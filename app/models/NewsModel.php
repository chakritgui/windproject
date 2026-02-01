<?php
class NewsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        $pdo = $this->db;
        $where = " WHERE n.status != 'deleted' AND n.type = 'news' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND n.status = :status ";
            $params[':status'] = $filters['status'];
        }
        if (!empty($search)) {
            $where .= " AND (
                iEn.content_subject LIKE :search OR
                iLo.content_subject LIKE :search OR
                iTh.content_subject LIKE :search
            )";
            $params[':search'] = "%{$search}%";
        }
        $sqlFiltered = "SELECT COUNT(DISTINCT n.content_id) FROM wp_content n 
                        LEFT JOIN wp_content_item iEn ON iEn.content_id = n.content_id AND iEn.content_lang='en' 
                        LEFT JOIN wp_content_item iLo ON iLo.content_id = n.content_id AND iLo.content_lang='lo' 
                        LEFT JOIN wp_content_item iTh ON iTh.content_id = n.content_id AND iTh.content_lang='th' 
                        $where";
        $stmtFiltered = $pdo->prepare($sqlFiltered);
        $stmtFiltered->execute($params);
        $totalFiltered = $stmtFiltered->fetchColumn();
        $sql = "SELECT 
                    n.content_id, n.publish_at, n.created_at, n.status, n.content_view, n.cover as cover_image,
                    iEn.content_subject AS subject_en,
                    iLo.content_subject AS subject_lo,
                    iTh.content_subject AS subject_th,
                    SUM(CASE WHEN m.file_type = 'attachment' THEN 1 ELSE 0 END) as count_attachment,
                    SUM(CASE WHEN m.file_type = 'image' THEN 1 ELSE 0 END) as count_image,
                    SUM(CASE WHEN m.file_type = 'image360' THEN 1 ELSE 0 END) as count_image360,
                    n.content_slug
                FROM wp_content n
                LEFT JOIN wp_content_item iEn ON iEn.content_id = n.content_id AND iEn.content_lang='en'
                LEFT JOIN wp_content_item iLo ON iLo.content_id = n.content_id AND iLo.content_lang='lo'
                LEFT JOIN wp_content_item iTh ON iTh.content_id = n.content_id AND iTh.content_lang='th'
                LEFT JOIN wp_content_media m on m.content_id = n.content_id and m.status = 'active'
                $where
                GROUP BY n.content_id
                ORDER BY n.content_id DESC
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
            if (!empty($r['created_at'])) $r['created_at'] = convertTimeZone($r['created_at'], 'd/m/Y H:i');
            if (!empty($r['publish_at'])) $r['publish_at'] = convertTimeZone($r['publish_at'], 'd/m/Y H:i');
            $r['count_attachment'] = (int)$r['count_attachment'];
            $r['count_image'] = (int)$r['count_image'];
            $r['count_image360'] = (int)$r['count_image360'];
            $r['subject_en'] = $r['subject_en'] ?? '';
            $r['subject_lo'] = $r['subject_lo'] ?? '';
            $r['subject_th'] = $r['subject_th'] ?? '';
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
                "id" => "", "status" => "published", "publish_at" => date('Y-m-d H:i'), "cover" => "",
                "attachments" => [],
                "images" => [],
                "images360" => [],
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""]
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, publish_at, cover FROM wp_content WHERE content_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $content = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            $title[$lang] = $row['content_subject'];
            $content[$lang] = $row['content_body'];
        }
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? and status = 'active'");
        $stmt->execute([$id]);
        $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $attachments = [];
        $images = [];
        $images360 = [];
        foreach ($media as $m) {
            $item = [
                "id" => $m['id'],
                "url" => $m['file_path'], 
                "name" => $m['file_name'],
                "size" => $m['file_size']
            ];
            if ($m['file_type'] === 'attachment') {
                $attachments[] = $item;
            } elseif ($m['file_type'] === 'image') {
                $images[] = $item;
            } elseif ($m['file_type'] === 'image360') {
                $images360[] = $item;
            }
        }
        return [
            "id" => $n['content_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "publish_at" => !empty($n['publish_at']) ? convertTimeZone($n['publish_at'], 'Y-m-d H:i') : "",
            "title" => $title,
            "content" => $content,
            "attachments" => $attachments,
            "images" => $images,
            "images360" => $images360
        ];
    }
    public function save($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?? null;
        $ex_cover = $data['ex_cover'] ?? null;
        $status = $data['status'] ?? 'draft';
        $publish_at = null;
        $mediaHelper = new MediaHelper($pdo);
        $content_slug = $mediaHelper->generateSlug('news', $data["title_en"], $content_id);
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
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = :status, content_slug = :content_slug, publish_at = :publish_at, updated_at = NOW() WHERE content_id = :content_id");
                $stmt->bindValue(':content_slug', $content_slug);
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, content_slug, publish_at, created_at, updated_at) VALUES (:status, :content_slug, :publish_at, NOW(), NOW())");
                $stmt->bindValue(':content_slug', $content_slug);
            }
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':publish_at', $publish_at, $publish_at === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt->execute();
            if (!$content_id) $content_id = $pdo->lastInsertId();
            $sqlItem = "INSERT INTO wp_content_item (content_id, content_subject, content_body, content_lang, created_at, updated_at) VALUES (:content_id, :subject, :body, :lang, NOW(), NOW()) ON DUPLICATE KEY UPDATE content_subject = VALUES(content_subject), content_body = VALUES(content_body), updated_at = NOW()";
            $stmtItem = $pdo->prepare($sqlItem);
            $langs = ['en', 'lo', 'th'];
            $all_html_content = "";
            foreach ($langs as $lang) {
                $subj = $data["title_$lang"] ?? '';
                $body = $data["content_$lang"] ?? '';
                $all_html_content .= $body;
                if ($subj !== '' || $body !== '') {
                    $stmtItem->execute([':content_id' => $content_id, ':subject' => $subj, ':body' => $body, ':lang' => $lang]);
                }
            }
            if(!$ex_cover) {
                $mediaHelper->deleteExistingCover($content_id, 'wp_content', 'cover');
            }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $mediaHelper->handleSingleUpload($content_id, $_FILES['cover']);
            }
            $mediaHelper->syncMedia($content_id, 'attachment', $data['existing_attachments'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image', $data['existing_images'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image360', $data['existing_images360'] ?? []);
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
            $this->notification($content_id, $status);
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
    public function notification($content_id, $status) {
        $pdo = $this->db;
        $isExternalTrans = $pdo->inTransaction();
        try {
            if (!$isExternalTrans) $pdo->beginTransaction();
            if ($status == 'published') {
                $stmt = $pdo->prepare("SELECT publish_at FROM wp_content WHERE content_id = ?");
                $stmt->execute([$content_id]);
                $publish_at = $stmt->fetchColumn();
                $sql = "INSERT INTO wp_notification_targets (notifications_target, notifications_item, member_id, publish_at, status)
                        SELECT 'news', :nid, member_id, :pub, 'published' 
                        FROM wp_members WHERE status = 'active'
                        ON DUPLICATE KEY UPDATE status = 'published', publish_at = :pub, read_at = NULL";
                $pdo->prepare($sql)->execute([':nid' => $content_id, ':pub' => $publish_at]);
            } else {
                $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status, publish_at = NULL, read_at = NULL WHERE notifications_item = :id AND notifications_target = 'news'");
                $stmt->execute([':status' => $status, ':id' => $content_id]);
            }
            if (!$isExternalTrans) $pdo->commit();
        } catch (Exception $e) {
            if (!$isExternalTrans && $pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
    public function delete($id) {
        $pdo = $this->db;
        $pdo->prepare("UPDATE wp_content SET status = 'deleted', updated_at = NOW() WHERE content_id = ?")->execute([(int)$id]);
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