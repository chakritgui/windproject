<?php
class MapModel{
    private PDO $db;
    public function __construct(){
        $this->db = Database::getInstance()->pdo;
    }
    public function windarea() {
        $sql = "SELECT * FROM wp_project_area WHERE status = 'active'";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function poleslocation() {
        $sql = "SELECT 
            p.*, t.type_id, t.type_name, l.installations_name
        FROM wp_poles p 
        LEFT JOIN wp_type t on t.type_id = p.type_id 
        LEFT JOIN wp_installations l on l.installations_id = p.installations_id
        WHERE p.status = 'online'";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function project() {
        $sql = "SELECT pj.project_id, pj.project_name 
                FROM wp_poles p
                LEFT JOIN wp_project pj on pj.project_id = p.project_id
                WHERE pj.status = 'active' and p.status = 'online' 
                GROUP BY pj.project_id 
                ORDER BY pj.project_id";
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function type($project_id) {
        $sql = "SELECT t.type_id, t.type_name 
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
        $sql = "SELECT l.installations_id, l.installations_name, p.poles_lat, p.poles_lng
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
        $sqlPole = "SELECT 
                        p.*, t.type_name, l.installations_name, pj.project_name
                    FROM wp_poles p 
                    LEFT JOIN wp_type t on t.type_id = p.type_id 
                    LEFT JOIN wp_installations l on l.installations_id = p.installations_id
                    LEFT JOIN wp_project pj on pj.project_id = p.project_id
                    WHERE p.poles_id = :poles_id";
        $stmt1 = $this->db->prepare($sqlPole);
        $stmt1->execute([':poles_id' => $poles_id]);
        $poleInfo = $stmt1->fetch(PDO::FETCH_ASSOC);
        if (!$poleInfo) return false;
        $sqlDate = "SELECT 
                        MAX(wind_datetime) as max_datetime, 
                        MIN(wind_datetime) as min_datetime 
                    FROM 
                        wp_winds 
                    WHERE 
                        poles_id = :poles_id and status = 'active'";
        $stmt2 = $this->db->prepare($sqlDate);
        $stmt2->execute([':poles_id' => $poles_id]);
        $dateInfo = $stmt2->fetch(PDO::FETCH_ASSOC);
        $min_datetime = ($start) ? convertTimeZone($start, 'd/m/Y') : convertTimeZone($dateInfo['min_datetime'], 'd/m/Y');
        $max_datetime = ($end) ? convertTimeZone($end, 'd/m/Y') : convertTimeZone($dateInfo['max_datetime'], 'd/m/Y');
        $min_datetime_val = ($start) ? convertTimeZone($start, 'd/m/Y') : convertTimeZone($dateInfo['min_datetime'], 'Y-m-d');
        $max_datetime_val = ($end) ? convertTimeZone($end, 'd/m/Y') : convertTimeZone($dateInfo['max_datetime'], 'Y-m-d');
        $poleInfo['start_date'] = convertTimeZone($dateInfo['min_datetime'], 'd/m/Y');
        $poleInfo['end_date'] = convertTimeZone($dateInfo['max_datetime'], 'd/m/Y');
        $poleInfo['min_datetime'] = $min_datetime;
        $poleInfo['max_datetime'] = $max_datetime;
        $poleInfo['min_datetime_val'] = $min_datetime_val;
        $poleInfo['max_datetime_val'] = $max_datetime_val;
        $poleInfo['levels_id'] = '';
        $poleInfo['levels_name'] = '';
        if ($height) {
            $sqlHeight = "SELECT 
                            l.levels_id, 
                            CONCAT(h.height_name,' ',l.height_levels) AS levels_name 
                        FROM wp_height h 
                        LEFT JOIN wp_height_levels l ON l.height_id = h.height_id 
                        WHERE l.levels_id = :height_id"; 
            $stmt2 = $this->db->prepare($sqlHeight);
            $stmt2->execute([':height_id' => $height]);
            $heightInfo = $stmt2->fetch(PDO::FETCH_ASSOC);
            if ($heightInfo) {
                $poleInfo['levels_id'] = $heightInfo['levels_id'];
                $poleInfo['levels_name'] = $heightInfo['levels_name'];
            }
        } else {
            $sqlFirst = "SELECT 
                            l.levels_id, 
                            CONCAT(h.height_name, ' ', l.height_levels) AS levels_name 
                        FROM wp_height h 
                        INNER JOIN wp_height_levels l ON l.height_id = h.height_id
                        INNER JOIN wp_winds w ON w.levels_id = l.levels_id
                        WHERE w.poles_id = :poles_id
                        GROUP BY l.levels_id 
                        ORDER BY h.height_id ASC, l.levels_id ASC 
                        LIMIT 1";
            $stmtFirst = $this->db->prepare($sqlFirst);
            $stmtFirst->execute([':poles_id' => $poles_id]);
            $firstItem = $stmtFirst->fetch(PDO::FETCH_ASSOC);
            if ($firstItem) {
                $poleInfo['levels_id'] = $firstItem['levels_id'];
                $poleInfo['levels_name'] = $firstItem['levels_name'];
            }
        }
        return $poleInfo;
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
        $sql = "SELECT l.levels_id AS id, CONCAT(h.height_name, ' ', l.height_levels) AS text 
                FROM wp_height h 
                {$join} 
                {$where}
                GROUP BY l.levels_id 
                ORDER BY h.height_id ASC, l.levels_id ASC 
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