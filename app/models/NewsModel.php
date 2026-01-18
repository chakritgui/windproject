<?php
class NewsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        $pdo = $this->db;
        $where = " WHERE n.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND n.status = :status ";
            $params[':status'] = $filters['status'];
        }
        if (!empty($search)) {
            $where .= " AND (
                iEn.news_subject LIKE :search OR
                iLo.news_subject LIKE :search OR
                iTh.news_subject LIKE :search
            )";
            $params[':search'] = "%{$search}%";
        }
        $sqlFiltered = "SELECT COUNT(DISTINCT n.news_id) FROM wp_news n 
                        LEFT JOIN wp_news_item iEn ON iEn.news_id = n.news_id AND iEn.news_lang='en' 
                        LEFT JOIN wp_news_item iLo ON iLo.news_id = n.news_id AND iLo.news_lang='lo' 
                        LEFT JOIN wp_news_item iTh ON iTh.news_id = n.news_id AND iTh.news_lang='th' 
                        $where";
        $stmtFiltered = $pdo->prepare($sqlFiltered);
        $stmtFiltered->execute($params);
        $totalFiltered = $stmtFiltered->fetchColumn();
        $sql = "SELECT 
                    n.news_id, n.publish_at, n.created_at, n.status, n.news_view, n.cover,
                    iEn.news_subject AS title_en,
                    iLo.news_subject AS title_lo,
                    iTh.news_subject AS title_th
                FROM wp_news n
                LEFT JOIN wp_news_item iEn ON iEn.news_id = n.news_id AND iEn.news_lang='en'
                LEFT JOIN wp_news_item iLo ON iLo.news_id = n.news_id AND iLo.news_lang='lo'
                LEFT JOIN wp_news_item iTh ON iTh.news_id = n.news_id AND iTh.news_lang='th'
                $where
                ORDER BY n.news_id DESC
                LIMIT :start, :length";
        $stmt = $pdo->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            if (!empty($r['created_at'])) $r['created_at'] = convertTimeZone($r['created_at'], 'd/m/Y H:i:s');
            if (!empty($r['publish_at'])) $r['publish_at'] = convertTimeZone($r['publish_at'], 'd/m/Y H:i:s');
            $r['news_view'] = number_format((int)$r['news_view']);
        }
        return [
            "total" => (int)$totalFiltered,
            "data" => $rows
        ];
    }
    public function get($id) {
        $pdo = $this->db;
        if (!$id) {
            return [
                "id" => "", "status" => "draft", "publish_at" => "", "cover" => "",
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""]
            ];
        }
        $stmt = $pdo->prepare("SELECT news_id, status, publish_at, cover FROM wp_news WHERE news_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmt = $pdo->prepare("SELECT news_lang, news_subject, news_body FROM wp_news_item WHERE news_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $content = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['news_lang'];
            $title[$lang] = $row['news_subject'];
            $content[$lang] = $row['news_body'];
        }
        return [
            "id" => $n['news_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "publish_at" => !empty($n['publish_at']) ? convertTimeZone($n['publish_at'], 'Y-m-d\TH:i') : "",
            "title" => $title,
            "content" => $content
        ];
    }
    public function save($data) {
        $pdo = $this->db;
        $news_id = $data['news_id'] ?? null;
        $ex_cover = $data['ex_cover'] ?? null;
        $status = $data['status'] ?? 'draft';
        $publish_at = null;
        if ($status !== 'draft') {
            $tz = new DateTimeZone('Asia/Bangkok');
            if (empty($data['publish_at']) || ($data['publish_now'] ?? false)) {
                $dt = new DateTime('now', $tz);
            } else {
                $dt = DateTime::createFromFormat('d/m/Y H:i', trim($data['publish_at']), $tz);
                if (!$dt) $dt = new DateTime('now', $tz);
            }
            $dt->setTimezone(new DateTimeZone('UTC'));
            $publish_at = $dt->format('Y-m-d H:i:s');
        }
        try {
            $pdo->beginTransaction();
            if ($news_id) {
                $stmt = $pdo->prepare("UPDATE wp_news SET status = :status, publish_at = :publish_at, updated_at = NOW() WHERE news_id = :news_id");
                $stmt->bindValue(':news_id', (int)$news_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_news (status, publish_at, created_at, updated_at) VALUES (:status, :publish_at, NOW(), NOW())");
            }
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':publish_at', $publish_at, $publish_at === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->execute();
            if (!$news_id) $news_id = $pdo->lastInsertId();
            $sqlItem = "INSERT INTO wp_news_item (news_id, news_subject, news_body, news_lang, created_at, updated_at) 
                        VALUES (:news_id, :subject, :body, :lang, NOW(), NOW()) 
                        ON DUPLICATE KEY UPDATE news_subject = VALUES(news_subject), news_body = VALUES(news_body), updated_at = NOW()";
            $stmtItem = $pdo->prepare($sqlItem);
            $langs = ['en', 'lo', 'th'];
            $all_html_content = "";
            foreach ($langs as $lang) {
                $subj = $data["title_$lang"] ?? '';
                $body = $data["content_$lang"] ?? '';
                $all_html_content .= $body;
                
                if ($subj !== '' || $body !== '') {
                    $stmtItem->execute([':news_id' => $news_id, ':subject' => $subj, ':body' => $body, ':lang' => $lang]);
                }
            }
            if(!$ex_cover) {
                $this->handleFileDelete($news_id);
            }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $this->handleFileUpload($news_id, $_FILES['cover']);
            }
            preg_match_all('/<img[^>]+src="([^">]+)"/i', $all_html_content, $matches);
            $currentImages = array_unique($matches[1] ?? []);
            $stmt = $pdo->prepare("SELECT file_path FROM wp_news_files WHERE news_id = ?");
            $stmt->execute([$news_id]);
            $oldFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $toDelete = array_diff($oldFiles ?: [], $currentImages);
            foreach ($toDelete as $file) {
                $fullPath = $_SERVER['DOCUMENT_ROOT'] . $file;
                if (file_exists($fullPath) && is_file($fullPath)) @unlink($fullPath);
                $pdo->prepare("DELETE FROM wp_news_files WHERE news_id = ? AND file_path = ?")->execute([$news_id, $file]);
            }
            $ins = $pdo->prepare("INSERT IGNORE INTO wp_news_files (news_id, file_path, created_at) VALUES (?, ?, NOW())");
            foreach ($currentImages as $path) {
                $ins->execute([$news_id, $path]);
            }
            $this->notification($news_id, $status);
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
    public function notification($news_id, $status) {
        $pdo = $this->db;
        $isExternalTrans = $pdo->inTransaction();
        try {
            if (!$isExternalTrans) $pdo->beginTransaction();
            if ($status == 'published') {
                $stmt = $pdo->prepare("SELECT publish_at FROM wp_news WHERE news_id = ?");
                $stmt->execute([$news_id]);
                $publish_at = $stmt->fetchColumn();
                $sql = "INSERT INTO wp_notification_targets (notifications_target, notifications_item, member_id, publish_at, status)
                        SELECT 'news', :nid, member_id, :pub, 'published' 
                        FROM wp_members WHERE status = 'active'
                        ON DUPLICATE KEY UPDATE status = 'published', publish_at = :pub, read_at = NULL";
                $pdo->prepare($sql)->execute([':nid' => $news_id, ':pub' => $publish_at]);
            } else {
                $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status, publish_at = NULL, read_at = NULL WHERE notifications_item = :id AND notifications_target = 'news'");
                $stmt->execute([':status' => $status, ':id' => $news_id]);
            }
            if (!$isExternalTrans) $pdo->commit();
        } catch (Exception $e) {
            if (!$isExternalTrans && $pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
    private function handleFileUpload($news_id, $file) {
        $this->handleFileDelete($news_id);
        $dir = "uploads/news/";
        $fullDir = $dir;
        if (!is_dir($fullDir)) mkdir($fullDir, 0755, true);
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newName = $news_id . "_" . time() . "." . $ext;
        $dbPath = $dir . $newName;
        if (move_uploaded_file($file['tmp_name'], dirname(__DIR__, 2) . '/' . $dir . $newName)) {
            $this->db->prepare("UPDATE wp_news SET cover=? WHERE news_id =?")->execute([$dbPath, $news_id]);
        }
    }
    private function handleFileDelete($news_id){
        $stmt = $this->db->prepare("SELECT cover FROM wp_news WHERE news_id = ?");
        $stmt->execute([$news_id]);
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
            $this->db->prepare("UPDATE wp_news SET cover = NULL WHERE news_id = ?")->execute([$news_id]);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
        }
    }
    public function delete($id) {
        $pdo = $this->db;
        $pdo->prepare("UPDATE wp_news SET status = 'deleted', updated_at = NOW() WHERE news_id = ?")->execute([(int)$id]);
        return $pdo->prepare("UPDATE wp_notification_targets SET status = 'deleted', publish_at = NULL WHERE notifications_item = ? AND notifications_target = 'news'")->execute([(int)$id]);
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        switch($type) {
            case 'status':
                $staticData = [
                    ['id' => 'published', 'text' => 'Published'],
                    ['id' => 'draft', 'text' => 'Draft']
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
}