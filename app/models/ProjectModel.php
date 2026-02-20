<?php
class ProjectModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function get($start = 0, $length = 20, $filters = [], $search = '', $order = 'asc') {
        list($mainWhere, $mainParams) = $this->buildListWhere($filters);
        $sql = "SELECT 
            f.id, f.name as folder_name, f.level, f.parent_id, f.created_at, f.type, f.content_id, c.cover, c.content_slug, 
            iEn.status as en_status,
            iLo.status as lo_status,
            iTh.status as th_status,
            iEn.content_subject as en_subject,
            iLo.content_subject as lo_subject,
            iTh.content_subject as th_subject,
            f.created_at,
            f.status
        FROM wp_folder f 
        LEFT JOIN wp_content c on c.content_id = f.content_id
        LEFT JOIN wp_content_item iEn ON iEn.content_id = c.content_id AND iEn.content_lang='en'
        LEFT JOIN wp_content_item iLo ON iLo.content_id = c.content_id AND iLo.content_lang='lo'
        LEFT JOIN wp_content_item iTh ON iTh.content_id = c.content_id AND iTh.content_lang='th'
        {$mainWhere} ORDER BY f.id {$order}";
        $stmt = $this->db->prepare($sql);
        foreach ($mainParams as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->execute();
        $folderRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $finalItems = [];
        $stmt = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        foreach ($folderRows as $row) {
            if (!empty($search) && stripos($row['folder_name'], $search) === false) continue;
            $item = $this->formatRow($row);
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
        $sqlFolder = "SELECT id FROM wp_folder WHERE parent_id = :pid AND level = :lvl AND status <> 'deleted'";
        $stmt = $this->db->prepare($sqlFolder);
        $stmt->execute([
            ':pid' => $folderId, 
            ':lvl' => $nextLevel
        ]);
        $nextFolders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($nextFolders)) return 0;
        $totalChild = 0;
        foreach ($nextFolders as $nf) {
            $totalChild++; 
            continue;
        }
        return $totalChild;
    }
    public function save($data){
        $parentId = (!empty($data['parent_id']) && $data['parent_id'] > 0) ? $data['parent_id'] : null;
        if ($data['folder_id'] > 0) {
            $slug = $this->generateUniqueSlug($data['folder_name'], $parentId, $data['folder_id']);
            $sql = "UPDATE wp_folder SET name = :name, slug = :slug, status = :status, updated_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':name' => $data['folder_name'],
                ':slug' => $slug,
                ':status' => $data['status'],
                ':id'   => $data['folder_id']
            ]);
        } else {
            $slug = $this->generateUniqueSlug($data['folder_name'],$parentId);
            $sql = "INSERT INTO wp_folder (name, slug, parent_id, level, status, type, created_at, updated_at) VALUES (:name, :slug, :parent_id, :level, :status, 'folder', NOW(), NOW())";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':name'      => $data['folder_name'],
                ':slug'      => $slug,
                ':parent_id' => $parentId,
                ':level'     => $data['level'],
                ':status'     => $data['status']
            ]);
        }
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
        $folder_id = intval($data['folder_id']);
        $sql = "SELECT id, name as folder_name, parent_id, level, status FROM wp_folder WHERE id = :id AND status <> 'deleted' LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $folder_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function delete($data) {
        $sql = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'   => $data['folder_id']
        ]);
    }
    private function formatRow($row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
        return $row;
    }
    private function buildListWhere($filters) {
        $where  = " WHERE f.status <> 'deleted' ";
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
            if ($data['content_id'] > 0) {
                $sql = "UPDATE wp_folder SET name = :name, status = :status, updated_at = NOW() WHERE content_id = :id";
                $stmtFolder = $pdo->prepare($sql);
                $stmtFolder->execute([
                    ':name' => $data["title_en"],
                    ':id'   => $data['content_id'],
                    ':status'   => $status
                ]);
            } else {
                $parentId = (!empty($data['parent_id']) && $data['parent_id'] > 0) ? $data['parent_id'] : null;
                $slug = $this->generateUniqueSlug(
                    $data['title_en'],
                    $parentId
                );
                $sql = "INSERT INTO wp_folder (name, slug, parent_id, level, status, type, created_at, updated_at, content_id) VALUES (:name, :slug, :parent_id, :level, :status, 'content', NOW(), NOW(), :content_id)";
                $stmtFolder = $pdo->prepare($sql);
                $stmtFolder->execute([
                    ':name'      => $data["title_en"],
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
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
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
}