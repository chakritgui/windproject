<?php
class DashboardModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function getStats() {
        $stats = [];
        $queries = [
            'total_members'      => "SELECT COUNT(*) FROM wp_members WHERE status = 'active'",
            'total_contracts'     => "SELECT COUNT(*) FROM wp_contract WHERE status = 'active'",
            'total_projects'      => "SELECT COUNT(*) FROM wp_project WHERE status = 'active'",
            'total_types'         => "SELECT COUNT(*) FROM wp_type WHERE status = 'active'",
            'total_installations' => "SELECT COUNT(*) FROM wp_installations WHERE status = 'active'",
            'total_poles'         => "SELECT COUNT(*) FROM wp_poles WHERE status <> 'deleted'",
            'total_documents'     => "SELECT COUNT(*) FROM wp_documents WHERE status = 'public'",
            'total_news'          => "SELECT COUNT(*) FROM wp_content WHERE status <> 'deleted' AND type = 'news'",
            'total_imports'       => "SELECT COUNT(*) FROM wp_imports WHERE status = 'complete'",
            'total_winds'         => "SELECT COUNT(*) FROM wp_winds WHERE status = 'active'"
        ];
        foreach ($queries as $key => $sql) {
            $stats[$key] = (int)$this->db->query($sql)->fetchColumn();
        }
        $stmt = $this->db->prepare("SELECT MAX(import_start) FROM wp_imports WHERE status = 'complete'");
        $stmt->execute();
        $lastUpdate = $stmt->fetchColumn();
        $stats['import_start'] = $lastUpdate ? convertTimeZone($lastUpdate, 'd/m/Y H:i:s') : '-';
        return $stats;
    }
    public function getWindChartData() {
        $stmtMax = $this->db->prepare("SELECT MAX(wind_datetime) FROM wp_winds WHERE status = 'active'");
        $stmtMax->execute();
        $latestTime = $stmtMax->fetchColumn();
        if (!$latestTime) return [];
        $stmt = $this->db->prepare("SELECT wind_datetime, wind_speed, wind_direction, air_density, pressure, humidity, temperature FROM wp_winds WHERE status = 'active' AND wind_datetime BETWEEN DATE_SUB(:latest, INTERVAL 24 HOUR) AND :latest_end ORDER BY wind_datetime ASC");
        $stmt->execute(['latest' => $latestTime, 'latest_end' => $latestTime]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $chartData = [];
        foreach ($rows as $row) {
            $chartData[] = [
                'time' => date('H:i', strtotime($row['wind_datetime'])),
                'speed' => (float)$row['wind_speed'],
                'direction' => (float)$row['wind_direction'],
                'density' => (float)$row['air_density'],
                'pressure' => (float)$row['pressure'],
                'humidity' => (float)$row['humidity'],
                'temp' => (float)$row['temperature']
            ];
        }
        return $chartData;
    }
    public function loginHistory() {
        $sql = "SELECT l.logs_id, CONCAT(m.first_name, ' ', m.last_name) AS member_name, l.login_at, l.logout_at, l.log_type, l.ip_address, l.login_device FROM wp_login_logs l LEFT JOIN wp_members m ON l.member_id = m.member_id ORDER BY l.login_at DESC LIMIT 10";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($history as &$entry) {
            $entry['login_at'] = convertTimeZone($entry['login_at'], 'd/m/Y H:i:s');
            $entry['logout_at'] = $entry['logout_at'] ? convertTimeZone($entry['logout_at'], 'd/m/Y H:i:s') : null;
            $entry['login_device'] = $this->parseUserAgent($entry['login_device']);
        }
        return $history;
    }
    private function parseUserAgent($ua) {
        $browser = "Unknown Browser";
        $platform = "Unknown OS";
        if (preg_match('/MSIE/i', $ua) && !preg_match('/Opera/i', $ua)) $browser = 'Internet Explorer';
        elseif (preg_match('/Firefox/i', $ua)) $browser = 'Firefox';
        elseif (preg_match('/Chrome/i', $ua)) $browser = 'Chrome';
        elseif (preg_match('/Safari/i', $ua)) $browser = 'Safari';
        elseif (preg_match('/Opera/i', $ua)) $browser = 'Opera';
        if (preg_match('/windows|win32/i', $ua)) $platform = 'Windows';
        elseif (preg_match('/macintosh|mac os x/i', $ua)) $platform = 'Mac OS';
        elseif (preg_match('/android/i', $ua)) $platform = 'Android';
        elseif (preg_match('/iphone/i', $ua)) $platform = 'iPhone';
        elseif (preg_match('/linux/i', $ua)) $platform = 'Linux';
        return "$browser ($platform)";
    }
}