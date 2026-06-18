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
                    'status' => true,
                    'unread' => 0,
                ];
            }
            $sql = "SELECT COUNT(*) AS unread_count
                    FROM (
                        SELECT t.targets_id 
                        FROM wp_notification_targets t
                        INNER JOIN wp_documents d 
                            ON d.document_id = t.notifications_item
                        WHERE 
                            t.member_id = ?
                            AND t.status = 'published'
                            AND t.publish_at <= NOW()
                            AND t.read_at IS NULL
                            AND t.notifications_target = 'document'
                            AND d.status = 'public'
                        UNION ALL
                        SELECT t.targets_id 
                        FROM wp_notification_targets t
                        INNER JOIN wp_content n 
                            ON n.content_id = t.notifications_item
                        WHERE 
                            t.member_id = ?
                            AND t.status = 'published'
                            AND t.publish_at <= NOW()
                            AND t.read_at IS NULL
                            AND t.notifications_target IN ('project','news')
                            AND n.status IN ('active','published')
                    ) x";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$member_id, $member_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $unread = $result ? (int)$result['unread_count'] : 0;
            return [
                'status' => true,
                'unread' => $unread
            ];
        } catch (PDOException $e) {
            return [
                'status' => false,
                'unread' => "Notification Load Error: " . $e->getMessage()
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
            
            $sql = "SELECT * FROM (
                -- ฝั่งที่ 1: ดึงเฉพาะ Document
                SELECT 
                    t.targets_id, t.publish_at, t.read_at,
                    d.document_name AS title_en,
                    d.document_name AS title_lo,
                    d.document_name AS title_th,
                    d.created_at AS notification_at,
                    t.notifications_target, t.notifications_item,
                    '' AS content_slug, 
                    d.document_type AS icon,
                    d.document_path AS path,
                    d.document_file_name AS item_name,
                    d.document_size AS item_size
                FROM wp_notification_targets t
                INNER JOIN wp_documents d ON d.document_id = t.notifications_item
                WHERE 
                    t.member_id = ? 
                    AND t.status = 'published' 
                    AND t.publish_at <= NOW()
                    AND t.notifications_target = 'document'
                    AND d.status = 'public'

                UNION ALL

                -- ฝั่งที่ 2: ดึงเฉพาะ Project และ News
                SELECT 
                    t.targets_id, t.publish_at, t.read_at,
                    IFNULL(iEn.content_subject, '') AS title_en,
                    IFNULL(iLo.content_subject, '') AS title_lo,
                    IFNULL(iTh.content_subject, '') AS title_th,
                    n.created_at AS notification_at,
                    t.notifications_target, t.notifications_item,
                    n.content_slug,
                    '' AS icon, '' AS path, '' AS item_name, 0 AS item_size
                FROM wp_notification_targets t
                INNER JOIN wp_content n ON n.content_id = t.notifications_item
                LEFT JOIN wp_content_item iEn ON iEn.content_id = t.notifications_item AND iEn.content_lang = 'en'
                LEFT JOIN wp_content_item iLo ON iLo.content_id = t.notifications_item AND iLo.content_lang = 'lo'
                LEFT JOIN wp_content_item iTh ON iTh.content_id = t.notifications_item AND iTh.content_lang = 'th'
                WHERE 
                    t.member_id = ? 
                    AND t.status = 'published' 
                    AND t.publish_at <= NOW()
                    AND t.notifications_target IN ('project','news')
                    AND n.status IN ('active', 'published')
            ) result_set
            ORDER BY publish_at DESC
            LIMIT ?, ?";
            
            $stmt = $pdo->prepare($sql);
            // ผูกค่าเรียงตามลำดับพารามิเตอร์ 1, 2, 3, 4 ให้ครบถ้วน
            $stmt->bindValue(1, $member_id, PDO::PARAM_INT);
            $stmt->bindValue(2, $member_id, PDO::PARAM_INT);
            $stmt->bindValue(3, $offset,    PDO::PARAM_INT);
            $stmt->bindValue(4, $limit,     PDO::PARAM_INT);
            $stmt->execute();
            
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as &$r) {
                if ($r['notifications_target'] === 'document') {
                    $r['redirect'] = 'document';
                } else if ($r['notifications_target'] === 'news') {
                    $r['redirect'] = 'news';
                } else if ($r['notifications_target'] === 'project') {
                    $path = getProjectPath($r['notifications_item'], $pdo);
                    $r['redirect'] = $path ? 'pstg/' . $path : 'pstg';
                }
                foreach (['read_at', 'publish_at', 'notification_at'] as $field) {
                    if (!empty($r[$field])) {
                        $r[$field] = convertTimeZone($r[$field], 'Y/m/d H:i:s');
                    }
                }
            }
            unset($r); // เคลียร์ reference เพื่อความปลอดภัย
            
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