<?php
class GroupModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $search = '', $colIndex = 1, $orderDir = 'desc') {
        $sqlTotal = "SELECT COUNT(*) FROM wp_project_group WHERE status <> 'deleted'";
        if (!empty($search)) {
            $sqlTotal .= " AND project_group_name LIKE :search";
        }
        $stmtTotal = $this->db->prepare($sqlTotal);
        if (!empty($search)) {
            $stmtTotal->bindValue(':search', '%' . $search . '%');
        }
        $stmtTotal->execute();
        $total = (int)$stmtTotal->fetchColumn();
        $orderMap = [
            0 => "project_group_name",
            1 => "created_at"
        ];
        $order = $orderMap[$colIndex] ?? 'created_at';
        $orderDir = strtolower($orderDir) === 'asc' ? 'asc' : 'desc';
        $sql = "SELECT project_group_id, project_group_name, created_at
                FROM wp_project_group
                WHERE status <> 'deleted'";
        if (!empty($search)) {
            $sql .= " AND project_group_name LIKE :search";
        }
        $sql .= " ORDER BY {$order} {$orderDir}";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $this->db->prepare($sql);
        if (!empty($search)) {
            $stmt->bindValue(':search', '%' . $search . '%');
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
    private function formatDocumentRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
    }
    public function delete($id) {
        $sql = "UPDATE wp_project_group SET status = 'deleted', updated_at = NOW() WHERE project_group_id = ?";
        return $this->db->prepare($sql)->execute([(int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return ['project_group_id' => '', 'project_group_name' => ''];
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
                    VALUES (:name, 'active', NOW(), NOW())";
            $stmt = $this->db->prepare($sql);
        }
        $stmt->bindValue(':name', $name);
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
}