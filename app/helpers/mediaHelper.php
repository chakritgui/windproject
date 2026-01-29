<?php
class MediaHelper {
    private $db;
    private $basePath;
    public function __construct($db) {
        $this->db = $db;
        $this->basePath = realpath(dirname(__DIR__, 2)); 
    }
    public function syncMedia($content_id, $type, $existingIds = []) {
        if ($this->basePath === false) return;
        $existingIds = array_map('intval', (array)$existingIds);
        $stmt = $this->db->prepare("SELECT id, file_path FROM wp_content_media WHERE content_id = ? AND file_type = ?");
        $stmt->execute([$content_id, $type]);
        $dbFiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($dbFiles as $file) {
            if (!in_array($file['id'], $existingIds)) {
                $this->deletePhysicalFile($file['file_path']);  
                $this->db->prepare("UPDATE wp_content_media SET status = 'deleted', updated_at = NOW() WHERE id = ?")->execute([$file['id']]);
            }
        }
    }
    public function handleMultiUpload($content_id, $type, $inputKey) {
        if (!isset($_FILES[$inputKey]) || empty($_FILES[$inputKey]['name'][0])) return;
        $files = $_FILES[$inputKey];
        $baseDir = "uploads/content/media/";
        $uploadPath = $this->basePath . '/' . $baseDir;
        if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
        foreach ($files['name'] as $i => $originalName) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
            $ext = pathinfo($originalName, PATHINFO_EXTENSION);
            $safeName = $type . "_" . $content_id . "_" . bin2hex(random_bytes(8)) . "." . $ext;
            $dbPath = $baseDir . $safeName;
            if (move_uploaded_file($files['tmp_name'][$i], $uploadPath . $safeName)) {
                $stmt = $this->db->prepare("INSERT INTO wp_content_media (content_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([$content_id, $dbPath, $originalName, $type, $files['size'][$i]]);
            }
        }
    }
    public function handleSingleUpload($content_id, $file, $table = 'wp_content', $column = 'cover') {
        $this->deleteExistingCover($content_id, $table, $column);
        $dir = "uploads/content/";
        $uploadPath = $this->basePath . '/' . $dir;
        if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newName = $content_id . "_" . time() . "." . $ext;
        $dbPath = $dir . $newName;
        if (move_uploaded_file($file['tmp_name'], $uploadPath . $newName)) {
            $this->db->prepare("UPDATE $table SET $column = ? WHERE content_id = ?")->execute([$dbPath, $content_id]);
            return $dbPath;
        }
        return false;
    }
    public function deleteExistingCover($content_id, $table, $column) {
        $stmt = $this->db->prepare("SELECT $column FROM $table WHERE content_id = ?");
        $stmt->execute([$content_id]);
        $oldPath = $stmt->fetchColumn();
        if ($oldPath) {
            $this->deletePhysicalFile($oldPath);
            $this->db->prepare("UPDATE $table SET $column = NULL WHERE content_id = ?")->execute([$content_id]);
        }
    }
    private function deletePhysicalFile($relativeShortPath) {
        $fullPath = $this->basePath . '/' . ltrim($relativeShortPath, '/');
        if (file_exists($fullPath) && is_file($fullPath)) {
            return @unlink($fullPath);
        }
        return false;
    }
}