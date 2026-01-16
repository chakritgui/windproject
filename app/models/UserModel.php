<?php
class UserModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function documentList($page = 1, $limit = 20, $type_id = null, $date = null, $keyword = null) {
        $offset = ($page - 1) * $limit;
        $where  = "WHERE d.status = 'public'";
        $params = [];
        if ($type_id) {
            $where .= " AND d.type_id = :type_id";
            $params[':type_id'] = [(int)$type_id, PDO::PARAM_INT];
        }
        if ($keyword) {
            $where .= " AND d.document_name LIKE :keyword";
            $params[':keyword'] = ['%' . $keyword . '%', PDO::PARAM_STR];
        }
        if ($date && preg_match('/^\d{2}\/\d{4}$/', $date)) {
            list($m, $y) = explode('/', $date);
            $start = convertTimeZoneUTC("$y-$m-01 00:00:00", 'Y-m-d H:i:s');
            $end   = convertTimeZoneUTC(
                date('Y-m-t 23:59:59', strtotime("$y-$m-01")),
                'Y-m-d H:i:s'
            );
            $where .= " AND d.document_start <= :end_date AND d.document_end >= :start_date";
            $params[':start_date'] = [$start, PDO::PARAM_STR];
            $params[':end_date']   = [$end, PDO::PARAM_STR];
        }
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_documents d $where");
        foreach ($params as $k => $p) {
            $stmt->bindValue($k, $p[0], $p[1]);
        }
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                d.document_id,
                d.document_name,
                d.document_type,
                d.document_size,
                d.document_start,
                d.document_end,
                d.document_path,
                d.created_at,
                d.document_download,
                COALESCE(t.type_name, '-') AS source_name
            FROM wp_documents d
            LEFT JOIN wp_type t ON t.type_id = d.type_id
            $where
            ORDER BY d.created_at DESC, d.document_id DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $p) {
            $stmt->bindValue($k, $p[0], $p[1]);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatDocumentRow($row);
        }
        return [
            'total'    => $total,
            'page'     => $page,
            'limit'    => $limit,
            'has_more' => ($offset + $limit) < $total,
            'items'    => $rows
        ];
    }
    private function formatDocumentRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
        if (!empty($row['document_download'])) {
            $row['document_download'] = number_format($row['document_download']);
        }
        foreach (['document_start', 'document_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y');
            }
        }
    }
    public function documentDownload($data) {
        if (empty($data['id']) || !is_numeric($data['id'])) {
            return false;
        }
        $document_id = (int)$data['id'];
        $member_id   = $_SESSION['user']['id'] ?? null;
        $device      = substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 255);
        try {
            $this->db->beginTransaction();
            $sql = "INSERT INTO wp_documents_download_logs (document_id, member_id, download_date, download_device) VALUES (:document_id, :member_id, NOW(), :device)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':document_id' => $document_id,
                ':member_id'   => $member_id,
                ':device'      => $device
            ]);
            $sql = "UPDATE wp_documents SET document_download = document_download + 1 WHERE document_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $document_id]);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function documentDownloadHistory($page = 1, $limit = 20) {
        $member_id = $_SESSION['user']['id'] ?? null;
        $offset = ($page - 1) * $limit;
        $where  = '';
        $params = [];
        if ($member_id) {
            $where = 'WHERE l.member_id = :member_id';
            $params[':member_id'] = (int)$member_id;
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents_download_logs l $where";
        $stmt = $this->db->prepare($sqlTotal);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_INT);
        }
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                l.download_date,
                l.download_device,
                d.document_name,
                t.type_name,
                d.document_type,
                d.document_size
            FROM wp_documents_download_logs l
            LEFT JOIN wp_documents d ON d.document_id = l.document_id
            LEFT JOIN wp_type t ON t.type_id = d.type_id
            $where
            ORDER BY l.download_date DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit',  (int)$limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($items as &$row) {
            $row['download_date'] = convertTimeZone($row['download_date'], 'd/m/Y H:i:s');
        }
        unset($row);
        return [
            'items'    => $items,
            'has_more' => ($offset + $limit) < $total
        ];
    }
}