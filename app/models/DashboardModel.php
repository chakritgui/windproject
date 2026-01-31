<?php
class DashboardModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function getStats() {
        $stats = [];
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_members WHERE status = 'active'");
        $stmt->execute();
        $stats['total_members'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_contract WHERE status = 'active'");
        $stmt->execute();
        $stats['total_contracts'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_project WHERE status = 'active'");
        $stmt->execute();
        $stats['total_projects'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_type WHERE status = 'active'");
        $stmt->execute();
        $stats['total_types'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_installations WHERE status = 'active'");
        $stmt->execute();
        $stats['total_installations'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_poles WHERE status <> 'deleted'");
        $stmt->execute();
        $stats['total_poles'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_documents WHERE status = 'public'");
        $stmt->execute();
        $stats['total_documents'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_content WHERE status <> 'deleted' and type = 'news'");
        $stmt->execute();
        $stats['total_news'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_imports WHERE status = 'complete'");
        $stmt->execute();
        $stats['total_imports'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM wp_winds WHERE status = 'active'");
        $stmt->execute();
        $stats['total_winds'] = (int)$stmt->fetchColumn();
        $stmt = $this->db->prepare("SELECT max(import_start) as import_start FROM wp_imports WHERE status = 'complete'");
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $stats['import_start'] = convertTimeZone($row['import_start'], 'd/m/Y H:i:s');
        return $stats;
    }
    public function loginHistory() {
        $stmt = $this->db->prepare("SELECT l.logs_id,
            CONCAT(m.first_name, ' ', m.last_name) AS member_name,
            l.login_at,
            l.logout_at,
            l.log_type,
            l.ip_address,
            l.login_device FROM wp_login_logs l LEFT JOIN wp_members m ON l.member_id = m.member_id ORDER BY login_at DESC LIMIT 10");
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($history as &$entry) {
            $entry['login_time'] = convertTimeZone($entry['login_at'], 'd/m/Y H:i:s');
            $entry['logout_time'] = convertTimeZone($entry['logout_at'], 'd/m/Y H:i:s');
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
        return "$browser on $platform";
    }
}