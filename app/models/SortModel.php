<?php
class SortModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($type) {
        switch($type) {
            case 'contract':
                $sql = "SELECT 
                    contract_id as item_id,
                    contract_name as item_name
                    FROM wp_contract
                    WHERE status <> 'deleted' ORDER BY ifnull(item_order, contract_id) ASC";
                break;
            case 'project':
                $sql = "SELECT 
                    project_id as item_id,
                    project_name as item_name
                    FROM wp_project
                    WHERE status <> 'deleted' ORDER BY ifnull(item_order, project_id) ASC";
                break;
            case 'pole_types':
                $sql = "SELECT 
                    type_id as item_id,
                    type_name as item_name
                    FROM wp_type
                    WHERE status <> 'deleted' ORDER BY ifnull(item_order, type_id) ASC";
                break;
            case 'installation':
                $sql = "SELECT 
                    i.installations_id as item_id,
                    i.installations_name as item_name,
                    pj.project_name
                    FROM wp_installations i
                    LEFT JOIN wp_project pj ON pj.project_id = i.project_id
                    WHERE i.status <> 'deleted' ORDER BY ifnull(pj.item_order, pj.project_id) ASC,ifnull(i.item_order, i.installations_id) ASC";
                break;
            case 'level':
                $sql = "SELECT 
                    height_id as item_id,
                    height_name as item_name
                    FROM wp_height
                    WHERE status <> 'deleted' ORDER BY ifnull(item_order, height_id) ASC";
                break;
            case 'poles':
                $sql = "SELECT
                    p.poles_id,
                    p.poles_code,
                    pj.project_name,
                    t.type_name,
                    i.installations_name
                FROM wp_poles p
                LEFT JOIN wp_project pj ON pj.project_id = p.project_id
                LEFT JOIN wp_type t ON t.type_id = p.type_id
                LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
                WHERE p.status <> 'deleted' ORDER BY ifnull(pj.item_order, pj.project_id) ASC, ifnull(p.item_order, p.poles_id) ASC";
                break;
            case 'group':
                $sql = "SELECT 
                    project_group_id as item_id,
                    project_group_name as item_name
                    FROM wp_project_group
                    WHERE status <> 'deleted' ORDER BY ifnull(item_order, project_group_id) ASC";
                break;
            case 'project_status':
                $sql = "SELECT 
                    project_status_id as item_id,
                    project_status_name as item_name
                    FROM wp_project_status
                    WHERE status <> 'deleted' ORDER BY ifnull(item_order, project_status_id) ASC";
                break;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }
    public function saveOrder($type, $orderIds) {
        $tables = [
            'contract'     => ['table' => 'wp_contract', 'pk' => 'contract_id'],
            'project'      => ['table' => 'wp_project', 'pk' => 'project_id'],
            'pole_types'   => ['table' => 'wp_type', 'pk' => 'type_id'],
            'installation' => ['table' => 'wp_installations', 'pk' => 'installations_id'],
            'level'        => ['table' => 'wp_height', 'pk' => 'height_id'],
            'poles'        => ['table' => 'wp_poles', 'pk' => 'poles_id'],
            'group' => ['table' => 'wp_project_group', 'pk' => 'project_group_id'],
            'project_status' => ['table' => 'wp_project_status', 'pk' => 'project_status_id'],
        ];
        if (!isset($tables[$type])) return false;
        $table = $tables[$type]['table'];
        $pk = $tables[$type]['pk'];
        try {
            $this->db->beginTransaction();  
            foreach ($orderIds as $index => $id) {
                $sql = "UPDATE $table SET item_order = ? WHERE $pk = ?";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$index + 1, $id]);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
}