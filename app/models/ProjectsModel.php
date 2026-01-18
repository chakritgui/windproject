<?php
class ProjectsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_project p LEFT JOIN wp_contract c on c.contract_id = p.contract_id {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                p.project_id, 
                p.project_code, 
                p.project_name, 
                p.project_start, 
                p.project_end, 
                p.status,
                c.contract_name
            FROM wp_project p
            LEFT JOIN wp_contract c on c.contract_id = p.contract_id 
            {$where}
            ORDER BY p.project_id DESC
        ";
        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatDocumentRow($row);
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE p.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND p.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['contract'])) {
            $where .= " AND c.contract_id = :contract";
            $params[':contract'] = $filters['contract'];
        }
        if (!empty($search)) {
            $where .= " AND (c.contract_name LIKE :search or p.project_name LIKE :search)";
            $params[':search'] = "%{$search}%";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        foreach (['project_start', 'project_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y');
            }
        }
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '') {
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        switch($type) {
            case 'status':
                $staticData = [
                    ['id' => 'active', 'text' => 'Active'],
                    ['id' => 'inactive', 'text' => 'Inactive']
                ];
                if (!empty($searchTerm)) {
                    $staticData = array_values(array_filter($staticData, function($item) use ($searchTerm) {
                        return strpos(strtolower($item['text']), strtolower($searchTerm)) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
            case 'contract':
                $where = "";
                if ($searchTerm !== '') {
                    $where = "WHERE (contract_name LIKE :search or contract_no LIKE :search) ";
                    $params[':search'] = "%{$searchTerm}%";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_contract {$where}");
                $stmtCount->execute($params);
                $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
                $sql = "SELECT contract_id AS id, contract_name AS text FROM wp_contract {$where} ORDER BY contract_id DESC LIMIT :limit OFFSET :offset";
                $stmt = $this->db->prepare($sql);
                foreach ($params as $k => $v) {
                    $stmt->bindValue($k, $v);
                }
                $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
                $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
                $stmt->execute();
                $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
                break;
        }
        return [
            'items' => $items,
            'total_count' => $totalCount
        ];
    }
    public function delete($id) {
        $sql = "UPDATE wp_project SET status=?, updated_at=NOW() WHERE project_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['deleted', (int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return [
                'project_id' => '',
                'project_code' => '',
                'project_name' => '',
                'project_start' => '',
                'project_end' => '',
                'contract_id' => '',
                'contract_name' => '',
                'status' => 'active'
            ];
        } else {
            $sql = "SELECT 
                p.*, c.contract_id, c.contract_name
            FROM wp_project p
            LEFT JOIN wp_contract c on c.contract_id = p.contract_id
            WHERE p.project_id  = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                foreach (['project_start', 'project_end'] as $f) {
                    if (!empty($row[$f])) {
                        $row[$f] = convertTimeZone($row[$f], 'Y-m-d');
                    }
                }
            }
            return $row;
        }
    }
    public function save($data) {
        $project_id = $data['project_id'] ?? null;
        $contract_id = $data['contract_id'] ?? null;
        $project_code = $data['project_code'] ?? '';
        $project_name = $data['project_name'] ?? '';
        if ($this->isDuplicateProjectName($project_name, $contract_id, $project_id)) {
            return [
                'status'  => false,
                'message' => 'already_project'
            ];
        }
        $status = $data['status'] ?? '';
        $startObj = DateTime::createFromFormat('d/m/Y', trim($data['project_start']));
        $endObj   = DateTime::createFromFormat('d/m/Y', trim($data['project_end']));
        $project_start = ($startObj) ? $startObj->format('Y-m-d') : null;
        $project_end   = ($endObj) ? $endObj->format('Y-m-d') : null;
        $pdo = $this->db;
        if ($project_id) {
            $sql = "UPDATE wp_project SET contract_id = :contract_id, project_code = :project_code, project_name = :project_name, project_start = :project_start, project_end = :project_end, status = :status, updated_at = NOW() WHERE project_id = :project_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':project_id', (int)$project_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_project (
                contract_id,
                project_code,
                project_name,
                project_start,
                project_end,
                status,
                created_at,
                updated_at
            ) VALUES (
                :contract_id,
                :project_code,
                :project_name,
                :project_start,
                :project_end,
                :status,
                NOW(),
                NOW()
            )";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':contract_id', $contract_id);
        $stmt->bindValue(':project_code', $project_code);
        $stmt->bindValue(':project_name', $project_name);
        $stmt->bindValue(':project_start', $project_start);
        $stmt->bindValue(':project_end', $project_end);
        $stmt->bindValue(':status', $status);
        return $stmt->execute();
    }
    private function isDuplicateProjectName($project_name, $contract_id, $project_id = null) {
        $sql = "SELECT COUNT(*) FROM wp_project WHERE project_name = :project_name AND contract_id = :contract_id";
        if ($project_id) {
            $sql .= " AND project_id != :project_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':project_name', trim($project_name));
        $stmt->bindValue(':contract_id', (int)$contract_id, PDO::PARAM_INT);
        if ($project_id) {
            $stmt->bindValue(':project_id', (int)$project_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
}