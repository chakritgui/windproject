<?php
class UserModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function documentList($page = 1, $limit = 20,  $contract_id = null, $project_id = null, $type_id = null, $installations_id = null, $poles_id = null, $date = null, $keyword = null, $order = 'desc') {
        $offset = ($page - 1) * $limit;
        $where  = "WHERE d.status = 'public'";
        $params = [];
        if ($contract_id) {
            $where .= " AND d.contract_id = :contract_id";
            $params[':contract_id'] = [(int)$contract_id, PDO::PARAM_INT];
        }
        if ($project_id) {
            $where .= " AND d.project_id = :project_id";
            $params[':project_id'] = [(int)$project_id, PDO::PARAM_INT];
        }
        if ($installations_id) {
            $where .= " AND d.installations_id = :installations_id";
            $params[':installations_id'] = [(int)$installations_id, PDO::PARAM_INT];
        }
        if ($poles_id) {
            $where .= " AND d.poles_id = :poles_id";
            $params[':poles_id'] = [(int)$poles_id, PDO::PARAM_INT];
        }
        if ($type_id) {
            $where .= " AND d.type_id = :type_id";
            $params[':type_id'] = [(int)$type_id, PDO::PARAM_INT];
        }
        if ($keyword) {
            $where .= " AND d.document_name LIKE :keyword";
            $params[':keyword'] = ['%' . $keyword . '%', PDO::PARAM_STR];
        }
        if ($date && preg_match('/^\d{2}\/\d{4}$/', $date)) {
            list($m, $y) = explode('/', $date);
            $start = convertTimeZoneUTC("$y-$m-01 00:00:00", 'Y-m-d H:i:s');
            $end   = convertTimeZoneUTC(
                date('Y-m-t 23:59:59', strtotime("$y-$m-01")),
                'Y-m-d H:i:s'
            );
            $where .= " AND d.document_start <= :end_date AND d.document_end >= :start_date";
            $params[':start_date'] = [$start, PDO::PARAM_STR];
            $params[':end_date']   = [$end, PDO::PARAM_STR];
        }
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_documents d $where");
        foreach ($params as $k => $p) {
            $stmt->bindValue($k, $p[0], $p[1]);
        }
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                d.document_id,
                d.document_name,
                d.document_type,
                d.document_size,
                d.document_start,
                d.document_end,
                d.document_path,
                d.created_at,
                d.document_download,
                c.contract_name,
                p.project_name,
                t.type_name,
                i.installations_name,
                pl.poles_code,
                d.document_file_name
            FROM wp_documents d
            LEFT JOIN wp_contract c on c.contract_id = d.contract_id
            LEFT JOIN wp_project p on p.project_id = d.project_id
            LEFT JOIN wp_type t on t.type_id = d.type_id
            LEFT JOIN wp_installations i on i.installations_id = d.installations_id
            LEFT JOIN wp_poles pl on pl.poles_id = d.poles_id
            $where 
            ORDER BY d.created_at {$order}
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $p) {
            $stmt->bindValue($k, $p[0], $p[1]);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatRow($row);
        }
        return [
            'total'    => $total,
            'page'     => $page,
            'limit'    => $limit,
            'has_more' => ($offset + $limit) < $total,
            'items'    => $rows
        ];
    }
    public function documentDownload($data) {
        if (empty($data['id']) || !is_numeric($data['id'])) {
            return false;
        }
        $document_id = (int)$data['id'];
        $member_id   = $_SESSION['user']['id'] ?? null;
        $device      = substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 255);
        try {
            $this->db->beginTransaction();
            $sql = "INSERT INTO wp_documents_download_logs (document_id, member_id, download_date, download_device) VALUES (:document_id, :member_id, NOW(), :device)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':document_id' => $document_id,
                ':member_id'   => $member_id,
                ':device'      => $device
            ]);
            $sql = "UPDATE wp_documents SET document_download = document_download + 1 WHERE document_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $document_id]);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function documentDownloadHistory($page = 1, $limit = 20) {
        $member_id = $_SESSION['user']['id'] ?? null;
        $offset = ($page - 1) * $limit;
        $where  = '';
        $params = [];
        if ($member_id) {
            $where = 'WHERE l.member_id = :member_id';
            $params[':member_id'] = (int)$member_id;
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents_download_logs l $where";
        $stmt = $this->db->prepare($sqlTotal);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_INT);
        }
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                l.download_date,
                l.download_device,
                d.document_name,
                t.type_name,
                d.document_type,
                d.document_size,
                c.contract_name,
                p.project_name,
                t.type_name,
                i.installations_name,
                pl.poles_code
            FROM wp_documents_download_logs l
            LEFT JOIN wp_documents d ON d.document_id = l.document_id
            LEFT JOIN wp_contract c on c.contract_id = d.contract_id
            LEFT JOIN wp_project p on p.project_id = d.project_id
            LEFT JOIN wp_type t on t.type_id = d.type_id
            LEFT JOIN wp_installations i on i.installations_id = d.installations_id
            LEFT JOIN wp_poles pl on pl.poles_id = d.poles_id
            $where
            ORDER BY l.download_date DESC
            LIMIT :limit OFFSET :offset
        ";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v, PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit',  (int)$limit,  PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($items as &$row) {
            $row['download_date'] = convertTimeZone($row['download_date'], 'd/m/Y H:i:s');
        }
        unset($row);
        return [
            'items'    => $items,
            'has_more' => ($offset + $limit) < $total
        ];
    }
    public function newsList($page = 1, $limit = 20, $order = 'desc') {
        $offset = ($page - 1) * $limit;
        $member_id = $_SESSION['user']['id'] ?? 0; 
        $where = "WHERE (
            (c.type = 'news' AND c.status = 'published' and c.publish_at is not null and c.publish_at <> '' and c.publish_at <= NOW())
            OR
            (c.type = 'project' AND c.status = 'active' AND c.folder_show_user = 'yes')
        )";
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_content c $where");
        $stmt->execute();
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
            c.content_id,
            c.created_at,
            iEn.content_subject AS subject_en,
            iTh.content_subject AS subject_th,
            iLo.content_subject AS subject_lo,
            c.cover AS cover_image,
            COALESCE(m.count_attachment, 0) AS count_attachment,
            COALESCE(m.count_image, 0) AS count_image,
            COALESCE(m.count_image360, 0) AS count_image360,
            EXISTS (
                SELECT 1
                FROM wp_notification_targets t2
                WHERE t2.notifications_item = c.content_id
                AND t2.notifications_target = 'news'
                AND t2.member_id = :member_id
                AND t2.read_at IS NOT NULL
            ) AS is_read,
            c.content_slug,
            c.type
        FROM wp_content c
        LEFT JOIN wp_content_item iEn ON iEn.content_id = c.content_id AND iEn.content_lang = 'en' AND iEn.status IN ('ready','success')
        LEFT JOIN wp_content_item iTh ON iTh.content_id = c.content_id AND iTh.content_lang = 'th' AND iTh.status IN ('ready','success')
        LEFT JOIN wp_content_item iLo ON iLo.content_id = c.content_id AND iLo.content_lang = 'lo' AND iLo.status IN ('ready','success')
        LEFT JOIN (
            SELECT
                content_id,
                SUM(CASE WHEN file_type = 'attachment' THEN 1 ELSE 0 END) AS count_attachment,
                SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) AS count_image,
                SUM(CASE WHEN file_type = 'image360' THEN 1 ELSE 0 END) AS count_image360
            FROM wp_content_media
            WHERE status = 'active'
            GROUP BY content_id
        ) m ON m.content_id = c.content_id
        $where
        ORDER BY c.created_at {$order}
        LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->bindValue(':member_id', $member_id, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatRow($row); 
        }
        return [
            'total'    => $total,
            'page'     => $page,
            'limit'    => $limit,
            'has_more' => ($offset + $limit) < $total,
            'items'    => $rows
        ];
    }
    private function formatRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
        if (!empty($row['document_download'])) {
            $row['document_download'] = number_format($row['document_download']);
        }
        foreach (['document_start', 'document_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y');
            }
        }
    }
    public function info($start = 0, $length = 20, $filters = []) {
        list($mainWhere, $mainParams) = $this->buildListWhere($filters);
        $sql = "SELECT 
            f.id, f.name as folder_name, f.level, f.parent_id, f.created_at, f.type, f.content_id, c.content_slug, f.sub_type,
            iEn.status as en_status,
            iLo.status as lo_status,
            iTh.status as th_status,
            iEn.content_subject as en_subject,
            iLo.content_subject as lo_subject,
            iTh.content_subject as th_subject,
            f.created_at,
            COALESCE(m.count_attachment, 0) AS count_attachment,
            COALESCE(m.count_image, 0) AS count_image,
            COALESCE(m.count_image360, 0) AS count_image360,
            CASE
                WHEN f.type = 'folder' THEN f.cover
                WHEN f.type = 'content' and  f.sub_type = 'project' THEN c.cover
                WHEN f.type = 'document' and  f.sub_type = 'document' THEN d.document_type
                ELSE c.cover
            END as cover,
            CASE
                WHEN f.type = 'folder' or f.type = 'content' THEN f.slug
                WHEN f.type = 'document' and f.sub_type = 'document' then d.document_path
                ELSE ''
            END as slug
        FROM wp_folder f 
        LEFT JOIN wp_content c on c.content_id = f.content_id and f.type = 'content'
        LEFT JOIN wp_documents d ON d.document_id = f.content_id and f.type = 'document'
        LEFT JOIN wp_content_item iEn ON iEn.content_id = c.content_id AND iEn.content_lang = 'en' AND iEn.status IN ('ready','success')
        LEFT JOIN wp_content_item iTh ON iTh.content_id = c.content_id AND iTh.content_lang = 'th' AND iTh.status IN ('ready','success')
        LEFT JOIN wp_content_item iLo ON iLo.content_id = c.content_id AND iLo.content_lang = 'lo' AND iLo.status IN ('ready','success')
        LEFT JOIN (
            SELECT
                content_id,
                SUM(CASE WHEN file_type = 'attachment' THEN 1 ELSE 0 END) AS count_attachment,
                SUM(CASE WHEN file_type = 'image' THEN 1 ELSE 0 END) AS count_image,
                SUM(CASE WHEN file_type = 'image360' THEN 1 ELSE 0 END) AS count_image360
            FROM wp_content_media
            WHERE status = 'active'
            GROUP BY content_id
        ) m ON m.content_id = c.content_id
        {$mainWhere} 
        ORDER BY 
            (CASE WHEN f.type = 'folder' THEN 0 ELSE 1 END) ASC,
            (CASE WHEN f.type = 'folder' THEN ifnull(f.folder_order, f.id) END) ASC";
        $stmt = $this->db->prepare($sql);
        foreach ($mainParams as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->execute();
        $folderRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $finalItems = [];
        $stmt = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting WHERE setting_type IN ('language', 'language_content')");
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        foreach ($folderRows as $row) {
            $item = $this->formatRows($row);
            $item['child_count'] = $this->countChildren($row['id'], $row['level']);
            $item['settings'] = $settings;
            $finalItems[] = $item;
        }
        $totalCount = count($finalItems);
        if ($length > 0) {
            $finalItems = array_slice($finalItems, $start, $length);
        };
        return [
            'total' => $totalCount, 
            'data' => $finalItems,
            'hasMore' => ($length > 0) ? ($start + $length < $totalCount) : false
        ];
    }
    private function formatRows($row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
        return $row;
    }
    private function countChildren($folderId, $currentLevel) {
        $nextLevel = (int)$currentLevel + 1; 
        $where = " AND (
            (f.sub_type = 'news' AND c.status = 'published' AND c.folder_show_user = 'yes' and c.publish_at is not null and c.publish_at <> '' and c.publish_at <= NOW())
            OR
            (f.sub_type = 'document' AND d.status = 'public' AND d.folder_show_admin = 'yes')
            OR
            (f.sub_type = 'project' AND f.status = 'active')
        ) AND f.status = 'active' ";
        $sql = "SELECT COUNT(DISTINCT f.id) FROM wp_folder f 
        LEFT JOIN wp_content c ON c.content_id = f.content_id and f.type = 'content'
        LEFT JOIN wp_documents d ON d.document_id = f.content_id and f.type = 'document'
        WHERE f.parent_id = :pid AND f.level = :lvl {$where}";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':pid' => $folderId, 
            ':lvl' => $nextLevel
        ]);
        return (int) $stmt->fetchColumn();
    }
    private function buildListWhere($filters) {
        $where  = " WHERE  
            ((f.sub_type = 'news' AND c.status = 'published' AND c.folder_show_user = 'yes')
            OR
            (f.sub_type = 'project' AND f.status = 'active') 
            OR (f.sub_type = 'document' AND d.status = 'public' AND d.folder_show_user = 'yes')
            ) AND f.status = 'active'
        ";
        $params = [];
        if (!empty($filters['level'])) {
            $where .= " AND f.level = :level ";
            $params[':level'] = $filters['level'];
        }
        if (isset($filters['item']) && ($filters['item'] !== '' && $filters['item'] !== null)) {
            $where .= " AND f.parent_id = :item ";
            $params[':item'] = $filters['item'];
        } else {
            $where .= " AND f.parent_id IS NULL ";
        }
        return [$where, $params];
    }
    public function saveAcceptance($userId, $disclaimerId, $version) {
        try {
            $sql = "INSERT INTO wp_user_disclaimer_accepts (user_id, disclaimer_id, version, accepted_at) 
                    VALUES (:user_id, :disclaimer_id, :version, NOW())
                    ON DUPLICATE KEY UPDATE 
                        version = VALUES(version), 
                        accepted_at = NOW()";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':user_id'       => $userId,
                ':disclaimer_id' => $disclaimerId,
                ':version'       => $version
            ]);
        } catch (PDOException $e) {
            return false;
        }
    }
}