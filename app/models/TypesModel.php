<?php
class TypesModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_type {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                type_id, 
                type_name,
                type_icon,
                status
            FROM wp_type
            {$where}
            ORDER BY type_id DESC
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
            $where .= " AND type_name LIKE :search ";
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
        $sql = "UPDATE wp_type SET status=?, updated_at=NOW() WHERE type_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['deleted', (int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return [
                'type_id' => '',
                'type_name' => '',
                'type_icon' => '',
                'status' => 'active'
            ];
        } else {
            $sql = "SELECT * FROM wp_type WHERE type_id  = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row;
        }
    }
    public function save($data) {
        $type_id = $data['type_id'] ?? null;
        $type_name = $data['type_name'] ?? '';
        $type_icon = $data['type_icon'] ?? '';
        $ex_type_icon = $data['ex_type_icon'] ?? '';
        if ($this->isDuplicateContractName($type_name, $type_id)) {
            return [
                'status'  => false,
                'message' => 'already_type'
            ];
        }
        $status = $data['status'] ?? '';
        $pdo = $this->db;
        if ($type_id) {
            $sql = "UPDATE wp_type SET type_name = :type_name, status = :status, updated_at = NOW() WHERE type_id = :type_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':type_id', (int)$type_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_type (
                type_name,
                status,
                created_at,
                updated_at
            ) VALUES (
                :type_name,
                :status,
                NOW(),
                NOW()
            )";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':type_name', $type_name);
        $stmt->bindValue(':status', $status);
        $result = $stmt->execute();
        if (!$type_id) $type_id = $pdo->lastInsertId();
        if(!$ex_type_icon) {
            $this->handleFileDelete($type_id);
        }
        if (isset($_FILES['type_icon']) && $_FILES['type_icon']['error'] === UPLOAD_ERR_OK) {
            $this->handleFileUpload($type_id, $_FILES['type_icon']);
        }
        return $result;
    }
    private function isDuplicateContractName($type_name, $type_id = null){
        $sql = "SELECT COUNT(*) FROM wp_type WHERE type_name = :type_name";
        if ($type_id) {
            $sql .= " AND type_id != :type_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':type_name', trim($type_name));
        if ($type_id) {
            $stmt->bindValue(':type_id', (int)$type_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
    private function handleFileUpload($type_id, $file) {
        $this->handleFileDelete($type_id);
        $dir = "uploads/type/";
        $fullDir = $dir;
        if (!is_dir($fullDir)) mkdir($fullDir, 0755, true);
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newName = $type_id . "_" . time() . "." . $ext;
        $dbPath = $dir . $newName;
        if (move_uploaded_file($file['tmp_name'], dirname(__DIR__, 2) . '/' . $dir . $newName)) {
            $this->db->prepare("UPDATE wp_type SET type_icon=? WHERE type_id =?")->execute([$dbPath, $type_id]);
        }
    }
    private function handleFileDelete($type_id){
        $stmt = $this->db->prepare("SELECT type_icon FROM wp_type WHERE type_id = ?");
        $stmt->execute([$type_id]);
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
            $this->db->prepare("UPDATE wp_type SET type_icon = NULL WHERE type_id = ?")->execute([$type_id]);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
        }
    }
}