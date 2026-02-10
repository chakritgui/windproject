<?php
    function ensure_login() {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }
        if (empty($_SESSION['user'])) {
            header('Location: /login');
            exit;
        }
        $member_id  = $_SESSION['user']['id'];
        $session_id = session_id();
        $db = Database::getInstance()->pdo;
        $stmt = $db->prepare("SELECT COUNT(*) FROM wp_login_logs WHERE member_id = ? AND session_id = ? AND logout_at IS NULL");
        $stmt->execute([$member_id, $session_id]);
        $isValid = $stmt->fetchColumn();
        if (!$isValid) {
            session_destroy();
            header('Location: login');
            exit;
        }
    }
    function is_admin() {
        return !empty($_SESSION['user']) && ($_SESSION['user']['role'] === 'admin' || $_SESSION['user']['role'] === 'administrator');
    }
    function getClientIp() {
        $keys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR'
        ];
        foreach ($keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ipList = explode(',', $_SERVER[$key]);
                return trim($ipList[0]);
            }
        }
        return 'UNKNOWN';
    }
    function encryptToken($token, $key = KEY) {
		$iv = openssl_random_pseudo_bytes(16);
		$cipher = 'AES-256-CBC';
		$encrypted = openssl_encrypt($token, $cipher, $key, 0, $iv);
		return base64_encode($iv . $encrypted);
	}
	function decryptToken($encrypted_token, $key = KEY) {
		$cipher = 'AES-256-CBC';
		$data = base64_decode($encrypted_token);
		$iv = substr($data, 0, 16);
		$encrypted = substr($data, 16);
		return openssl_decrypt($encrypted, $cipher, $key, 0, $iv);
	}
    function convertTimeZone($datetime_str, $format = 'Y/m/d H:i:s') {
        $userTz = $_SESSION['timezone'] ?? 'UTC';
        if(!$datetime_str) {
            return '';  
        }
        $dt = new DateTime($datetime_str, new DateTimeZone('UTC'));
        $dt->setTimezone(new DateTimeZone($userTz));
        return $dt->format($format);
    }
    function convertTimeZoneUTC($datetime_str, $format = 'Y-m-d H:i:s') {
        if (empty($datetime_str)) {
            return '';
        }
        $userTz = $_SESSION['timezone'] ?? 'UTC';
        try {
            $tz = new DateTimeZone($userTz);
        } catch (Exception $e) {
            $tz = new DateTimeZone('UTC');
        }
        try {
            if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $datetime_str)) {
                $dt = DateTime::createFromFormat('Y-m-d H:i:s', $datetime_str . ' 00:00:00', $tz);
            } else {
                $dt = new DateTime($datetime_str, $tz);
            }
            if (!$dt) {
                return '';
            }
            $dt->setTimezone(new DateTimeZone('UTC'));
            return $dt->format($format);
        } catch (Exception $e) {
            return '';
        }
    }
    function env($key, $default = null) {
        if (isset($_ENV[$key])) {
            return $_ENV[$key];
        }
        if (getenv($key) !== false) {
            return getenv($key);
        }
        return $default;
    }
