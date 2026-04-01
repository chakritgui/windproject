<?php
class StatusModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10,$filters = [], $search = '', $colIndex = 0, $orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_project_status {$where}";
        $stmtTotal = $this->db->prepare($sqlTotal);
        foreach ($params as $key => $val) {
            $stmtTotal->bindValue($key, $val);
        }
        $stmtTotal->execute();
        $total = (int)$stmtTotal->fetchColumn();
        $orderMap = [
            0 => "item_order",
            2 => "project_status_name",
            3 => "created_at",
            4 => "status"
        ];
        $order = $orderMap[$colIndex] ?? 'created_at';
        $orderDir = strtolower($orderDir) === 'asc' ? 'ASC' : 'DESC';
        $sql = "SELECT 
                project_status_id,
                project_status_name,
                project_status_color,
                created_at,
                status,
                item_order
            FROM wp_project_status
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
            $where .= " AND project_status_name LIKE :search";
            $params[':search'] = '%' . $search . '%';
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
    }
    public function get($id) {
        if (!$id) {
            return ['project_status_id' => '', 'project_status_name' => '', 'project_status_color' => '#3b82f6'];
        }
        $sql = "SELECT * FROM wp_project_status WHERE project_status_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function save($data) {
        $id = $data['project_status_id'] ?? null;
        $name = trim($data['project_status_name'] ?? '');
        $color = $data['project_status_color'] ?? '#3b82f6';
        $status = $data['status'] ?? 'active';
        if ($this->isDuplicateName($name, $id)) {
            return ['status' => false, 'message' => 'already_exists'];
        }
        if ($id) {
            $sql = "UPDATE wp_project_status SET project_status_name = :name, project_status_color = :color,status = :status, updated_at = NOW() WHERE project_status_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_project_status (project_status_name, project_status_color, status, created_at, updated_at) 
                    VALUES (:name, :color, :status, NOW(), NOW())";
            $stmt = $this->db->prepare($sql);
        }
        $stmt->bindValue(':name', $name);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':color', $color);
        return $stmt->execute();
    }
    public function delete($id) {
        $sql = "UPDATE wp_project_status SET status = 'deleted', updated_at = NOW() WHERE project_status_id = ?";
        return $this->db->prepare($sql)->execute([(int)$id]);
    }
    private function isDuplicateName($name, $id = null) {
        $sql = "SELECT COUNT(*) FROM wp_project_status WHERE project_status_name = :name AND status <> 'deleted'";
        if ($id) { $sql .= " AND project_status_id <> :id"; }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':name', $name);
        if ($id) { $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT); }
        $stmt->execute();
        return (int)$stmt->fetchColumn() > 0;
    }
}