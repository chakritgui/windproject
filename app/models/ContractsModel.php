<?php
class ContractsModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 0, $orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_contract {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "item_order",
            1 => "contract_no",
            2 => "contract_name",
            3 => "contract_name_display",
            4 => "contract_start",
            5 => "contract_end",
            6 => "created_at",
            7 => "status"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                contract_id, 
                contract_no,
                contract_name, 
                contract_name_display,
                contract_start, 
                contract_end, 
                status,
                created_at,
                item_order
            FROM wp_contract
            {$where}
            ORDER BY {$order} {$orderDir}
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
        $where  = " WHERE status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($search)) {
            $where .= " AND (contract_name LIKE :search or contract_no LIKE :search)";
            $params[':search'] = "%{$search}%";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        foreach (['contract_start', 'contract_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y');
            }
        }
        foreach (['created_at'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
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
                    ['id' => 'inactive', 'text' => 'Inactive'],
                    ['id' => 'expired', 'text' => 'Expired']
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
    public function delete($id) {
        $sql = "UPDATE wp_contract SET status=?, updated_at=NOW() WHERE contract_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['deleted', (int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return [
                'contract_id' => '',
                'contract_name' => '',
                'contract_name_display' => '',
                'contract_no' => '',
                'contract_start' => '',
                'contract_end' => '',
                'status' => 'active'
            ];
        } else {
            $sql = "SELECT * FROM wp_contract WHERE contract_id  = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                foreach (['contract_start', 'contract_end'] as $f) {
                    if (!empty($row[$f])) {
                        $row[$f] = convertTimeZone($row[$f], 'Y-m-d');
                    }
                }
            }
            return $row;
        }
    }
    public function save($data) {
        $contract_id = $data['contract_id'] ?? null;
        $contract_no = $data['contract_no'] ?? '';
        $contract_name = $data['contract_name'] ?? '';
        $contract_name_display = $data['contract_name_display'] ?? '';
        if ($this->isDuplicateContractName($contract_name, $contract_id)) {
            return [
                'status'  => false,
                'message' => 'already_contract'
            ];
        }
        $status = $data['status'] ?? '';
        $startObj = DateTime::createFromFormat('d/m/Y', trim($data['contract_start']));
        $endObj   = DateTime::createFromFormat('d/m/Y', trim($data['contract_end']));
        $contract_start = ($startObj) ? convertTimeZoneUTC($startObj->format('Y-m-d'), 'Y-m-d') : null;
        $contract_end   = ($endObj) ? convertTimeZoneUTC($endObj->format('Y-m-d'), 'Y-m-d') : null;
        $pdo = $this->db;
        if ($contract_id) {
            $sql = "UPDATE wp_contract SET contract_no = :contract_no, contract_name = :contract_name, contract_name_display = :contract_name_display, contract_start = :contract_start, contract_end = :contract_end, status = :status, updated_at = NOW() WHERE contract_id = :contract_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':contract_id', (int)$contract_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_contract (
                contract_no,
                contract_name,
                contract_name_display,
                contract_start,
                contract_end,
                status,
                created_at,
                updated_at
            ) VALUES (
                :contract_no,
                :contract_name,
                :contract_name_display,
                :contract_start,
                :contract_end,
                :status,
                NOW(),
                NOW()
            )";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':contract_no', $contract_no);
        $stmt->bindValue(':contract_name', $contract_name);
        $stmt->bindValue(':contract_name_display', $contract_name_display);
        $stmt->bindValue(':contract_start', $contract_start);
        $stmt->bindValue(':contract_end', $contract_end);
        $stmt->bindValue(':status', $status);
        return $stmt->execute();
    }
    private function isDuplicateContractName($contract_name, $contract_id = null){
        $sql = "SELECT COUNT(*) FROM wp_contract WHERE contract_name = :contract_name";
        if ($contract_id) {
            $sql .= " AND contract_id != :contract_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':contract_name', trim($contract_name));
        if ($contract_id) {
            $stmt->bindValue(':contract_id', (int)$contract_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
}