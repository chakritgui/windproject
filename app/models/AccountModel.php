<?php
class AccountModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function get() {
        try {
            $pdo = $this->db;
            $sql = "SELECT first_name, last_name, phone, email, username, password_hash FROM wp_members WHERE member_id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$_SESSION['user']['id']]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $row['password'] = decryptToken($row['password_hash']);
                return [
                    'status' => true,
                    'data' => $row
                ];
            } else {
                return [
                    'status' => false,
                    'message' => 'User not found'
                ];
            }
        } catch (PDOException $e) {
            return [
                'status' => false,
                'message' => 'Database error'
            ];
        }
    }
    public function update($field, $value, $member_id) {
        $allowedFields = ['firstName', 'lastName', 'phone', 'email', 'username', 'password'];
        if (!in_array($field, $allowedFields)) {
            return ['status' => false, 'message' => 'Invalid field'];
        }
        $mapping = [
            'firstName' => 'first_name',
            'lastName'  => 'last_name',
            'phone'     => 'phone',
            'email'     => 'email',
            'username'  => 'username',
            'password'  => 'password_hash'
        ];
        $dbField = $mapping[$field];
        try {
            if (in_array($field, ['email', 'username'])) {
                $checkStmt = $this->db->prepare("SELECT COUNT(*) FROM wp_members WHERE $dbField = ? AND member_id != ?");
                $checkStmt->execute([$value, $member_id]);
                if ($checkStmt->fetchColumn() > 0) {
                    return [
                        'status' => false, 
                        'message' => ($field === 'email' ? 'email_exists' : 'username_exists')
                    ];
                }
            }
            if ($field === 'password') {
                $value = encryptToken($value);
            }
            $sql = "UPDATE wp_members SET $dbField = ? WHERE member_id = ?";
            $stmt = $this->db->prepare($sql);
            $result = $stmt->execute([$value, $member_id]);
            if ($result) {
                return ['status' => true, 'message' => 'Update successful'];
            } else {
                return ['status' => false, 'message' => 'No changes made'];
            }
        } catch (Exception $e) {
            return ['status' => false, 'message' => 'Database error occurred'];
        }
    }
    public function getLoginLogs($offset, $limit) {
        $member_id = $_SESSION['user']['id'];
        $sql = "SELECT * FROM wp_login_logs WHERE member_id = :member_id ORDER BY login_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':member_id', $member_id, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT); 
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userAgent = new AgentHelper($this->db);
        foreach ($rows as &$row) {
            $row['formatted_at'] = convertTimeZone($row['login_at'], 'd/m/Y H:i:s');
            $ua_info = $userAgent->parse_user_agent($row['login_device']);
            $row['device_os'] = $ua_info['os'];
            $row['device_browser'] = $ua_info['browser'];
            $row['duration'] = '-'; 
            if (!empty($row['logout_at'])) {
                $login_time = new DateTime($row['login_at']);
                $logout_time = new DateTime($row['logout_at']);
                $interval = $login_time->diff($logout_time);
                $hours = ($interval->days * 24) + $interval->h;
                $row['duration'] = sprintf(
                    '%02d:%02d:%02d',
                    $hours,
                    $interval->i,
                    $interval->s
                );
            }
        }
        return $rows;
    }
}