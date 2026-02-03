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
        public function updateLogin($member_id, $timezone, $session_id) {
            $stmt = $this->db->prepare('UPDATE wp_members SET last_login_at = NOW() WHERE member_id = ?');
            $stmt->execute([$member_id]);
            $stmt = $this->db->prepare("UPDATE wp_login_logs SET logout_at = NOW(), log_type = 'kick' WHERE member_id = ? AND logout_at IS NULL");
            $stmt->execute([$member_id]);
            $stmt = $this->db->prepare('INSERT INTO wp_login_logs (member_id, login_at, ip_address, login_device, timezone, session_id) VALUES (?, NOW(), ?, ?, ?, ?)');
            $ip_address = getClientIp();
            if ($ip_address === '::1') $ip_address = '127.0.0.1';
            $login_device = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            $stmt->execute([$member_id, $ip_address, $login_device, $timezone, $session_id]);
        }
        public function setRememberToken($member_id, $selector, $validator_hash, $expires_at) {
            $stmt = $this->db->prepare('UPDATE wp_members SET remember_selector = ?, remember_validator_hash = ?, remember_expires_at = ? WHERE member_id = ?');
            $stmt->execute([$selector, $validator_hash, $expires_at, $member_id]);
        }
        public function checkRememberMe() {
            $cookie = $_COOKIE['remember_me'] ?? null;
            if (!$cookie || !strpos($cookie, ':')) return false;
            list($selector, $validator) = explode(':', $cookie);
            $stmt = $this->db->prepare('SELECT * FROM wp_members WHERE remember_selector = ? AND remember_expires_at > NOW() AND status = "active"');
            $stmt->execute([$selector]);
            $user = $stmt->fetch();
            if ($user && hash_equals($user['remember_validator_hash'], hash('sha256', $validator))) {
                return $user;
            }
            return false;
        }
        public function updateLogout($member_id) {
            $stmt = $this->db->prepare("UPDATE wp_login_logs SET logout_at = NOW(), log_type = 'logout' WHERE member_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1");
            $stmt->execute([$member_id]);  
            $stmt = $this->db->prepare("UPDATE wp_members SET remember_selector = NULL, remember_validator_hash = NULL, remember_expires_at = NULL WHERE member_id = ?");
            $stmt->execute([$member_id]);
        } 
    }