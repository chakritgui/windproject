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
                    p.*, 
                    t.type_id, 
                    t.type_name, 
                    l.installations_name, 
                    t.type_icon
                FROM wp_poles p
                INNER JOIN wp_type t ON t.type_id = p.type_id 
                INNER JOIN wp_installations l ON l.installations_id = p.installations_id
                WHERE p.status = 'online'";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function project() {
        $sql = "SELECT DISTINCT
                    p.project_id,
                    COALESCE(NULLIF(p.project_name_display, ''), p.project_name, '') AS project_name
                FROM wp_project p
                INNER JOIN wp_poles po ON po.project_id = p.project_id
                WHERE p.status = 'active' AND po.status = 'online'
                ORDER BY p.project_id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function type($project_id) {
        $sql = "SELECT DISTINCT
                    t.type_id,  
                    COALESCE(NULLIF(t.type_name_display, ''), t.type_name, '') AS type_name
                FROM wp_type t
                INNER JOIN wp_poles po ON po.type_id = t.type_id 
                WHERE t.status = 'active' 
                  AND po.status = 'online' 
                  AND po.project_id = :project_id
                ORDER BY t.type_id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':project_id' => $project_id]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function station($project_id, $type_id) {
        $sql = "SELECT 
                    l.installations_id, 
                    COALESCE(NULLIF(l.installations_name_display, ''), l.installations_name, '') AS installations_name,
                    p.poles_lat, 
                    p.poles_lng, 
                    p.poles_id
                FROM wp_installations l
                INNER JOIN wp_poles p ON p.installations_id = l.installations_id
                WHERE l.status = 'active' 
                  AND p.status = 'online' 
                  AND p.project_id = :project_id 
                  AND p.type_id = :type_id
                ORDER BY l.installations_id ASC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':project_id' => $project_id,
            ':type_id' => $type_id
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function poledetails($poles_id, $start, $end, $height) {
        try {
            $sqlPole = "SELECT p.*, t.type_name, l.installations_name, pj.project_name, s.project_status_name, s.project_status_color
                        FROM wp_poles p 
                        LEFT JOIN wp_type t on t.type_id = p.type_id 
                        LEFT JOIN wp_installations l on l.installations_id = p.installations_id
                        LEFT JOIN wp_project pj on pj.project_id = p.project_id
                        LEFT JOIN wp_project_status s on s.project_status_id = pj.project_status_id
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
            $raw_min = $dateInfo['min_dt'];
            $raw_max = $dateInfo['max_dt'];
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
                $stC = $this->db->prepare("SELECT content_id, status, cover, created_at, type, cover_display FROM wp_content WHERE content_id = :id AND status != 'deleted'");
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
                        "cover_display" => $contentBase['cover_display'],
                        "title" => $titles,
                        "content" => $bodies,
                        "images" => $images,
                        "images360" => $images360,
                        "attachments" => $attachments
                    ];
                }
            }
            $project_id = $poleInfo['project_id'];
            $sql = "SELECT project_background, project_opacity FROM wp_project WHERE project_id = ?"; 
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$project_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $default = [
                'project_background' => '',
                'project_opacity' => 0
            ];
            $poleInfo['project_bg'] = $row ?: $default;
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