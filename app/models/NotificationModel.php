<?php
class NotificationModel {
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
                iEn.notifications_subject LIKE :search OR
                iLo.notifications_subject LIKE :search OR
                iTh.notifications_subject LIKE :search
            )";
            $params[':search'] = "%{$search}%";
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_notifications n WHERE n.status != 'deleted'";
        $total = $pdo->query($sqlTotal)->fetchColumn();
        $sqlFiltered = "SELECT COUNT(*) 
                        FROM wp_notifications n
                        LEFT JOIN wp_notifications_item iEn ON iEn.notifications_id = n.notifications_id AND iEn.notifications_lang='en'
                        LEFT JOIN wp_notifications_item iLo ON iLo.notifications_id = n.notifications_id AND iLo.notifications_lang='lo'
                        LEFT JOIN wp_notifications_item iTh ON iTh.notifications_id = n.notifications_id AND iTh.notifications_lang='th'
                        $where";
        $stmtFiltered = $pdo->prepare($sqlFiltered);
        $stmtFiltered->execute($params);
        $filtered = $stmtFiltered->fetchColumn();
        $sql = "SELECT 
                    n.notifications_id,
                    n.publish_at,
                    n.created_at,
                    n.status,
                    iEn.notifications_subject AS title_en,
                    iLo.notifications_subject AS title_lo,
                    iTh.notifications_subject AS title_th,
                    n.notifications_view
                FROM wp_notifications n
                LEFT JOIN wp_notifications_item iEn ON iEn.notifications_id = n.notifications_id AND iEn.notifications_lang='en'
                LEFT JOIN wp_notifications_item iLo ON iLo.notifications_id = n.notifications_id AND iLo.notifications_lang='lo'
                LEFT JOIN wp_notifications_item iTh ON iTh.notifications_id = n.notifications_id AND iTh.notifications_lang='th'
                $where
                ORDER BY n.notifications_id DESC
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
            foreach (['notifications_view'] as $field) {
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
        $stmt = $pdo->prepare("SELECT notifications_id, status, publish_at FROM wp_notifications WHERE notifications_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if(!$n){
            return null;
        }
        $stmt = $pdo->prepare("SELECT notifications_lang, notifications_subject, notifications_body FROM wp_notifications_item WHERE notifications_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th"=>"","lo"=>"","en"=>""];
        $content = ["th"=>"","lo"=>"","en"=>""];
        foreach($items as $row){
            $lang = $row['notifications_lang'];
            $title[$lang] = $row['notifications_subject'];
            $content[$lang] = $row['notifications_body'];
        }
        $publishLocal = "";
        if(!empty($n['publish_at'])){
            $publishLocal = convertTimeZone($n['publish_at'], 'Y-m-d\TH:i');
        }
        return [
            "id" => $n['notifications_id'],
            "status" => $n['status'],
            "publish_at" => $publishLocal,
            "title" => $title,
            "content" => $content
        ];
    }
    public function save($data){
        $pdo = $this->db;
        $notifications_id = $data['notifications_id'] ?? null;
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
            if ($notifications_id) {
                $sql = "UPDATE wp_notifications SET status = :status,publish_at = :publish_at,updated_at = NOW() WHERE notifications_id = :notifications_id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':notifications_id', (int)$notifications_id, PDO::PARAM_INT);
            } else {
                $sql = "INSERT INTO wp_notifications (status, publish_at, created_at, updated_at) VALUES (:status, :publish_at, NOW(), NOW())";
                $stmt = $pdo->prepare($sql);
            }
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':publish_at', $publish_at, $publish_at === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->execute();
            if (!$notifications_id) {
                $notifications_id = $pdo->lastInsertId();
            }
            $this->notification($notifications_id, $status);
            $sqlItem = "INSERT INTO wp_notifications_item
                (notifications_id, notifications_subject, notifications_body, notifications_lang, created_at, updated_at)
                VALUES
                (:notifications_id, :subject, :body, :lang, NOW(), NOW())
                ON DUPLICATE KEY UPDATE
                    notifications_subject = VALUES(notifications_subject),
                    notifications_body = VALUES(notifications_body),
                    updated_at = NOW()";
            $stmtItem = $pdo->prepare($sqlItem);
            foreach (['en', 'lo', 'th'] as $lang) {
                if ($title[$lang] === '' && $content[$lang] === '') {
                    continue;
                }
                $stmtItem->execute([
                    ':notifications_id' => $notifications_id,
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
            $stmt = $pdo->prepare("SELECT file_path FROM wp_notifications_files WHERE notifications_id = ?");
            $stmt->execute([$notifications_id]);
            $oldFiles = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $toDelete = array_diff($oldFiles ?: [], $allImages);
            foreach ($toDelete as $file) {
                $fullPath = $_SERVER['DOCUMENT_ROOT'] . $file;
                if (file_exists($fullPath)) {
                    @unlink($fullPath);
                }
                $del = $pdo->prepare("DELETE FROM wp_notifications_files WHERE notifications_id = ? AND file_path = ?");
                $del->execute([$notifications_id, $file]);
            }
            $ins = $pdo->prepare("INSERT IGNORE INTO wp_notifications_files (notifications_id, file_path, created_at) VALUES (:nid, :path, NOW())");
            foreach ($allImages as $path) {
                $ins->execute([
                    ':nid'  => $notifications_id,
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
            $sql = "UPDATE wp_notifications set status = 'deleted', updated_at = NOW() WHERE notifications_id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = 'deleted',publish_at = NULL,read_at = NULL WHERE notifications_item = :id AND notifications_target = 'notifications'");
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
        $sql = "UPDATE wp_notifications SET status = :status,publish_at = :publish_at,updated_at = NOW() WHERE notifications_id = :id";
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
                $stmt = $pdo->prepare("SELECT publish_at FROM wp_notifications WHERE notifications_id = ?");
                $stmt->execute([$id]);
                $n = $stmt->fetch(PDO::FETCH_ASSOC);
                $publish_at = $n['publish_at'] ?? null;
                $stmt = $pdo->prepare("SELECT member_id FROM wp_members WHERE status = 'active'");
                $stmt->execute();
                $members = $stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($members as $m) {
                    $stmt = $pdo->prepare("SELECT targets_id FROM wp_notification_targets WHERE notifications_target = 'notifications' AND notifications_item = ? AND member_id = ? LIMIT 1");
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
                                ('notifications', :id, :member_id, :publish_at, :status, NULL)
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
                $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status,publish_at = NULL,read_at = NULL WHERE notifications_item = :id AND notifications_target = 'notifications'");
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
    public function load() {
        try {
            $pdo = $this->db;
            $member_id = $_SESSION['user']['id'] ?? null;
            if (!$member_id) {
                return [
                    'unread' => 0,
                ];
            }
            $sql1 = "SELECT COUNT(*) AS unread FROM wp_notification_targets WHERE member_id = ? AND status = 'published' AND publish_at <= NOW() AND read_at IS NULL LIMIT 100";
            $stmt = $pdo->prepare($sql1);
            $stmt->execute([$member_id]);
            $unread = (int)$stmt->fetch(PDO::FETCH_ASSOC)['unread'];
            return [
                'status' => true,
                'unread' => $unread
            ];
        } catch (PDOException $e) {
            return [
                'status' => false
            ];
            exit;
        }
    }
    public function loadlist($page = 1, $limit = 10) {
        try {
            $pdo = $this->db;
            $member_id = $_SESSION['user']['id'] ?? null;
            if (!$member_id) {
                return [
                    'status' => false,
                    'data' => []
                ];
            }
            $page  = max(1, (int)$page);
            $limit = max(1, (int)$limit);
            $offset = ($page - 1) * $limit;
            $sql = "SELECT 
                        t.targets_id,
                        t.publish_at,
                        t.read_at,
                        CASE
                            WHEN t.notifications_target = 'notifications' THEN iEn.notifications_subject
                            ELSE ''
                        END AS title_en,
                        CASE
                            WHEN t.notifications_target = 'notifications' THEN iLo.notifications_subject
                            ELSE ''
                        END AS title_lo,
                        CASE
                            WHEN t.notifications_target = 'notifications' THEN iTh.notifications_subject
                            ELSE ''
                        END AS title_th,
                        CASE
                            WHEN t.notifications_target = 'notifications' THEN n.created_at
                            ELSE NULL
                        END AS notification_at,
                        t.notifications_target,
                        t.notifications_item
                    FROM wp_notification_targets t
                    LEFT JOIN wp_notifications n on n.notifications_id = t.notifications_item
                    LEFT JOIN wp_notifications_item iEn 
                        ON iEn.notifications_id = t.notifications_item AND iEn.notifications_lang = 'en'
                    LEFT JOIN wp_notifications_item iLo 
                        ON iLo.notifications_id = t.notifications_item AND iLo.notifications_lang = 'lo'
                    LEFT JOIN wp_notifications_item iTh 
                        ON iTh.notifications_id = t.notifications_item AND iTh.notifications_lang = 'th'
                    WHERE t.member_id = ?
                    AND t.status = 'published'
                    AND t.publish_at <= NOW()
                    ORDER BY t.publish_at DESC
                    LIMIT ?, ?";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(1, $member_id, PDO::PARAM_INT);
            $stmt->bindValue(2, (int)$offset, PDO::PARAM_INT);
            $stmt->bindValue(3, (int)$limit, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as &$r) {
                foreach (['read_at', 'publish_at', 'notification_at'] as $field) {
                    if (!empty($r[$field])) {
                        $r[$field] = convertTimeZone($r[$field], 'Y/m/d H:i:s');
                    }
                }
            }
            return [
                'status' => true,
                'data'   => $rows
            ];
        } catch (PDOException $e) {
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    public function read() {
        $pdo = $this->db;
        $member_id = $_SESSION['user']['id'] ?? null;
        if (!$member_id) {
            return [
                'status' => false,
                'data' => []
            ];
        }
        $sql = "UPDATE wp_notification_targets 
                SET read_at = NOW() 
                WHERE member_id = :member_id 
                AND read_at IS NULL 
                AND publish_at <= NOW()";

        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':member_id', (int)$member_id, PDO::PARAM_INT);
        return $stmt->execute();
    }
}