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
        if ($member_id) {
            $sql = "UPDATE wp_members SET first_name = :first_name, last_name = :last_name, email = :email, phone = :phone, role = :role, status = :status, updated_at = NOW(), username = :username, password_hash = :password_hash WHERE member_id = :member_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':member_id', (int)$member_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_members (
                first_name,
                last_name,
                email,
                phone,
                role,
                status,
                created_at,
                updated_at, 
                username,
                password_hash
            ) VALUES (
                :first_name,
                :last_name,
                :email,
                :phone,
                :role,
                :status,
                NOW(),
                NOW(), 
                :username,
                :password_hash
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
        return $stmt->execute();
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
        switch($type) {
            case 'role':
                $staticData = [
                    ['id' => 'administrator', 'text' => 'Administrator'],
                    ['id' => 'admin', 'text' => 'Admin'],
                    ['id' => 'user', 'text' => 'User']
                ];
                if (!empty($searchTerm)) {
                    $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                        return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
            case 'status':
                $staticData = [
                    ['id' => 'active', 'text' => 'Active'],
                    ['id' => 'inactive', 'text' => 'Inactive'],
                    ['id' => 'banned', 'text' => 'Banned']
                ];
                if (!empty($searchTerm)) {
                    $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                        return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
        }
        return [
            'items' => $items,
            'total_count' => $totalCount
        ];
    }
}