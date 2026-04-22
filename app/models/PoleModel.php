<?php
class PoleModel {
    private PDO $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    private function formatDbDate($dateStr) {
        $date = DateTime::createFromFormat('d/m/Y', $dateStr);
        return $date ? $date->format('Y-m-d') : $dateStr;
    }
    public function polestats($params) {
        $map = [
            'WS' => ['col' => 'wind_speed', 'dec' => 2],
            'WD' => ['col' => 'wind_direction', 'dec' => 2],
            'AD' => ['col' => 'air_density', 'dec' => 3],
            'SP' => ['col' => 'pressure', 'dec' => 2],
            'RH' => ['col' => 'humidity', 'dec' => 2],
            'TE' => ['col' => 'temperature', 'dec' => 2],
            'TU' => ['col' => 'turbulence_intensity', 'dec' => 2]
        ];
        $select = [];
        foreach ($params['sensors'] as $k) {
            if (isset($map[$k])) {
                $column = $map[$k]['col'];
                $decimal = $map[$k]['dec'];
                $select[] = "ROUND(AVG({$column}), {$decimal}) AS {$k}";
                if ($k === 'WS') {
                    $select[] = "ROUND(MAX({$column}), {$decimal}) AS WS_MAX";
                }
            }
        }
        $stats = [];
        if (!empty($select)) {
            $start = $this->formatDbDate($params['start']) . " 00:00:00";
            $end   = $this->formatDbDate($params['end']) . " 23:59:59";
            $levels = !empty($params['levels']) ? $params['levels'] : [$params['height_id']];
            if (!is_array($levels)) $levels = explode(',', $levels);
            $levels = array_filter(array_map('intval', $levels));
            if (empty($levels)) $levels = [0];
            $placeholders = implode(',', array_fill(0, count($levels), '?'));
            $sql = "SELECT " . implode(', ', $select) . " FROM wp_winds WHERE poles_id = ? AND levels_id IN ($placeholders) AND wind_datetime BETWEEN ? AND ? AND status = 'active'";
            $stmt = $this->db->prepare($sql);
            $bindParams = array_merge([$params['poles_id']], $levels, [$start, $end]);
            $stmt->execute($bindParams);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
        }
        $sqlPole = "SELECT poles_lat, poles_lng FROM wp_poles WHERE poles_id = ?";
        $stmt1 = $this->db->prepare($sqlPole);
        $stmt1->execute([$params['poles_id']]);
        $pole = $stmt1->fetch(PDO::FETCH_ASSOC);
        $stats['lat'] = $pole['poles_lat'] ?? null;
        $stats['lng'] = $pole['poles_lng'] ?? null;
        return $stats;
    }
    public function poleval($params) {
        $map = [
            'WS' => 'w.wind_speed',
            'WD' => 'w.wind_direction',
            'AD' => 'w.air_density',
            'SP' => 'w.pressure',
            'RH' => 'w.humidity',
            'TE' => 'w.temperature',
            'TU' => 'w.turbulence_intensity'
        ];
        $start = $this->formatDbDate($params['start']) . " 00:00:00";
        $end   = $this->formatDbDate($params['end']) . " 23:59:59";
        $select = [
            "DATE_FORMAT(w.wind_datetime, '%Y-%m-%d %H:%i') AS full_time",
            "DATE_FORMAT(w.wind_datetime, '%H:%i') AS time_label",
            "hl.height_levels AS level_name",
            "w.levels_id"
        ];
        foreach ($params['sensors'] as $k) {
            if (isset($map[$k])) {
                $select[] = "ROUND(AVG({$map[$k]}), 2) AS {$k}";
                if ($k === 'WS') {
                    $select[] = "ROUND(MAX(w.wind_speed), 2) AS WS_MAX";
                }
            }
        }
        $levels = !empty($params['levels']) ? $params['levels'] : [$params['height_id']];
        if (!is_array($levels)) $levels = array_filter(explode(',', $levels));
        $levels = array_map('intval', $levels);
        if (empty($levels)) $levels = [0];
        $placeholders = implode(',', array_fill(0, count($levels), '?'));
        $sql = "SELECT " . implode(', ', $select) . " 
                FROM wp_winds w 
                JOIN wp_height_levels hl ON w.levels_id = hl.levels_id 
                WHERE w.poles_id = ?  
                AND w.levels_id IN ($placeholders) 
                AND w.wind_datetime BETWEEN ? AND ? 
                AND w.status = 'active' 
                GROUP BY w.levels_id, DATE_FORMAT(w.wind_datetime, '%Y-%m-%d %H:%i') 
                ORDER BY w.wind_datetime ASC, ifnull(hl.height_order, hl.levels_id) ASC";
        $stmt = $this->db->prepare($sql);
        $executeParams = array_merge([$params['poles_id']], $levels, [$start, $end]);
        $stmt->execute($executeParams); 
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function info($params) {
        $poles_id = $params['poles_id'];
        $height_id = $params['height_id'];
        $dateStart = DateTime::createFromFormat('d/m/Y', $params['start']) ?: new DateTime($params['start']);
        $dateEnd   = DateTime::createFromFormat('d/m/Y', $params['end']) ?: new DateTime($params['end']);
        $interval = $dateStart->diff($dateEnd);
        $total_days = $interval->days + 1;
        $sqlPole = "SELECT p.*, t.type_name, l.installations_name, pj.project_name, 
                    CASE
                        WHEN p.project_status_id is not null and p.project_status_id <> '' and p.project_status_id > 0 THEN sp.project_status_name
                            ELSE s.project_status_name
                        END AS project_status_name,
                        CASE
                            WHEN p.project_status_id is not null and p.project_status_id <> '' and p.project_status_id > 0 THEN sp.project_status_color
                            ELSE s.project_status_color
                        END AS project_status_color
                    FROM wp_poles p 
                    LEFT JOIN wp_type t on t.type_id = p.type_id 
                    LEFT JOIN wp_installations l on l.installations_id = p.installations_id
                    LEFT JOIN wp_project pj on pj.project_id = p.project_id
                    LEFT JOIN wp_project_status s on s.project_status_id = pj.project_status_id
                    LEFT JOIN wp_project_status sp on sp.project_status_id = p.project_status_id
                    WHERE p.poles_id = :poles_id";
        $stmt1 = $this->db->prepare($sqlPole);
        $stmt1->execute([':poles_id' => $poles_id]);
        $poleInfo = $stmt1->fetch(PDO::FETCH_ASSOC);
        $sqlHeight = "SELECT height_name FROM wp_height h WHERE h.height_id = :height_id"; 
        $stmt2 = $this->db->prepare($sqlHeight);
        $stmt2->execute([':height_id' => $height_id]);
        $heightInfo = $stmt2->fetch(PDO::FETCH_ASSOC);
        return [
            'pole'   => $poleInfo,
            'height'  => $heightInfo,
            'period' => $dateStart->format('d/m/Y') . " - " . $dateEnd->format('d/m/Y'),
            'total_days' => $total_days
        ];
    }
    public function level($params) {
        $sqlLimit = "SELECT height_limit FROM wp_height WHERE height_id = ?";
        $stmtLimit = $this->db->prepare($sqlLimit);
        $stmtLimit->execute([$params['height_id']]);
        $heightLimit = $stmtLimit->fetchColumn() ?: 3; 
        $sqlLevels = "SELECT levels_id, height_levels FROM wp_height_levels WHERE height_id = ? AND status <> 'deleted' ORDER BY ifnull(height_order, levels_id) ASC"; 
        $stmtLevels = $this->db->prepare($sqlLevels);
        $stmtLevels->execute([$params['height_id']]);
        $levels = $stmtLevels->fetchAll(PDO::FETCH_ASSOC);
        return [
            'height_limit' => (int)$heightLimit,
            'levels' => $levels
        ];
    }
    public function polesList($project_id) {
        $sqlProject = "SELECT 
                            pj.project_name, 
                            s.project_status_name AS project_status, 
                            s.project_status_color
                    FROM wp_project pj
                    LEFT JOIN wp_project_status s 
                            ON s.project_status_id = pj.project_status_id
                    WHERE pj.project_id = :project_id
                    LIMIT 1";
        $stmtProject = $this->db->prepare($sqlProject);
        $stmtProject->execute(['project_id' => $project_id]);
        $project = $stmtProject->fetch(PDO::FETCH_ASSOC);
        if (!$project) {
            return [];
        }
        $sql = "SELECT
                    p.poles_id, 
                    p.poles_lat AS lat, 
                    p.poles_lng AS lng, 
                    t.type_id, 
                    t.type_name, 
                    i.installations_name,
                    t.type_icon,
                    CASE
                        WHEN p.project_status_id is not null and p.project_status_id <> '' and p.project_status_id > 0 THEN sp.project_status_name
                        ELSE s.project_status_name
                    END AS poles_status_name,
                    CASE
                        WHEN p.project_status_id is not null and p.project_status_id <> '' and p.project_status_id > 0 THEN sp.project_status_color
                        ELSE s.project_status_color
                    END AS poles_status_color
                FROM wp_poles p
                LEFT JOIN wp_type t ON t.type_id = p.type_id
                LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
                LEFT JOIN wp_project pj ON pj.project_id = p.project_id
                LEFT JOIN wp_project_status s on s.project_status_id = pj.project_status_id
                LEFT JOIN wp_project_status sp on sp.project_status_id = p.project_status_id
                WHERE p.project_id = :project_id AND p.status = 'online'
                ORDER BY IFNULL(p.item_order, p.poles_id) ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['project_id' => $project_id]);
        $poles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return [
            'project_name'   => $project['project_name'],
            'project_status' => strtolower($project['project_status']),
            'status_color'   => $project['project_status_color'],
            'poles'          => $poles ?: []
        ];
    }
}