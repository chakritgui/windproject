<?php
class LevelModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 0, $orderDir = 'asc'){
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(DISTINCT h.height_id) FROM wp_height h LEFT JOIN wp_height_levels l ON l.height_id = h.height_id  AND l.status <> 'deleted' {$where}";
        $stmtTotal = $this->db->prepare($sqlTotal);
        foreach ($params as $key => $val) {
            $stmtTotal->bindValue($key, $val);
        }
        $stmtTotal->execute();
        $total = (int)$stmtTotal->fetchColumn();
        $orderMap = [
            0 => "h.item_order",
            1 => "h.height_name",
            3 => "h.height_limit",
            4 => "h.created_at",
            5 => "h.status"
        ];
        $order = $orderMap[$colIndex] ?? 'h.created_at';
        $orderDir = strtolower($orderDir) === 'asc' ? 'ASC' : 'DESC';
        $sql = "SELECT 
                h.height_id,
                h.height_name,
                h.height_limit,
                h.created_at,
                GROUP_CONCAT(l.height_levels ORDER BY IFNULL(l.height_order, l.levels_id) ASC) AS height_levels,
                h.status,
                h.item_order
            FROM wp_height h
            LEFT JOIN wp_height_levels l ON l.height_id = h.height_id AND l.status <> 'deleted'
            {$where}
            GROUP BY h.height_id
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
        $where  = " WHERE h.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND h.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($search)) {
            $where .= " AND h.height_name LIKE :search";
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
        $sqlSelect = "SELECT height_name FROM wp_height WHERE height_id = ?";
        $stmtSelect = $this->db->prepare($sqlSelect);
        $stmtSelect->execute([(int)$id]);
        $level = $stmtSelect->fetch();
        if ($level) {
            $newName = "deleted_" . time() . "_" . $level['height_name'];
            $sql = "UPDATE wp_height SET 
                        status = 'deleted', 
                        height_name  = ?, 
                        updated_at = NOW() 
                    WHERE height_id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$newName, (int)$id]);
        }
        return false;
    }
    public function get($id) {
        if (!$id) {
            return ['height_id' => '', 'height_name' => '', 'height_levels' => '', 'height_limit' => 3, 'status' => 'active'];
        }
        $sql = "SELECT h.height_id, h.height_name, h.height_limit, h.created_at, group_concat(l.height_levels order by ifnull(l.height_order, l.levels_id) ASC) as height_levels, h.status FROM wp_height h LEFT JOIN wp_height_levels l on l.height_id = h.height_id and l.status <> 'deleted' WHERE h.height_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function save($data) {
        $id = $data['height_id'] ?? null;
        $name = trim($data['height_name'] ?? '');
        $levels_str = $data['height_levels'] ?? '';
        $height_limit = $data['height_limit'] ?? 3;
        $status = $data['status'] ?? 'active';

        if ($this->isDuplicateName($name, $id)) {
            return ['status' => false, 'message' => 'already_exists'];
        }
        try {
            $this->db->beginTransaction();
            if ($id) {
                $sql = "UPDATE wp_height SET height_name = :name, height_limit = :height_limit, updated_at = NOW(), status = :status WHERE height_id = :id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            } else {
                $sql = "INSERT INTO wp_height (height_name, height_limit, status, created_at, updated_at) VALUES (:name, :height_limit, :status, NOW(), NOW())";
                $stmt = $this->db->prepare($sql);
            }
            $stmt->bindValue(':name', $name);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':height_limit', (int)$height_limit, PDO::PARAM_INT);
            $stmt->execute();
            $current_height_id = $id ?: $this->db->lastInsertId();
            $sqlMarkDeleted = "UPDATE wp_height_levels SET status = 'deleted', updated_at = NOW() WHERE height_id = :hid";
            $stmtMark = $this->db->prepare($sqlMarkDeleted);
            $stmtMark->execute([':hid' => $current_height_id]);
            if (!empty($levels_str)) {
                $levels_array = array_unique(array_filter(explode(',', $levels_str)));
                $sqlUpsert = "INSERT INTO wp_height_levels (height_id, height_levels, height_order, status, created_at, updated_at) 
                            VALUES (:hid, :lvl, :ord, 'active', NOW(), NOW())
                            ON DUPLICATE KEY UPDATE 
                                height_order = VALUES(height_order), 
                                status = 'active', 
                                updated_at = NOW()";
                $stmtIn = $this->db->prepare($sqlUpsert);
                foreach ($levels_array as $index => $val) {
                    $val = trim($val);
                    if ($val !== "") {
                        $stmtIn->execute([
                            ':hid' => $current_height_id,
                            ':lvl' => $val,
                            ':ord' => $index + 1 
                        ]);
                    }
                }
            }
            $this->db->commit(); 
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    private function isDuplicateName($name, $id = null) {
        $sql = "SELECT COUNT(*) FROM wp_height WHERE height_name = :name AND status <> 'deleted'";
        if ($id) {
            $sql .= " AND height_id <> :id";
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