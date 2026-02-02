<?php
class MediaHelper {
    private $db;
    private $basePath;
    private string $GOOGLE_API_KEY;
    public function __construct($db) {
        $this->db = $db;
        $this->basePath = realpath(dirname(__DIR__, 2)); 
        $this->GOOGLE_API_KEY = GOOGLE_API_KEY;
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
    public function notification($content_id, $status, $publish_at, $target) {
        $pdo = $this->db;
        $isExternalTrans = $pdo->inTransaction();
        try {
            if (!$isExternalTrans) $pdo->beginTransaction();
            if ($status == 'published') {
                $sql = "INSERT INTO wp_notification_targets (notifications_target, notifications_item, member_id, publish_at, status)
                        SELECT :target, :nid, member_id, :pub, 'published' 
                        FROM wp_members WHERE status = 'active'
                        ON DUPLICATE KEY UPDATE status = 'published', publish_at = :pub";
                $pdo->prepare($sql)->execute([':target' => $target, ':nid' => $content_id, ':pub' => $publish_at]);
            } else {
                $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status, publish_at = NULL WHERE notifications_item = :id AND notifications_target = :target");
                $stmt->execute([':status' => $status, ':id' => $content_id, ':target' => $target]);
            }
            if (!$isExternalTrans) $pdo->commit();
        } catch (Exception $e) {
            if (!$isExternalTrans && $pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
    public function autoTranslate($content_id){
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT content_lang FROM wp_content_item WHERE content_id = ? AND status = 'ready' AND content_lang IN ('th','lo')");
        $stmt->execute([$content_id]);
        $targets = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!$targets) return false;
        $stmt = $pdo->prepare("SELECT content_subject, content_body FROM wp_content_item WHERE content_id = ? AND content_lang = 'en' LIMIT 1");
        $stmt->execute([$content_id]);
        $source = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$source) return false;
        foreach ($targets as $lang) {
            try {
                $pdo->prepare("UPDATE wp_content_item SET status = 'wait' WHERE content_id = ? AND content_lang = ?")->execute([$content_id, $lang]);
                $subject = $this->translatePlainText(
                    $source['content_subject'],
                    'en',
                    $lang,
                    $content_id
                );
                $body = $this->translateTinyMCEHtml(
                    $source['content_body'],
                    'en',
                    $lang,
                    $content_id
                );
                $pdo->prepare("UPDATE wp_content_item SET content_subject = ?, content_body = ?, status = 'success',response = NULL,updated_at = NOW() WHERE content_id = ? AND content_lang = ?")->execute([
                    $subject,
                    $body,
                    $content_id,
                    $lang
                ]);
            } catch (\Throwable $e) {
                $pdo->prepare("UPDATE wp_content_item SET status = 'failed',response = ? WHERE content_id = ? AND content_lang = ?")->execute([
                    $e->getMessage(),
                    $content_id,
                    $lang
                ]);
            }
        }
        return true;
    }
    private function translatePlainText($text, $source, $target, $content_id){
        if (trim($text) === '') return '';
        $this->logTranslateUsage(
            $content_id,
            'subject',
            $source,
            $target,
            $text
        );
        return $this->callTranslateApi($text, $source, $target);
    }
    private function translateTinyMCEHtml($html, $source, $target, $content_id){
        if (trim($html) === '') return '';
        libxml_use_internal_errors(true);
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        $wrapper = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>'
                . $html .
                '</body></html>';
        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->loadHTML($wrapper);
        $xpath = new DOMXPath($dom);
        $skipTags = [
            'script','style',
            'img','video','audio',
            'iframe','object','embed',
            'source','track'
        ];
        foreach ($xpath->query('//body//text()') as $node) {
            $parent = $node->parentNode;
            if (!$parent) continue;
            if (in_array($parent->nodeName, $skipTags)) continue;
            $text = trim(html_entity_decode($node->nodeValue, ENT_QUOTES, 'UTF-8'));
            if ($text === '') continue;
            $this->logTranslateUsage(
                $content_id,
                'body',
                $source,
                $target,
                $text
            );
            $translated = $this->callTranslateApi(
                $text,
                $source,
                $target
            );
            $node->nodeValue = htmlspecialchars(
                $translated,
                ENT_NOQUOTES | ENT_HTML5,
                'UTF-8'
            );
            usleep(120000);
        }
        $body = $dom->getElementsByTagName('body')->item(0);
        $result = '';
        foreach ($body->childNodes as $child) {
            $result .= $dom->saveHTML($child);
        }
        return html_entity_decode($result, ENT_QUOTES, 'UTF-8');
    }
    private function callTranslateApi($text, $source, $target){
        $url = 'https://translation.googleapis.com/language/translate/v2?key=' . $this->GOOGLE_API_KEY;
        $payload = [
            'q'      => $text,
            'source' => $source,
            'target' => $target,
            'format' => 'text'
        ];
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode($payload),
            CURLOPT_TIMEOUT        => 30
        ]);
        $response = curl_exec($ch);
        if ($response === false) {
            throw new Exception('CURL error: ' . curl_error($ch));
        }
        curl_close($ch);
        $json = json_decode($response, true);
        if (!isset($json['data']['translations'][0]['translatedText'])) {
            throw new Exception('Google Translate API error: ' . $response);
        }
        return $json['data']['translations'][0]['translatedText'];
    }
    private function logTranslateUsage($content_id, $part, $source, $target, $text){
        $chars = mb_strlen($text, 'UTF-8');
        $words = count(preg_split('/\s+/u', trim($text)));
        $stmt = $this->db->prepare("INSERT INTO translate_usage_log (content_id, part, source_lang, target_lang, char_count, word_count) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $content_id,
            $part,
            $source,
            $target,
            $chars,
            $words
        ]);
    }
}