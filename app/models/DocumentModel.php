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
                pl.poles_code,
                (SELECT GROUP_CONCAT(folder_id) FROM wp_document_folder WHERE document_id = d.document_id AND status = 'active') as all_folder_ids,
                d.folder_show_admin, d.folder_show_user,
                f.parent_id as dynamic_parent_id 
            FROM wp_documents d
            LEFT JOIN wp_contract c on c.contract_id = d.contract_id
            LEFT JOIN wp_project p on p.project_id = d.project_id
            LEFT JOIN wp_type t on t.type_id = d.type_id
            LEFT JOIN wp_installations i on i.installations_id = d.installations_id
            LEFT JOIN wp_poles pl on pl.poles_id = d.poles_id
            LEFT JOIN wp_folder f ON f.content_id = d.document_id and f.sub_type = 'document'
            {$where}
            GROUP BY d.document_id
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
            if(!empty($row['dynamic_parent_id'])) {
                $row['folder_id'] = $row['dynamic_parent_id'];
            }
            $row['folder_chains'] = [];
            if (!empty($row['all_folder_ids'])) {
                $folder_ids = explode(',', $row['all_folder_ids']);
                foreach ($folder_ids as $f_id) {
                    $row['folder_chains'][] = $this->getParentFolders(trim($f_id));
                }
            }
            $this->formatDocumentRow($row);
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    private function getParentFolders($folderId){
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT id, name, parent_id FROM wp_folder WHERE status = 'active'");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $map = [];
        foreach ($rows as $r) {
            $map[$r['id']] = [
                'id' => $r['id'],
                'name' => $r['name'],
                'parent_id' => $r['parent_id']
            ];
        }
        $result = [];
        $current = $folderId;
        while (!empty($current) && isset($map[$current])) {
            $result[] = [
                'id' => $map[$current]['id'],
                'name' => $map[$current]['name']
            ];
            $current = $map[$current]['parent_id'];
        }
        return $result;
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
        $stmtFolder = $this->db->prepare("SELECT id, name, slug, type, level, parent_id FROM wp_folder WHERE status = 'active' AND type IN ('root','folder') ORDER BY level ASC, parent_id ASC, id ASC");
        $stmtFolder->execute();
        $foldersRaw = $stmtFolder->fetchAll(PDO::FETCH_ASSOC);
        $folderMap = [];
        $foldersTree = [];
        foreach ($foldersRaw as $f) {
            $f['children'] = [];
            $folderMap[$f['id']] = $f;
        }
        foreach ($folderMap as $fid => &$folder) {
            $parentId = $folder['parent_id'];
            if (!empty($parentId) && isset($folderMap[$parentId])) {
                $folderMap[$parentId]['children'][] = &$folder;
            } else {
                $foldersTree[] = &$folder;
            }
        }
        unset($folder);
        if (!$id) {
            return [
                'created_at' => '',
                'document_download' => 0,
                'document_end' => '',
                'document_file_name' => '',
                'document_id' => '',
                'document_name' => '',
                'document_path' => '',
                'document_size' => '',
                'document_start' => '',
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
                'updated_at' => '',
                'folder_show_admin' => '',
                'folder_show_user' => '',
                "folder_id" => [],
                'folders' => $foldersTree
            ];
        } else {
            $sql = "SELECT 
                    d.*,
                    t.type_id, t.type_name,
                    c.contract_id, c.contract_name,
                    p.project_id, p.project_name,
                    i.installations_id, i.installations_name,
                    pl.poles_code
                FROM wp_documents d
                LEFT JOIN wp_contract c ON c.contract_id = d.contract_id
                LEFT JOIN wp_project p ON p.project_id = d.project_id
                LEFT JOIN wp_type t ON t.type_id = d.type_id
                LEFT JOIN wp_installations i ON i.installations_id = d.installations_id
                LEFT JOIN wp_poles pl ON pl.poles_id = d.poles_id
                WHERE d.document_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([(int)$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                foreach (['document_start', 'document_end'] as $dateField) {
                    if (!empty($row[$dateField])) {
                        $row[$dateField] = convertTimeZone($row[$dateField], 'Y-m-d');
                    }
                }
                $stmtFolder = $this->db->prepare("SELECT folder_id FROM wp_document_folder WHERE document_id = ? AND status = 'active'");
                $stmtFolder->execute([(int)$row['document_id']]);
                $selectedFolders = $stmtFolder->fetchAll(PDO::FETCH_COLUMN);
                $n['folder_id'] = array_filter($selectedFolders, function($f_id) use ($folderMap) {
                    return isset($folderMap[$f_id]);
                });
                $row['folder_id'] = array_values($n['folder_id']);
                $row['folders'] = $foldersTree;
                return $row;
            }
            return null; 
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
            $startObj = !empty($data['document_start']) 
                ? DateTime::createFromFormat('d/m/Y', trim($data['document_start'])) 
                : null;
            $endObj = !empty($data['document_end']) 
                ? DateTime::createFromFormat('d/m/Y', trim($data['document_end'])) 
                : null;
            $document_start = $startObj ? $startObj->format('Y-m-d') : null;
            $document_end   = $endObj   ? $endObj->format('Y-m-d')   : null;
            $folder_show_admin = $data['folder_show_admin'];
            $folder_show_user  = $data['folder_show_user'];
            $send_notification = $data['send_notification'] ?? 'no';
            if ($document_id) {
                $this->updateDocument($document_id, $document_name, $document_start, $document_end, $status, $type_id, $contract_id, $project_id, $installations_id, $poles_id, $folder_show_admin, $folder_show_user);
            } else {
                $document_id = $this->insertDocument($document_name, $document_start, $document_end, $status, $type_id, $contract_id, $project_id, $installations_id, $poles_id, $folder_show_admin, $folder_show_user);
            }
            if($document_id) {
                $folder_ids = !empty($data['folder_id']) && is_array($data['folder_id']) ? $data['folder_id'] : [];
                $folder_status_base = ($status === 'private') ? 'inactive' : 'active';
                if (!empty($folder_ids)) {
                    $placeholders = implode(',', array_fill(0, count($folder_ids), '?'));
                    $sql_soft_del_mapping = "UPDATE wp_document_folder SET status = 'deleted', updated_at = NOW() WHERE document_id = ? AND folder_id NOT IN ($placeholders)";
                    $this->db->prepare($sql_soft_del_mapping)->execute(array_merge([$document_id], $folder_ids));
                    $sql_soft_del_folder = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? AND parent_id NOT IN ($placeholders) and sub_type = 'document'";
                    $this->db->prepare($sql_soft_del_folder)->execute(array_merge([$document_id], $folder_ids));
                    foreach ($folder_ids as $f_id) {
                        $f_id = (int)$f_id;
                        if($f_id > 0) {
                            $stmt_check = $this->db->prepare("SELECT id FROM wp_document_folder WHERE document_id = ? AND folder_id = ?");
                            $stmt_check->execute([$document_id, $f_id]);
                            if ($stmt_check->fetch()) {
                                $this->db->prepare("UPDATE wp_document_folder SET status = 'active', updated_at = NOW() WHERE document_id = ? AND folder_id = ?")->execute([$document_id, $f_id]);
                            } else {
                                $this->db->prepare("INSERT INTO wp_document_folder (document_id, folder_id, status, created_at, updated_at) VALUES (?, ?, 'active', NOW(), NOW())")->execute([$document_id, $f_id]);
                            }
                            $folder_name = $document_name;
                            $stmt = $this->db->prepare("SELECT id FROM wp_folder WHERE parent_id = ? AND content_id = ? and sub_type = 'document'");
                            $stmt->execute([$f_id, $document_id]);
                            $existingFolder = $stmt->fetch(PDO::FETCH_ASSOC);
                            if ($existingFolder) {
                                $sql = "UPDATE wp_folder SET name = :name, status = :status, updated_at = NOW() WHERE id = :id";
                                $this->db->prepare($sql)->execute([
                                    ':name'   => $folder_name,
                                    ':status' => $folder_status_base,
                                    ':id'     => $existingFolder['id']
                                ]);
                            } else {
                                $stmt = $this->db->prepare("SELECT level FROM wp_folder WHERE id = ?");
                                $stmt->execute([$f_id]);
                                $parentData = $stmt->fetch(PDO::FETCH_ASSOC);
                                $level = $parentData ? (int)$parentData['level'] + 1 : 1;
                                $slug = $this->generateUniqueSlug($folder_name, $f_id);
                                $sql = "INSERT INTO wp_folder (name, slug, parent_id, level, status, type, sub_type, created_at, updated_at, content_id) VALUES (:name, :slug, :parent_id, :level, :status, 'document', 'document', NOW(), NOW(), :document_id)";
                                $this->db->prepare($sql)->execute([
                                    ':name'       => $folder_name,
                                    ':slug'       => $slug,
                                    ':parent_id'  => $f_id,
                                    ':level'      => $level,
                                    ':status'     => $folder_status_base,
                                    ':document_id' => $document_id
                                ]);
                            }
                        }
                    }
                } else {
                    $this->db->prepare("UPDATE wp_document_folder SET status = 'deleted', updated_at = NOW() WHERE document_id = ?")->execute([$document_id]);
                    $this->db->prepare("UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? and sub_type = 'document'")->execute([$document_id]);
                }
            }
            if (isset($_FILES['document_file']) && $_FILES['document_file']['error'] === UPLOAD_ERR_OK) {
                $this->handleFileUpload($document_id, $_FILES['document_file']);
            }
            if($send_notification === 'yes' && $status === 'public') {
                $mediaHelper = new MediaHelper($this->db);
                $status = 'published';
                $publish_at = convertTimeZoneUTC(date('Y-m-d H:i:s'), 'Y-m-d H:i:s');
                $mediaHelper->notification($document_id, $status, $publish_at, 'document');
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
                'document_id' => $e
            ];
        }
    }
     private function generateSlug($text){
        $text = trim($text);
        $text = mb_strtolower($text, 'UTF-8');
        $text = preg_replace('/[^a-z0-9ก-๙]+/u', '-', $text);
        $text = trim($text, '-');
        return $text ?: 'folder';
    }
    private function generateUniqueSlug($name, $parentId, $excludeId = null){
        $slug = $this->generateSlug($name);
        $baseSlug = $slug;
        $i = 1;
        while (true) {
            $sql = "SELECT id FROM wp_folder WHERE slug = :slug AND parent_id <=> :parent";
            if ($excludeId) {
                $sql .= " AND id != :exclude";
            }
            $stmt = $this->db->prepare($sql);
            $params = [
                ':slug' => $slug,
                ':parent' => $parentId
            ];
            if ($excludeId) {
                $params[':exclude'] = $excludeId;
            }
            $stmt->execute($params);
            if (!$stmt->fetch()) break;
            $slug = $baseSlug . '-' . $i;
            $i++;
        }
        return $slug;
    }
    public function delete($id) {
        $this->db->prepare("UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = ? AND sub_type = 'document'")->execute([(int)$id]);
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
        $sql = "SELECT d.*,CONCAT(m.first_name, ' ', m.last_name) AS member_name FROM wp_documents_download_logs d LEFT JOIN wp_members m ON m.member_id = d.member_id {$whereSql} ORDER BY {$order} {$orderDir} LIMIT :start, :length";
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
    private function insertDocument($name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id, $folder_show_admin, $folder_show_user) {
        $sql = "INSERT INTO wp_documents (document_name, document_start, document_end, status, created_at, updated_at, type_id, contract_id, project_id, installations_id, poles_id, folder_show_admin, folder_show_user) VALUES (?, ?, ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id, $folder_show_admin, $folder_show_user]);
        return $this->db->lastInsertId();
    }
    private function updateDocument($id, $name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id, $folder_show_admin, $folder_show_user) {
        $sql = "UPDATE wp_documents SET document_name=?, document_start=?, document_end=?, status=?, updated_at=NOW(), type_id=?, contract_id=?, project_id=?, installations_id=?, poles_id=?, folder_show_admin=?,folder_show_user = ? WHERE document_id=?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$name, $start, $end, $status, $type, $contract_id, $project_id, $installations_id, $poles_id, $folder_show_admin, $folder_show_user, $id]);
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
        $path   = "{$dir}{$dId}.{$ext}";
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
                'where' => "c.status = 'active'",
                'order' => "c.item_order ASC",
            ],
            'project' => [
                'table' => 'wp_project p',
                'id'    => 'p.project_id',
                'text'  => 'p.project_name',
                'where' => "p.status = 'active'",
                'order' => "p.item_order ASC",
            ],
            'type' => [
                'table' => 'wp_type t',
                'id'    => 't.type_id',
                'text'  => 't.type_name',
                'join'  => "LEFT JOIN wp_project_pole_type pt ON pt.type_id = t.type_id LEFT JOIN wp_project p ON p.project_id = pt.project_id",
                'where' => "t.status = 'active'",
                'order' => "t.item_order ASC",
            ],
            'installation' => [
                'table' => 'wp_installations i',
                'id'    => 'i.installations_id',
                'text'  => 'i.installations_name',
                'join'  => "LEFT JOIN wp_project p ON p.project_id = i.project_id",
                'where' => "i.status = 'active'",
                'order' => "i.item_order ASC",
            ],
            'pole' => [
                'table' => 'wp_poles pl',
                'id'    => 'pl.poles_id',
                'text'  => 'pl.poles_code',
                'join'  => "LEFT JOIN wp_project p ON p.project_id = pl.project_id",
                'where' => "pl.status <> 'deleted'",
                'order' => "pl.item_order ASC",
            ],
            'document' => [
                'table' => 'wp_documents',
                'id'    => 'document_id',
                'text'  => 'document_name',
                'where' => "status <> 'deleted'",
                'order' => "document_id ASC",
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
            $sqlCount = "SELECT COUNT(DISTINCT {$cfg['id']}) as total FROM {$cfg['table']} $joinSql $whereSql ORDER BY {$cfg['order']}";
            $stmtCount = $this->db->prepare($sqlCount);
            $stmtCount->execute($params);
            $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
            $sqlData = "SELECT {$cfg['id']} as id, {$cfg['text']} as text 
                        FROM {$cfg['table']} $joinSql $whereSql 
                        GROUP BY {$cfg['id']} 
                        ORDER BY {$cfg['order']} LIMIT $limit OFFSET $offset";
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