<?php
class InstallationsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 0, $orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_installations i {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'i.created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "i.item_order",
            1 => "p.project_name",
            2 => "t.type_name",
            3 => "i.installations_name",
            4 => "i.installations_name_display",
            5 => "i.created_at",
            6 => "i.status",
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                i.installations_id, 
                i.installations_name,
                i.installations_name_display,
                i.status,
                p.project_name,
                t.type_name,
                i.created_at,
                i.item_order
            FROM wp_installations i
            LEFT JOIN wp_project p on p.project_id = i.project_id
            LEFT JOIN wp_type t on t.type_id = i.type_id
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
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatDocumentRow($row);
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE i.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND i.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['project'])) {
            $where .= " AND i.project_id = :project";
            $params[':project'] = $filters['project'];
        }
        if (!empty($filters['type'])) {
            $where .= " AND i.type_id = :type";
            $params[':type'] = $filters['type'];
        }
        if (!empty($search)) {
            $where .= " AND (i.installations_name LIKE :search)";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        foreach (['created_at'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = (int)max(0, ($page - 1) * $limit);
        $items = [];
        $totalCount = 0;
        $params = [];
        $whereClauses = [];
        if ($type === 'status') {
            $staticData = [
                ['id' => 'active', 'text' => 'active'],
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
        $whereClauses[] = "status <> 'deleted'";
        if ($searchTerm !== '') {
            $whereClauses[] = "{$columnText} LIKE :search";
            $params[':search'] = "%{$searchTerm}%";
        }
        $whereSql = "WHERE " . implode(" AND ", $whereClauses);
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
    public function delete($id) {
        $sqlSelect = "SELECT installations_name FROM wp_installations WHERE installations_id = ?";
        $stmtSelect = $this->db->prepare($sqlSelect);
        $stmtSelect->execute([(int)$id]);
        $installations = $stmtSelect->fetch();
        if ($installations) {
            $newName = "deleted_" . time() . "_" . $installations['installations_name'];
            $sql = "UPDATE wp_installations SET 
                        status = 'deleted', 
                        installations_name  = ?, 
                        updated_at = NOW() 
                    WHERE installations_id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$newName, (int)$id]);
        }
        return false;
    }
    public function get($id) {
        if (!$id) {
            return [
                'installations_id' => '',
                'installations_name' => '',
                'installations_name_display' => '',
                'project_id' => '',
                'project_name' => '',
                'type_id' => '',
                'type_name' => '',
                'status' => 'active'
            ];
        } else {
            $sql = "SELECT 
                    i.installations_id,
                    i.installations_name,
                    i.installations_name_display,
                    i.status,
                    p.project_id,
                    p.project_name,
                    t.type_id,
                    t.type_name
                FROM wp_installations i
                LEFT JOIN wp_project p on p.project_id = i.project_id
                LEFT JOIN wp_type t on t.type_id = i.type_id
                WHERE i.installations_id  = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row;
        }
    }
    public function save(array $data){
        $installations_id   = !empty($data['installations_id']) ? (int)$data['installations_id'] : null;
        $installations_name = trim($data['installations_name'] ?? '');
        $installations_name_display = trim($data['installations_name_display'] ?? '');
        $project_id         = (int)($data['project'] ?? 0);
        $type_id            = (int)($data['type'] ?? 0);
        $status             = ($data['status'] ?? '');
        if ($installations_name === '') {
            return [
                'status'  => false,
                'message' => 'empty_installation_name'
            ];
        }
        if ($this->isDuplicateInstallationName($installations_name,$project_id,$type_id,$installations_id)) {
            return [
                'status'  => false,
                'message' => 'already_installation'
            ];
        }
        $pdo = $this->db;
        if ($installations_id) {
            $sql = "UPDATE wp_installations SET installations_name = :installations_name, installations_name_display = :installations_name_display, project_id = :project_id, type_id = :type_id, status = :status, updated_at = NOW() WHERE installations_id = :installations_id";
        } else {
            $sql = "INSERT INTO wp_installations (
                    installations_name,
                    installations_name_display,
                    project_id,
                    type_id,
                    status,
                    created_at,
                    updated_at
                ) VALUES (
                    :installations_name,
                    :installations_name_display,
                    :project_id,
                    :type_id,
                    :status,
                    NOW(),
                    NOW()
                )
            ";
        }
        $stmt = $pdo->prepare($sql);
        if ($installations_id) {
            $stmt->bindValue(':installations_id', $installations_id, PDO::PARAM_INT);
        }
        $stmt->bindValue(':installations_name', $installations_name);
        $stmt->bindValue(':installations_name_display', $installations_name_display);
        $stmt->bindValue(':project_id', $project_id, PDO::PARAM_INT);
        $stmt->bindValue(':type_id', $type_id, PDO::PARAM_INT);
        $stmt->bindValue(':status', $status);
        $result = $stmt->execute();
        if (!$result) {
            return [
                'status'  => false,
                'message' => 'db_error'
            ];
        }
        return [
            'status' => true,
            'id'     => $installations_id ?: (int)$pdo->lastInsertId()
        ];
    }
    private function isDuplicateInstallationName($installations_name,$project_id,$type_id,$installations_id = null) {
        $sql = "SELECT 1 FROM wp_installations WHERE installations_name = :installations_name AND project_id = :project_id AND type_id = :type_id";
        if ($installations_id) {
            $sql .= " AND installations_id != :installations_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':installations_name', trim($installations_name));
        $stmt->bindValue(':project_id', (int)$project_id, PDO::PARAM_INT);
        $stmt->bindValue(':type_id', (int)$type_id, PDO::PARAM_INT);
        if ($installations_id) {
            $stmt->bindValue(':installations_id', (int)$installations_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return (bool)$stmt->fetchColumn();
    }
}