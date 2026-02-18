<?php
class DashboardModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function getStats() {
        $stats = [];
        $queries = [
            'total_members' => "SELECT COUNT(*) FROM wp_members WHERE status = 'active'",
            'total_contracts' => "SELECT COUNT(*) FROM wp_contract WHERE status = 'active'",
            'total_projects' => "SELECT COUNT(*) FROM wp_project WHERE status = 'active'",
            'total_types' => "SELECT COUNT(*) FROM wp_type WHERE status = 'active'",
            'total_installations' => "SELECT COUNT(*) FROM wp_installations WHERE status = 'active'",
            'total_poles' => "SELECT COUNT(*) FROM wp_poles WHERE status <> 'deleted'",
            'total_documents' => "SELECT COUNT(*) FROM wp_documents WHERE status = 'public'",
            'total_news' => "SELECT COUNT(*) FROM wp_content WHERE status <> 'deleted' AND type = 'news'",
            'total_imports' => "SELECT COUNT(*) FROM wp_imports WHERE status = 'complete'",
            'total_winds' => "SELECT COUNT(*) FROM wp_winds WHERE status = 'active'"
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
        $sql = "SELECT MIN(wind_datetime) as target_time, AVG(wind_speed) as avg_speed, AVG(wind_direction) as avg_direction, AVG(air_density) as avg_density, AVG(pressure) as avg_pressure, AVG(humidity) as avg_humidity, AVG(temperature) as avg_temp FROM wp_winds WHERE status = 'active' AND wind_datetime BETWEEN DATE_SUB(:latest, INTERVAL 24 HOUR) AND :latest_end GROUP BY (UNIX_TIMESTAMP(wind_datetime) DIV 300) ORDER BY target_time ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(['latest' => $latestTime, 'latest_end' => $latestTime]);
        $chartData = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $chartData[] = [
                'time' => date('H:i', strtotime($row['target_time'])),
                'speed' => round((float)$row['avg_speed'], 2),
                'direction' => round((float)$row['avg_direction'], 2),
                'density' => round((float)$row['avg_density'], 2),
                'pressure' => round((float)$row['avg_pressure'], 2),
                'humidity' => round((float)$row['avg_humidity'], 2),
                'temp' => round((float)$row['avg_temp'], 2)
            ];
        }
        return $chartData;
    }
    public function loginHistory() {
        $sql = "SELECT l.logs_id, CONCAT(m.first_name, ' ', m.last_name) AS member_name, l.login_at, l.logout_at, l.log_type, l.ip_address, l.login_device FROM wp_login_logs l LEFT JOIN wp_members m ON l.member_id = m.member_id ORDER BY l.login_at DESC LIMIT 20";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userAgent = new AgentHelper($this->db);
        foreach ($history as &$entry) {
            $entry['login_at'] = convertTimeZone($entry['login_at'], 'd/m/Y H:i:s');
            $entry['logout_at'] = $entry['logout_at'] ? convertTimeZone($entry['logout_at'], 'd/m/Y H:i:s') : null;
            $ua_info = $userAgent->parse_user_agent($entry['login_device']);
            $entry['device_os'] = $ua_info['os'];
            $entry['device_browser'] = $ua_info['browser'];
        }
        return $history;
    }
}