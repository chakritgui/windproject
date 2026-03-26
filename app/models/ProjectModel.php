<?php
class ProjectModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function get($start = 0, $length = 20, $filters = [], $search = '', $order = 'desc') {
        list($mainWhere, $mainParams) = $this->buildListWhere($filters);
        $sql = "SELECT 
                f.id, f.name as folder_name, f.slug, f.level, f.parent_id, f.created_at, f.type, f.content_id, c.content_slug, 
                iEn.status as en_status, iLo.status as lo_status, iTh.status as th_status,
                iEn.content_subject as en_subject, iLo.content_subject as lo_subject, iTh.content_subject as th_subject,
                f.sub_type,
                CASE
                    WHEN f.type = 'folder' THEN f.cover
                    ELSE c.cover
                END as cover,
                CASE
                    WHEN f.type = 'folder' or f.type = 'content' and f.sub_type = 'project' THEN f.status
                    WHEN f.type = 'content' and f.sub_type = 'news' then c.status
                    WHEN f.type = 'document' and f.sub_type = 'document' then d.status
                    ELSE ''
                END as status
            FROM wp_folder f 
            LEFT JOIN wp_content c on c.content_id = f.content_id and (f.sub_type = 'news' or f.sub_type = 'project')
            LEFT JOIN wp_documents d on d.document_id = f.content_id and f.sub_type = 'document'
            LEFT JOIN wp_content_item iEn ON iEn.content_id = c.content_id AND iEn.content_lang='en'
            LEFT JOIN wp_content_item iLo ON iLo.content_id = c.content_id AND iLo.content_lang='lo'
            LEFT JOIN wp_content_item iTh ON iTh.content_id = c.content_id AND iTh.content_lang='th'
            {$mainWhere} 
            ORDER BY 
                (CASE WHEN f.type = 'folder' THEN 0 ELSE 1 END) ASC,
                (CASE WHEN f.type = 'folder' THEN ifnull(f.folder_order, f.id) END) ASC,
                (CASE WHEN f.type != 'folder' THEN f.id END) {$order}";
        $stmt = $this->db->prepare($sql);
        foreach ($mainParams as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->execute();
        $folderRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $stmt = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $finalItems = [];
        foreach ($folderRows as $row) {
            if (!empty($search) && stripos($row['folder_name'], $search) === false) continue;
            $item = $row;
            $item['child_count'] = $this->countChildren($row['id'], $row['level']);
            $item['settings'] = $settings;
            $finalItems[] = $item;
        }
        $totalCount = count($finalItems);
        if ($length > 0) {
            $finalItems = array_slice($finalItems, $start, $length);
        }
        return [
            'total' => $totalCount, 
            'data' => $finalItems,
            'hasMore' => ($length > 0) ? ($start + $length < $totalCount) : false
        ];
    }
    private function countChildren($folderId, $currentLevel) {
        $nextLevel = (int)$currentLevel + 1; 
        $where = " AND (
            (f.sub_type = 'news' AND c.status <> 'deleted' AND c.folder_show_admin = 'yes')
            OR
            (f.sub_type = 'project' AND f.status <> 'deleted')
        ) AND f.status <> 'deleted' ";
        $sql = "SELECT COUNT(DISTINCT f.id) FROM wp_folder f LEFT JOIN wp_content c ON c.content_id = f.content_id WHERE f.parent_id = :pid AND f.level = :lvl {$where}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':pid' => $folderId, 
            ':lvl' => $nextLevel
        ]);
        return (int) $stmt->fetchColumn();
    }
    public function save($data){
        $parentId = (!empty($data['parent_id']) && $data['parent_id'] > 0) ? $data['parent_id'] : null;
        if ($data['folder_id'] > 0) {
            $folderId = $data['folder_id'];
            $slug = $this->generateUniqueSlug($data['folder_name'], $parentId, $folderId);
            $sql = "UPDATE wp_folder SET name = :name, slug = :slug, status = :status, updated_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $success = $stmt->execute([
                ':name' => $data['folder_name'],
                ':slug' => $slug,
                ':status' => $data['status'],
                ':id'   => $folderId
            ]);
        } else {
            $slug = $this->generateUniqueSlug($data['folder_name'], $parentId);
            $sql = "INSERT INTO wp_folder (name, slug, parent_id, level, status, type, created_at, updated_at) VALUES (:name, :slug, :parent_id, :level, :status, 'folder', NOW(), NOW())";
            $stmt = $this->db->prepare($sql);
            $success = $stmt->execute([
                ':name'      => $data['folder_name'],
                ':slug'      => $slug,
                ':parent_id' => $parentId,
                ':level'     => $data['level'],
                ':status'    => $data['status']
            ]);
            $folderId = $this->db->lastInsertId();
        }
        if (!$success) {
            return false;
        }
        $ex_cover = $data['ex_cover'] ?? '';
        if (!$ex_cover && empty($_FILES['cover']['name'])) {
            $this->handleFileDelete($folderId);
        }
        if (!empty($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
            $this->handleFileUpload($folderId, $_FILES['cover']);
        }
        return true;
    }
    private function generateSlug($text){
        $text = trim($text);
        $text = mb_strtolower($text, 'UTF-8');
        $text = preg_replace('/[^a-z0-9ก-๙]+/u', '-', $text);
        $text = trim($text, '-');
        return $text ?: 'folder';
    }
    private function generateUniqueSlug($name, $parentId, $excludeId = null){
        $slug = $this->generateSlug($name);
        $baseSlug = $slug;
        $i = 1;
        while (true) {
            $sql = "SELECT id FROM wp_folder WHERE slug = :slug AND parent_id <=> :parent";
            if ($excludeId) {
                $sql .= " AND id != :exclude";
            }
            $stmt = $this->db->prepare($sql);
            $params = [
                ':slug' => $slug,
                ':parent' => $parentId
            ];
            if ($excludeId) {
                $params[':exclude'] = $excludeId;
            }
            $stmt->execute($params);
            if (!$stmt->fetch()) break;
            $slug = $baseSlug . '-' . $i;
            $i++;
        }
        return $slug;
    }
    public function data($data) {
        $folder_id = intval($data['folder_id'] ?? 0);
        if ($folder_id <= 0) {
            return [
                'id' => null,
                'folder_name' => '',
                'parent_id' => null,
                'level' => 1,
                'status' => 'active',
                'cover' => null
            ];
        }
        $sql = "SELECT 
                    id, 
                    name as folder_name, 
                    parent_id, 
                    level, 
                    status, 
                    cover 
                FROM wp_folder 
                WHERE id = :id 
                AND status <> 'deleted' 
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $folder_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$result) {
            return [
                'id' => null,
                'folder_name' => '',
                'parent_id' => null,
                'level' => 1,
                'status' => 'active',
                'cover' => null
            ];
        }

        return $result;
    }
    public function delete($data) {
        $sql = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'   => $data['folder_id']
        ]);
    }
    private function buildListWhere($filters) {
        $where  = " WHERE  
            ((f.sub_type = 'news' AND c.status <> 'deleted' AND c.folder_show_admin = 'yes')
            OR
            (f.sub_type = 'project')) AND f.status <> 'deleted'
        ";
        $params = [];
        if (!empty($filters['level'])) {
            $where .= " AND f.level = :level";
            $params[':level'] = $filters['level'];
        }
        if (isset($filters['item']) && ($filters['item'] !== '' && $filters['item'] !== null)) {
            $where .= " AND f.parent_id = :item";
            $params[':item'] = $filters['item'];
        } else {
            $where .= " AND f.parent_id IS NULL";
        }
        return [$where, $params];
    }
    public function gets($id) {
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $stmtTranslate = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('ENABLE_TRANSLATE', 'GOOGLE_API_KEY')");
        $stmtTranslate->execute();
        $translates = $stmtTranslate->fetchAll(PDO::FETCH_KEY_PAIR);
        if (!$id) {
            return [
                "id" => "", "status" => "active", "cover" => "",
                "attachments" => [],
                "images" => [],
                "images360" => [],
                "presentation" => [],
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""],
                "status_translate" => ["th" => "", "lo" => "", "en" => ""],
                "response" => ["th" => "", "lo" => "", "en" => ""],
                "translate_with" => ["th" => "", "lo" => "", "en" => ""],
                "settings" => $settings,
                "translates" => $translates,
                "cover_display" => 'no',
                "folder_show_admin" => 'no',
                "folder_show_user" => 'no'
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, cover, cover_display, folder_show_admin, folder_show_user FROM wp_content WHERE content_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body, status, response, translate_with FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $content = ["th" => "", "lo" => "", "en" => ""];
        $status_translate = ["th" => "", "lo" => "", "en" => ""];
        $response = ["th" => "", "lo" => "", "en" => ""];
        $translate_with = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            $title[$lang] = $row['content_subject'];
            $content[$lang] = $row['content_body'];
            $status_translate[$lang] = $row['status'];
            $response[$lang] = $row['response'];
            $translate_with[$lang] = $row['translate_with'];
        }
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? and status <> 'deleted'");
        $stmt->execute([$id]);
        $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $attachments = [];
        $images = [];
        $images360 = [];
        $presentation = [];
        foreach ($media as $m) {
            $item = [
                "id" => $m['id'],
                "url" => $m['file_path'], 
                "name" => $m['file_name'],
                "size" => $m['file_size']
            ];
            if ($m['file_type'] === 'attachment') {
                $attachments[] = $item;
            } elseif ($m['file_type'] === 'image') {
                $images[] = $item;
            } elseif ($m['file_type'] === 'image360') {
                $images360[] = $item;
            } elseif ($m['file_type'] === 'presentation') {
                $presentation[] = $item;
            }
        }
        return [
            "id" => $n['content_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "cover_display" => $n['cover_display'],
            "folder_show_admin" => $n['folder_show_admin'],
            "folder_show_user" => $n['folder_show_user'],
            "title" => $title,
            "content" => $content,
            "status_translate" => $status_translate,
            "response" => $response,
            "translate_with" => $translate_with,
            "attachments" => $attachments,
            "images" => $images,
            "images360" => $images360,
            "presentation" => $presentation,
            "settings" => $settings,
            "translates" => $translates
        ];
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        switch($type) {
            case 'status':
                $staticData = [
                    ['id' => 'active', 'text' => 'Active'],
                    ['id' => 'inactive', 'text' => 'Inactive']
                ];
                if (!empty($searchTerm)) {
                    $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                        return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
            case 'notification':
                $staticData = [
                    ['id' => 'yes', 'text' => 'Yes'],
                    ['id' => 'no', 'text' => 'No']
                ];
                if (!empty($searchTerm)) {
                    $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                        return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
        }
        return [
            'items' => $items,
            'total_count' => $totalCount
        ];
    }
    public function saveContent($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?? null;
        $ex_cover = $data['ex_cover'] ?? null;
        $status = $data['status'] ?? 'active';
        $send_notification = $data['send_notification'] ?? 'no';
        $auto_translate = $data['auto_translate'] ?? 'no';
        $cover_display = $data['cover_display'] ?? 'no';
        $folder_show_admin = $data['folder_show_admin'];
        $folder_show_user  = $data['folder_show_user'];
        $mediaHelper = new MediaHelper($pdo);
        $content_slug = $mediaHelper->generateSlug('project', $data["title_en"], $content_id);
        try {
            $pdo->beginTransaction();
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = :status, content_slug = :content_slug, cover_display = :cover_display, updated_at = NOW(), folder_show_admin = :folder_show_admin, folder_show_user = :folder_show_user WHERE content_id = :content_id");
                $stmt->bindValue(':content_slug', $content_slug);
                $stmt->bindValue(':cover_display', $cover_display);
                $stmt->bindValue(':folder_show_admin', $folder_show_admin);
                $stmt->bindValue(':folder_show_user', $folder_show_user);
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, content_slug, cover_display, created_at, updated_at, type, folder_show_admin, folder_show_user) VALUES (:status, :content_slug, :cover_display, NOW(), NOW(), 'project', :folder_show_admin, :folder_show_user)");
                $stmt->bindValue(':content_slug', $content_slug);
                $stmt->bindValue(':cover_display', $cover_display);
                $stmt->bindValue(':folder_show_admin', $folder_show_admin);
                $stmt->bindValue(':folder_show_user', $folder_show_user);
            }
            $stmt->bindValue(':status', $status);
            $stmt->execute();
            if (!$content_id) {
                $content_id = $pdo->lastInsertId();
            }
            $mediaHelper->handleContent($data, $content_id);
            if(!$ex_cover) {
                $mediaHelper->deleteExistingCover($content_id, 'wp_content', 'cover');
            }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $mediaHelper->handleSingleUpload($content_id, $_FILES['cover']);
            }
            $folder_name = 'Untitled';
            if (!empty($data["title_en"])) {
                $folder_name = $data["title_en"];
            } elseif (!empty($data["title_th"])) {
                $folder_name = $data["title_th"];
            } elseif (!empty($data["title_lo"])) {
                $folder_name = $data["title_lo"];
            }
            if ($data['content_id'] > 0) {
                $sql = "UPDATE wp_folder SET name = :name, status = :status, updated_at = NOW() WHERE content_id = :id";
                $stmtFolder = $pdo->prepare($sql);
                $stmtFolder->execute([
                    ':name' => $folder_name,
                    ':id'   => $data['content_id'],
                    ':status'   => $status
                ]);
            } else {
                $parentId = (!empty($data['parent_id']) && $data['parent_id'] > 0) ? $data['parent_id'] : null;
                $slug = $this->generateUniqueSlug(
                    $folder_name,
                    $parentId
                );
                $sql = "INSERT INTO wp_folder (name, slug, parent_id, level, status, type, created_at, updated_at, content_id) VALUES (:name, :slug, :parent_id, :level, :status, 'content', NOW(), NOW(), :content_id)";
                $stmtFolder = $pdo->prepare($sql);
                $stmtFolder->execute([
                    ':name'      => $folder_name,
                    ':slug'      => $slug,
                    ':parent_id' => $parentId,
                    ':level'     => $data['level'],
                    ':status'   => $status,
                    ':content_id' => $content_id
                ]);
            }
            $mediaHelper->syncMedia($content_id, 'attachment', $data['existing_attachments'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image', $data['existing_images'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image360', $data['existing_images360'] ?? []);
            $mediaHelper->syncMedia($content_id, 'presentation', $data['existing_presentation'] ?? []);
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
            $mediaHelper->handleMultiUpload($content_id, 'presentation', 'new_presentation');
            $status = '';
            if($send_notification == 'yes') {
                $status = 'published';
                $publish_at = convertTimeZoneUTC(date('Y-m-d H:i:s'), 'Y-m-d H:i:s');
                $mediaHelper->notification($content_id, $status, $publish_at, 'project');
            }
            if($auto_translate == 'yes') {
                $mediaHelper->autoTranslate($content_id);
            }
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }
    public function deleteContent($data) {
        $sql_folder = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = :id";
        $stmt_folder = $this->db->prepare($sql_folder);
        $res1 = $stmt_folder->execute([
            ':id' => $data['content_id']
        ]);
        $sql_content = "UPDATE wp_content SET status = 'deleted', updated_at = NOW() WHERE content_id = :id";
        $stmt_content = $this->db->prepare($sql_content);
        $res2 = $stmt_content->execute([
            ':id' => $data['content_id']
        ]);
        return ($res1 && $res2);
    }
    public function unlink($data) {
        try {
            $sql_get_parent = "SELECT parent_id FROM wp_folder WHERE id = :folder_id LIMIT 1";
            $stmt_parent = $this->db->prepare($sql_get_parent);
            $stmt_parent->execute([':folder_id' => $data['folder_id']]);
            $folder = $stmt_parent->fetch(PDO::FETCH_ASSOC);
            if (!$folder) {
                return false;
            }
            $parent_id = $folder['parent_id'];
            $sql_folder = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE id = :id";
            $stmt_folder = $this->db->prepare($sql_folder);
            $res1 = $stmt_folder->execute([':id' => $data['folder_id']]);
            $sql_content = "UPDATE wp_content_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = :content_id AND folder_id = :folder_id";
            $stmt_content = $this->db->prepare($sql_content);
            $res2 = $stmt_content->execute([
                ':content_id' => $data['content_id'],
                ':folder_id'  => $parent_id
            ]);
            return ($res1 && $res2);
        } catch (Exception $e) {
            return false;
        }
    }
    public function sort($items) {
        $pdo = $this->db;
        try {
            $pdo->beginTransaction();
            $stmt = $pdo->prepare("
                UPDATE wp_folder
                SET folder_order = :sort_order,
                    updated_at = NOW()
                WHERE id = :id
            ");
            foreach ($items as $item) {
                $stmt->execute([
                    ':sort_order' => (int)$item['sort_order'],
                    ':id'         => (int)$item['id']
                ]);
            }
            $pdo->commit();
            return [
                'status' => true
            ];
        } catch (Exception $e) {
            $pdo->rollBack();
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    private function handleFileUpload($folder_id, $file) {
        $this->handleFileDelete($folder_id);  
        $dir = "uploads/folder/";
        $baseDir = dirname(__DIR__, 2) . '/' . $dir;
        if (!is_dir($baseDir)) mkdir($baseDir, 0755, true);
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $image = false;
        switch ($ext) {
            case 'jpeg':
            case 'jpg':  $image = @imagecreatefromjpeg($file['tmp_name']); break;
            case 'png':   $image = @imagecreatefrompng($file['tmp_name']);  break;
            case 'gif':   $image = @imagecreatefromgif($file['tmp_name']);  break;
            case 'webp':  $image = @imagecreatefromwebp($file['tmp_name']); break;
        }
        if ($image) {
            $newName = $folder_id . "_" . time() . ".webp";
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            $quality = 85;
            do {
                ob_start();
                imagewebp($image, null, $quality);
                $imageData = ob_get_contents();
                ob_end_clean();
                if (strlen($imageData) <= 1048576 || $quality <= 20) {
                    break;
                }
                $quality -= 10;
            } while ($quality > 10);
            if (file_put_contents($targetFull, $imageData)) {
                $this->db->prepare("UPDATE wp_folder SET cover=? WHERE id =?")->execute([$dbPath, $folder_id]);
            }
            imagedestroy($image);

        } else {
            $newName = $folder_id . "_" . time() . "." . $ext;
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            if (move_uploaded_file($file['tmp_name'], $targetFull)) {
                $this->db->prepare("UPDATE wp_folder SET cover=? WHERE id =?")->execute([$dbPath, $folder_id]);
            }
        }
    }
    private function handleFileDelete($folder_id){
        $stmt = $this->db->prepare("SELECT cover FROM wp_folder WHERE id = ?");
        $stmt->execute([$folder_id]);
        $old = $stmt->fetchColumn();
        if (!$old) {
            return;
        }
        $basePath = realpath(dirname(__DIR__, 2));
        if ($basePath === false) {
            error_log("Base path not found");
            return;
        }
        $old = ltrim($old, '/');
        if (strpos($old, '..') !== false) {
            error_log("Invalid file path: " . $old);
            return;
        }
        $oldPath = $basePath . '/' . $old;
        if (!file_exists($oldPath)) {
            error_log("File not found: " . $oldPath);
            return;
        }
        if (!is_file($oldPath)) {
            error_log("Not a file: " . $oldPath);
            return;
        }
        $this->db->beginTransaction();
        try {
            if (!unlink($oldPath)) {
                throw new Exception("Cannot delete file: " . $oldPath);
            }
            $this->db->prepare("UPDATE wp_folder SET cover = NULL WHERE id = ?")->execute([$folder_id]);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
        }
    }
}