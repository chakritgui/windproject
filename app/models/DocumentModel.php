<?php
class DocumentModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        $pdo = $this->db;
        $where = " WHERE status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND status = :status ";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['date'])) {
            $where .= " AND :date BETWEEN date(document_start) AND date(document_end) ";
            $params[':date'] = convertTimeZoneUTC($filters['date'],'Y-m-d');
        }
        if (!empty($search)) {
            $where .= " AND (document_name LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents {$where}";
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = (int)$stmtTotal->fetchColumn();
        $sql = "SELECT
                document_id,
                document_name,
                document_type,
                document_size,
                document_start,
                document_end,
                document_path,
                status,
                created_at,
                document_dowload
            FROM wp_documents
            {$where}
            ORDER BY document_id DESC
        ";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length ";
        }
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            foreach (['created_at'] as $field) {
                if (!empty($r[$field])) {
                    $r[$field] = convertTimeZone($r[$field], 'Y/m/d H:i:s');
                }
            }
            foreach (['document_dowload'] as $field) {
                if (!empty($r[$field])) {
                    $r[$field] = number_format($r[$field]);
                }
            }
            foreach (['document_start', 'document_end'] as $field) {
                if (!empty($r[$field])) {
                    $r[$field] = convertTimeZone($r[$field], 'Y/m/d');
                }
            }
        }
        return [
            "total" => $total,
            "data"  => $rows
        ];
    }
    public function get($id){
        if($id) {
            $pdo = $this->db;
            $sql = "SELECT * FROM wp_documents WHERE document_id=?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            foreach (['document_start', 'document_end'] as $field) {
                if (!empty($row[$field])) {
                    $row[$field] = convertTimeZone($row[$field], 'Y-m-d');
                }
            }
            return $row;
        }
        return null;
    }
    public function save($data) {
        $pdo = $this->db;
        $pdo->beginTransaction();
        try {
            $document_id     = $data['document_id'] ?? null;
            $document_name   = $data['document_name'];
            $document_start  = $data['document_start'];
            $document_end    = $data['document_end'];
            $status          = $data['status'];
            $document_file = $_FILES['document_file'] ?? null;
            if (!empty($document_id)) {
                $sql = "UPDATE wp_documents SET document_name=?, document_start=?, document_end=?, status=?, updated_at=NOW() WHERE document_id=?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$document_name, $document_start, $document_end, $status, $document_id]);
            } else {
                $sql = "INSERT INTO wp_documents (document_name, document_start, document_end, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$document_name, $document_start, $document_end, $status]);
                $document_id = $pdo->lastInsertId();
            }
            if ($document_file && $document_file['error'] == UPLOAD_ERR_OK) {
                $sqlOld = "SELECT document_path FROM wp_documents WHERE document_id = ?";
                $stmtOld = $pdo->prepare($sqlOld);
                $stmtOld->execute([$document_id]);
                $old = $stmtOld->fetch(PDO::FETCH_ASSOC);
                if ($old && !empty($old['document_path'])) {
                    $oldPath = dirname(__DIR__,2) . "/" . $old['document_path'];
                    if (file_exists($oldPath)) {
                        unlink($oldPath);
                    }
                }
                $document_type = strtolower(pathinfo($document_file['name'], PATHINFO_EXTENSION));
                $document_size = $document_file['size'];
                $dir = "uploads/document/";
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                $safeName = preg_replace("/[^A-Za-z0-9_\.-]/", "_", basename($document_file['name']));
                $document_path = $dir . $document_id . "_" . $safeName;
                $target = dirname(__DIR__,2) . "/" . $document_path;
                move_uploaded_file($document_file['tmp_name'], $target);
                $sql = "UPDATE wp_documents SET document_path=?, document_type=?, document_size=? WHERE document_id=?";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$document_path, $document_type, $document_size, $document_id]);
            }
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $pdo->rollBack();
            return false;
        }
    }
    public function delete($id) {
        if ($id) {
            $pdo = $this->db;
            $sql = "UPDATE wp_documents SET status='deleted', updated_at=NOW() WHERE document_id=?";
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([(int)$id]);
        }
        return false;
    }
    public function change($id, $status) {
        if ($id) {
            $pdo = $this->db;
            $sql = "UPDATE wp_documents SET status= ?, updated_at=NOW() WHERE document_id=?";
            $stmt = $pdo->prepare($sql);
            return $stmt->execute([$status, (int)$id]);
        }
        return false;
    }
    public function downloadHistory($start, $length, $filters, $search){
        $where = " WHERE 1=1 ";
        $params = [];
        if (!empty($filters['document_id'])) {
            $where .= " AND d.document_id = ? ";
            $params[] = $filters['document_id'];
        }
        if (!empty($filters['date_start']) && !empty($filters['date_end'])) {
            $startUtc = convertTimeZoneUTC($filters['date_start'] . ' 00:00:00', 'Y-m-d H:i:s');
            $endUtc   = convertTimeZoneUTC($filters['date_end']   . ' 23:59:59', 'Y-m-d H:i:s');
            $where .= " AND d.download_date BETWEEN ? AND ? ";
            $params[] = $startUtc;
            $params[] = $endUtc;
        }
        if (!empty($search)) {
            $where .= " AND (m.first_name LIKE ? OR m.last_name LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents_download_logs d LEFT JOIN wp_members m ON m.member_id = d.member_id $where";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = $stmt->fetchColumn();
        $sql = "SELECT 
                    d.*,
                    CONCAT(m.first_name, ' ', m.last_name) AS member_name
                FROM wp_documents_download_logs d
                LEFT JOIN wp_members m ON m.member_id = d.member_id
                $where
                ORDER BY d.download_date DESC
                LIMIT $start, $length";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            if (!empty($r['download_date'])) {
                $r['download_date'] = convertTimeZone($r['download_date'], 'Y/m/d H:i:s');
            }
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
}