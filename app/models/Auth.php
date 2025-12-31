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
    }