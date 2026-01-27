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
    public function gets($id) {
        $pdo = $this->db;
        if (!$id) {
            return [
                "id" => "", "status" => "active", "cover" => "", "notification_status" => "no",
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""]
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
        return [
            "id" => $n['content_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "title" => $title,
            "content" => $content
        ];
    }
}