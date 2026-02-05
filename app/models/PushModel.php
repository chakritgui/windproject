<?php
class PushModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function saveSubscription($subscription) {
        $endpoint  = $subscription['endpoint'] ?? '';
        $p256dh    = $subscription['keys']['p256dh'] ?? '';
        $auth      = $subscription['keys']['auth'] ?? '';
        $userId    = $_SESSION['user']['id'] ?? null;
        $userAgent = $_SERVER['HTTP_USER_AGENT'];
        $browser   = $this->getBrowserName($userAgent);
        $os        = $this->getOSName($userAgent);
        $sql = "INSERT INTO push_subscriptions 
                (user_id, endpoint, p256dh, auth, platform, browser, os, is_active) 
                VALUES (?, ?, ?, ?, 'pwa', ?, ?, 1)
                ON DUPLICATE KEY UPDATE 
                user_id = VALUES(user_id),
                p256dh = VALUES(p256dh),
                auth = VALUES(auth),
                browser = VALUES(browser),
                os = VALUES(os),
                is_active = 1,
                updated_at = NOW()";
        try {
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                $userId, 
                $endpoint, 
                $p256dh, 
                $auth, 
                $browser, 
                $os
            ]);
        } catch (Exception $e) {
            error_log("Save Subscription Error: " . $e->getMessage());
            return false;
        }
    }
    private function getBrowserName($user_agent) {
        if (strpos($user_agent, 'Opera') || strpos($user_agent, 'OPR')) return 'Opera';
        if (strpos($user_agent, 'Edge')) return 'Edge';
        if (strpos($user_agent, 'Chrome')) return 'Chrome';
        if (strpos($user_agent, 'Safari')) return 'Safari';
        if (strpos($user_agent, 'Firefox')) return 'Firefox';
        if (strpos($user_agent, 'MSIE') || strpos($user_agent, 'Trident/7')) return 'Internet Explorer';
        return 'Unknown';
    }
    private function getOSName($user_agent) {
        if (strpos($user_agent, 'Windows')) return 'Windows';
        if (strpos($user_agent, 'Android')) return 'Android';
        if (strpos($user_agent, 'iPhone') || strpos($user_agent, 'iPad')) return 'iOS';
        if (strpos($user_agent, 'Macintosh')) return 'macOS';
        if (strpos($user_agent, 'Linux')) return 'Linux';
        return 'Unknown';
    }
    public function disableSubscription($endpoint) {
        $sql = "UPDATE push_subscriptions SET is_active = 0, updated_at = NOW() WHERE endpoint = :endpoint";
        try {
            $stmt = $this->db->prepare($sql); 
            return $stmt->execute([':endpoint' => $endpoint]);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return false;
        }
    }
}