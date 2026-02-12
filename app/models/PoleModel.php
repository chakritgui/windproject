<?php
class PoleModel {
    private PDO $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
        $this->db->exec("SET time_zone = '+00:00'"); 
    }
    private function parseDate($dateStr, $isEndOfDay = false) {
        date_default_timezone_set('UTC'); // หรือ Asia/Bangkok ตามโครงสร้าง DB
        $date = DateTime::createFromFormat('d/m/Y', $dateStr);
        if (!$date) {
            try {
                $date = new DateTime($dateStr);
            } catch (Exception $e) {
                return $dateStr;
            }
        }
        if ($isEndOfDay) {
            return $date->format('Y-m-d') . " 23:59:59";
        }
        return $date->format('Y-m-d') . " 00:00:00";
    }
    public function polestats($params) {
        $map = [
            'WS' => ['col' => 'wind_speed', 'dec' => 2],
            'WD' => ['col' => 'wind_direction', 'dec' => 2],
            'AD' => ['col' => 'air_density', 'dec' => 3],
            'SP' => ['col' => 'pressure', 'dec' => 2],
            'RH' => ['col' => 'humidity', 'dec' => 2],
            'TI' => ['col' => 'turbulence_intensity', 'dec' => 2]
        ];
        $select = [];
        if (!empty($params['sensors'])) {
            foreach ($params['sensors'] as $k) {
                if (isset($map[$k])) {
                    $column = $map[$k]['col'];
                    $decimal = $map[$k]['dec'];
                    $select[] = "ROUND(AVG({$column}), {$decimal}) AS {$k}";
                }
            }
        }
        $stats = [];
        $sqlPole = "SELECT poles_lat, poles_lng FROM wp_poles WHERE poles_id = :poles_id";
        $stmt1 = $this->db->prepare($sqlPole);
        $stmt1->execute([':poles_id' => $params['poles_id']]);
        $pole = $stmt1->fetch(PDO::FETCH_ASSOC);
        $stats['lat'] = $pole['poles_lat'] ?? null;
        $stats['lng'] = $pole['poles_lng'] ?? null;
        if (!empty($select)) {
            $start = $this->parseDate($params['start']);
            $end   = $this->parseDate($params['end'], true);

            $sql = "SELECT " . implode(', ', $select) . "
                    FROM wp_winds
                    WHERE poles_id = ?
                    AND levels_id = ?
                    AND wind_datetime BETWEEN ? AND ?
                    AND status = 'active'";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $params['poles_id'],
                $params['height_id'],
                $start,
                $end
            ]);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($res) {
                $stats = array_merge($stats, $res);
            }
        }
        return $stats;
    }
    public function poleval($params) {
        $map = [
            'WS' => 'wind_speed', 'WD' => 'wind_direction',
            'AD' => 'air_density', 'SP' => 'pressure',
            'RH' => 'humidity', 'TI' => 'turbulence_intensity'
        ];
        $select = ["DATE_FORMAT(wind_datetime, '%H:%i') AS time_label"];
        foreach ($params['sensors'] as $k) {
            if (isset($map[$k])) {
                $select[] = "ROUND(AVG({$map[$k]}), 2) AS {$k}";
            }
        }
        $start = $this->parseDate($params['start']);
        $end   = $this->parseDate($params['end'], true);
        $sql = "SELECT " . implode(', ', $select) . "
                FROM wp_winds
                WHERE poles_id = ? AND levels_id = ? 
                AND wind_datetime BETWEEN ? AND ?
                AND status = 'active'
                GROUP BY DATE_FORMAT(wind_datetime, '%Y-%m-%d %H:%i')
                ORDER BY wind_datetime ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$params['poles_id'], $params['height_id'], $start, $end]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function info($params) {
        $poles_id = $params['poles_id'];
        $height_id = $params['height_id'];
        $dateStart = new DateTime($this->parseDate($params['start']));
        $dateEnd   = new DateTime($this->parseDate($params['end']));
        $interval = $dateStart->diff($dateEnd);
        $total_days = $interval->days + 1;
        $startStr = $dateStart->format('d/m/Y');
        $endStr = $dateEnd->format('d/m/Y');
        $sqlPole = "SELECT p.*, t.type_name, l.installations_name, pj.project_name
                    FROM wp_poles p 
                    LEFT JOIN wp_type t on t.type_id = p.type_id 
                    LEFT JOIN wp_installations l on l.installations_id = p.installations_id
                    LEFT JOIN wp_project pj on pj.project_id = p.project_id
                    WHERE p.poles_id = :poles_id";
        $stmt1 = $this->db->prepare($sqlPole);
        $stmt1->execute([':poles_id' => $poles_id]);
        $poleInfo = $stmt1->fetch(PDO::FETCH_ASSOC);
        $sqlHeight = "SELECT l.levels_id, h.height_name AS levels_name 
                    FROM wp_height h 
                    LEFT JOIN wp_height_levels l ON l.height_id = h.height_id 
                    WHERE l.levels_id = :height_id"; 
        $stmt2 = $this->db->prepare($sqlHeight);
        $stmt2->execute([':height_id' => $height_id]);
        $heightInfo = $stmt2->fetch(PDO::FETCH_ASSOC);
        return [
            'pole'   => $poleInfo,
            'level'  => $heightInfo,
            'period' => "$startStr - $endStr",
            'total_days' => $total_days
        ];
    }
}