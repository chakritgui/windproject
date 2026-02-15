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
            $where .= " AND role = :role ";
            $params[':role'] = $filters['role'];
        }
        if(!empty($search)) {
            $where .= " AND (username LIKE :search OR first_name LIKE :search OR last_name LIKE :search OR email LIKE :search OR phone LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_members " . $where . "and status != 'deleted'";
        $stmtTotal = $pdo->prepare($sqlTotal);
        $stmtTotal->execute($params);
        $total = $stmtTotal->fetchColumn();
        $order = 'created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            1 => "COALESCE(first_name, last_name)",
            2 => "email",
            3 => "phone",
            4 => "role",
            5 => "created_at",
            6 => "last_login_at",
            7 => "status"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT 
            member_id,
            username,
            first_name,
            last_name,
            email,
            phone,
            role,
            status,
            last_login_at,
            created_at,
            password_hash
        FROM wp_members
        $where and status != 'deleted'
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
            $where .= " AND DATE(l.login_at) = :login_date ";
            $params[':login_date'] = $filters['date'];
        }
        if (!empty($filters['log_type'])) {
            $where .= " AND l.log_type = :log_type ";
            $params[':log_type'] = $filters['log_type'];
        }
        if (!empty($filters['device'])) {
            $where .= " AND l.login_device LIKE :device ";
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
            4 => "l.ip_address",
            5 => "l.login_device",
            6 => "l.login_device",
            7 => "l.timezone",
            8 => "l.log_type"
        ];
        $order = $orderMap[$colIndex] ?? 'l.login_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $sql = "SELECT l.*, m.first_name, m.last_name, m.role FROM wp_login_logs l LEFT JOIN wp_members m ON l.member_id = m.member_id $where ORDER BY {$order} {$orderDir}";
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
            $r['login_at_formatted'] = !empty($r['login_at']) ? convertTimeZone($r['login_at'], 'd/m/Y H:i:s') : '-';
            $r['logout_at_formatted'] = !empty($r['logout_at']) ? convertTimeZone($r['logout_at'], 'd/m/Y H:i:s') : '-';
            $ua_info = $this->parse_user_agent($r['login_device']);
            $r['device_os'] = $ua_info['os'];
            $r['device_browser'] = $ua_info['browser'];
        }
        return ["total" => (int)$total, "data" => $rows];
    }
    private function parse_user_agent($ua) {
        $browser = "Unknown Browser";
        $platform = "Unknown OS";
        if (preg_match('/windows|win32/i', $ua)) $platform = 'Windows';
        else if (preg_match('/macintosh|mac os x/i', $ua)) $platform = 'Mac OS';
        else if (preg_match('/android/i', $ua)) $platform = 'Android';
        else if (preg_match('/iphone|ipad|ipod/i', $ua)) $platform = 'iOS';
        else if (preg_match('/linux/i', $ua)) $platform = 'Linux';
        if (preg_match('/chrome/i', $ua) && !preg_match('/edg/i', $ua)) $browser = 'Chrome';
        else if (preg_match('/firefox/i', $ua)) $browser = 'Firefox';
        else if (preg_match('/safari/i', $ua) && !preg_match('/chrome/i', $ua)) $browser = 'Safari';
        else if (preg_match('/msie|trident/i', $ua)) $browser = 'IE';
        else if (preg_match('/edg/i', $ua)) $browser = 'Edge';
        return ['os' => $platform, 'browser' => $browser];
    }
    public function get($id) {
        if($id) {
            $pdo = $this->db;
            $sql = "SELECT 
                member_id,
                username,
                first_name,
                last_name,
                email,
                phone,
                role,
                status,
                username,
                password_hash
            FROM wp_members
            WHERE member_id = :id
            LIMIT 1";
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
                'username' => ''
            ];
        }
    }
    public function delete($id) {
        if($id) {
            $pdo = $this->db;
            $sql = "UPDATE wp_members set status = 'deleted', updated_at = NOW() WHERE member_id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':id', (int)$id, PDO::PARAM_INT);
            return $stmt->execute();
        }
        return false;
    }
    public function save($data) {
        $member_id = $data['member_id'] ?? null;
        $first_name = $data['first_name'] ?? '';
        $last_name = $data['last_name'] ?? '';
        $email = $data['email'] ?? '';
        $phone = $data['phone'] ?? '';
        $role = $data['role'] ?? '';
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
                            password_hash = :password_hash 
                        WHERE member_id = :member_id";
                $stmt = $pdo->prepare($sql);
                $stmt->bindValue(':member_id', (int)$member_id, PDO::PARAM_INT);
            } else {
                $sql = "INSERT INTO wp_members (
                            first_name, last_name, email, phone, role, status, 
                            created_at, updated_at, username, password_hash
                        ) VALUES (
                            :first_name, :last_name, :email, :phone, :role, :status, 
                            NOW(), NOW(), :username, :password_hash
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
                    ['id' => 'iOS', 'text' => 'iOS'],
                    ['id' => 'Mac OS', 'text' => 'Mac OS'],
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
                $sql = "SELECT member_id as id, CONCAT(first_name, ' ', last_name) as text 
                        FROM wp_members" . $where . " LIMIT :offset, :limit";
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
                $sql = "SELECT DISTINCT timezone as id, timezone as text 
                        FROM wp_login_logs " . $where . " 
                        ORDER BY timezone ASC LIMIT :offset, :limit";
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
}