<?php
class MenuModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function getMenu() {
        $userRole = $_SESSION['user']['role'] ?? 'guest';
        $targetGroups = 'guest';
        if (in_array($userRole, ['admin', 'administrator'])) {
            $targetGroups = 'admin';
        } elseif ($userRole === 'user') {
            $targetGroups = 'user';
        }
        $userPrivileges = $_SESSION['user']['privileges'] ?? '';
        $allowedMenuIds = [];
        if (!empty($userPrivileges)) {
            try {
                $privSql = "SELECT menu_id FROM wp_members_privileges_config WHERE privileges_id = ? AND status = 'active'";
                $privStmt = $this->db->prepare($privSql);
                $privStmt->execute([$userPrivileges]);
                $allowedMenuIds = $privStmt->fetchAll(PDO::FETCH_COLUMN, 0);
            } catch (Exception $e) {
                error_log($e->getMessage());
            }
        }
        try {
            $filterSql = "";
            $params = [$targetGroups];
            if (!empty($allowedMenuIds)) {
                $placeholders = implode(',', array_fill(0, count($allowedMenuIds), '?'));
                $filterSql = " AND m.id IN ($placeholders)";
                $params = array_merge($params, $allowedMenuIds);
            }
            $sql = "SELECT m.*, t.language_code, t.menu_name FROM wp_menus m LEFT JOIN wp_menu_translations t ON m.id = t.menu_id WHERE m.status = 'active' AND m.target_group = ? $filterSql ORDER BY m.target_group, m.sort_order ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $menus = [];
            foreach ($rows as $row) {
                $id = $row['id'];
                if (!isset($menus[$id])) {
                    $menus[$id] = [
                        'id'           => $row['id'],
                        'parent_id'    => $row['parent_id'],
                        'icon'         => $row['icon'],
                        'path'         => $row['path'],
                        'sort_order'   => $row['sort_order'],
                        'target_group' => $row['target_group'],
                        'is_active'    => $row['is_active'],
                        'is_default'   => $row['is_default'],
                        'translations' => []
                    ];
                }
                if (!empty($row['language_code'])) {
                    $menus[$id]['translations'][$row['language_code']] = $row['menu_name'];
                    $menus[$id][$row['language_code']] = $row['menu_name']; 
                }
            }
            return array_values($menus);
        } catch (Exception $e) {
            error_log($e->getMessage());
            return [];
        }
    }
}