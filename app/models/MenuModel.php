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
        try {
            $sql = "SELECT m.*, t.language_code, t.menu_name 
                    FROM wp_menus m
                    LEFT JOIN wp_menu_translations t ON m.id = t.menu_id
                    WHERE m.status = 'active' 
                    AND m.target_group = ?
                    ORDER BY m.target_group, m.sort_order ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$targetGroups]);
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
                }
            }
            return array_values($menus);
        } catch (Exception $e) {
            return [];
        }
    }
}