<?php
class LevelModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $search = '', $colIndex = 2, $orderDir = 'desc') {
        $sqlTotal = "SELECT COUNT(*) FROM wp_height WHERE status <> 'deleted'";
        if (!empty($search)) {
            $sqlTotal .= " AND height_name LIKE :search";
        }
        $stmtTotal = $this->db->prepare($sqlTotal);
        if (!empty($search)) {
            $stmtTotal->bindValue(':search', '%' . $search . '%');
        }
        $stmtTotal->execute();
        $total = (int)$stmtTotal->fetchColumn();
        $orderMap = [
            0 => "h.height_name",
            2 => "h.created_at"
        ];
        $order = $orderMap[$colIndex] ?? 'created_at';
        $orderDir = strtolower($orderDir) === 'asc' ? 'asc' : 'desc';
        $sql = "SELECT h.height_id, h.height_name, h.created_at, group_concat(l.height_levels order by l.levels_id) as height_levels
                FROM wp_height h
                LEFT JOIN wp_height_levels l on l.height_id = h.height_id and l.status <> 'deleted'
                WHERE h.status <> 'deleted' 
                GROUP BY h.height_id";
        if (!empty($search)) {
            $sql .= " AND h.height_name LIKE :search";
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
        $sql = "UPDATE wp_height SET status = 'deleted', updated_at = NOW() WHERE height_id = ?";
        return $this->db->prepare($sql)->execute([(int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return ['height_id' => '', 'height_name' => '', 'height_levels' => ''];
        }
        $sql = "SELECT h.height_id, h.height_name, h.created_at, group_concat(l.height_levels order by l.levels_id) as height_levels
                FROM wp_height h
                LEFT JOIN wp_height_levels l on l.height_id = h.height_id and l.status <> 'deleted' WHERE h.height_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function save($data) {
        $id = $data['height_id'] ?? null;
        $name = trim($data['height_name'] ?? '');
        $levels_str = $data['height_levels'] ?? '';
        if ($this->isDuplicateName($name, $id)) {
            return ['status' => false, 'message' => 'already_exists'];
        }
        try {
            $this->db->beginTransaction();
            if ($id) {
                $sql = "UPDATE wp_height SET height_name = :name, updated_at = NOW() WHERE height_id = :id";
                $stmt = $this->db->prepare($sql);
                $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            } else {
                $sql = "INSERT INTO wp_height (height_name, status, created_at, updated_at) 
                        VALUES (:name, 'active', NOW(), NOW())";
                $stmt = $this->db->prepare($sql);
            }
            $stmt->bindValue(':name', $name);
            $stmt->execute();
            $current_height_id = $id ?: $this->db->lastInsertId();
            $sqlMarkDeleted = "UPDATE wp_height_levels SET status = 'deleted', updated_at = NOW() WHERE height_id = :hid";
            $stmtMark = $this->db->prepare($sqlMarkDeleted);
            $stmtMark->bindValue(':hid', $current_height_id, PDO::PARAM_INT);
            $stmtMark->execute();
            if (!empty($levels_str)) {
                $levels_array = array_unique(explode(',', $levels_str));
                $sqlUpsert = "INSERT INTO wp_height_levels (height_id, height_levels, status, created_at, updated_at) 
                            VALUES (:hid, :lvl, 'active', NOW(), NOW())
                            ON DUPLICATE KEY UPDATE status = 'active', updated_at = NOW()";
                $stmtIns = $this->db->prepare($sqlUpsert);
                foreach ($levels_array as $val) {
                    $val = trim($val);
                    if ($val !== "") {
                        $sqlCheck = "SELECT levels_id FROM wp_height_levels WHERE height_id = :hid AND height_levels = :lvl LIMIT 1";
                        $stmtCheck = $this->db->prepare($sqlCheck);
                        $stmtCheck->execute([':hid' => $current_height_id, ':lvl' => $val]);
                        $existing = $stmtCheck->fetch();
                        if ($existing) {
                            $sqlUpdate = "UPDATE wp_height_levels SET status = 'active', updated_at = NOW() WHERE levels_id = :lid";
                            $stmtUpd = $this->db->prepare($sqlUpdate);
                            $stmtUpd->execute([':lid' => $existing['levels_id']]);
                        } else {
                            $sqlInsert = "INSERT INTO wp_height_levels (height_id, height_levels, status, created_at, updated_at) 
                                        VALUES (:hid, :lvl, 'active', NOW(), NOW())";
                            $stmtIn = $this->db->prepare($sqlInsert);
                            $stmtIn->execute([':hid' => $current_height_id, ':lvl' => $val]);
                        }
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