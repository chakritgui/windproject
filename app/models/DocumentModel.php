<?php
class DocumentModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 4, $orderDir = 'desc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents d {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'd.created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "d.document_name",
            1 => "d.document_start, d.document_end",
            2 => "d.document_size",
            3 => "d.document_type",
            4 => "d.created_at",
            5 => "d.status",
            6 => "d.document_download"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                d.document_id, 
                d.document_name, 
                d.document_type, 
                d.document_size, 
                d.document_start, 
                d.document_end, 
                d.document_path, 
                d.status, 
                d.created_at, 
                d.document_download,
                t.type_name,
                c.contract_name,
                p.project_name,
                i.installations_name,
                pl.poles_code
            FROM wp_documents d
            LEFT JOIN wp_contract c on c.contract_id = d.contract_id
            LEFT JOIN wp_project p on p.project_id = d.project_id
            LEFT JOIN wp_type t on t.type_id = d.type_id
            LEFT JOIN wp_installations i on i.installations_id = d.installations_id
            LEFT JOIN wp_poles pl on pl.poles_id = d.poles_id
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
    public function downloadHistory($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 2, $orderDir = 'desc') {
        $where = " WHERE 1=1 ";
        $params = [];
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
                        $where .= " AND l.download_date BETWEEN :start_utc AND :end_utc";
                        $params[':start_utc'] = $startObj->format('Y-m-d H:i:s');
                        $params[':end_utc']   = $endObj->format('Y-m-d H:i:s');
                    }
                } catch (Exception $e) {
                }
            }
        }
        if (!empty($filters['device'])) {
            if ($filters['device'] === 'Mac OS') {
                $where .= " AND l.download_device LIKE :device AND l.download_device NOT LIKE '%iPhone%' AND l.download_device NOT LIKE '%iPad%' ";
            } else {
                $where .= " AND l.download_device LIKE :device ";
            }
            $params[':device'] = '%' . $filters['device'] . '%';
        }
        if (!empty($filters['browser'])) {
            $where .= " AND l.download_device LIKE :browser ";
            $params[':browser'] = '%' . $filters['browser'] . '%';
        }
        if(!empty($search)) {
            $where .= " AND (d.document_name LIKE :search OR m.first_name LIKE :search OR m.last_name LIKE :search OR l.ip_address LIKE :search OR l.download_device LIKE :search) ";
            $params[':search'] = '%' . $search . '%';
        }
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents_download_logs l LEFT JOIN wp_documents d ON d.document_id = l.document_id {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $orderMap = [
            0 => "d.document_name",
            1 => "m.first_name",
            2 => "l.download_date",
            3 => "l.download_device"
        ];
        $order = $orderMap[$colIndex] ?? 'l.download_date';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $sql = "SELECT
                    d.document_name, d.document_type, d.document_size, 
                    m.first_name, m.last_name,
                    l.download_date, l.download_device
                FROM wp_documents_download_logs l
                LEFT JOIN wp_documents d ON d.document_id = l.document_id
                LEFT JOIN wp_members m ON l.member_id = m.member_id 
                {$where}
                ORDER BY {$order} {$orderDir}";

        if ($length != -1) {
            $sql .= " LIMIT :start, :length";
        }
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }
        if ($length != -1) {
            $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userAgent = new AgentHelper($this->db);
        foreach ($rows as &$row) {
            $ua_info = $userAgent->parse_user_agent($row['download_device']);
            $row['device_os'] = $ua_info['os']; 
            $row['device_browser'] = $ua_info['browser'];
            if (method_exists($this, 'formatDocumentRow')) {
                $this->formatDocumentRow($row);
            }
        }
        return ['total' => $total, 'data' => $rows];
    }
    public function get($id) {
        if (!$id) {
            return [
                'created_at' => '',
                'document_download' => 0,
                'document_end' => convertTimeZone(date('Y-m-d'), 'Y-m-d'),
                'document_file_name' => '',
                'document_id' => '',
                'document_name' => '',
                'document_path' => '',
                'document_size' => '',
                'document_start' => convertTimeZone(date('Y-m-d'), 'Y-m-d'),
                'document_type' => '',
                'type_id' => '',
                'type_name' => '',
                'contract_id' => '',
                'contract_name' => '',
                'project_id' => '',
                'project_name' => '',
                'installations_id' => '',
                'installations_name' => '',
                'poles_id' => '',
                'poles_code' => '',
                'status' => 'public',
                'updated_at' => ''
            ];
        } else {
            $sql = "SELECT 
                d.*,
                t.type_id,
                t.type_name,
                c.contract_id,
                c.contract_name,
                p.project_id,
                p.project_name,
                i.installations_id,
                i.installations_name,
                pl.poles_code
            FROM wp_documents d
            LEFT JOIN wp_contract c on c.contract_id = d.contract_id
            LEFT JOIN wp_project p on p.project_id = d.project_id
            LEFT JOIN wp_type t on t.type_id = d.type_id
            LEFT JOIN wp_installations i on i.installations_id = d.installations_id
            LEFT JOIN wp_poles pl on pl.poles_id = d.poles_id
            WHERE d.document_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                foreach (['document_start', 'document_end'] as $f) {
                    if (!empty($row[$f])) {
                        $row[$f] = convertTimeZone($row[$f], 'Y-m-d');
                    }
                }
            }
            return $row;
        }
    }
    public function save($data) {
        $this->db->beginTransaction();
        try {
            $document_id = !empty($data['document_id']) ? $data['document_id'] : null;
            $document_name = $data['document_name'];
            $status = $data['status'];
            $contract_id = !empty($data['contract_id']) ? $data['contract_id'] : null;
            $project_id = !empty($data['project_id']) ? $data['project_id'] : null;
            $type_id = !empty($data['type_id']) ? $data['type_id'] : null;
            $installations_id = !empty($data['installations_id']) ? $data['installations_id'] : null;
            $poles_id = !empty($data['poles_id']) ? $data['poles_id'] : null;
            $startObj = DateTime::createFromFormat('d/m/Y', trim($data['document_start']));
            $endObj = DateTime::createFromFormat('d/m/Y', trim($data['document_end']));
            $document_start = ($startObj) ? convertTimeZoneUTC($startObj->format('Y-m-d'), 'Y-m-d') : null;
            $document_end   = ($endObj) ? convertTimeZoneUTC($endObj->format('Y-m-d'), 'Y-m-d') : null;
            if ($document_id) {
                $this->updateDocument($document_id, $document_name, $document_start, $document_end, $status, $type_id, $contract_id, $project_id, $installations_id, $poles_id);
            } else {
                $document_id = $this->insertDocument($document_name, $document_start, $document_end, $status, $type_id, $contract_id, $project_id, $installations_id, $poles_id);
            }
            if (isset($_FILES['document_file']) && $_FILES['document_file']['error'] === UPLOAD_ERR_OK) {
                $this->handleFileUpload($document_id, $_FILES['document_file']);
            }
            $this->db->commit();
            return [
                'status' => true,
                'document_id' => $document_id
            ];
        } catch (Exception $e) {
            $this->db->rollBack();
            return [
                'status' => false,
                'document_id' => null
            ];
        }
    }
    public function delete($id) {
        return $this->updateStatus($id, 'deleted');
    }
    public function documentHistory($start, $length, $document_id, $search, $colIndex = 2, $orderDir = 'desc') {
        $params = [];
        $whereClauses = [];
        if (!empty($document_id)) {
            $whereClauses[] = "d.document_id = :document_id";
            $params[':document_id'] = $document_id;
        }
        if (!empty($search)) {
            $whereClauses[] = "(m.first_name LIKE :search OR m.last_name LIKE :search OR d.download_device LIKE :search)";
            $params[':search'] = "%$search%";
        }
        $whereSql = !empty($whereClauses) ? " WHERE " . implode(" AND ", $whereClauses) : "";
        $sqlTotal = "SELECT COUNT(*) FROM wp_documents_download_logs d LEFT JOIN wp_members m ON m.member_id = d.member_id {$whereSql}";
        $stmt = $this->db->prepare($sqlTotal);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();
        $total = $stmt->fetchColumn();
        $order = 'd.download_date';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            1 => "m.first_name",
            2 => "d.download_date",
            3 => "d.download_device",
            4 => "d.download_device"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                    d.*,
                    CONCAT(m.first_name, ' ', m.last_name) AS member_name
                FROM wp_documents_download_logs d
                LEFT JOIN wp_members m ON m.member_id = d.member_id
                {$whereSql}
                ORDER BY {$order} {$orderDir}
                LIMIT :start, :length";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':start', (int)$start, PDO::PARAM_INT);
        $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userAgent = new AgentHelper($this->db);
        foreach ($rows as &$r) {
            if (!empty($r['download_date'])) {
                $r['download_date'] = convertTimeZone($r['download_date'], 'd/m/Y H:i:s');
            }
            $ua_info = $userAgent->parse_user_agent($r['download_device'] ?? '');
            $r['device_os'] = $ua_info['os']; 
            $r['device_browser'] = $ua_info['browser'];
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE d.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND d.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['contract'])) {
            $where .= " AND d.contract_id = :contract";
            $params[':contract'] = $filters['contract'];
        }
        if (!empty($filters['project'])) {
            $where .= " AND d.project_id = :project";
            $params[':project'] = $filters['project'];
        }
        if (!empty($filters['installation'])) {
            $where .= " AND d.installations_id = :installation";
            $params[':installation'] = $filters['installation'];
        }
        if (!empty($filters['pole'])) {
            $where .= " AND d.poles_id = :pole";
            $params[':pole'] = $filters['pole'];
        }
        if (!empty($filters['type'])) {
            $where .= " AND d.type_id = :type";
            $params[':type'] = $filters['type'];
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
                        $where .= " AND d.document_start BETWEEN :start_utc AND :end_utc";
                        $params[':start_utc'] = $startObj->format('Y-m-d H:i:s');
                        $params[':end_utc']   = $endObj->format('Y-m-d H:i:s');
                    }
                } catch (Exception $e) {
                }
            }
        }
        if (!empty($search)) {
            $where .= " AND d.document_name LIKE :search";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = convertTimeZone($row['created_at'], 'd/m/Y H:i:s');
        }
        if (!empty($row['download_date'])) {
            $row['download_date'] = convertTimeZone($row['download_date'], 'd/m/Y H:i:s');
        }
        if (!empty($row['document_download'])) {
            $row['document_download'] = number_format($row['document_download']);
        }
        foreach (['document_start', 'document_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y');
            }
        }
    }
    private function insertDocument($name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id) {
        $sql = "INSERT INTO wp_documents (document_name, document_start, document_end, status, created_at, updated_at, type_id, contract_id, project_id, installations_id, poles_id) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id]);
        return $this->db->lastInsertId();
    }
    private function updateDocument($id, $name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id) {
        $sql = "UPDATE wp_documents SET document_name=?, document_start=?, document_end=?, status=?, updated_at=NOW(), type_id=?, contract_id=?, project_id=?, installations_id=?, poles_id=? WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id, $id]);
    }
    private function updateStatus($id, $status) {
        if (!$id) return false;
        $sql = "UPDATE wp_documents SET status=?, updated_at=NOW() WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, (int)$id]);
    }
    private function handleFileUpload($document_id, $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) return;
        $sql = "SELECT document_path FROM wp_documents WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$document_id]);
        $old = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!empty($old['document_path'])) {
            $oldPath = dirname(__DIR__, 2) . '/' . $old['document_path'];
            if (file_exists($oldPath)) unlink($oldPath);
        }
        $dir = "uploads/document/";
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $ext  = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $size = $file['size'];
        $name = $file['name'];
        $dId = md5($document_id);
        $path   = "{$dir}{$dId}";
        $target = dirname(__DIR__, 2) . '/' . $path;
        move_uploaded_file($file['tmp_name'], $target);
        $sql = "UPDATE wp_documents SET document_path=?, document_type=?, document_size=?, document_file_name=? WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$path, $ext, $size, $name, $document_id]);
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = '', $filter = []) {
        $offset = ($page - 1) * $limit;
        $params = [];
        $items = [];
        $totalCount = 0;
        if ($type === 'status') {
            $staticData = [['id' => 'public', 'text' => 'Public'], ['id' => 'private', 'text' => 'Private']];
            if (!empty($searchTerm)) {
                $staticData = array_values(array_filter($staticData, fn($i) => stripos($i['text'], $searchTerm) !== false));
            }
            return [
                'items' => array_slice($staticData, $offset, $limit),
                'total_count' => count($staticData)
            ];
        }
        $config = [
            'contract' => [
                'table' => 'wp_contract c',
                'id'    => 'c.contract_id',
                'text'  => 'c.contract_name',
                'where' => "c.status = 'active'"
            ],
            'project' => [
                'table' => 'wp_project p',
                'id'    => 'p.project_id',
                'text'  => 'p.project_name',
                'where' => "p.status = 'active'"
            ],
            'type' => [
                'table' => 'wp_type t',
                'id'    => 't.type_id',
                'text'  => 't.type_name',
                'join'  => "LEFT JOIN wp_project_pole_type pt ON pt.type_id = t.type_id LEFT JOIN wp_project p ON p.project_id = pt.project_id",
                'where' => "t.status = 'active'"
            ],
            'installation' => [
                'table' => 'wp_installations i',
                'id'    => 'i.installations_id',
                'text'  => 'i.installations_name',
                'join'  => "LEFT JOIN wp_project p ON p.project_id = i.project_id",
                'where' => "i.status = 'active'"
            ],
            'pole' => [
                'table' => 'wp_poles pl',
                'id'    => 'pl.poles_id',
                'text'  => 'pl.poles_code',
                'join'  => "LEFT JOIN wp_project p ON p.project_id = pl.project_id",
                'where' => "pl.status <> 'deleted'"
            ],
            'document' => [
                'table' => 'wp_documents',
                'id'    => 'document_id',
                'text'  => 'document_name',
                'where' => "status <> 'deleted'"
            ]
        ];
        if (!isset($config[$type])) return ['items' => [], 'total_count' => 0];
        $cfg = $config[$type];
        $whereClauses = [$cfg['where']];
        if (!empty($searchTerm)) {
            $whereClauses[] = "({$cfg['text']} LIKE ?)";
            $params[] = "%$searchTerm%";
        }
        $filterMap = [
            'contract_id'     => ($type === 'contract') ? 'c.contract_id' : 'p.contract_id',
            'project_id'      => ($type === 'project')  ? 'p.project_id'  : 'p.project_id',
            'type_id'         => ($type === 'type')     ? 't.type_id'     : (($type === 'installation') ? 'i.type_id' : 'pl.type_id'),
            'installation_id' => 'pl.installations_id'
        ];
        foreach ($filterMap as $key => $column) {
            if (!empty($filter[$key])) {
                $whereClauses[] = "$column = ?";
                $params[] = $filter[$key];
            }
        }
        $whereSql = "WHERE " . implode(' AND ', $whereClauses);
        $joinSql  = $cfg['join'] ?? "";
        try {
            $sqlCount = "SELECT COUNT(DISTINCT {$cfg['id']}) as total FROM {$cfg['table']} $joinSql $whereSql";
            $stmtCount = $this->db->prepare($sqlCount);
            $stmtCount->execute($params);
            $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
            $sqlData = "SELECT {$cfg['id']} as id, {$cfg['text']} as text 
                        FROM {$cfg['table']} $joinSql $whereSql 
                        GROUP BY {$cfg['id']} 
                        ORDER BY id ASC LIMIT $limit OFFSET $offset";
            
            $stmtData = $this->db->prepare($sqlData);
            $stmtData->execute($params);
            $items = $stmtData->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
        }
        return [
            'items' => $items,
            'total_count' => (int)$totalCount
        ];
    }
}