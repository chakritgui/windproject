<?php
class PolesModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }

    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 0, $orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*)
            FROM wp_poles p
            LEFT JOIN wp_project pj ON pj.project_id = p.project_id
            LEFT JOIN wp_project_status s on s.project_status_id = p.project_status_id
            LEFT JOIN wp_type t ON t.type_id = p.type_id
            LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
            {$where}
        ";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $stmtSet = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmtSet->execute();
        $settings = $stmtSet->fetchAll(PDO::FETCH_KEY_PAIR);
        $order = 'p.created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "p.item_order",
            1 => "p.status",
            2 => "p.show_wind_speed",
            4 => "p.poles_code",
            5 => "t.type_name",
            6 => "pj.project_name",
            7 => "p.project_name",
            8 => "p.poles_lat",
            9 => "p.poles_lng",
            10 => "i.installations_name",
            11 => "p.created_at",
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                    p.poles_id,
                    p.poles_code,
                    p.poles_lat,
                    p.poles_lng,
                    p.status,
                    pj.project_id,
                    pj.project_name,
                    t.type_id,
                    t.type_name,
                    i.installations_id,
                    i.installations_name,
                    p.content_id,
                    c.content_slug,
                    iEn.status as en_status,
                    iLo.status as lo_status,
                    iTh.status as th_status,
                    p.created_at,
                    p.poles_source,
                    p.item_order,
                    s.project_status_name,
                    s.project_status_color,
                    CASE
                        WHEN p.poles_icon is null or p.poles_icon = '' THEN t.type_icon
                        ELSE p.poles_icon
                    END as poles_icon,
                    CASE
                        WHEN p.default_color is null or p.default_color = '' THEN t.default_color
                        ELSE p.default_color
                    END as default_color,
                    p.show_wind_speed
                FROM wp_poles p
                LEFT JOIN wp_project pj ON pj.project_id = p.project_id
                LEFT JOIN wp_project_status s on s.project_status_id = p.project_status_id
                LEFT JOIN wp_type t ON t.type_id = p.type_id
                LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
                LEFT JOIN wp_content c ON c.content_id = p.content_id
                LEFT JOIN wp_content_item iEn ON iEn.content_id = c.content_id AND iEn.content_lang='en'
                LEFT JOIN wp_content_item iLo ON iLo.content_id = c.content_id AND iLo.content_lang='lo'
                LEFT JOIN wp_content_item iTh ON iTh.content_id = c.content_id AND iTh.content_lang='th'
                {$where}
                ORDER BY {$order} {$orderDir}
        ";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($data as &$r) {
            $this->formatDocumentRow($r);
            $r['settings'] = $settings;
        }
        return [
            'total'    => $total,
            'data'     => $data
        ];
    }
    private function formatDocumentRow(&$row) {
        foreach (['created_at'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE p.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND p.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['project_status'])) {
            $where .= " AND s.project_status_id = :project_status";
            $params[':project_status'] = $filters['project_status'];
        }
        if (!empty($filters['project'])) {
            $where .= " AND pj.project_id = :project";
            $params[':project'] = (int)$filters['project'];
        }
        if (!empty($filters['type'])) {
            $where .= " AND t.type_id = :type";
            $params[':type'] = (int)$filters['type'];
        }
        if (!empty($filters['installation'])) {
            $where .= " AND i.installations_id = :installation";
            $params[':installation'] = (int)$filters['installation'];
        }
        if ($search !== '') {
            $where .= " AND (
                p.poles_code LIKE :search
                OR pj.project_name LIKE :search
                OR t.type_name LIKE :search
                OR i.installations_name LIKE :search
            )";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    public function get($id) {
        $default = [
            'poles_id' => null,
            'poles_code' => null,
            'poles_lat' => null,
            'poles_lng' => null,
            'project_id' => null,
            'project_name' => null,
            'type_id' => null,
            'type_name' => null,
            'installations_id' => null,
            'installations_name' => null,
            'project_status_id' => null,
            'project_status_name' => null,
            'default_color' => null,
            'cover' => null
        ];
        if (empty($id)) {
            return $default;
        }
        $sql = "SELECT
                    p.poles_id,
                    p.poles_code,
                    p.poles_lat,
                    p.poles_lng,
                    pj.project_id,
                    pj.project_name,
                    t.type_id,
                    t.type_name,
                    i.installations_id,
                    i.installations_name,
                    s.project_status_id,
                    s.project_status_name,
                    p.default_color,
                    p.poles_icon as cover
                FROM wp_poles p
                LEFT JOIN wp_project pj ON pj.project_id = p.project_id
                LEFT JOIN wp_project_status s ON s.project_status_id = p.project_status_id
                LEFT JOIN wp_type t ON t.type_id = p.type_id
                LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
                WHERE p.poles_id = :id
            ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: $default;
    }
    public function save($data) {
        $poles_id = !empty($data['poles_id']) ? (int)$data['poles_id'] : null;
        $poles_code = trim($data['poles_code'] ?? '');
        $should_trigger_api = false;
        if ($this->isDuplicatePole($poles_code, $poles_id)) {
            return ['status' => false, 'message' => 'already_pole'];
        }
        try {
            if ($poles_id) {
                $stmt_check = $this->db->prepare("SELECT poles_lat, poles_lng FROM wp_poles WHERE poles_id = :id");
                $stmt_check->execute([':id' => $poles_id]);
                $current = $stmt_check->fetch(PDO::FETCH_OBJ);
                if ($current) {
                    if ((float)$current->poles_lat != (float)$data['latitude'] || 
                        (float)$current->poles_lng != (float)$data['longitude']) {
                        $should_trigger_api = true;
                    }
                }
                $sql = "UPDATE wp_poles SET 
                            poles_code = :code, poles_lat = :lat, poles_lng = :lng,
                            project_id = :project, project_status_id = :project_status,
                            type_id = :type, installations_id = :installation,
                            updated_at = NOW(),
                            poles_source = 'manual', default_color = :default_color
                        WHERE poles_id = :id";
            } else {
                $should_trigger_api = true;
                $sql = "INSERT INTO wp_poles (
                            poles_code, poles_lat, poles_lng, project_id,
                            project_status_id, type_id, installations_id,
                            status, created_at, updated_at, poles_source, default_color
                        ) VALUES (
                            :code, :lat, :lng, :project, :project_status,
                            :type, :installation, :status, NOW(), NOW(), 'manual', :default_color
                        )";
            }
            $stmt = $this->db->prepare($sql);
            if ($poles_id) {
                $stmt->bindValue(':id', $poles_id, PDO::PARAM_INT);
            }
            $stmt->bindValue(':code', $poles_code);
            $stmt->bindValue(':lat', $data['latitude']);
            $stmt->bindValue(':lng', $data['longitude']);
            $stmt->bindValue(':project', (int)$data['project'], PDO::PARAM_INT);
            $stmt->bindValue(':project_status', $data['project_status']);
            $stmt->bindValue(':type', (int)$data['type'], PDO::PARAM_INT);
            $stmt->bindValue(':installation', (int)$data['installation'], PDO::PARAM_INT);
            if (!$poles_id) {
                $stmt->bindValue(':status', 'inactive');
            }
            $stmt->bindValue(':default_color', $data['default_color']);
            if (!$stmt->execute()) {
                return ['status' => false, 'message' => 'save_failed'];
            }
            if (!$poles_id) {
                $poles_id = (int)$this->db->lastInsertId();
            }
            $ex_cover = $data['ex_cover'] ?? '';
            if (!$ex_cover) { $this->handleFileDelete($poles_id); }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $this->handleFileUpload($poles_id, $_FILES['cover']);
            }
            if ($should_trigger_api) {
                try {
                    require_once 'app/helpers/fetchWindSpeed.php';
                    $fetcher = new fetchWindSpeed($this->db);
                    $fetcher->processSinglePoint($poles_id, $data['latitude'], $data['longitude']);
                } catch (Exception $e) {
                    error_log("API Single Update Error: " . $e->getMessage());
                }
            }
            return ['status' => true, 'message' => 'success', 'id' => $poles_id];
        } catch (Exception $e) {
            error_log("Save Pole Error: " . $e->getMessage());
            return ['status' => false, 'message' => 'system_error' . $e->getMessage()];
        }
    }
    private function handleFileUpload($poles_id, $file) {
        $this->handleFileDelete($poles_id);  
        $dir = "uploads/poles/";
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
            $newName = $poles_id . "_" . time() . ".webp";
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
                $this->db->prepare("UPDATE wp_poles SET poles_icon=? WHERE poles_id =?")->execute([$dbPath, $poles_id]);
            }
            imagedestroy($image);

        } else {
            $newName = $poles_id . "_" . time() . "." . $ext;
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            if (move_uploaded_file($file['tmp_name'], $targetFull)) {
                $this->db->prepare("UPDATE wp_poles SET poles_icon=? WHERE poles_id =?")->execute([$dbPath, $poles_id]);
            }
        }
    }
    private function handleFileDelete($poles_id){
        $stmt = $this->db->prepare("SELECT poles_icon FROM wp_poles WHERE poles_id = ?");
        $stmt->execute([$poles_id]);
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
            $this->db->prepare("UPDATE wp_poles SET poles_icon = NULL WHERE poles_id = ?")->execute([$poles_id]);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
        }
    }
    public function delete($id) {
        $stmt = $this->db->prepare("UPDATE wp_poles SET status = 'deleted', updated_at = NOW() WHERE poles_id = ?
        ");
        return $stmt->execute([(int)$id]);
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = (int)max(0, ($page - 1) * $limit);
        $items = [];
        $totalCount = 0;
        $params = [];
        $whereClauses = [];
        if ($type === 'status') {
            $staticData = [
                ['id' => 'online', 'text' => 'Online'],
                ['id' => 'inactive', 'text' => 'Inactive']
            ];
            if ($searchTerm !== '') {
                $staticData = array_values(array_filter($staticData, function ($item) use ($searchTerm) {
                    return stripos($item['text'], $searchTerm) !== false;
                }));
            }
            return [
                'items' => array_slice($staticData, $offset, $limit),
                'total_count' => count($staticData)
            ];
        }
        $whereClauses[] = "status <> 'deleted'";
        switch ($type) {
            case 'project':
                $table = "wp_project";
                $columnId = "project_id";
                $columnText = "project_name";
                $order = "DESC";
                break;
            case 'pole':
                $table = "wp_poles";
                $columnId = "poles_id";
                $columnText = "poles_code";
                $order = "DESC";
                break;
            case 'type':
                $table = "wp_type";
                $columnId = "type_id";
                $columnText = "type_name";
                $order = "ASC";
                break;
            case 'installation':
                $table = "wp_installations";
                $columnId = "installations_id";
                $columnText = "installations_name";
                $order = "ASC";
                break;
            default:
                return ['items' => [], 'total_count' => 0];
        }
        if ($searchTerm !== '') {
            $whereClauses[] = "{$columnText} LIKE :search";
            $params[':search'] = "%{$searchTerm}%";
        }
        $whereSql = !empty($whereClauses) ? "WHERE " . implode(" AND ", $whereClauses) : "";
        $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM {$table} {$whereSql}");
        $stmtCount->execute($params);
        $totalCount = (int)$stmtCount->fetchColumn();
        $sql = "SELECT {$columnId} AS id, {$columnText} AS text 
                FROM {$table} 
                {$whereSql} 
                ORDER BY {$columnId} {$order} 
                LIMIT :limit OFFSET :offset";         
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return [
            'items' => $items,
            'total_count' => $totalCount
        ];
    }
    private function isDuplicatePole($poles_code, $poles_id = null){
        $sql = "SELECT COUNT(*) FROM wp_poles WHERE poles_code = :poles_code";
        if ($poles_id) {
            $sql .= " AND poles_id != :poles_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':poles_code', trim($poles_code));
        if ($poles_id) {
            $stmt->bindValue(':poles_id', (int)$poles_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
    public function gets($poles_id, $id) {
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $stmtTranslate = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('ENABLE_TRANSLATE', 'GOOGLE_API_KEY')");
        $stmtTranslate->execute();
        $translates = $stmtTranslate->fetchAll(PDO::FETCH_KEY_PAIR);
        if (!$id) {
            return [
                "id" => "", 
                "poles_id" => $poles_id,
                "status" => "active", 
                "cover" => "", 
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""],
                "status_translate" => ["th" => "", "lo" => "", "en" => ""],
                "translate_with" => ["th" => "", "lo" => "", "en" => ""],
                "response" => ["th" => "", "lo" => "", "en" => ""],
                "attachments" => [],
                "images" => [],
                "images360" => [],
                "presentation" => [],
                "settings" => $settings,
                "translates" => $translates,
                "cover_display" => 'no'
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, cover, cover_display FROM wp_content WHERE content_id = ?");
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
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? and status = 'active'");
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
            "poles_id" => $poles_id,
            "status" => $n['status'],
            "cover" => $n['cover'],
            "cover_display" => $n['cover_display'],
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
    public function saveContent($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?: null;
        $ex_cover = $data['ex_cover'] ?? null;
        $auto_translate = $data['auto_translate'] ?? 'no';
        $cover_display = $data['cover_display'] ?? 'no';
        $mediaHelper = new MediaHelper($pdo);
        $content_slug = $mediaHelper->generateSlug('pole', $data["title_en"], $content_id);
        try {
            $pdo->beginTransaction();
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = 'active', content_slug = :content_slug, cover_display = :cover_display, updated_at = NOW() WHERE content_id = :content_id");
                $stmt->bindValue(':content_slug', $content_slug);
                $stmt->bindValue(':cover_display', $cover_display);
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, content_slug, cover_display, type, created_at, updated_at) VALUES ('active', :content_slug, :cover_display, 'pole', NOW(), NOW())");
                $stmt->bindValue(':content_slug', $content_slug);
                $stmt->bindValue(':cover_display', $cover_display);
            }
            $stmt->execute();
            if (!$content_id) {
                $content_id = $pdo->lastInsertId();
            }
            $mediaHelper->handleContent($data, $content_id);
            if (!$ex_cover && !isset($_FILES['cover'])) {
                $mediaHelper->deleteExistingCover($content_id, 'wp_content', 'cover');
            }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $mediaHelper->handleSingleUpload($content_id, $_FILES['cover']);
            }
            $mediaHelper->syncMedia($content_id, 'attachment', $data['existing_attachments'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image', $data['existing_images'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image360', $data['existing_images360'] ?? []);
            $mediaHelper->syncMedia($content_id, 'presentation', $data['existing_presentation'] ?? []);
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
            $mediaHelper->handleMultiUpload($content_id, 'presentation', 'new_presentation');
            $stmtFolder = $pdo->prepare("UPDATE wp_poles SET content_id = :content_id WHERE poles_id = :id");
            $stmtFolder->execute([':content_id' => $content_id, ':id' => $data['poles_id']]);
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
    public function deleteContent($poles_id, $content_id) {
        $sql_folder = "UPDATE wp_poles SET content_id = NULL WHERE poles_id  = :id";
        $stmt_folder = $this->db->prepare($sql_folder);
        $res1 = $stmt_folder->execute([
            ':id' => $poles_id 
        ]);
        $sql_content = "UPDATE wp_content SET status = 'deleted', updated_at = NOW() WHERE content_id = :id";
        $stmt_content = $this->db->prepare($sql_content);
        $res2 = $stmt_content->execute([
            ':id' => $content_id
        ]);
        return ($res1 && $res2);
    }
    public function updateWind($id, $status) {
        $sql = "UPDATE wp_poles SET show_wind_speed=?, updated_at=NOW() WHERE poles_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, (int)$id]);
    }
    public function updateStatus($id, $status) {
        if($status === 'active') {
            $status = 'online';
        }
        $sql = "UPDATE wp_poles SET status = ?, updated_at = NOW() WHERE poles_id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, (int)$id]);
    }
}