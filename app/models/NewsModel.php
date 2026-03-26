<?php
class NewsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 6, $orderDir = 'desc') {
        $pdo = $this->db;
        $where = "WHERE n.status != 'deleted' AND (
            n.type = 'news' OR 
            (n.type = 'project' AND n.folder_show_admin = 'yes')
        )";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND n.status = :status ";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['type'])) {
            $where .= " AND n.type = :type ";
            $params[':type'] = $filters['type'];
        }
        if (!empty($search)) {
            $where .= " AND (
                iEn.content_subject LIKE :search OR
                iLo.content_subject LIKE :search OR
                iTh.content_subject LIKE :search
            )";
            $params[':search'] = "%{$search}%";
        }
        $stmt = $pdo->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $sqlFiltered = "SELECT COUNT(DISTINCT n.content_id) FROM wp_content n 
                        LEFT JOIN wp_content_item iEn ON iEn.content_id = n.content_id AND iEn.content_lang='en' 
                        LEFT JOIN wp_content_item iLo ON iLo.content_id = n.content_id AND iLo.content_lang='lo' 
                        LEFT JOIN wp_content_item iTh ON iTh.content_id = n.content_id AND iTh.content_lang='th' 
                        $where";
        $stmtFiltered = $pdo->prepare($sqlFiltered);
        $stmtFiltered->execute($params);
        $totalFiltered = $stmtFiltered->fetchColumn();
        $orderMap = [
            1 => "COALESCE(iTh.content_subject, iEn.content_subject, iLo.content_subject)",
            2 => "n.type",
            5 => "n.publish_at",
            6 => "n.created_at",
            8 => "n.content_view",
            7 => "n.status"
        ];
        $order = $orderMap[$colIndex] ?? 'n.created_at';
        $orderDir = strtolower($orderDir) === 'asc' ? 'asc' : 'desc';
        $sql = "SELECT 
                    n.content_id, n.publish_at, n.created_at, n.status, MAX(n.content_view) AS content_view, n.cover as cover_image,
                    iEn.content_subject AS subject_en, iLo.content_subject AS subject_lo, iTh.content_subject AS subject_th,
                    SUM(CASE WHEN m.file_type = 'attachment' THEN 1 ELSE 0 END) as count_attachment,
                    SUM(CASE WHEN m.file_type = 'image' THEN 1 ELSE 0 END) as count_image,
                    SUM(CASE WHEN m.file_type = 'image360' THEN 1 ELSE 0 END) as count_image360,
                    SUM(CASE WHEN m.file_type = 'presentation' THEN 1 ELSE 0 END) as count_presentation,
                    n.content_slug, (SELECT GROUP_CONCAT(folder_id) FROM wp_content_folder WHERE content_id = n.content_id AND status = 'active') as all_folder_ids, n.folder_show_admin, n.folder_show_user, n.type,
                    f.parent_id as dynamic_parent_id 
                FROM wp_content n
                LEFT JOIN wp_content_item iEn ON iEn.content_id = n.content_id AND iEn.content_lang='en'
                LEFT JOIN wp_content_item iLo ON iLo.content_id = n.content_id AND iLo.content_lang='lo'
                LEFT JOIN wp_content_item iTh ON iTh.content_id = n.content_id AND iTh.content_lang='th'
                LEFT JOIN wp_content_media m ON m.content_id = n.content_id AND m.status = 'active'
                LEFT JOIN wp_folder f ON f.content_id = n.content_id and f.sub_type = 'news'
                $where
                GROUP BY n.content_id
                ORDER BY {$order} {$orderDir}
                LIMIT :start, :length";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['created_at'] = !empty($r['created_at']) ? convertTimeZone($r['created_at'], 'd/m/Y H:i') : '';
            $r['publish_at'] = !empty($r['publish_at']) ? convertTimeZone($r['publish_at'], 'd/m/Y H:i') : '';
            $r['count_attachment'] = (int)$r['count_attachment'];
            $r['count_image'] = (int)$r['count_image'];
            $r['count_image360'] = (int)$r['count_image360'];
            $r['count_presentation'] = (int)$r['count_presentation'];
            if($r['type'] === 'project' && !empty($r['dynamic_parent_id'])) {
                $r['folder_id'] = $r['dynamic_parent_id'];
            }
            $r['folder_chains'] = [];
            if (!empty($r['all_folder_ids'])) {
                $folder_ids = explode(',', $r['all_folder_ids']);
                foreach ($folder_ids as $f_id) {
                    $r['folder_chains'][] = $this->getParentFolders(trim($f_id));
                }
            }
            $r['settings'] = $settings;
        }
        return [
            "total" => (int)$totalFiltered,
            "data" => $rows
        ];
    }
    private function getParentFolders($folderId){
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT id, name, parent_id FROM wp_folder WHERE status = 'active'");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $map = [];
        foreach ($rows as $r) {
            $map[$r['id']] = [
                'id' => $r['id'],
                'name' => $r['name'],
                'parent_id' => $r['parent_id']
            ];
        }
        $result = [];
        $current = $folderId;
        while (!empty($current) && isset($map[$current])) {
            $result[] = [
                'id' => $map[$current]['id'],
                'name' => $map[$current]['name']
            ];
            $current = $map[$current]['parent_id'];
        }
        return $result;
    }
    public function get($id) {
        $pdo = $this->db;
        $stmtFolder = $pdo->prepare("SELECT id, name, slug, type, level, parent_id FROM wp_folder WHERE status = 'active' AND type IN ('root','folder') ORDER BY level ASC, parent_id ASC, id ASC");
        $stmtFolder->execute();
        $foldersRaw = $stmtFolder->fetchAll(PDO::FETCH_ASSOC);
        $folderMap = [];
        foreach ($foldersRaw as $f) {
            $f['children'] = [];
            $folderMap[$f['id']] = $f;
        }
        $folders = [];
        foreach ($folderMap as $fid => &$folder) {
            if (!empty($folder['parent_id']) && isset($folderMap[$folder['parent_id']])) {
                $folderMap[$folder['parent_id']]['children'][] = &$folder;
            } else {
                $folders[] = &$folder;
            }
        }
        unset($folder);
        $stmt = $pdo->prepare("SELECT setting_type, setting_value 
            FROM wp_setting 
            WHERE setting_type IN ('language', 'language_content')
        ");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $stmtTranslate = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('ENABLE_TRANSLATE', 'GOOGLE_API_KEY')");
        $stmtTranslate->execute();
        $translates = $stmtTranslate->fetchAll(PDO::FETCH_KEY_PAIR);
        if (!$id) {
            return [
                "id" => "",
                "status" => "published",
                "publish_at" => convertTimeZoneUTC(date('Y-m-d H:i'), 'Y-m-d H:i'),
                "cover" => "",
                "cover_display" => "no",
                "folder_id" => [],
                "folder_show_admin" => "no",
                "folder_show_user" => "no",
                "attachments" => [],
                "images" => [],
                "images360" => [],
                "presentation" => [],
                "title" => ["th"=>"","lo"=>"","en"=>""],
                "content" => ["th"=>"","lo"=>"","en"=>""],
                "status_translate" => ["th"=>"","lo"=>"","en"=>""],
                "translate_with" => ["th"=>"","lo"=>"","en"=>""],
                "response" => ["th"=>"","lo"=>"","en"=>""],
                "settings" => $settings,
                "translates" => $translates,
                "folders" => $folders
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, publish_at, cover, cover_display, folder_show_admin, folder_show_user FROM wp_content WHERE content_id = ?");
        $stmt->execute([(int)$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmtFolder = $pdo->prepare("SELECT folder_id FROM wp_content_folder WHERE content_id = ? AND status = 'active'");
        $stmtFolder->execute([(int)$id]);
        $selectedFolders = $stmtFolder->fetchAll(PDO::FETCH_COLUMN);
        $n['folder_id'] = array_filter($selectedFolders, function($f_id) use ($folderMap) {
            return isset($folderMap[$f_id]);
        });
        $n['folder_id'] = array_values($n['folder_id']);
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body, status, response, translate_with FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th"=>"","lo"=>"","en"=>""];
        $content = ["th"=>"","lo"=>"","en"=>""];
        $status_translate = ["th"=>"","lo"=>"","en"=>""];
        $translate_with = ["th"=>"","lo"=>"","en"=>""];
        $response = ["th"=>"","lo"=>"","en"=>""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            if (isset($title[$lang])) {
                $title[$lang] = $row['content_subject'];
                $content[$lang] = $row['content_body'];
                $status_translate[$lang] = $row['status'];
                $response[$lang] = $row['response'];
                $translate_with[$lang] = $row['translate_with'];
            }
        }
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? AND status = 'active'");
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
            "id" => (int)$n['content_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "cover_display" => $n['cover_display'],
            "folder_id" => $n['folder_id'],
            "folder_show_admin" => $n['folder_show_admin'] ?? 'no',
            "folder_show_user" => $n['folder_show_user'] ?? 'no',
            "publish_at" => !empty($n['publish_at']) ? convertTimeZone($n['publish_at'], 'Y-m-d H:i') : "",
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
            "translates" => $translates,
            "folders" => $folders
        ];
    }
    public function save($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?: null;
        $status = $data['status'] ?? 'draft';
        $cover_display = $data['cover_display'] ?? 'no';
        $folder_show_admin = $data['folder_show_admin'];
        $folder_show_user  = $data['folder_show_user'];
        $mediaHelper = new MediaHelper($pdo);
        $publish_at = null;
        if ($status !== 'draft') {
            $tz = new DateTimeZone('Asia/Bangkok');
            if ($data['publish_now'] === true || empty($data['publish_at'])) {
                $dt = new DateTime('now', $tz);
            } else {
                $raw_date = trim($data['publish_at']);
                $dt = DateTime::createFromFormat('Y-m-d H:i:s', $raw_date, $tz);
                if (!$dt) {
                    $dt = DateTime::createFromFormat('d/m/Y H:i', $raw_date, $tz);
                }
                if (!$dt) $dt = new DateTime('now', $tz);
            }
            $dt->setTimezone(new DateTimeZone('UTC'));
            $publish_at = $dt->format('Y-m-d H:i:s');
        }
        try {
            $pdo->beginTransaction();
            $content_slug = $mediaHelper->generateSlug('news', $data["title_en"], $content_id);
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = :status, cover_display = :cover_display, content_slug = :content_slug, publish_at = :publish_at, folder_show_admin = :folder_show_admin,folder_show_user = :folder_show_user, updated_at = NOW() WHERE content_id = :content_id");
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, cover_display, content_slug, publish_at, folder_show_admin, folder_show_user, created_at, updated_at) VALUES (:status, :cover_display, :content_slug, :publish_at, :folder_show_admin, :folder_show_user, NOW(), NOW())");
            }
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':cover_display', $cover_display);
            $stmt->bindValue(':content_slug', $content_slug);
            $stmt->bindValue(':publish_at', $publish_at, $publish_at === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->bindValue(':folder_show_admin', $folder_show_admin);
            $stmt->bindValue(':folder_show_user', $folder_show_user);
            $stmt->execute();
            if (!$content_id) {
                $content_id = $pdo->lastInsertId();
            }
            $folder_ids = !empty($data['folder_id']) && is_array($data['folder_id']) ? $data['folder_id'] : [];
            $folder_status_base = ($status === 'draft') ? 'inactive' : 'active';
            if (!empty($folder_ids)) {
                $placeholders = implode(',', array_fill(0, count($folder_ids), '?'));
                $sql_soft_del_mapping = "UPDATE wp_content_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? AND folder_id NOT IN ($placeholders)";
                $pdo->prepare($sql_soft_del_mapping)->execute(array_merge([$content_id], $folder_ids));
                $sql_soft_del_folder = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? AND parent_id NOT IN ($placeholders) and sub_type = 'news'";
                $pdo->prepare($sql_soft_del_folder)->execute(array_merge([$content_id], $folder_ids));
                foreach ($folder_ids as $f_id) {
                    $f_id = (int)$f_id;
                    if($f_id > 0) {
                        $stmt_check = $pdo->prepare("SELECT id FROM wp_content_folder WHERE content_id = ? AND folder_id = ?");
                        $stmt_check->execute([$content_id, $f_id]);
                        if ($stmt_check->fetch()) {
                            $pdo->prepare("UPDATE wp_content_folder SET status = 'active', updated_at = NOW() WHERE content_id = ? AND folder_id = ?")->execute([$content_id, $f_id]);
                        } else {
                            $pdo->prepare("INSERT INTO wp_content_folder (content_id, folder_id, status, created_at, updated_at) VALUES (?, ?, 'active', NOW(), NOW())")->execute([$content_id, $f_id]);
                        }
                        $folder_name = !empty($data["title_en"]) ? $data["title_en"] : (!empty($data["title_th"]) ? $data["title_th"] : 'Untitled');
                        $stmt = $pdo->prepare("SELECT id FROM wp_folder WHERE parent_id = ? AND content_id = ? and sub_type = 'news'");
                        $stmt->execute([$f_id, $content_id]);
                        $existingFolder = $stmt->fetch(PDO::FETCH_ASSOC);
                        if ($existingFolder) {
                            $sql = "UPDATE wp_folder SET name = :name, status = :status, updated_at = NOW() WHERE id = :id and sub_type = 'news'";
                            $pdo->prepare($sql)->execute([
                                ':name'   => $folder_name,
                                ':status' => $folder_status_base,
                                ':id'     => $existingFolder['id']
                            ]);
                        } else {
                            $stmt = $pdo->prepare("SELECT level FROM wp_folder WHERE id = ?");
                            $stmt->execute([$f_id]);
                            $parentData = $stmt->fetch(PDO::FETCH_ASSOC);
                            $level = $parentData ? (int)$parentData['level'] + 1 : 1;
                            $slug = $this->generateUniqueSlug($folder_name, $f_id);
                            $sql = "INSERT INTO wp_folder (name, slug, parent_id, level, status, type, sub_type, created_at, updated_at, content_id) VALUES (:name, :slug, :parent_id, :level, :status, 'content', 'news', NOW(), NOW(), :content_id)";
                            $pdo->prepare($sql)->execute([
                                ':name'       => $folder_name,
                                ':slug'       => $slug,
                                ':parent_id'  => $f_id,
                                ':level'      => $level,
                                ':status'     => $folder_status_base,
                                ':content_id' => $content_id
                            ]);
                        }
                    }
                }
            } else {
                $pdo->prepare("UPDATE wp_content_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ?")->execute([$content_id]);
                $pdo->prepare("UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? and sub_type = 'news'")->execute([$content_id]);
            }
            $mediaHelper->handleContent($data, $content_id);
            if (empty($data['ex_cover'])) {
                $mediaHelper->deleteExistingCover($content_id, 'wp_content', 'cover');
            }
            if (isset($data['cover']) && $data['cover']['error'] === UPLOAD_ERR_OK) {
                $mediaHelper->handleSingleUpload($content_id, $data['cover']);
            }
            $mediaHelper->syncMedia($content_id, 'attachment', $data['existing_attachments']);
            $mediaHelper->syncMedia($content_id, 'image', $data['existing_images']);
            $mediaHelper->syncMedia($content_id, 'image360', $data['existing_images360']);
            $mediaHelper->syncMedia($content_id, 'presentation', $data['existing_presentation']);
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
            $mediaHelper->handleMultiUpload($content_id, 'presentation', 'new_presentation');
            if ($data['auto_translate'] === 'yes') {
                $mediaHelper->autoTranslate($content_id);
            }
            if ($data['send_notification'] === 'yes' && $status === 'published') {
                $mediaHelper->notification($content_id, $status, $publish_at, 'news');
            }
            $pdo->commit();
            return [
                'status' => true,
                'content_id' => $content_id ?? $pdo->lastInsertId()
            ];
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
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
    public function delete($id) {
        $pdo = $this->db;
        $pdo->prepare("UPDATE wp_content SET status = 'deleted', updated_at = NOW() WHERE content_id = ?")->execute([(int)$id]);
        $pdo->prepare("UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? AND sub_type = 'news'")->execute([(int)$id]);
        return $pdo->prepare("UPDATE wp_notification_targets SET status = 'deleted', publish_at = NULL WHERE notifications_item = ? AND notifications_target = 'news'")->execute([(int)$id]);
    }
    public function unlink($id) {
        $pdo = $this->db;
        return $pdo->prepare("UPDATE wp_content SET folder_show_admin = 'no', folder_show_user = 'no', updated_at = NOW() WHERE type = 'project' AND content_id = ?")->execute([(int)$id]);
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        switch($type) {
            case 'status':
                $staticData = [
                    ['id' => 'published', 'text' => 'Published'],
                    ['id' => 'draft', 'text' => 'Draft'],
                    ['id' => 'active', 'text' => 'Active']
                ];
                if (!empty($searchTerm)) {
                    $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                        return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
            case 'type':
                $staticData = [
                    ['id' => 'news', 'text' => 'News'],
                    ['id' => 'project', 'text' => 'Project']
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
}