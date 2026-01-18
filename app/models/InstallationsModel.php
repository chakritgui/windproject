<?php
class InstallationsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_installations {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                installations_id, 
                installations_name,
                status
            FROM wp_installations
            {$where}
            ORDER BY installations_id DESC
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
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($search)) {
            $where .= " AND (installations_name LIKE :search)";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
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
        }
        return [
            'items' => $items,
            'total_count' => $totalCount
        ];
    }
    public function delete($id) {
        $sql = "UPDATE wp_installations SET status=?, updated_at=NOW() WHERE installations_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['deleted', (int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return [
                'installations_id' => '',
                'installations_name' => '',
                'status' => 'active'
            ];
        } else {
            $sql = "SELECT * FROM wp_installations WHERE installations_id  = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row;
        }
    }
    public function save($data) {
        $installations_id = $data['installations_id'] ?? null;
        $installations_name = $data['installations_name'] ?? '';
        if ($this->isDuplicateInstallationName($installations_name, $installations_id)) {
            return [
                'status'  => false,
                'message' => 'already_installation'
            ];
        }
        $status = $data['status'] ?? '';
        $pdo = $this->db;
        if ($installations_id) {
            $sql = "UPDATE wp_installations SET installations_name = :installations_name, status = :status, updated_at = NOW() WHERE installations_id = :installations_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':installations_id', (int)$installations_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_installations (
                installations_name
                status,
                created_at,
                updated_at
            ) VALUES (
                :installations_name,
                :status,
                NOW(),
                NOW()
            )";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':installations_name', $installations_name);
        $stmt->bindValue(':status', $status);
        return $stmt->execute();
    }
    private function isDuplicateInstallationName($installations_name, $installations_id = null){
        $sql = "SELECT COUNT(*) FROM wp_installations WHERE installations_name = :installations_name";
        if ($installations_id) {
            $sql .= " AND installations_id != :installations_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':installations_name', trim($installations_name));
        if ($installations_id) {
            $stmt->bindValue(':installations_id', (int)$installations_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
}