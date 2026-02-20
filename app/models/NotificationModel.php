<?php
class NotificationModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
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
    public function read() {
        $pdo = $this->db;
        $member_id = $_SESSION['user']['id'] ?? null;
        if (!$member_id) {
            return [
                'status' => false,
                'data' => []
            ];
        }
        $sql = "UPDATE wp_notification_targets SET read_at = NOW() WHERE member_id = :member_id AND read_at IS NULL AND publish_at <= NOW()";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':member_id', (int)$member_id, PDO::PARAM_INT);
        return $stmt->execute();
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
                        WHEN t.notifications_target = 'document' THEN d.document_name
                        ELSE iEn.content_subject
                    END AS title_en,
                    CASE
                        WHEN t.notifications_target = 'document' THEN d.document_name
                        ELSE iLo.content_subject
                    END AS title_lo,
                    CASE
                        WHEN t.notifications_target = 'document' THEN d.document_name
                        ELSE iTh.content_subject
                    END AS title_th,
                    n.created_at AS notification_at,
                    t.notifications_target,
                    t.notifications_item,
                    n.content_slug,
                    CASE
                        WHEN t.notifications_target = 'document' THEN d.document_type
                        ELSE ''
                    END AS icon,
                    CASE
                        WHEN t.notifications_target = 'document' THEN d.document_path
                        ELSE ''
                    END AS path,
                    CASE
                        WHEN t.notifications_target = 'document' THEN d.document_file_name
                        ELSE ''
                    END AS item_name,
                    CASE
                        WHEN t.notifications_target = 'document' THEN d.document_size
                        ELSE 0
                    END AS item_size
                FROM wp_notification_targets t
                LEFT JOIN wp_content n ON n.content_id = t.notifications_item
                LEFT JOIN wp_content_item iEn ON iEn.content_id = t.notifications_item AND iEn.content_lang = 'en'
                LEFT JOIN wp_content_item iLo ON iLo.content_id = t.notifications_item AND iLo.content_lang = 'lo'
                LEFT JOIN wp_content_item iTh ON iTh.content_id = t.notifications_item AND iTh.content_lang = 'th'
                LEFT JOIN wp_documents d ON d.document_id = t.notifications_item AND t.notifications_target = 'document'
                WHERE 
                    t.member_id = ? AND t.status = 'published' AND t.publish_at <= NOW()
                    AND (
                            (
                                t.notifications_target = 'document'
                                AND d.document_id IS NOT NULL
                                AND d.status = 'public'
                            )
                        OR
                            (
                                t.notifications_target IN ('project','news')
                                AND n.content_id IS NOT NULL
                                AND n.status in ('active', 'published')
                            )
                    )
                ORDER BY t.publish_at DESC
                LIMIT ?, ?
            ";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(1, $member_id, PDO::PARAM_INT);
            $stmt->bindValue(2, $offset, PDO::PARAM_INT);
            $stmt->bindValue(3, $limit, PDO::PARAM_INT);
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
                'status'  => false,
                'message' => $e->getMessage()
            ];
        }
    }
}