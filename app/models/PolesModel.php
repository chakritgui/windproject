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
        $stmtSet = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_default')");
        $stmtSet->execute();
        $settings = $stmtSet->fetchAll(PDO::FETCH_KEY_PAIR);
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
                    iTh.status as th_status
                FROM wp_poles p
                LEFT JOIN wp_project pj ON pj.project_id = p.project_id
                LEFT JOIN wp_type t ON t.type_id = p.type_id
                LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
                LEFT JOIN wp_content c ON c.content_id = p.content_id
                LEFT JOIN wp_content_item iEn ON iEn.content_id = c.content_id AND iEn.content_lang='en'
                LEFT JOIN wp_content_item iLo ON iLo.content_id = c.content_id AND iLo.content_lang='lo'
                LEFT JOIN wp_content_item iTh ON iTh.content_id = c.content_id AND iTh.content_lang='th'
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
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($data as &$r) {
            $r['settings'] = $settings;
        }
        return [
            'total'    => $total,
            'data'     => $data
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
        $stmt = $pdo->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_default')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
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
                "settings" => $settings
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, cover FROM wp_content WHERE content_id = ?");
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
            "status_translate" => $status_translate,
            "response" => $response,
            "translate_with" => $translate_with,
            "attachments" => $attachments,
            "images" => $images,
            "images360" => $images360,
            "settings" => $settings
        ];
    }
    public function saveContent($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?: null;
        $ex_cover = $data['ex_cover'] ?? null;
        $auto_translate = $data['auto_translate'] ?? 'no';
        $mediaHelper = new MediaHelper($pdo);
        $content_slug = $mediaHelper->generateSlug('pole', $data["title_en"], $content_id);
        try {
            $pdo->beginTransaction();
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = 'active', content_slug = :content_slug, updated_at = NOW() WHERE content_id = :content_id");
                $stmt->bindValue(':content_slug', $content_slug);
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, content_slug, type, created_at, updated_at) VALUES ('active', :content_slug, 'pole', NOW(), NOW())");
                $stmt->bindValue(':content_slug', $content_slug);
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
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
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
}