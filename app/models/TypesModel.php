<?php
class TypesModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 0, $orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_type {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "item_order",
            2 => "type_name",
            3 => "type_name_display",
            4 => "created_at",
            5 => "status"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                type_id, 
                type_name,
                type_name_display,
                type_icon,
                status,
                created_at,
                item_order
            FROM wp_type
            {$where}
            ORDER BY {$order} {$orderDir}
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
    private function formatDocumentRow(&$row) {
        foreach (['created_at'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
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
                'type_name_display' => '',
                'cover' => '',
                'status' => 'active'
            ];
        } else {
            $sql = "SELECT *, type_icon as cover FROM wp_type WHERE type_id  = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row;
        }
    }
    public function save($data) {
        $type_id = $data['type_id'] ?? null;
        $type_name = $data['type_name'] ?? '';
        $type_name_display = $data['type_name_display'] ?? '';
        $ex_cover = $data['ex_cover'] ?? '';
        if ($this->isDuplicateContractName($type_name, $type_id)) {
            return [
                'status'  => false,
                'message' => 'already_type'
            ];
        }
        $status = $data['status'] ?? '';
        $pdo = $this->db;
        if ($type_id) {
            $sql = "UPDATE wp_type SET type_name = :type_name, type_name_display = :type_name_display, status = :status, updated_at = NOW() WHERE type_id = :type_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':type_id', (int)$type_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_type (
                type_name,
                type_name_display,
                status,
                created_at,
                updated_at
            ) VALUES (
                :type_name,
                :type_name_display,
                :status,
                NOW(),
                NOW()
            )";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':type_name', $type_name);
        $stmt->bindValue(':type_name_display', $type_name_display);
        $stmt->bindValue(':status', $status);
        $result = $stmt->execute();
        if (!$type_id) $type_id = $pdo->lastInsertId();
        if(!$ex_cover) {
            $this->handleFileDelete($type_id);
        }
        if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
            $this->handleFileUpload($type_id, $_FILES['cover']);
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
        $baseDir = dirname(__DIR__, 2) . '/' . $dir;
        if (!is_dir($baseDir)) mkdir($baseDir, 0755, true);
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $image = false;
        switch ($ext) {
            case 'jpeg':
            case 'jpg':  $image = @imagecreatefromjpeg($file['tmp_name']); break;
            case 'png':   $image = @imagecreatefrompng($file['tmp_name']);  break;
            case 'gif':   $image = @imagecreatefromgif($file['tmp_name']);  break;
            case 'webp':  $image = @imagecreatefromwebp($file['tmp_name']); break;
        }
        if ($image) {
            $newName = $type_id . "_" . time() . ".webp";
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            $quality = 85;
            do {
                ob_start();
                imagewebp($image, null, $quality);
                $imageData = ob_get_contents();
                ob_end_clean();
                if (strlen($imageData) <= 1048576 || $quality <= 20) {
                    break;
                }
                $quality -= 10;
            } while ($quality > 10);
            if (file_put_contents($targetFull, $imageData)) {
                $this->db->prepare("UPDATE wp_type SET type_icon=? WHERE type_id =?")->execute([$dbPath, $type_id]);
            }
            imagedestroy($image);

        } else {
            $newName = $type_id . "_" . time() . "." . $ext;
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            if (move_uploaded_file($file['tmp_name'], $targetFull)) {
                $this->db->prepare("UPDATE wp_type SET type_icon=? WHERE type_id =?")->execute([$dbPath, $type_id]);
            }
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