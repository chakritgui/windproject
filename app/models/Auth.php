<?php
    class Auth {
        private $db;
        public function __construct() {
            $this->db = Database::getInstance()->pdo;
        }
        public function findMember($username) {
            $stmt = $this->db->prepare('SELECT member_id, password_hash, role, status FROM wp_members WHERE email = ? or username = ? LIMIT 1');
            $stmt->execute([$username, $username]);
            return $stmt->fetch();
        }
        public function findByEmail($email) {
            $stmt = $this->db->prepare('SELECT member_id FROM wp_members WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            return $stmt->fetch();
        }
        public function updateLogin($member_id, $timezone) {
            $stmt = $this->db->prepare('UPDATE wp_members SET last_login_at = NOW() WHERE member_id = ?');
            $stmt->execute([$member_id]);
            $stmt = $this->db->prepare('INSERT INTO wp_login_logs (member_id, login_at, ip_address, login_device, timezone) VALUES (?, NOW(), ?, ?, ?)');
            $ip_address = getClientIp();
            if ($ip_address === '::1') {
                $ip_address = '127.0.0.1';
            }
            $login_device = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            $stmt->execute([$member_id, $ip_address, $login_device, $timezone]);
        }
        public function updateLogout($member_id) {
            $stmt = $this->db->prepare('UPDATE wp_login_logs SET logout_at = NOW() WHERE member_id = ? ORDER BY login_at DESC LIMIT 1');
            $stmt->execute([$member_id]);  
        }    
    }