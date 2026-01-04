<?php
    function ensure_login() {
        if (empty($_SESSION['user'])) {
            header('Location: /login');
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
    function encryptToken($token, $key = key) {
		$iv = openssl_random_pseudo_bytes(16);
		$cipher = 'AES-256-CBC';
		$encrypted = openssl_encrypt($token, $cipher, $key, 0, $iv);
		return base64_encode($iv . $encrypted);
	}
	function decryptToken($encrypted_token, $key = key) {
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
        $userTz = $_SESSION['timezone'] ?? 'UTC';
        if (!$datetime_str) {
            return '';
        }
        $dt = new DateTime($datetime_str, new DateTimeZone($userTz));
        $dt->setTimezone(new DateTimeZone('UTC'));
        return $dt->format($format);
    }