<?php
class MemberModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 5, $orderDir = 'desc') {
        $pdo = $this->db;
        $where = " WHERE 1=1 ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND status = :status ";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['role'])) {
            $where .= " AND m.role = :role ";
            $params[':role'] = $filters['role'];
        }
        if (!empty($filters['privileges'])) {
            $where .= " AND m.privileges_id = :privileges ";
            $params[':privileges'] = $filters['privileges'];
        }
        if(!empty($search)) {
            $where .= " AND (m.username LIKE :search OR m.first_name LIKE :search OR m.last_name LIKE :search OR m.email LIKE :search OR m.phone LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_members m " . $where . "and m.status != 'deleted'";
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = $stmtTotal->fetchColumn();
        $order = 'm.created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            1 => "COALESCE(m.first_name, m.last_name)",
            2 => "m.email",
            3 => "m.phone",
            4 => "m.role",
            5 => "m.privileges_id",
            6 => "m.created_at",
            7 => "m.last_login_at",
            8 => "m.status"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT 
            m.member_id,
            m.username,
            m.first_name,
            m.last_name,
            m.email,
            m.phone,
            m.role,
            m.status,
            m.last_login_at,
            m.created_at,
            m.password_hash,
            p.privileges_name
        FROM wp_members m
        LEFT JOIN wp_members_privileges p on p.privileges_id = m.privileges_id
        $where and m.status != 'deleted'
        ORDER BY {$order} {$orderDir}";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            foreach (['created_at','last_login_at'] as $field) {
                if (!empty($r[$field])) {
                    $r[$field] = convertTimeZone($r[$field], 'd/m/Y H:i:s');
                }
            }
        }
        return [
            "total" => (int)$total,
            "data"  => $rows
        ];
    }
    public function history($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 2, $orderDir = 'desc') {
        $pdo = $this->db;
        $where = " WHERE 1=1 ";
        $params = [];
        if (!empty($filters['role'])) {
            $where .= " AND m.role = :role ";
            $params[':role'] = $filters['role'];
        }
        if (!empty($filters['member'])) {
            $where .= " AND l.member_id = :member_id ";
            $params[':member_id'] = $filters['member'];
        }
        if (!empty($filters['date'])) {
            $dateParts = explode(' - ', $filters['date']);
            if (count($dateParts) == 2) {
                $userTzStr = $_SESSION['timezone'] ?? 'Asia/Bangkok';
                try {
                    $userTz = new DateTimeZone($userTzStr);
                    $utcTz  = new DateTimeZone('UTC');
                    $startObj = DateTime::createFromFormat('d/m/Y H:i:s', trim($dateParts[0]) . ' 00:00:00', $userTz);
                    $endObj   = DateTime::createFromFormat('d/m/Y H:i:s', trim($dateParts[1]) . ' 23:59:59', $userTz);
                    if ($startObj && $endObj) {
                        $startObj->setTimezone($utcTz);
                        $endObj->setTimezone($utcTz);
                        $where .= " AND l.login_at BETWEEN :start_utc AND :end_utc";
                        $params[':start_utc'] = $startObj->format('Y-m-d H:i:s');
                        $params[':end_utc']   = $endObj->format('Y-m-d H:i:s');
                    }
                } catch (Exception $e) {
                }
            }
        }
        if (!empty($filters['log_type'])) {
            $where .= " AND l.log_type = :log_type ";
            $params[':log_type'] = $filters['log_type'];
        }
        if (!empty($filters['device'])) {
            if ($filters['device'] === 'Mac OS') {
                $where .= " AND l.login_device LIKE :device AND l.login_device NOT LIKE '%iPhone%' AND l.login_device NOT LIKE '%iPad%' ";
            } else {
                $where .= " AND l.login_device LIKE :device ";
            }
            $params[':device'] = '%' . $filters['device'] . '%';
        }
        if (!empty($filters['browser'])) {
            $where .= " AND l.login_device LIKE :browser ";
            $params[':browser'] = '%' . $filters['browser'] . '%';
        }
        if (!empty($filters['timezone'])) {
            $where .= " AND l.timezone = :timezone ";
            $params[':timezone'] = $filters['timezone'];
        }
        if(!empty($search)) {
            $where .= " AND (m.first_name LIKE :search OR m.last_name LIKE :search OR l.ip_address LIKE :search OR l.login_device LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_login_logs l LEFT JOIN wp_members m ON l.member_id = m.member_id " . $where;
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = $stmtTotal->fetchColumn();
        $orderMap = [
            0 => "m.first_name",
            1 => "m.role",
            2 => "l.login_at",
            3 => "l.logout_at",
            5 => "l.ip_address",
            6 => "l.login_device",
            7 => "l.login_device",
            8 => "l.timezone",
            9 => "l.login_location",
            10 => "l.log_type"
        ];
        $order = $orderMap[$colIndex] ?? 'l.login_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $sql = "SELECT l.*, m.first_name, m.last_name, m.role 
                FROM wp_login_logs l 
                LEFT JOIN wp_members m ON l.member_id = m.member_id 
                $where 
                ORDER BY {$order} {$orderDir}";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userAgent = new AgentHelper($pdo);
        foreach ($rows as &$r) {
            $usage = '-';
            if (!empty($r['login_at']) && !empty($r['logout_at'])) {
                try {
                    $startTime = new DateTime($r['login_at']);
                    $endTime   = new DateTime($r['logout_at']);
                    $interval = $startTime->diff($endTime);
                    $totalHours = ($interval->days * 24) + $interval->h;
                    $usage = sprintf('%02d:%02d:%02d', $totalHours, $interval->i, $interval->s);
                } catch (Exception $e) {
                    $usage = '-';
                }
            }
            $r['usage'] = $usage;
            $r['login_at'] = !empty($r['login_at']) ? convertTimeZone($r['login_at'], 'd/m/Y H:i:s') : '-';
            $r['logout_at'] = !empty($r['logout_at']) ? convertTimeZone($r['logout_at'], 'd/m/Y H:i:s') : '-';
            $ua_info = $userAgent->parse_user_agent($r['login_device']);
            $r['device_os'] = $ua_info['os'];
            $r['device_browser'] = $ua_info['browser'];
        }
        return ["total" => (int)$total, "data" => $rows];
    }
    public function listPrivileges($start = 0, $length = 10, $search = '', $colIndex = 2, $orderDir = 'desc') {
        $pdo = $this->db;
        $where = " WHERE 1=1 ";
        $params = [];
        if(!empty($search)) {
            $where .= " AND privileges_name LIKE :search ";
            $params[':search'] = '%' . $search . '%';
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_members_privileges WHERE status <> 'deleted'";
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = $stmtTotal->fetchColumn();
        $orderMap = [
            0 => "privileges_name",
            1 => "status",
            2 => "created_at",
        ];
        $order = $orderMap[$colIndex] ?? 'created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $sql = "SELECT * FROM wp_members_privileges WHERE status <> 'deleted' ORDER BY {$order} {$orderDir}";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userAgent = new AgentHelper($pdo);
        foreach ($rows as &$r) {
            $r['created_at'] = !empty($r['created_at']) ? convertTimeZone($r['created_at'], 'd/m/Y H:i:s') : '-';
        }
        return ["total" => (int)$total, "data" => $rows];
    }
    public function request($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 6, $orderDir = 'desc') {
        $pdo = $this->db;
        $where = " WHERE 1=1 ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND r.status = :status ";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['member'])) {
            $where .= " AND m.member_id = :member ";
            $params[':member'] = $filters['member'];
        }
        if (!empty($filters['role'])) {
            $where .= " AND m.role = :role ";
            $params[':role'] = $filters['role'];
        }
        if(!empty($search)) {
            $where .= " AND (m.first_name LIKE :search OR m.last_name LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        if (!empty($filters['date'])) {
            $dateParts = explode(' - ', $filters['date']);
            if (count($dateParts) == 2) {
                $userTzStr = $_SESSION['timezone'] ?? 'Asia/Bangkok';
                try {
                    $userTz = new DateTimeZone($userTzStr);
                    $utcTz  = new DateTimeZone('UTC');
                    $startObj = DateTime::createFromFormat('d/m/Y H:i:s', trim($dateParts[0]) . ' 00:00:00', $userTz);
                    $endObj   = DateTime::createFromFormat('d/m/Y H:i:s', trim($dateParts[1]) . ' 23:59:59', $userTz);
                    if ($startObj && $endObj) {
                        $startObj->setTimezone($utcTz);
                        $endObj->setTimezone($utcTz);
                        $where .= " AND r.created_at BETWEEN :start_utc AND :end_utc";
                        $params[':start_utc'] = $startObj->format('Y-m-d H:i:s');
                        $params[':end_utc']   = $endObj->format('Y-m-d H:i:s');
                    }
                } catch (Exception $e) {
                }
            }
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_password_reset_requests r LEFT JOIN wp_members m ON r.user_email = m.email or r.user_email = m.username " . $where;
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = $stmtTotal->fetchColumn();
        $orderMap = [
            0 => "m.first_name",
            1 => "m.role",
            2 => "m.email",
            3 => "m.username",
            4 => "m.status",
            5 => "r.user_note",
            6 => "r.created_at",
            7 => "r.status",
            8 => "r.admin_remark"
        ];
        $order = $orderMap[$colIndex] ?? 'r.created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $sql = "SELECT r.*, m.first_name, m.last_name, m.role, m.status as member_status, m.email, m.username, m.member_id FROM wp_password_reset_requests r LEFT JOIN wp_members m ON r.user_email = m.email or r.user_email = m.username $where ORDER BY {$order} {$orderDir}";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$r) {
            $r['created_at'] = !empty($r['created_at']) ? convertTimeZone($r['created_at'], 'd/m/Y H:i:s') : '-';
            $r['processed_at'] = !empty($r['processed_at']) ? convertTimeZone($r['processed_at'], 'd/m/Y H:i:s') : '-';
        }
        return ["total" => (int)$total, "data" => $rows];
    }
    public function get($id) {
        if($id) {
            $pdo = $this->db;
            $sql = "SELECT m.member_id,m.username,m.first_name,m.last_name,m.email,m.phone,m.role,m.status,m.username,m.password_hash,p.privileges_id,p.privileges_name FROM wp_members m LEFT JOIN wp_members_privileges p on p.privileges_id = m.privileges_id WHERE member_id = :id LIMIT 1";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if($row) {
                $row['password_hash'] = decryptToken($row['password_hash']);
                return $row;
            }
        } else {
            return [
                'email' => '',
                'first_name' => '',
                'last_name' => '',
                'member_id' => '',
                'password_hash' => '',
                'phone' => '',
                'role' => 'user',
                'status' => 'active',
                'username' => '',
                'privileges_id' => '',
                'privileges_name' => '',
            ];
        }
    }
    public function delete($id) {
        $sqlSelect = "SELECT username FROM wp_members WHERE member_id = ?";
        $stmtSelect = $this->db->prepare($sqlSelect);
        $stmtSelect->execute([(int)$id]);
        $user = $stmtSelect->fetch();
        if ($user) {
            $newUsername = "deleted_" . time() . "_" . uniqid() . "_" . $user['username'];
            $newUsername = substr($newUsername, 0, 60);
            $sql = "UPDATE wp_members SET status = 'deleted', username = ?, updated_at = NOW() WHERE member_id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$newUsername, (int)$id]);
        }
        return false;
    }
    public function deletePrivileges($id) {
        if($id) {
            $pdo = $this->db;
            $sql = "UPDATE wp_members_privileges set status = 'deleted', updated_at = NOW() WHERE privileges_id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            return $stmt->execute();
        }
        return false;
    }
    public function getPrivileges($id) {
        if (!$id) {
            return ['privileges_id' => '', 'privileges_name' => '', 'status' => 'active'];
        }
        $sql = "SELECT * FROM wp_members_privileges WHERE privileges_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function savePrivileges($data) {
        $id = $data['privileges_id'] ?? null;
        $name = trim($data['privileges_name'] ?? '');
        $status = $data['status'] ?? 'active';
        if ($this->isDuplicateName($name, $id)) {
            return ['status' => false, 'message' => 'already_exists'];
        }
        if ($id) {
            $sql = "UPDATE wp_members_privileges SET privileges_name = :name, status = :status, updated_at = NOW() WHERE privileges_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_members_privileges (privileges_name, status, created_at, updated_at) 
                    VALUES (:name, :status, NOW(), NOW())";
            $stmt = $this->db->prepare($sql);
        }
        $stmt->bindValue(':name', $name);
        $stmt->bindValue(':status', $status);
        return $stmt->execute();
    }
    private function isDuplicateName($name, $id = null) {
        $sql = "SELECT COUNT(*) FROM wp_members_privileges WHERE privileges_name = :name AND status <> 'deleted'";
        if ($id) {
            $sql .= " AND privileges_id <> :id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':name', $name);
        if ($id) {
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return (int)$stmt->fetchColumn() > 0;
    }
    public function reject($id, $note) {
        if($id) {
            $pdo = $this->db;
            $sql = "UPDATE wp_password_reset_requests set status = 'rejected', processed_at = NOW(), admin_remark = :note WHERE request_id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $stmt->bindValue(':note', $note);
            return $stmt->execute();
        }
        return false;
    }
    public function approved($id, $member_id, $password, $send_notification) {
        if(!$id) return false;
        try {
            $this->db->beginTransaction();
            $hashedPassword = encryptToken($password);
            $updateUser = $this->db->prepare("UPDATE wp_members SET password_hash = ? WHERE member_id = ?");
            $updateUser->execute([$hashedPassword, $member_id]);
            $sql = "UPDATE wp_password_reset_requests SET status = 'approved', processed_at = NOW() WHERE request_id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            $stmt->execute();
            if($send_notification === 'yes') {
                $stmtUser = $this->db->prepare("SELECT email,username FROM wp_members WHERE member_id = :id LIMIT 1");
                $stmtUser->execute([':id' => (int)$member_id]);
                $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);
                if ($userData) {
                    $userLanguage = 'en';
                    $stmtLang = $this->db->prepare("SELECT language FROM wp_members_language WHERE member_id = :member_id LIMIT 1");
                    $stmtLang->execute([':member_id' => $member_id]);
                    $langDataRow = $stmtLang->fetch(PDO::FETCH_ASSOC);
                    if ($langDataRow) {
                        $userLanguage = $langDataRow['language'];
                    }
                    $mailHelper = new MailHelper($this->db);
                    $mailHelper->sendApproved($userData['email'], $userLanguage, $password, $userData['username']);
                }
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function save($data) {
        $member_id = $data['member_id'] ?? null;
        $first_name = $data['first_name'] ?? '';
        $last_name = $data['last_name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        $role = $data['role'] ?? '';
        $privileges = $data['privileges'] ?? '';
        $status = $data['status'] ?? 'inactive';
        $username  = $data['username'] ?? '';
        $password  = $data['password'] ?? '';
        $password_hash = '';
        if($password) {
            $password_hash = encryptToken($password);
        }
        $pdo = $this->db;
        try {
            if ($member_id) {
                $sql = "UPDATE wp_members SET 
                            first_name = :first_name, 
                            last_name = :last_name, 
                            email = :email, 
                            phone = :phone, 
                            role = :role, 
                            status = :status, 
                            updated_at = NOW(), 
                            username = :username, 
                            password_hash = :password_hash, 
                            privileges_id = :privileges,
                            login_attempts = 0,
                            lock_until = null
                        WHERE member_id = :member_id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':member_id', (int)$member_id, PDO::PARAM_INT);
            } else {
                $sql = "INSERT INTO wp_members (
                            first_name, last_name, email, phone, role, status, 
                            created_at, updated_at, username, password_hash, privileges_id, login_attempts, lock_until
                        ) VALUES (
                            :first_name, :last_name, :email, :phone, :role, :status, 
                            NOW(), NOW(), :username, :password_hash, :privileges, 0, null
                        )";
                $stmt = $pdo->prepare($sql);
            }
            $stmt->bindValue(':first_name', $first_name);
            $stmt->bindValue(':last_name', $last_name);
            $stmt->bindValue(':email', $email);
            $stmt->bindValue(':phone', $phone);
            $stmt->bindValue(':role', $role);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':username', $username);
            $stmt->bindValue(':password_hash', $password_hash);
            $stmt->bindValue(':privileges', $privileges);
            if ($stmt->execute()) {
                return [
                    'status' => true,
                    'member_id' => $member_id ?: $pdo->lastInsertId()
                ];
            } else {
                return [
                    'status' => false,
                    'message' => 'Failed to execute query.'
                ];
            }
        } catch (PDOException $e) {
            return [
                'status' => false,
                'message' => $e->getMessage()
            ];
        }
    }
    public function checkEmailExists($email, $exclude_member_id = null) {
        $pdo = $this->db;
        if($exclude_member_id) {
            $sql = "SELECT COUNT(*) FROM wp_members WHERE email = :email AND member_id != :member_id and status != 'deleted'";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':member_id', (int)$exclude_member_id, PDO::PARAM_INT);
        } else {
            $sql = "SELECT COUNT(*) FROM wp_members WHERE email = :email and status != 'deleted'";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':email', $email);
        $stmt->execute();
        $count = $stmt->fetchColumn();
        return $count > 0;
    }
    public function checkUsernameExists($username, $exclude_member_id = null) {
        $pdo = $this->db;
        if($exclude_member_id) {
            $sql = "SELECT COUNT(*) FROM wp_members WHERE username = :username AND member_id != :member_id and status != 'deleted'";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':member_id', (int)$exclude_member_id, PDO::PARAM_INT);
        } else {
            $sql = "SELECT COUNT(*) FROM wp_members WHERE username = :username and status != 'deleted'";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':username', $username);
        $stmt->execute();
        $count = $stmt->fetchColumn();
        return $count > 0;
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        $pdo = $this->db;
        switch($type) {
            case 'role':
                $staticData = [
                    ['id' => 'administrator', 'text' => 'Administrator'],
                    ['id' => 'admin', 'text' => 'Admin'],
                    ['id' => 'user', 'text' => 'User']
                ];
                $this->filterStatic($staticData, $searchTerm, $offset, $limit, $items, $totalCount);
                break;
            case 'status':
                $staticData = [
                    ['id' => 'active', 'text' => 'Active'],
                    ['id' => 'inactive', 'text' => 'Inactive']
                ];
                $this->filterStatic($staticData, $searchTerm, $offset, $limit, $items, $totalCount);
                break;
            case 'log_type':
                $staticData = [
                    ['id' => 'normal', 'text' => 'Normal Login'],
                    ['id' => 'kick', 'text' => 'Kicked / Force Logout']
                ];
                $this->filterStatic($staticData, $searchTerm, $offset, $limit, $items, $totalCount);
                break;
            case 'device':
                $staticData = [
                    ['id' => 'Windows', 'text' => 'Windows'],
                    ['id' => 'Android', 'text' => 'Android'],
                    ['id' => 'iPhone', 'text' => 'iPhone (iOS)'],
                    ['id' => 'iPad', 'text' => 'iPad (iOS)'],
                    ['id' => 'Mac OS', 'text' => 'Mac OS (Macintosh)'],
                    ['id' => 'Linux', 'text' => 'Linux']
                ];
                $this->filterStatic($staticData, $searchTerm, $offset, $limit, $items, $totalCount);
                break;
            case 'member':
                $where = " WHERE status != 'deleted' ";
                $params = [];
                if (!empty($searchTerm)) {
                    $where .= " AND (first_name LIKE :search OR last_name LIKE :search OR username LIKE :search) ";
                    $params[':search'] = '%' . $searchTerm . '%';
                }
                $sqlTotal = "SELECT COUNT(*) FROM wp_members" . $where;
                $stmtTotal = $pdo->prepare($sqlTotal);
                $stmtTotal->execute($params);
                $totalCount = $stmtTotal->fetchColumn();
                $sql = "SELECT member_id as id, CONCAT(first_name, ' ', last_name) as text FROM wp_members" . $where . " LIMIT :offset, :limit";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                foreach ($params as $key => $val) $stmt->bindValue($key, $val);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
            case 'privileges':
                $where = " WHERE status != 'deleted' ";
                $params = [];
                if (!empty($searchTerm)) {
                    $where .= " AND privileges_name LIKE :search ";
                    $params[':search'] = '%' . $searchTerm . '%';
                }
                $sqlTotal = "SELECT COUNT(*) FROM wp_members_privileges" . $where;
                $stmtTotal = $pdo->prepare($sqlTotal);
                $stmtTotal->execute($params);
                $totalCount = $stmtTotal->fetchColumn();
                $sql = "SELECT privileges_id as id, privileges_name as text FROM wp_members_privileges" . $where . " LIMIT :offset, :limit";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                foreach ($params as $key => $val) $stmt->bindValue($key, $val);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
            case 'browser': 
                $staticData = [
                    ['id' => 'Chrome', 'text' => 'Google Chrome'],
                    ['id' => 'Firefox', 'text' => 'Mozilla Firefox'],
                    ['id' => 'Safari', 'text' => 'Safari'],
                    ['id' => 'Edge', 'text' => 'Microsoft Edge'],
                    ['id' => 'Opera', 'text' => 'Opera']
                ];
                $this->filterStatic($staticData, $searchTerm, $offset, $limit, $items, $totalCount);
                break;
            case 'timezone':
                $where = " WHERE 1=1 ";
                $params = [];
                if (!empty($searchTerm)) {
                    $where .= " AND timezone LIKE :search ";
                    $params[':search'] = '%' . $searchTerm . '%';
                }
                $sqlTotal = "SELECT COUNT(DISTINCT timezone) FROM wp_login_logs" . $where;
                $stmtTotal = $pdo->prepare($sqlTotal);
                $stmtTotal->execute($params);
                $totalCount = $stmtTotal->fetchColumn();
                $sql = "SELECT DISTINCT timezone as id, timezone as text FROM wp_login_logs " . $where . " ORDER BY timezone ASC LIMIT :offset, :limit";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                foreach ($params as $key => $val) $stmt->bindValue($key, $val);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
        }
        return [
            'items' => $items,
            'total_count' => $totalCount
        ];
    }
    private function filterStatic($staticData, $searchTerm, $offset, $limit, &$items, &$totalCount) {
        if (!empty($searchTerm)) {
            $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
            }));
        }
        $totalCount = count($staticData);
        $items = array_slice($staticData, $offset, $limit);
    }
    public function permission() {
        try {
            $sql = "SELECT field_key, is_allowed FROM wp_edit_permissions";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_OBJ);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return [];
        }
    }
    public function menuPrivileges($privileges_id) {
        try {
            $sql = "SELECT menu_id FROM wp_members_privileges_config WHERE privileges_id = :priv_id and status = 'active'";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['priv_id' => $privileges_id]);   
            return $stmt->fetchAll(PDO::FETCH_OBJ);
        } catch (PDOException $e) {
            error_log($e->getMessage());
            return [];
        }
    }
    public function saveAllPermissions($permissions) {
        try {
            $this->db->beginTransaction();
            $sql = "INSERT INTO wp_edit_permissions (field_key, is_allowed) 
                    VALUES (:field_key, :is_allowed)
                    ON DUPLICATE KEY UPDATE 
                    is_allowed = VALUES(is_allowed), 
                    updated_at = NOW()";
            $stmt = $this->db->prepare($sql);
            foreach ($permissions as $item) {
                $stmt->execute([
                    ':field_key'  => $item['field_key'],
                    ':is_allowed' => $item['is_allowed']
                ]);
            }
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Database Error: " . $e->getMessage());
            return false;
        }
    }
    public function configPrivileges($privileges_id, $menu_ids) {
        try {
            $this->db->beginTransaction();
            $sql_clear = "UPDATE wp_members_privileges_config SET status = 'inactive', updated_at = NOW() WHERE privileges_id = :priv_id";
            $stmt_clear = $this->db->prepare($sql_clear);
            $stmt_clear->execute([':priv_id' => $privileges_id]);
            $sql = "INSERT INTO wp_members_privileges_config (privileges_id, menu_id, status, created_at, updated_at) 
                    VALUES (:priv_id, :menu_id, 'active', NOW(), NOW())
                    ON DUPLICATE KEY UPDATE 
                    status = 'active', 
                    updated_at = NOW()";
            $stmt = $this->db->prepare($sql);
            foreach ($menu_ids as $m_id) {
                $stmt->execute([
                    ':priv_id' => $privileges_id,
                    ':menu_id' => intval($m_id)
                ]);
            }
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Privilege Config Error: " . $e->getMessage());
            return false;
        }
    }
}