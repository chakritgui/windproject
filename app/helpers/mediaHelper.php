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
    public function handleMultiUpload($content_id, $type, $inputKey){
        if (!isset($_FILES[$inputKey]) || empty($_FILES[$inputKey]['name'][0])) {
            return;
        }
        $files = $_FILES[$inputKey];
        $baseDir = "uploads/content/media/";
        $uploadPath = $this->basePath . '/' . $baseDir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        foreach ($files['name'] as $i => $originalName) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                continue;
            }
            $tmp  = $files['tmp_name'][$i];
            $size = $files['size'][$i];
            $baseName = md5($type . '_' . $content_id . '_' . $i);
            if ($type === 'image' && function_exists('imagewebp')) {
                $imgInfo = @getimagesize($tmp);
                if ($imgInfo !== false) {
                    switch ($imgInfo['mime']) {
                        case 'image/jpeg':
                            $image = imagecreatefromjpeg($tmp);
                            break;
                        case 'image/png':
                            $image = imagecreatefrompng($tmp);
                            imagepalettetotruecolor($image);
                            imagealphablending($image, true);
                            imagesavealpha($image, true);
                            break;
                        case 'image/gif':
                            $image = imagecreatefromgif($tmp);
                            break;
                        default:
                            $image = false;
                    }
                    if ($image) {
                        $fileName = $baseName . ".webp";
                        $target   = $uploadPath . $fileName;
                        imagewebp($image, $target, 80);
                        imagedestroy($image);
                        $dbPath = $baseDir . $fileName;
                        $stmt = $this->db->prepare("INSERT INTO wp_content_media (content_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
                        $stmt->execute([
                            $content_id,
                            $dbPath,
                            $originalName,
                            $type,
                            filesize($target)
                        ]);
                        continue;
                    }
                }
            }
            $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            $fileName = $baseName . "." . $ext;
            $dbPath   = $baseDir . $fileName;
            if (move_uploaded_file($tmp, $uploadPath . $fileName)) {
                $stmt = $this->db->prepare("INSERT INTO wp_content_media (content_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
                $stmt->execute([
                    $content_id,
                    $dbPath,
                    $originalName,
                    $type,
                    $size
                ]);
            }
        }
    }
    public function handleSingleUpload($content_id, $file, $table = 'wp_content', $column = 'cover'){
        $this->deleteExistingCover($content_id, $table, $column);
        if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        $dir = "uploads/content/";
        $uploadPath = $this->basePath . '/' . $dir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        $imgInfo = @getimagesize($file['tmp_name']);
        $isImage = ($imgInfo !== false);
        $baseName = md5($content_id);
        if ($isImage && function_exists('imagewebp')) {
            switch ($imgInfo['mime']) {
                case 'image/jpeg':
                    $image = imagecreatefromjpeg($file['tmp_name']);
                    break;
                case 'image/png':
                    $image = imagecreatefrompng($file['tmp_name']);
                    imagepalettetotruecolor($image);
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                    break;
                case 'image/gif':
                    $image = imagecreatefromgif($file['tmp_name']);
                    break;
                default:
                    $image = false;
            }
            if ($image) {
                $newName = $baseName . ".webp";
                $target  = $uploadPath . $newName;
                imagewebp($image, $target, 80);
                imagedestroy($image);
                $dbPath = $dir . $newName;
                $this->db->prepare("UPDATE $table SET $column = ? WHERE content_id = ?")->execute([$dbPath, $content_id]);
                return $dbPath;
            }
        }
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $newName = $baseName . "." . $ext;
        $dbPath  = $dir . $newName;
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
    public function generateSlug($type, $title, $id = 0) {
        $pdo = $this->db;
        $title = mb_strtolower($title, 'UTF-8');
        $slug = preg_replace('/[^\p{L}\p{N}\p{M}]+/u', '-', $title);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');
        $slug = mb_substr($slug, 0, 150, 'UTF-8');
        $slug = trim($slug, '-');
        if (empty($slug)) {
            $slug = $type . "-" . time();
        }
        $checkSql = "SELECT COUNT(*) FROM wp_content WHERE content_slug = :slug AND content_id != :id";
        $stmt = $pdo->prepare($checkSql);
        $tempSlug = $slug;
        $counter = 1;
        while (true) {
            $stmt->execute([':slug' => $tempSlug, ':id' => $id]);
            if ($stmt->fetchColumn() == 0) {
                $slug = $tempSlug;
                break;
            }
            $suffix = '-' . $counter;
            $tempSlug = mb_substr($slug, 0, 140, 'UTF-8') . $suffix;
            $counter++;
        }
        return $slug;
    }
}