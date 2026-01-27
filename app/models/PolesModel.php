<?php
class PolesModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*)
            FROM wp_poles p
            LEFT JOIN wp_project pj ON pj.project_id = p.project_id
            LEFT JOIN wp_type t ON t.type_id = p.type_id
            LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
            {$where}
        ";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
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
                p.content_id
            FROM wp_poles p
            LEFT JOIN wp_project pj ON pj.project_id = p.project_id
            LEFT JOIN wp_type t ON t.type_id = p.type_id
            LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
            {$where}
            ORDER BY p.poles_id DESC
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
        return [
            'total' => $total,
            'data'  => $stmt->fetchAll(PDO::FETCH_ASSOC)
        ];
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE p.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND p.status = :status";
            $params[':status'] = $filters['status'];
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
        if (!$id) {
            return null;
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
                i.installations_name
            FROM wp_poles p
            LEFT JOIN wp_project pj ON pj.project_id = p.project_id
            LEFT JOIN wp_type t ON t.type_id = p.type_id
            LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
            WHERE p.poles_id = :id
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function save($data) {
        if ($this->isDuplicatePole(trim($data['poles_code']), (int)$data['poles_id'])) {
            return [
                'status'  => false,
                'message' => 'already_pole'
            ];
        }
        try {
            if (!empty($data['poles_id'])) {
                $sql = "UPDATE wp_poles SET
                        poles_code = :code,
                        poles_lat = :lat,
                        poles_lng = :lng,
                        project_id = :project,
                        type_id = :type,
                        installations_id = :installation,
                        status = :status,
                        updated_at = NOW()
                    WHERE poles_id = :id
                ";
            } else {
                $sql = "INSERT INTO wp_poles (
                        poles_code,
                        poles_lat,
                        poles_lng,
                        project_id,
                        type_id,
                        installations_id,
                        status,
                        created_at,
                        updated_at
                    ) VALUES (
                        :code,
                        :lat,
                        :lng,
                        :project,
                        :type,
                        :installation,
                        :status,
                        NOW(),
                        NOW()
                    )
                ";
            }
            $stmt = $this->db->prepare($sql);
            if (!empty($data['poles_id'])) {
                $stmt->bindValue(':id', (int)$data['poles_id'], PDO::PARAM_INT);
            }
            $stmt->bindValue(':code', trim($data['poles_code']));
            $stmt->bindValue(':lat', $data['latitude']);
            $stmt->bindValue(':lng', $data['longitude']);
            $stmt->bindValue(':project', (int)$data['project'], PDO::PARAM_INT);
            $stmt->bindValue(':type', (int)$data['type'], PDO::PARAM_INT);
            $stmt->bindValue(':installation', (int)$data['installation'], PDO::PARAM_INT);
            $stmt->bindValue(':status', $data['status']);
            return $stmt->execute();
        } catch (Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }
    public function delete($id) {
        $stmt = $this->db->prepare("UPDATE wp_poles SET status = 'deleted', updated_at = NOW() WHERE poles_id = ?
        ");
        return $stmt->execute([(int)$id]);
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = ''){
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        $params = [];
        $where = '';
        switch ($type) {
            case 'status':
                $staticData = [
                    ['id' => 'online', 'text' => 'Online'],
                    ['id' => 'inactive', 'text' => 'Inactive']
                ];
                if ($searchTerm !== '') {
                    $staticData = array_values(array_filter($staticData, function ($item) use ($searchTerm) {
                        return stripos($item['text'], $searchTerm) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
            case 'project':
                if ($searchTerm !== '') {
                    $where = "WHERE project_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_project {$where}");
                $stmtCount->execute($params);
                $totalCount = (int)$stmtCount->fetchColumn();
                $sql = "SELECT project_id AS id, project_name AS text
                    FROM wp_project
                    {$where}
                    ORDER BY project_id DESC
                    LIMIT :limit OFFSET :offset
                ";
                $stmt = $this->db->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
            case 'pole':
                if ($searchTerm !== '') {
                    $where = "WHERE poles_code LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_poles {$where}");
                $stmtCount->execute($params);
                $totalCount = (int)$stmtCount->fetchColumn();
                $sql = "SELECT poles_id AS id, poles_code AS text
                    FROM wp_poles
                    {$where}
                    ORDER BY poles_id DESC
                    LIMIT :limit OFFSET :offset
                ";
                $stmt = $this->db->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
            case 'type':
                if ($searchTerm !== '') {
                    $where = "WHERE type_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_type {$where}");
                $stmtCount->execute($params);
                $totalCount = (int)$stmtCount->fetchColumn();
                $sql = "SELECT type_id AS id, type_name AS text
                    FROM wp_type
                    {$where}
                    ORDER BY type_id ASC
                    LIMIT :limit OFFSET :offset
                ";
                $stmt = $this->db->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
            case 'installation':
                if ($searchTerm !== '') {
                    $where = "WHERE installations_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_installations {$where}");
                $stmtCount->execute($params);
                $totalCount = (int)$stmtCount->fetchColumn();
                $sql = "SELECT installations_id AS id, installations_name AS text
                    FROM wp_installations
                    {$where}
                    ORDER BY installations_id ASC
                    LIMIT :limit OFFSET :offset
                ";
                $stmt = $this->db->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
        }
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
        if (!$id) {
            return [
                "id" => "", 
                "poles_id" => $poles_id,
                "status" => "active", 
                "cover" => "", 
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""],
                "attachments" => [],
                "images" => [],
                "images360" => []
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, cover FROM wp_content WHERE content_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $content = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            $title[$lang] = $row['content_subject'];
            $content[$lang] = $row['content_body'];
        }
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? and status = 'active'");
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
            "poles_id" => $poles_id,
            "status" => $n['status'],
            "cover" => $n['cover'],
            "title" => $title,
            "content" => $content,
            "attachments" => $attachments,
            "images" => $images,
            "images360" => $images360
        ];
    }
    public function saveContent($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?: null;
        $ex_cover = $data['ex_cover'] ?? null;
        try {
            $pdo->beginTransaction();
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = 'active', updated_at = NOW() WHERE content_id = :content_id");
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, type, created_at, updated_at) VALUES ('active', 'pole', NOW(), NOW())");
            }
            $stmt->execute();
            if (!$content_id) $content_id = $pdo->lastInsertId();
            $sqlItem = "INSERT INTO wp_content_item (content_id, content_subject, content_body, content_lang, created_at, updated_at) 
                        VALUES (:content_id, :subject, :body, :lang, NOW(), NOW()) 
                        ON DUPLICATE KEY UPDATE content_subject = VALUES(content_subject), content_body = VALUES(content_body), updated_at = NOW()";
            $stmtItem = $pdo->prepare($sqlItem);
            $langs = ['en', 'lo', 'th'];
            foreach ($langs as $lang) {
                $subj = $data["title_$lang"] ?? '';
                $body = $data["content_$lang"] ?? '';
                if ($subj !== '' || $body !== '') {
                    $stmtItem->execute([':content_id' => $content_id, ':subject' => $subj, ':body' => $body, ':lang' => $lang]);
                }
            }
            if (!$ex_cover) {
                $this->handleFileDelete($content_id);
            }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $this->handleFileUpload($content_id, $_FILES['cover']);
            }
            $this->syncMedia($content_id, 'attachment', $data['existing_attachments'] ?? []);
            $this->syncMedia($content_id, 'image', $data['existing_images'] ?? []);
            $this->syncMedia($content_id, 'image360', $data['existing_images360'] ?? []);
            $this->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $this->handleMultiUpload($content_id, 'image', 'new_images');
            $this->handleMultiUpload($content_id, 'image360', 'new_images360');
            $stmtFolder = $pdo->prepare("UPDATE wp_poles SET content_id = :content_id WHERE poles_id = :id");
            $stmtFolder->execute([':content_id' => $content_id, ':id' => $data['poles_id']]);
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }
    private function syncMedia($content_id, $type, $existingIds) {
        $basePath = realpath(dirname(__DIR__, 2));
        if ($basePath === false) {
            error_log("Base path not found");
            return;
        }
        $existingIds = array_map('intval', $existingIds);
        $stmt = $this->db->prepare("SELECT id, file_path FROM wp_content_media WHERE content_id = ? AND file_type = ?");
        $stmt->execute([$content_id, $type]);
        $dbFiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($dbFiles as $file) {
            if (!in_array($file['id'], $existingIds)) {
                $fullPath = $basePath . '/' . ltrim($file['file_path'], '/');
                if (file_exists($fullPath) && is_file($fullPath)) {
                    @unlink($fullPath);
                }
                $this->db->prepare("UPDATE wp_content_media set status = 'deleted',updated_at = NOW() WHERE id = ?")->execute([$file['id']]);
            }
        }
    }
    private function handleMultiUpload($content_id, $type, $inputKey) {
        if (!isset($_FILES[$inputKey]) || empty($_FILES[$inputKey]['name'][0])) return;
        $files = $_FILES[$inputKey];
        $baseDir = "uploads/content/media/";
        $basePath = realpath(dirname(__DIR__, 2));
        if ($basePath === false) {
            error_log("Base path not found");
            return;
        }
        $uploadPath = $basePath . '/' . $baseDir;
        if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
        foreach ($files['name'] as $i => $originalName) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
            $ext = pathinfo($originalName, PATHINFO_EXTENSION);
            $safeName = $type . "_" . $content_id . "_" . bin2hex(random_bytes(8)) . "." . $ext;
            $dbPath = $baseDir . $safeName;

            if (move_uploaded_file($files['tmp_name'][$i], $uploadPath . $safeName)) {
                $stmt = $this->db->prepare("INSERT INTO wp_content_media (content_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([$content_id, $dbPath, $originalName, $type, $files['size'][$i]]);
            }
        }
    }
    private function handleFileUpload($content_id, $file) {
        $this->handleFileDelete($content_id);
        $dir = "uploads/content/";
        $fullDir = $dir;
        if (!is_dir($fullDir)) mkdir($fullDir, 0755, true);
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newName = $content_id . "_" . time() . "." . $ext;
        $dbPath = $dir . $newName;
        if (move_uploaded_file($file['tmp_name'], dirname(__DIR__, 2) . '/' . $dir . $newName)) {
            $this->db->prepare("UPDATE wp_content SET cover=? WHERE content_id =?")->execute([$dbPath, $content_id]);
        }
    }
    private function handleFileDelete($content_id){
        $stmt = $this->db->prepare("SELECT cover FROM wp_content WHERE content_id = ?");
        $stmt->execute([$content_id]);
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
            $this->db->prepare("UPDATE wp_content SET cover = NULL WHERE content_id = ?")->execute([$content_id]);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
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
}