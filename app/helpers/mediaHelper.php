<?php
class MediaHelper {
    private $db;
    private $basePath;
    private string $TRANSLATE_LIMIT;
    public function __construct($db) {
        $this->db = $db;
        $this->basePath = realpath(dirname(__DIR__, 2));
        $this->TRANSLATE_LIMIT = TRANSLATE_LIMIT;
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
        if (!isset($_FILES[$inputKey]) || empty($_FILES[$inputKey]['name'][0])) {
            return;
        }
        $files = $_FILES[$inputKey];
        $baseDir = "uploads/content/media/";
        $uploadPath = rtrim($this->basePath, '/') . '/' . $baseDir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        foreach ($files['name'] as $i => $originalName) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
            $tmp      = $files['tmp_name'][$i];
            $size     = $files['size'][$i];
            $baseName = md5($type . '_' . $content_id . '_' . $i);
            $image    = false;
            $isConverted = false;
            if ($type === 'image' && function_exists('imagewebp')) {
                $imgInfo = @getimagesize($tmp);
                if ($imgInfo !== false) {
                    switch ($imgInfo['mime']) {
                        case 'image/jpeg': $image = imagecreatefromjpeg($tmp); break;
                        case 'image/png': 
                            $image = imagecreatefrompng($tmp);
                            imagepalettetotruecolor($image);
                            imagealphablending($image, true);
                            imagesavealpha($image, true);
                            break;
                        case 'image/gif':  $image = imagecreatefromgif($tmp); break;
                        case 'image/webp': 
                            if (function_exists('imagecreatefromwebp')) {
                                $image = imagecreatefromwebp($tmp);
                            }
                            break;
                    }
                    if ($image) {
                        $fileName = $baseName . ".webp";
                        $target   = $uploadPath . $fileName;
                        if (imagewebp($image, $target, 80)) {
                            imagedestroy($image);
                            $dbPath = $baseDir . $fileName;
                            $finalSize = filesize($target);
                            $isConverted = true;
                        } else {
                            imagedestroy($image);
                        }
                    }
                }
            }
            if (!$isConverted) {
                $ext      = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                $fileName = $baseName . "." . $ext;
                $target   = $uploadPath . $fileName;
                $dbPath   = $baseDir . $fileName;
                if (!move_uploaded_file($tmp, $target)) continue;
                $finalSize = $size;
            }
            $stmt = $this->db->prepare("INSERT INTO wp_content_media (content_id, file_path, file_name, file_type, file_size, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())");
            $stmt->execute([$content_id, $dbPath, $originalName, $type, $finalSize]);
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
                $pdo->prepare($sql)->execute([
                    ':target' => $target, 
                    ':nid' => $content_id, 
                    ':pub' => $publish_at
                ]);
                $stmtNoti = $pdo->prepare("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('NOTIFY_EMAIL', 'NOTIFY_PWA')");
                $stmtNoti->execute();
                $settings = $stmtNoti->fetchAll(PDO::FETCH_KEY_PAIR);
                $canEmail = ($settings['NOTIFY_EMAIL'] ?? 0) == 1;
                $canPWA   = ($settings['NOTIFY_PWA'] ?? 0) == 1;
                if ($canEmail) {
                    $this->handleEmail($content_id, $publish_at);
                }
                if ($canPWA) {
                    $this->handlePWA($content_id, $publish_at);
                }
            } else {
                $sql = "UPDATE wp_notification_targets SET status = :status, publish_at = NULL WHERE notifications_item = :id AND notifications_target = :target"; 
                $pdo->prepare($sql)->execute([
                    ':status' => $status, 
                    ':id' => $content_id, 
                    ':target' => $target
                ]);
                $pdo->prepare("DELETE FROM email_queue WHERE status = 'pending' AND subject IN (SELECT content_subject FROM wp_content_item WHERE content_id = ?)")->execute([$content_id]);
                $pdo->prepare("DELETE FROM pwa_notification_queue WHERE status = 'pending' AND title IN (SELECT content_subject FROM wp_content_item WHERE content_id = ?)")->execute([$content_id]);
            }
            if (!$isExternalTrans) $pdo->commit();
        } catch (Exception $e) {
            if (!$isExternalTrans && $pdo->inTransaction()) $pdo->rollBack();
            error_log("Notification Error: " . $e->getMessage());
            throw $e;
        }
    }
    private function handleEmail($id, $publish_at = null) {
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $availableContent = [];
        foreach ($items as $row) {
            $availableContent[$row['content_lang']] = [
                'subject' => $row['content_subject'],
                'body'    => $row['content_body']
            ];
        }
        if (empty($availableContent)) return;
        $sqlMembers = "SELECT m.member_id, m.email, IFNULL(ml.language, 'en') as user_lang FROM wp_members m LEFT JOIN wp_members_language ml ON m.member_id = ml.member_id WHERE m.status = 'active'";
        $members = $pdo->query($sqlMembers)->fetchAll(PDO::FETCH_ASSOC);
        $sqlQueue = "INSERT INTO email_queue (recipient_email, subject, body, priority, status, scheduled_at, created_at) VALUES (:email, :subject, :body, :priority, 'pending', :scheduled, NOW())";
        $stmtQueue = $pdo->prepare($sqlQueue);
        $scheduledTime = $publish_at ?: date('Y-m-d H:i:s');
        foreach ($members as $member) {
            $targetLang = $member['user_lang'];
            $final = $availableContent[$targetLang] ?? null;
            if (!$final) {
                foreach (['en', 'lo', 'th'] as $fallback) {
                    if (isset($availableContent[$fallback])) {
                        $final = $availableContent[$fallback];
                        break;
                    }
                }
            }
            if ($final) {
                $stmtQueue->execute([
                    ':email'     => $member['email'],
                    ':subject'   => $final['subject'],
                    ':body'      => $final['body'],
                    ':priority'  => 3,
                    ':scheduled' => $scheduledTime
                ]);
            }
        }
    }
    private function handlePWA($id, $publish_at = null) {
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $availableSubjects = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        if (empty($availableSubjects)) return;
        $sqlSub = "SELECT ps.id, ps.user_id, IFNULL(ml.language, 'en') as user_lang FROM push_subscriptions ps LEFT JOIN wp_members_language ml ON ps.user_id = ml.member_id WHERE ps.is_active = 1"; 
        $subscriptions = $pdo->query($sqlSub)->fetchAll(PDO::FETCH_ASSOC);
        $sqlInsert = "INSERT INTO pwa_notification_queue (subscription_id, title, status, scheduled_at, created_at) VALUES (?, ?, 'pending', ?, NOW())";
        $stmtInsert = $pdo->prepare($sqlInsert);
        $scheduledTime = $publish_at ?: date('Y-m-d H:i:s');
        foreach ($subscriptions as $sub) {
            $targetLang = ($sub['user_id'] !== null) ? $sub['user_lang'] : 'en';
            $finalSubject = $availableSubjects[$targetLang] ?? '';
            if ($finalSubject === '') {
                foreach (['en', 'lo', 'th'] as $fallback) {
                    if (isset($availableSubjects[$fallback])) {
                        $finalSubject = $availableSubjects[$fallback];
                        break;
                    }
                }
            }
            if ($finalSubject !== '') {
                $stmtInsert->execute([$sub['id'], $finalSubject, $scheduledTime]);
            }
        }
    }
    public function handleContent($data, $content_id) {
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT setting_value FROM wp_setting WHERE setting_type = 'language_content' LIMIT 1");
        $stmt->execute();
        $dbDefaultLang = $stmt->fetchColumn() ?: 'en';
        $sqlItem = "INSERT INTO wp_content_item 
                    (content_id, content_subject, content_body, content_lang, is_default, translate_with, created_at, updated_at) 
                    VALUES (:content_id, :subject, :body, :lang, :is_default, 'self', NOW(), NOW()) 
                    ON DUPLICATE KEY UPDATE 
                        is_default = VALUES(is_default),
                        translate_with = IF(content_subject <=> VALUES(content_subject) AND content_body <=> VALUES(content_body), translate_with, 'self'),
                        content_subject = VALUES(content_subject), 
                        content_body = VALUES(content_body), 
                        updated_at = NOW()";
        $stmtItem = $pdo->prepare($sqlItem);
        $langs = ['en', 'th', 'lo'];
        foreach ($langs as $lang) {
            $subj = trim($data["title_$lang"] ?? '');
            $bodyRaw = $data["content_$lang"] ?? '';
            $cleanBody = trim(strip_tags($bodyRaw, '<img><iframe>'));
            $cleanBody = str_replace('&nbsp;', '', $cleanBody);
            $cleanBody = trim($cleanBody);
            $body = ($cleanBody === '' && !str_contains($bodyRaw, '<img')) ? null : $bodyRaw;
            $subj = ($subj === '') ? null : $subj;
            $isDefaultFlag = ($lang === $dbDefaultLang) ? 'yes' : 'no';
            $stmtItem->execute([
                ':content_id' => $content_id,
                ':subject'    => $subj,
                ':body'       => $body,
                ':lang'       => $lang,
                ':is_default' => $isDefaultFlag
            ]);
            $status = ($body === null && $subj === null) ? 'wait' : 'ready';
            $sqlStatus = "UPDATE wp_content_item SET status = :status, response = NULL WHERE content_id = :content_id AND content_lang = :lang";
            $stmtStatus = $pdo->prepare($sqlStatus);
            $stmtStatus->execute([
                ':status'     => $status,
                ':content_id' => $content_id,
                ':lang'       => $lang
            ]);
        }
    }
    public function autoTranslate($content_id) {
        $pdo = $this->db;
        if (date('j') === '1') {
            $this->archiveOldLogs();
        }
        $stmtSet = $pdo->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmtSet->execute();
        $settings = $stmtSet->fetchAll(PDO::FETCH_KEY_PAIR);
        $enabledLangs = explode(',', $settings['language'] ?? 'en');
        $stmtSource = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ? AND is_default = 'yes' LIMIT 1");
        $stmtSource->execute([$content_id]);
        $source = $stmtSource->fetch(PDO::FETCH_ASSOC);
        if (!$source || empty($source['content_subject'])) return false;
        $sourceLang = $source['content_lang'];
        $stmtTargets = $pdo->prepare("SELECT content_lang FROM wp_content_item WHERE content_id = ? AND content_lang != ?");
        $stmtTargets->execute([$content_id, $sourceLang]);
        $allTargetLangsInDb = $stmtTargets->fetchAll(PDO::FETCH_COLUMN);
        $targetsToProcess = array_intersect($allTargetLangsInDb, $enabledLangs);
        if (empty($targetsToProcess)) return false;
        $charsPerLanguage = mb_strlen($source['content_subject'] ?? '', 'UTF-8') + mb_strlen($source['content_body'] ?? '', 'UTF-8');
        $estimatedTotalChars = $charsPerLanguage * count($targetsToProcess);
        if (!$this->isUsageAllowed($estimatedTotalChars)) {
            $errorMsg = "Quota exceeded: Estimated usage (" . number_format($estimatedTotalChars) . " chars) exceeds daily average limit.";
            foreach ($targetsToProcess as $lang) {
                $pdo->prepare("UPDATE wp_content_item SET status = 'failed', response = ? WHERE content_id = ? AND content_lang = ?")->execute([$errorMsg, $content_id, $lang]);
            }
            return false;
        }
        foreach ($targetsToProcess as $lang) {
            try {
                $subject = $this->translatePlainText($source['content_subject'], $sourceLang, $lang, $content_id);
                $body = $this->translateTinyMCEHtml($source['content_body'], $sourceLang, $lang, $content_id);
                $subject = trim($subject ?? '');
                $subject = ($subject === '') ? null : $subject;
                $cleanBody = trim(strip_tags($body ?? '', '<img><iframe>'));
                $cleanBody = str_replace('&nbsp;', '', $cleanBody);
                $cleanBody = trim($cleanBody);
                $body = ($cleanBody === '' && !str_contains($body ?? '', '<img')) ? null : $body;
                $status = ($subject === null && $body === null) ? 'wait' : 'ready';
                $translateWith = ($status === 'ready') ? 'ai' : null;
                $pdo->prepare("UPDATE wp_content_item SET 
                    content_subject = ?, 
                    content_body = ?, 
                    status = ?, 
                    response = NULL, 
                    updated_at = NOW(), 
                    translate_with = ? 
                    WHERE content_id = ? AND content_lang = ?")
                ->execute([
                    $subject, 
                    $body, 
                    $status, 
                    $translateWith, 
                    $content_id, 
                    $lang
                ]);
            } catch (\Throwable $e) {
                $pdo->prepare("UPDATE wp_content_item SET status = 'failed', response = ? WHERE content_id = ? AND content_lang = ?")
                    ->execute([$e->getMessage(), $content_id, $lang]);
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
    private function callTranslateApi($text, $source, $target) {
        $sqlStatus = "SELECT setting_value FROM system_settings WHERE setting_key = 'ENABLE_TRANSLATE' LIMIT 1";
        $stmtStatus = $this->db->prepare($sqlStatus);
        $stmtStatus->execute();
        $isEnabled = $stmtStatus->fetchColumn();
        if (!$isEnabled || $isEnabled == '0') {
            return $text; 
        }
        $sql = "SELECT setting_value FROM system_settings WHERE setting_key = 'GOOGLE_API_KEY' LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $encryptedKey = $stmt->fetchColumn();
        if (!$encryptedKey) {
            return $text;
        }
        $apiKey = decryptToken($encryptedKey); 
        $url = 'https://translation.googleapis.com/language/translate/v2?key=' . $apiKey;
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
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_SSL_VERIFYPEER => true
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($response === false) {
            $error = curl_error($ch);
            curl_close($ch);
            return $text;
        }
        curl_close($ch);
        $json = json_decode($response, true);
        if ($httpCode !== 200 || !isset($json['data']['translations'][0]['translatedText'])) {
            return $text;
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
    private function isUsageAllowed($newTextLength) {
        $limit = (float)$this->TRANSLATE_LIMIT;
        if ($limit <= 0) {
            return true;
        }
        if ($limit > 500000) {
            $limit = 500000;
        }
        $today = new DateTime('now', new DateTimeZone('UTC'));
        $daysInMonth = (int)$today->format('t');
        $currentDay = (int)$today->format('j');
        $allowedUntilToday = ($limit / $daysInMonth) * $currentDay;
        $firstDayOfMonth = $today->format('Y-m-01 00:00:00');
        $stmt = $this->db->prepare("SELECT SUM(char_count) as total FROM translate_usage_log WHERE created_at >= ?");
        $stmt->execute([$firstDayOfMonth]);
        $usedTotal = (int)($stmt->fetch()['total'] ?? 0);
        return ($usedTotal + $newTextLength) <= $allowedUntilToday;
    }
    public function archiveOldLogs() {
        $pdo = $this->db;
        $lastMonth = new DateTime('first day of last month', new DateTimeZone('UTC'));
        $yearMonth = $lastMonth->format('Y-m');
        $startDate = $lastMonth->format('Y-m-01 00:00:00');
        $endDate = $lastMonth->format('Y-m-t 23:59:59');
        try {
            $check = $pdo->prepare("SELECT id FROM translate_usage_summary WHERE `year_month` = ?");
            $check->execute([$yearMonth]);
            if ($check->fetch()) {
                return "Month $yearMonth already archived.";
            }
            $stmt = $pdo->prepare("SELECT SUM(char_count) as total_chars, SUM(word_count) as total_words, COUNT(*) as total_requests FROM translate_usage_log WHERE created_at BETWEEN ? AND ?
            ");
            $stmt->execute([$startDate, $endDate]);
            $summary = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($summary && $summary['total_requests'] > 0) {
                $pdo->beginTransaction();
                $insert = $pdo->prepare("INSERT INTO translate_usage_summary (`year_month`, total_chars, total_words, total_requests) VALUES (?, ?, ?, ?)");
                $insert->execute([
                    $yearMonth, 
                    $summary['total_chars'] ?? 0, 
                    $summary['total_words'] ?? 0, 
                    $summary['total_requests'] ?? 0
                ]);
                $delete = $pdo->prepare("DELETE FROM translate_usage_log WHERE created_at <= ?");
                $delete->execute([$endDate]);
                $pdo->commit();
                return "Archived $yearMonth successfully: " . number_format($summary['total_chars']) . " chars processed.";
            }
            return "No usage data found for $yearMonth.";
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log("Archive Error: " . $e->getMessage());
            return "Error during archiving: " . $e->getMessage();
        }
    }
}