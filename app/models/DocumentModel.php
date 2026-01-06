<?php
class DocumentModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents d {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                d.document_id, 
                d.document_name, 
                d.document_type, 
                d.document_size, 
                d.document_start, 
                d.document_end, 
                d.document_path, 
                d.status, 
                d.created_at, 
                d.document_dowload,
                t.type_name as source_name
            FROM wp_documents d
            LEFT JOIN wp_type t on t.type_id = d.type_id
            {$where}
            ORDER BY d.document_id DESC
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
    public function get($id) {
        if (!$id) return null;
        $sql = "SELECT * FROM wp_documents WHERE document_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            foreach (['document_start', 'document_end'] as $f) {
                if (!empty($row[$f])) {
                    $row[$f] = convertTimeZone($row[$f], 'Y-m-d');
                }
            }
        }
        return $row;
    }
    public function save($data) {
        $this->db->beginTransaction();
        try {
            $document_id    = $data['document_id'] ?? null;
            $document_name  = $data['document_name'];
            $document_start = $data['document_start'];
            $document_end   = $data['document_end'];
            $status         = $data['status'];
            $source         = $data['source'];
            if ($document_id) {
                $this->updateDocument($document_id, $document_name, $document_start, $document_end, $status, $source);
            } else {
                $document_id = $this->insertDocument($document_name, $document_start, $document_end, $status, $source);
            }
            if (!empty($_FILES['document_file'])) {
                $this->handleFileUpload($document_id, $_FILES['document_file']);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function delete($id) {
        return $this->updateStatus($id, 'deleted');
    }
    public function change($id, $status) {
        return $this->updateStatus($id, $status);
    }
    public function downloadHistory($start, $length, $filters, $search) {
        list($where, $params) = $this->buildDownloadWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents_download_logs d LEFT JOIN wp_members m ON m.member_id = d.member_id {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = $stmt->fetchColumn();
        $sql = "SELECT
                d.*,
                CONCAT(m.first_name, ' ', m.last_name) AS member_name
            FROM wp_documents_download_logs d
            LEFT JOIN wp_members m ON m.member_id = d.member_id
            {$where}
            ORDER BY d.download_date DESC
            LIMIT {$start}, {$length}
        ";
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
    private function buildListWhere($filters, $search) {
        $where  = " WHERE d.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND d.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['source'])) {
            $where .= " AND d.type_id = :source";
            $params[':source'] = $filters['source'];
        }
        if (!empty($filters['date'])) {
            $where .= " AND :date BETWEEN DATE(d.document_start) AND DATE(d.document_end)";
            $params[':date'] = convertTimeZoneUTC($filters['date'], 'Y-m-d');
        }
        if (!empty($search)) {
            $where .= " AND d.document_name LIKE :search";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'Y/m/d H:i:s');
        }
        if (!empty($row['document_dowload'])) {
            $row['document_dowload'] = number_format($row['document_dowload']);
        }
        foreach (['document_start', 'document_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'Y/m/d');
            }
        }
    }
    private function insertDocument($name, $start, $end, $status, $source) {
        $sql = "INSERT INTO wp_documents (document_name, document_start, document_end, status, created_at, updated_at, type_id) VALUES (?, ?, ?, ?, NOW(), NOW(), ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$name, $start, $end, $status, $source]);
        return $this->db->lastInsertId();
    }
    private function updateDocument($id, $name, $start, $end, $status, $source) {
        $sql = "UPDATE wp_documents SET document_name=?, document_start=?, document_end=?, status=?, updated_at=NOW(), type_id=? WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$name, $start, $end, $status, $source, $id]);
    }
    private function updateStatus($id, $status) {
        if (!$id) return false;
        $sql = "UPDATE wp_documents SET status=?, updated_at=NOW() WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, (int)$id]);
    }
    private function handleFileUpload($document_id, $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) return;
        $sql = "SELECT document_path FROM wp_documents WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$document_id]);
        $old = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!empty($old['document_path'])) {
            $oldPath = dirname(__DIR__, 2) . '/' . $old['document_path'];
            if (file_exists($oldPath)) unlink($oldPath);
        }
        $dir = "uploads/document/";
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $size = $file['size'];
        $safe = preg_replace("/[^A-Za-z0-9_\.-]/", "_", basename($file['name']));
        $path   = "{$dir}{$document_id}_{$safe}";
        $target = dirname(__DIR__, 2) . '/' . $path;
        move_uploaded_file($file['tmp_name'], $target);
        $sql = "UPDATE wp_documents SET document_path=?, document_type=?, document_size=? WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$path, $ext, $size, $document_id]);
    }
    private function buildDownloadWhere($filters, $search) {
        $where = " WHERE 1=1 ";
        $params = [];
        if (!empty($filters['document_id'])) {
            $where .= " AND d.document_id = ?";
            $params[] = $filters['document_id'];
        }
        if (!empty($filters['date_start']) && !empty($filters['date_end'])) {
            $where .= " AND d.download_date BETWEEN ? AND ?";
            $params[] = convertTimeZoneUTC($filters['date_start'].' 00:00:00', 'Y-m-d H:i:s');
            $params[] = convertTimeZoneUTC($filters['date_end'].' 23:59:59', 'Y-m-d H:i:s');
        }
        if (!empty($search)) {
            $where .= " AND (m.first_name LIKE ? OR m.last_name LIKE ?)";
            $params[] = "%{$search}%";
            $params[] = "%{$search}%";
        }
        return [$where, $params];
    }
}