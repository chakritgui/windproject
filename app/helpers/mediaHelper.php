<?php
class MediaHelper {
    private $db;
    private $basePath;
    private string $TRANSLATE_LIMIT;
    private $configs = [];
    private $siteSettings = [];
    public function __construct($db) {
        $this->db = $db;
        $this->basePath = realpath(dirname(__DIR__, 2));
        $this->TRANSLATE_LIMIT = TRANSLATE_LIMIT;
        $this->loadAllConfigs();
    }
    private function loadAllConfigs() {
        $stmt = $this->db->prepare("SELECT setting_key, setting_value FROM system_settings");
        $stmt->execute();
        $this->configs = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $stmt2 = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting");
        $stmt2->execute();
        $this->siteSettings = $stmt2->fetchAll(PDO::FETCH_KEY_PAIR);
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
    private function convertToOptimizedWebp($tmpPath, $targetPath, $maxDim = 1600, $maxSizeKB = 1024){
        $imgInfo = @getimagesize($tmpPath);
        if (!$imgInfo) return false;
        $width  = $imgInfo[0];
        $height = $imgInfo[1];
        $mime   = $imgInfo['mime'];
        switch ($mime) {
            case 'image/jpeg': $source = imagecreatefromjpeg($tmpPath); break;
            case 'image/png':
                $source = imagecreatefrompng($tmpPath);
                imagepalettetotruecolor($source);
                imagealphablending($source, true);
                imagesavealpha($source, true);
                break;
            case 'image/gif':  $source = imagecreatefromgif($tmpPath); break;
            case 'image/webp': $source = imagecreatefromwebp($tmpPath); break;
            default: return false;
        }
        if (!$source) return false;
        if ($width > $maxDim || $height > $maxDim) {
            $ratio = $width / $height;
            if ($ratio > 1) {
                $newWidth  = $maxDim;
                $newHeight = intval($maxDim / $ratio);
            } else {
                $newHeight = $maxDim;
                $newWidth  = intval($maxDim * $ratio);
            }
            $canvas = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            imagecopyresampled($canvas, $source, 0, 0, 0, 0,
                $newWidth, $newHeight, $width, $height);
            imagedestroy($source);
            $source = $canvas;
        }
        $quality = 85;
        do {
            imagewebp($source, $targetPath, $quality);
            clearstatcache(true, $targetPath);
            $fileSizeKB = filesize($targetPath) / 1024;
            $quality -= 5;
        } while ($fileSizeKB > $maxSizeKB && $quality >= 50);
        imagedestroy($source);
        return file_exists($targetPath);
    }
    public function handleMultiUpload($content_id, $type, $inputKey){
        if (!isset($_FILES[$inputKey]) || empty($_FILES[$inputKey]['name'][0])) {
            return;
        }
        $allowedImageExt = ['jpg','jpeg','png','gif','webp'];
        $allowedPresentationExt = ['jpg','jpeg','png','gif','webp','mp4'];
        $allowedFileExt  = ['ppt','pptx','pdf','doc','docx','xls','xlsx','txt','zip','rar','jpg','jpeg','png','gif','webp'];
        $files = $_FILES[$inputKey];
        $baseDir = "uploads/content/media/";
        $uploadPath = rtrim($this->basePath,'/') . '/' . $baseDir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        foreach ($files['name'] as $i => $originalName) {
            if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;
            $tmp  = $files['tmp_name'][$i];
            $ext  = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
            if (in_array($type, ['image','image360'])) {
                if (!in_array($ext, $allowedImageExt)) continue;
            } else if (in_array($type, ['presentation'])) {
                if (!in_array($ext, $allowedPresentationExt)) continue;
            } else {
                if (!in_array($ext, $allowedFileExt)) continue;
            }
            $baseName = md5($type . '_' . $content_id . '_' . uniqid('', true));
            $dbPath   = "";
            $target   = "";
            if (in_array($type, ['image','image360']) && function_exists('imagewebp')) {
                $fileName = $baseName . ".webp";
                $target   = $uploadPath . $fileName;
                if ($this->convertToOptimizedWebp($tmp, $target, 1600, 1024)) {
                    $dbPath = $baseDir . $fileName;
                    $finalSize = filesize($target);
                }
            } else {
                $fileName = $baseName . "." . $ext;
                $target   = $uploadPath . $fileName;
                if (move_uploaded_file($tmp, $target)) {
                    $dbPath   = $baseDir . $fileName;
                    $finalSize = filesize($target);
                }
            }
            if (!$dbPath) continue;
            try {
                $stmt = $this->db->prepare("INSERT INTO wp_content_media (content_id,file_path,file_name,file_type,file_size,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())");
                $stmt->execute([$content_id,$dbPath,$originalName,$type,$finalSize]);
            } catch (Exception $e) {
                if (file_exists($target)) unlink($target);
            }
        }
    }
    public function handleSingleUpload($content_id, $file, $table='wp_content', $column='cover'){
        $this->deleteExistingCover($content_id, $table, $column);
        if (empty($file) || $file['error'] !== UPLOAD_ERR_OK) {
            return false;
        }
        $dir = "uploads/content/";
        $uploadPath = rtrim($this->basePath,'/') . '/' . $dir;
        if (!is_dir($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        $imgInfo = @getimagesize($file['tmp_name']);
        $isImage = ($imgInfo !== false);
        $baseName = md5($content_id . '_' . uniqid('', true));
        if ($isImage && function_exists('imagewebp')) {
            $newName = $baseName . ".webp";
            $target  = $uploadPath . $newName;
            if ($this->convertToOptimizedWebp($file['tmp_name'], $target, 1600, 1024)) {
                $dbPath = $dir . $newName;
                $this->db->prepare("UPDATE $table SET $column=? WHERE content_id=?")->execute([$dbPath,$content_id]);
                return $dbPath;
            }
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
            if ($status === 'published') {
                $sql = "INSERT INTO wp_notification_targets 
                        (notifications_target, notifications_item, member_id, publish_at, status)
                        SELECT :target, :nid, member_id, :pub, 'published'
                        FROM wp_members WHERE status = 'active'
                        ON DUPLICATE KEY UPDATE status='published', publish_at=:pub";
                $pdo->prepare($sql)->execute([
                    ':target' => $target,
                    ':nid'    => $content_id,
                    ':pub'    => $publish_at
                ]);
                $settings = $pdo->query("SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('NOTIFY_EMAIL','NOTIFY_PWA')")->fetchAll(PDO::FETCH_KEY_PAIR);
                if (($settings['NOTIFY_EMAIL'] ?? 0) == 1) {
                    $this->handleEmail($content_id, $publish_at, $target);
                }
                if (($settings['NOTIFY_PWA'] ?? 0) == 1) {
                    $this->handlePWA($content_id, $publish_at, $target);
                }
            } else {
                $pdo->prepare("UPDATE wp_notification_targets SET status = :status, publish_at = NULL WHERE notifications_item = :id AND notifications_target = :target")->execute([
                    ':status' => $status,
                    ':id'     => $content_id,
                    ':target' => $target
                ]);
                $pdo->prepare("DELETE FROM email_queue WHERE status='pending' AND reference_id=? AND reference_type=?")->execute([$content_id, $target]);
                $pdo->prepare("DELETE FROM pwa_notification_queue WHERE status='pending' AND reference_id=? AND reference_type=?")->execute([$content_id, $target]);
            }
            if (!$isExternalTrans) $pdo->commit();
        } catch (Exception $e) {
            if (!$isExternalTrans && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            error_log("Notification Error: " . $e->getMessage());
            throw $e;
        }
    }
    private function handleEmail($id, $publish_at = null, $target) {
        $pdo = $this->db;
        $members = $pdo->query("SELECT m.member_id, m.email, IFNULL(ml.language,'en') as user_lang FROM wp_members m LEFT JOIN wp_members_language ml ON m.member_id = ml.member_id WHERE m.status='active' and m.role = 'user' GROUP BY m.member_id
        ")->fetchAll(PDO::FETCH_ASSOC);
        if (!$members) return;
        $stmtInsert = $pdo->prepare("INSERT INTO email_queue (recipient_email, subject, body, priority, status, scheduled_at, created_at, reference_id, reference_type) VALUES (:email, :subject, :body, 3, 'pending', :scheduled, NOW(), :refid, :reftype)");
        $scheduledTime = $publish_at ?: date('Y-m-d H:i:s');
        foreach ($members as $member) {
            $content = $this->buildNotificationContent($id, $target, $member['user_lang']);
            if (!$content) continue;
            $stmtInsert->execute([
                ':email'    => $member['email'],
                ':subject'  => $content['email_subject'],
                ':body'     => $content['email_body'],
                ':scheduled'=> $scheduledTime,
                ':refid'    => $id,
                ':reftype'  => $target
            ]);
        }
    }
    private function handlePWA($id, $publish_at = null, $target){
        $pdo = $this->db;
        $subscriptions = $pdo->query("SELECT ps.id, ps.user_id, IFNULL(ml.language,'en') as user_lang
            FROM push_subscriptions ps
            LEFT JOIN wp_members_language ml ON ps.user_id = ml.member_id
            LEFT JOIN wp_members m on m.member_id = ml.member_id
            WHERE ps.is_active=1 and m.role = 'user'
            GROUP BY m.member_id
        ")->fetchAll(PDO::FETCH_ASSOC);
        if (!$subscriptions) return;
        $stmtInsert = $pdo->prepare("INSERT INTO pwa_notification_queue
            (subscription_id, title, message, url, status, scheduled_at, created_at, reference_id, reference_type)
            VALUES (:subid, :title, :body, :url, 'pending', :scheduled, NOW(), :refid, :reftype)
        ");
        $scheduledTime = $publish_at ?: date('Y-m-d H:i:s');
        foreach ($subscriptions as $sub) {
            $content = $this->buildNotificationContent($id, $target, $sub['user_lang']);
            if (!$content) continue;
            $stmtInsert->execute([
                ':subid'   => $sub['id'],
                ':title'   => $content['pwa_title'],
                ':body'    => $content['pwa_body'],
                ':url'     => $content['url'],
                ':scheduled'=> $scheduledTime,
                ':refid'   => $id,
                ':reftype' => $target
            ]);
        }
    }
    private function buildNotificationContent($id, $target, $lang) {
        $lang = in_array($lang, ['en', 'lo', 'th']) ? $lang : 'en';
        $domain = rtrim($this->configs['DOMAIN_NAME'], '/');
        if ($target === 'document') {
            $stmt = $this->db->prepare("SELECT d.document_name, d.document_path, d.document_size,
                            p.project_name, c.contract_name, t.type_name, i.installations_name, pl.poles_code
                        FROM wp_documents d
                        LEFT JOIN wp_project p ON p.project_id = d.project_id
                        LEFT JOIN wp_contract c ON c.contract_id = d.contract_id
                        LEFT JOIN wp_type t ON t.type_id = d.type_id
                        LEFT JOIN wp_installations i on i.installations_id = d.installations_id
                        LEFT JOIN wp_poles pl on pl.poles_id = d.poles_id
                        WHERE d.document_id = ?
            ");
            $stmt->execute([$id]);
            $doc = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$doc) return null;
            $labels = [
                'en' => [
                    'subject' => "New Document: " . $doc['document_name'],
                    'header'  => "New Document Available",
                    'doc'     => "Document",
                    'project' => "Project",
                    'type'    => "Type",
                    'btn'     => "View Online",
                    'footer_msg' => "This is an automated notification from the iWind System."
                ],
                'lo' => [
                    'subject' => "ເອກະສານໃໝ່: " . $doc['document_name'],
                    'header'  => "ມີເອກະສານໃໝ່ໃນລະບົບ",
                    'doc'     => "ເອກະສານ",
                    'project' => "ໂຄງການ",
                    'type'    => "ປະເພດ",
                    'btn'     => "ເບິ່ງເອກະສານ",
                    'footer_msg' => "ນີ້ແມ່ນການແຈ້ງເຕືອນອັດຕະໂນມັດຈາກລະບົບ iWind."
                ],
                'th' => [
                    'subject' => "เอกสารใหม่: " . $doc['document_name'],
                    'header'  => "มีเอกสารใหม่ในระบบ",
                    'doc'     => "ชื่อเอกสาร",
                    'project' => "โครงการ",
                    'type'    => "ประเภท",
                    'btn'     => "ดูรายละเอียด",
                    'footer_msg' => "นี่คือการแจ้งเตือนอัตโนมัติจากระบบ iWind"
                ]
            ];
            $t = $labels[$lang];
            $url = $domain . "/document";
            $bodyHtml = "
                <div style='background-color:#f8f9fa; padding:20px; border-radius:8px; border:1px solid #e9ecef;'>
                    <h3 style='color:#2c3e50; margin-top:0;'>{$t['header']}</h3>
                    <table style='width:100%; border-collapse:collapse;'>
                        <tr>
                            <td style='padding:8px 0; color:#6c757d; width:100px;'><strong>{$t['doc']}:</strong></td>
                            <td style='padding:8px 0; color:#212529;'>{$doc['document_name']}</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 0; color:#6c757d;'><strong>{$t['project']}:</strong></td>
                            <td style='padding:8px 0; color:#212529;'>{$doc['project_name']}</td>
                        </tr>
                        <tr>
                            <td style='padding:8px 0; color:#6c757d;'><strong>{$t['type']}:</strong></td>
                            <td style='padding:8px 0; color:#212529;'>{$doc['type_name']}</td>
                        </tr>
                    </table>
                    <div style='margin-top:25px; text-align:center;'>
                        <a href='{$url}' style='background:#007bff; color:#ffffff; padding:12px 25px; text-decoration:none; border-radius:5px; font-weight:bold; display:inline-block;'>{$t['btn']}</a>
                    </div>
                </div>
                <p style='font-size:12px; color:#999; margin-top:20px;'>{$t['footer_msg']}</p>
            ";
            $fullPath = $_SERVER['DOCUMENT_ROOT'] . '/' . ltrim($doc['document_path'], '/');
            $attachment = null;
            if (!empty($doc['document_path']) && file_exists($fullPath)) {
                $attachment = [
                    'path' => $fullPath,
                    'name' => $doc['document_name']
                ];
            }
            return [
                'email_subject' => $t['subject'],
                'email_body'    => $this->wrapEmailTemplate($t['subject'], $bodyHtml),
                'pwa_title'     => $t['subject'],
                'pwa_body'      => $doc['project_name'] . " - " . $doc['type_name'],
                'url'           => $url,
                'attachment'    => $attachment
            ];
        }
        $row = $this->getContentWithFallback($id, $lang);
        if (!$row) return null;
        $processedBody = $this->fixContentImagePaths($row['content_body'], $domain);
        if ($target === 'project') {
            $path = getProjectPath($id, $this->db);
            $url = $domain . '/' . ($path ? 'pstg/' . $path : 'pstg');
            $pwaLabels = ['en' => 'Project Update', 'lo' => 'ອັບເດດໂຄງການ', 'th' => 'อัปเดตโครงการ'];
            $pwaBody = $pwaLabels[$lang] ?? $pwaLabels['en'];
            $subject = "Project Update: " . $row['content_subject'];
        } else {
            $url = $domain . "/news";
            $pwaLabels = ['en' => 'New news update', 'lo' => 'ມີຂ່າວສານໃໝ່', 'th' => 'ข่าวสารใหม่ล่าสุด'];
            $pwaBody = $pwaLabels[$lang] ?? $pwaLabels['en'];
            $subject = "News: " . $row['content_subject'];
        }
        return [
            'email_subject' => $subject,
            'email_body'    => $this->wrapEmailTemplate($row['content_subject'], $processedBody),
            'pwa_title'     => $row['content_subject'],
            'pwa_body'      => $pwaBody,
            'url'           => $url
        ];
    }
    private function fixContentImagePaths($content, $domain) {
        if (empty($content)) return "";
        $pattern = '/src=["\'](uploads\/[^"\']+)["\']/i';
        $replacement = 'src="' . $domain . '/$1"'; 
        return preg_replace($pattern, $replacement, $content);
    }
    private function getContentWithFallback($contentId, $lang) {
        $languages = array_unique([$lang, 'en', 'lo', 'th']);
        foreach ($languages as $l) {
            $stmt = $this->db->prepare("SELECT content_subject, content_body FROM wp_content_item WHERE content_id = ? AND content_lang = ? AND status = 'ready' LIMIT 1");
            $stmt->execute([$contentId, $l]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row && !empty($row['content_subject'])) {
                return $row;
            }
        }
        return null;
    }
    private function wrapEmailTemplate($title, $body) {
        $domain = rtrim($this->configs['DOMAIN_NAME'], '/');
        $logo   = $domain . "/public/images/logo.png";
        $year   = date("Y");
        $footer = $this->siteSettings['footer'] ?? "Copyright © {$year} iWind Corporation Limited";
        return "
            <div style='background-color:#f4f7f6; padding:30px 0; font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;'>
                <table align='center' border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width:600px; background-color:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);'>
                    <tr>
                        <td style='padding:30px; text-align:center; background-color:#ffffff; border-bottom:1px solid #f0f0f0;'>
                            <img src='{$logo}' alt='Logo' style='max-height:50px; width:auto;'>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:40px 30px;'>
                            <div style='line-height:1.6; color:#333; font-size:15px;'>
                                <h2 style='color:#2c3e50; margin-top:0; margin-bottom:20px; font-size:20px;'>{$title}</h2>
                                <div class='content-area' style='word-break: break-word;'>
                                    <style>
                                        .content-area img { max-width: 100% !important; height: auto !important; border-radius: 5px; margin: 10px 0; }
                                        .content-area p { margin-bottom: 15px; }
                                    </style>
                                    {$body}
                                </div>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style='padding:20px; text-align:center; background-color:#fcfcfc; border-top:1px solid #f0f0f0;'>
                            <p style='font-size:11px; color:#999; margin:0;'>{$footer}</p>
                        </td>
                    </tr>
                </table>
            </div>
        ";
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
                $pdo->prepare("UPDATE wp_content_item SET status = 'failed', response = ? WHERE content_id = ? AND content_lang = ?")->execute([$e->getMessage(), $content_id, $lang]);
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