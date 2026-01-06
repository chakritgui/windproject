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
        $sqlTotal = "SELECT COUNT(*) FROM wp_news n WHERE n.status != 'deleted'";
        $total = $pdo->query($sqlTotal)->fetchColumn();
        $sqlFiltered = "SELECT COUNT(*) FROM wp_news n LEFT JOIN wp_news_item iEn ON iEn.news_id = n.news_id AND iEn.news_lang='en' LEFT JOIN wp_news_item iLo ON iLo.news_id = n.news_id AND iLo.news_lang='lo' LEFT JOIN wp_news_item iTh ON iTh.news_id = n.news_id AND iTh.news_lang='th' $where";
        $stmtFiltered = $pdo->prepare($sqlFiltered);
        $stmtFiltered->execute($params);
        $filtered = $stmtFiltered->fetchColumn();
        $sql = "SELECT 
                    n.news_id,
                    n.publish_at,
                    n.created_at,
                    n.status,
                    iEn.news_subject AS title_en,
                    iLo.news_subject AS title_lo,
                    iTh.news_subject AS title_th,
                    n.news_view
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
            foreach (['created_at', 'publish_at'] as $field) {
                if (!empty($r[$field])) {
                    $r[$field] = convertTimeZone($r[$field], 'Y/m/d H:i:s');
                }
            }
            foreach (['news_view'] as $field) {
                if (!empty($r[$field])) {
                    $r[$field] = number_format($r[$field]);
                }
            }
        }
        return [
            "total" => (int)$total,
            "data" => $rows
        ];
    }
    public function get($id){
        $pdo = $this->db;
        if(!$id){
            return [
                "id"=>"",
                "status"=>"",
                "publish_at"=>"",
                "title"=>["th"=>"","lo"=>"","en"=>""],
                "content"=>["th"=>"","lo"=>"","en"=>""]
            ];
        }
        $stmt = $pdo->prepare("SELECT news_id, status, publish_at FROM wp_news WHERE news_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if(!$n){
            return null;
        }
        $stmt = $pdo->prepare("SELECT news_lang, news_subject, news_body FROM wp_news_item WHERE news_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th"=>"","lo"=>"","en"=>""];
        $content = ["th"=>"","lo"=>"","en"=>""];
        foreach($items as $row){
            $lang = $row['news_lang'];
            $title[$lang] = $row['news_subject'];
            $content[$lang] = $row['news_body'];
        }
        $publishLocal = "";
        if(!empty($n['publish_at'])){
            $publishLocal = convertTimeZone($n['publish_at'], 'Y-m-d\TH:i');
        }
        return [
            "id" => $n['news_id'],
            "status" => $n['status'],
            "publish_at" => $publishLocal,
            "title" => $title,
            "content" => $content
        ];
    }
    public function save($data){
        $pdo = $this->db;
        $news_id = $data['news_id'] ?? null;
        $status      = $data['status'] ?? '';
        $publish_at = $data['publish_at'] ?? null;
        if ($status === 'draft') {
            $publish_at = null;
        } else {
            if ($publish_at === 'now' || empty($publish_at)) {
                $publish_at = date('Y-m-d H:i:s');
            } else {
                $publish_at = date('Y-m-d H:i:s', strtotime($publish_at));
                $publish_at = convertTimeZoneUTC($publish_at, 'Y-m-d H:i:s');
            }
        }
        $title = [
            'en' => $data['title_en'] ?? '',
            'lo' => $data['title_lo'] ?? '',
            'th' => $data['title_th'] ?? ''
        ];
        $content = [
            'en' => $data['content_en'] ?? '',
            'lo' => $data['content_lo'] ?? '',
            'th' => $data['content_th'] ?? ''
        ];
        try {
            $pdo->beginTransaction();
            if ($news_id) {
                $sql = "UPDATE wp_news SET status = :status,publish_at = :publish_at,updated_at = NOW() WHERE news_id = :news_id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':news_id', (int)$news_id, PDO::PARAM_INT);
            } else {
                $sql = "INSERT INTO wp_news (status, publish_at, created_at, updated_at) VALUES (:status, :publish_at, NOW(), NOW())";
                $stmt = $pdo->prepare($sql);
            }
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':publish_at', $publish_at, $publish_at === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->execute();
            if (!$news_id) {
                $news_id = $pdo->lastInsertId();
            }
            $this->notification($news_id, $status);
            $sqlItem = "INSERT INTO wp_news_item
                (news_id, news_subject, news_body, news_lang, created_at, updated_at)
                VALUES
                (:news_id, :subject, :body, :lang, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    news_subject = VALUES(news_subject),
                    news_body = VALUES(news_body),
                    updated_at = NOW()";
            $stmtItem = $pdo->prepare($sqlItem);
            foreach (['en', 'lo', 'th'] as $lang) {
                if ($title[$lang] === '' && $content[$lang] === '') {
                    continue;
                }
                $stmtItem->execute([
                    ':news_id' => $news_id,
                    ':subject' => $title[$lang],
                    ':body' => $content[$lang],
                    ':lang' => $lang
                ]);
            }
            $allImages = [];
            foreach ($content as $html) {
                preg_match_all('/<img[^>]+src="([^">]+)"/i', $html, $matches);
                if (!empty($matches[1])) {
                    $allImages = array_merge($allImages, $matches[1]);
                }
            }
            $allImages = array_unique($allImages);
            $stmt = $pdo->prepare("SELECT file_path FROM wp_news_files WHERE news_id = ?");
            $stmt->execute([$news_id]);
            $oldFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $toDelete = array_diff($oldFiles ?: [], $allImages);
            foreach ($toDelete as $file) {
                $fullPath = $_SERVER['DOCUMENT_ROOT'] . $file;
                if (file_exists($fullPath)) {
                    @unlink($fullPath);
                }
                $del = $pdo->prepare("DELETE FROM wp_news_files WHERE news_id = ? AND file_path = ?");
                $del->execute([$news_id, $file]);
            }
            $ins = $pdo->prepare("INSERT IGNORE INTO wp_news_files (news_id, file_path, created_at) VALUES (:nid, :path, NOW())");
            foreach ($allImages as $path) {
                $ins->execute([
                    ':nid'  => $news_id,
                    ':path' => $path
                ]);
            }
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
    public function delete($id) {
        if($id) {
            $pdo = $this->db;
            $sql = "UPDATE wp_news set status = 'deleted', updated_at = NOW() WHERE news_id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = 'deleted',publish_at = NULL,read_at = NULL WHERE notifications_item = :id AND notifications_target = 'news'");
            $stmt->execute([
                ':id'     => $id
            ]);
            return $stmt->execute();
        }
        return false;
    }
    public function change($id, $status) {
        if (!$id) {
            return false;
        }
        $pdo = $this->db;
        if ($status === 'published') {
            $publish_at = date('Y-m-d H:i:s');
        } else {
            $publish_at = null;
        }
        $sql = "UPDATE wp_news SET status = :status,publish_at = :publish_at,updated_at = NOW() WHERE news_id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        if ($publish_at === null) {
            $stmt->bindValue(':publish_at', null, PDO::PARAM_NULL);
        } else {
            $stmt->bindValue(':publish_at', $publish_at, PDO::PARAM_STR);
        }
        $ok = $stmt->execute();
        if ($ok) {
            $this->notification($id, $status);
        }
        return $ok;
    }
    public function notification($id, $status) {
        $pdo = $this->db;
        $pdo->beginTransaction();
        try {
            if ($status == 'published') {
                $stmt = $pdo->prepare("SELECT publish_at FROM wp_news WHERE news_id = ?");
                $stmt->execute([$id]);
                $n = $stmt->fetch(PDO::FETCH_ASSOC);
                $publish_at = $n['publish_at'] ?? null;
                $stmt = $pdo->prepare("SELECT member_id FROM wp_members WHERE status = 'active'");
                $stmt->execute();
                $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($members as $m) {
                    $stmt = $pdo->prepare("SELECT targets_id FROM wp_notification_targets WHERE notifications_target = 'news' AND notifications_item = ? AND member_id = ? LIMIT 1");
                    $stmt->execute([$id, $m['member_id']]);
                    $target = $stmt->fetch(PDO::FETCH_ASSOC);
                    if ($target) {
                        $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status, publish_at = :publish_at, read_at = NULL WHERE targets_id = :tid");
                        $stmt->execute([
                            ':status' => $status,
                            ':publish_at' => $publish_at,
                            ':tid' => $target['targets_id']
                        ]);
                    } else {
                        $stmt = $pdo->prepare("INSERT INTO wp_notification_targets 
                                (notifications_target, notifications_item, member_id, publish_at, status, read_at)
                            VALUES 
                                ('news', :id, :member_id, :publish_at, :status, NULL)
                        ");
                        $stmt->execute([
                            ':id' => $id,
                            ':member_id' => $m['member_id'],
                            ':publish_at' => $publish_at,
                            ':status' => $status
                        ]);
                    }
                }
            } else {
                $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status,publish_at = NULL,read_at = NULL WHERE notifications_item = :id AND notifications_target = 'news'");
                $stmt->execute([
                    ':status' => $status,
                    ':id'     => $id
                ]);
            }
            $pdo->commit();
        } catch (Exception $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}