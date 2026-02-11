<?php
class MapModel{
    private PDO $db;
    public function __construct(){
        $this->db = Database::getInstance()->pdo;
    }
    public function master() {
        $sql = "SELECT center_lat, center_lng, zoom_level, polygon_visibility, show_country_line, country_layers_data,map_labels FROM wp_map_master LIMIT 1";
        return $this->db->query($sql)->fetch(PDO::FETCH_ASSOC);
    }
    public function windarea() {
        $sql = "SELECT area_name, geo_data, custom_style FROM wp_map_polygons WHERE status = 'active'";
        $polygons = $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        return ['polygons' => $polygons];
    }
    public function poleslocation() {
        $sql = "SELECT 
            p.*, t.type_id, t.type_name, l.installations_name, t.type_icon
        FROM wp_poles p 
        LEFT JOIN wp_type t on t.type_id = p.type_id 
        LEFT JOIN wp_installations l on l.installations_id = p.installations_id
        WHERE p.status = 'online'";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function contracts() {
        $sql = "SELECT contract_id,
                CASE 
                    WHEN contract_name_display IS NOT NULL AND contract_name_display <> '' 
                        THEN contract_name_display
                    WHEN contract_name IS NOT NULL AND contract_name <> '' 
                        THEN contract_name
                    ELSE '' 
                END AS contract_name
                FROM wp_contract
                WHERE status = 'active' 
                ORDER BY contract_id ";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function project(){
        $sql = "SELECT DISTINCT
                pj.project_id,
                CASE 
                    WHEN pj.project_name_display IS NOT NULL AND pj.project_name_display <> '' 
                        THEN pj.project_name_display
                    WHEN pj.project_name IS NOT NULL AND pj.project_name <> '' 
                        THEN pj.project_name
                    ELSE '' 
                END AS project_name
            FROM wp_poles p
            LEFT JOIN wp_project pj 
                ON pj.project_id = p.project_id
            WHERE pj.status = 'active'
            AND p.status = 'online'
            ORDER BY pj.project_id
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function type($project_id) {
        $sql = "SELECT t.type_id,  
                CASE 
                    WHEN t.type_name_display IS NOT NULL AND t.type_name_display <> '' 
                        THEN t.type_name_display
                    WHEN t.type_name IS NOT NULL AND t.type_name <> '' 
                        THEN t.type_name
                    ELSE '' 
                END AS type_name
                FROM wp_poles p
                LEFT JOIN wp_type t on t.type_id = p.type_id
                WHERE t.status = 'active' and p.status = 'online' and p.project_id = :project_id
                GROUP BY t.type_id 
                ORDER BY t.type_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':project_id' => $project_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function station($project_id, $type_id) {
        $sql = "SELECT l.installations_id, 
                CASE 
                    WHEN l.installations_name_display IS NOT NULL AND l.installations_name_display <> '' 
                        THEN l.installations_name_display
                    WHEN l.installations_name IS NOT NULL AND l.installations_name <> '' 
                        THEN l.installations_name
                    ELSE '' 
                END AS installations_name,
                p.poles_lat, p.poles_lng, p.poles_id
                FROM wp_poles p
                LEFT JOIN wp_installations l on l.installations_id = p.installations_id
                WHERE l.status = 'active' and p.status = 'online' 
                AND p.project_id = :project_id AND p.type_id = :type_id
                GROUP BY l.installations_id 
                ORDER BY l.installations_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':project_id' => $project_id,
            ':type_id' => $type_id
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function poledetails($poles_id, $start, $end, $height) {
        try {
            $sqlPole = "SELECT p.*, t.type_name, l.installations_name, pj.project_name
                        FROM wp_poles p 
                        LEFT JOIN wp_type t on t.type_id = p.type_id 
                        LEFT JOIN wp_installations l on l.installations_id = p.installations_id
                        LEFT JOIN wp_project pj on pj.project_id = p.project_id
                        WHERE p.poles_id = :poles_id LIMIT 1";
            $stmt1 = $this->db->prepare($sqlPole);
            $stmt1->execute([':poles_id' => $poles_id]);
            $poleInfo = $stmt1->fetch(PDO::FETCH_ASSOC);
            if (!$poleInfo) return false;
            $sqlDate = "SELECT MAX(wind_datetime) as max_dt, MIN(wind_datetime) as min_dt 
                        FROM wp_winds WHERE poles_id = :poles_id AND status = 'active'";
            $stmt2 = $this->db->prepare($sqlDate);
            $stmt2->execute([':poles_id' => $poles_id]);
            $dateInfo = $stmt2->fetch(PDO::FETCH_ASSOC);
            $raw_min = $start ?: $dateInfo['min_dt'];
            $raw_max = $end ?: $dateInfo['max_dt'];
            $poleInfo['start_date'] = convertTimeZone($dateInfo['min_dt'], 'd/m/Y');
            $poleInfo['end_date']   = convertTimeZone($dateInfo['max_dt'], 'd/m/Y');
            $poleInfo['min_datetime'] = convertTimeZone($raw_min, 'd/m/Y');
            $poleInfo['max_datetime'] = convertTimeZone($raw_max, 'd/m/Y');
            $poleInfo['min_datetime_val'] = convertTimeZone($raw_min, 'Y-m-d');
            $poleInfo['max_datetime_val'] = convertTimeZone($raw_max, 'Y-m-d');
            $height_id = null;
            $height_name = '';
            if ($height) {
                $sqlH = "SELECT h.height_id, h.height_name
                        FROM wp_height h 
                        JOIN wp_height_levels l ON l.height_id = h.height_id 
                        WHERE h.height_id = :h_id";
                $stH = $this->db->prepare($sqlH);
                $stH->execute([':h_id' => $height]);
                $resH = $stH->fetch(PDO::FETCH_ASSOC);
                if ($resH) {
                    $height_id = $resH['height_id'];
                    $height_name = $resH['height_name'];
                }
            } else {
                $sqlF = "SELECT h.height_id, h.height_name 
                        FROM wp_height h 
                        JOIN wp_height_levels l ON l.height_id = h.height_id
                        JOIN wp_winds w ON w.levels_id = l.levels_id
                        WHERE w.poles_id = :p_id
                        GROUP BY h.height_id ORDER BY h.height_id ASC LIMIT 1";
                $stF = $this->db->prepare($sqlF);
                $stF->execute([':p_id' => $poles_id]);
                $resF = $stF->fetch(PDO::FETCH_ASSOC);
                if ($resF) {
                    $height_id = $resF['height_id'];
                    $height_name = $resF['height_name'];
                }
            }
            $poleInfo['height_id'] = $height_id;
            $poleInfo['height_name'] = $height_name;
            if (!empty($poleInfo['content_id'])) {
                $cId = $poleInfo['content_id'];
                $stC = $this->db->prepare("SELECT content_id, status, cover, created_at, type FROM wp_content WHERE content_id = :id AND status != 'deleted'");
                $stC->execute([':id' => $cId]);
                $contentBase = $stC->fetch(PDO::FETCH_ASSOC);
                if ($contentBase) {
                    $stI = $this->db->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = :id AND status IN ('ready', 'success')");
                    $stI->execute([':id' => $cId]);
                    $items = $stI->fetchAll(PDO::FETCH_ASSOC);
                    $titles = ["th" => "", "lo" => "", "en" => ""];
                    $bodies = ["th" => "", "lo" => "", "en" => ""];
                    foreach ($items as $row) {
                        $l = $row['content_lang'];
                        if (isset($titles[$l])) {
                            $titles[$l] = $row['content_subject'];
                            $bodies[$l] = $row['content_body'];
                        }
                    }
                    $stM = $this->db->prepare("SELECT id, file_path as url, file_name as name, file_type FROM wp_content_media WHERE content_id = :id AND status = 'active'");
                    $stM->execute([':id' => $cId]);
                    $media = $stM->fetchAll(PDO::FETCH_ASSOC);
                    $images = []; $images360 = []; $attachments = [];
                    foreach ($media as $m) {
                        if ($m['file_type'] === 'image') $images[] = $m;
                        elseif ($m['file_type'] === 'image360') $images360[] = $m;
                        elseif ($m['file_type'] === 'attachment') $attachments[] = $m;
                    }
                    $poleInfo['content'] = [
                        "id" => $cId,
                        "created_at" => convertTimeZone($contentBase['created_at'], 'd/m/Y H:i:s'),
                        "status" => $contentBase['status'],
                        "type" => $contentBase['type'],
                        "cover" => $contentBase['cover'],
                        "title" => $titles,
                        "content" => $bodies,
                        "images" => $images,
                        "images360" => $images360,
                        "attachments" => $attachments
                    ];
                }
            }
            return $poleInfo;
        } catch (PDOException $e) {
            error_log("Database Error in poledetails: " . $e->getMessage());
            return false;
        }
    }
    public function height($page = 1, $limit = 10, $searchTerm = '', $poles_id) {
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = "WHERE w.poles_id = :poles_id"; 
        $params[':poles_id'] = $poles_id;
        if ($searchTerm !== '') {
            $where .= " AND (h.height_name LIKE :search OR l.height_levels LIKE :search)";
            $params[':search'] = "%{$searchTerm}%";
        }
        $join = "INNER JOIN wp_height_levels l ON l.height_id = h.height_id 
                INNER JOIN wp_winds w ON w.levels_id = l.levels_id";
        $stmtCount = $this->db->prepare("SELECT COUNT(DISTINCT l.levels_id) as total FROM wp_height h {$join} {$where}");
        $stmtCount->execute($params);
        $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
        $sql = "SELECT h.height_id AS id, h.height_name AS text 
                FROM wp_height h 
                {$join} 
                {$where}
                GROUP BY h.height_id
                ORDER BY h.height_id ASC
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        return [
            'items' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total_count' => (int)$totalCount,
        ];
    }
}