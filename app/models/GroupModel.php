<?php
class GroupModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0,$length = 10,$filters = [],$search = '',$colIndex = 0,$orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_project_group {$where}";
        $stmtTotal = $this->db->prepare($sqlTotal);
        foreach ($params as $key => $val) {
            $stmtTotal->bindValue($key, $val);
        }
        $stmtTotal->execute();
        $total = (int)$stmtTotal->fetchColumn();
        $orderMap = [
            0 => "item_order",
            1 => "status",
            2 => "project_group_name",
            3 => "created_at",
        ];
        $order = $orderMap[$colIndex] ?? 'created_at';
        $orderDir = strtolower($orderDir) === 'asc' ? 'ASC' : 'DESC';
        $sql = "SELECT 
                project_group_id,
                project_group_name,
                created_at,
                status,
                item_order
            FROM wp_project_group
            {$where}
            ORDER BY {$order} {$orderDir}
        ";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
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
    private function buildListWhere($filters, $search){
        $where  = " WHERE status != 'deleted'";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($search)) {
            $where .= " AND project_group_name LIKE :search";
            $params[':search'] = '%' . $search . '%';
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
    }
    public function delete($id) {
        $sqlSelect = "SELECT project_group_name FROM wp_project_group WHERE project_group_id = ?";
        $stmtSelect = $this->db->prepare($sqlSelect);
        $stmtSelect->execute([(int)$id]);
        $group = $stmtSelect->fetch();
        if ($group) {
            $newName = "deleted_" . time() . "_" . $group['project_group_name'];
            $sql = "UPDATE wp_project_group SET 
                        status = 'deleted', 
                        project_group_name  = ?, 
                        updated_at = NOW() 
                    WHERE project_group_id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$newName, (int)$id]);
        }
        return false;
    }
    public function get($id) {
        if (!$id) {
            return ['project_group_id' => '', 'project_group_name' => '', 'status' => 'active'];
        }
        $sql = "SELECT * FROM wp_project_group WHERE project_group_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function save($data) {
        $id = $data['project_group_id'] ?? null;
        $name = trim($data['project_group_name'] ?? '');
        if ($this->isDuplicateName($name, $id)) {
            return ['status' => false, 'message' => 'already_exists'];
        }
        if ($id) {
            $sql = "UPDATE wp_project_group SET project_group_name = :name, updated_at = NOW() WHERE project_group_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_project_group (project_group_name, status, created_at, updated_at) 
                    VALUES (:name, :status, NOW(), NOW())";
            $stmt = $this->db->prepare($sql);
        }
        $stmt->bindValue(':name', $name);
        if (!$id) {
            $stmt->bindValue(':status', 'inactive');
        }
        return $stmt->execute();
    }
    private function isDuplicateName($name, $id = null) {
        $sql = "SELECT COUNT(*) FROM wp_project_group WHERE project_group_name = :name AND status <> 'deleted'";
        if ($id) {
            $sql .= " AND project_group_id <> :id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':name', $name);
        if ($id) {
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return (int)$stmt->fetchColumn() > 0;
    }
    public function updateStatus($id, $status) {
        $sql = "UPDATE wp_project_group SET status = ?, updated_at = NOW() WHERE project_group_id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, (int)$id]);
    }
}