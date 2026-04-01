<?php
class ProjectsModel {
    private $db;
    private $basePath;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
        $this->basePath = realpath(dirname(__DIR__, 2));
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 0, $orderDir = 'asc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_project p LEFT JOIN wp_contract c on c.contract_id = p.contract_id LEFT JOIN wp_project_group g on g.project_group_id = p.project_group_id {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'p.created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "p.item_order",
            1 => "p.project_code",
            2 => "p.project_name",
            3 => "p.project_name_display",
            4 => "c.contract_name",
            5 => "g.project_group_name",
            6 => "p.project_start",
            7 => "p.project_end",
            8 => "p.created_at",
            9 => "s.project_status_name"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                p.project_id, 
                p.project_code, 
                p.project_name, 
                p.project_name_display, 
                p.project_start, 
                p.project_end, 
                s.project_status_name,
                s.project_status_color,
                c.contract_name,
                g.project_group_name,
                p.created_at,
                p.project_background,
                p.project_opacity,
                p.status,
                p.item_order
            FROM wp_project p
            LEFT JOIN wp_contract c on c.contract_id = p.contract_id 
            LEFT JOIN wp_project_status s on s.project_status_id = p.project_status_id
            LEFT JOIN wp_project_group g on g.project_group_id = p.project_group_id
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
        $where  = " WHERE p.status != 'deleted' ";
        $params = [];
        if (!empty($filters['project_status'])) {
            $where .= " AND p.project_status_id = :project_status";
            $params[':project_status'] = $filters['project_status'];
        }
        if (!empty($filters['status'])) {
            $where .= " AND p.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['contract'])) {
            $where .= " AND c.contract_id = :contract";
            $params[':contract'] = $filters['contract'];
        }
        if (!empty($filters['group'])) {
            $where .= " AND g.project_group_id = :group";
            $params[':group'] = $filters['group'];
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
        foreach (['created_at'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = ''){
        $offset = ($page - 1) * $limit;
        $items = [];
        $totalCount = 0;
        $params = [];
        $config = [
            'project_status' => [
                'table' => 'wp_project_status',
                'id'    => 'project_status_id',
                'text'  => 'project_status_name',
                'search'=> ['project_status_name']
            ],
            'contract' => [
                'table' => 'wp_contract',
                'id'    => 'contract_id',
                'text'  => 'contract_name',
                'search'=> ['contract_name', 'contract_no']
            ],
            'group' => [
                'table' => 'wp_project_group',
                'id'    => 'project_group_id',
                'text'  => 'project_group_name',
                'search'=> ['project_group_name']
            ],
            'status' => [
                'static' => true,
                'data' => [
                    ['id' => 'active',   'text' => 'Active'],
                    ['id' => 'inactive', 'text' => 'Inactive']
                ]
            ]
        ];
        if (!isset($config[$type])) {
            return ['items' => [], 'total_count' => 0];
        }
        $cfg = $config[$type];
        if (!empty($cfg['static'])) {
            $data = $cfg['data'];
            if ($searchTerm !== '') {
                $data = array_filter($data, function ($row) use ($searchTerm) {
                    return stripos($row['text'], $searchTerm) !== false;
                });
            }
            $totalCount = count($data);
            $items = array_slice(array_values($data), $offset, $limit);
            return [
                'items' => $items,
                'total_count' => $totalCount
            ];
        }
        $conditions = ["status <> 'deleted'"];
        if ($searchTerm !== '') {
            $searchParts = [];
            foreach ($cfg['search'] as $field) {
                $searchParts[] = "{$field} LIKE :search";
            }
            $conditions[] = "(" . implode(" OR ", $searchParts) . ")";
            $params[':search'] = "%{$searchTerm}%";
        }
        $whereClause = "WHERE " . implode(" AND ", $conditions);
        $sqlCount = "SELECT COUNT(*) FROM {$cfg['table']} {$whereClause}";
        $stmtCount = $this->db->prepare($sqlCount);
        $stmtCount->execute($params);
        $totalCount = (int)$stmtCount->fetchColumn();
        $sql = "SELECT {$cfg['id']} AS id, {$cfg['text']} AS text 
                FROM {$cfg['table']} 
                {$whereClause} 
                ORDER BY {$cfg['id']} DESC 
                LIMIT :limit OFFSET :offset";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    public function deleteBg($id) {
        $sql = "UPDATE wp_project SET project_background=null, project_opacity=0 WHERE project_id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([(int)$id]);
    }
    public function get($id) {
        if (!$id) {
            return [
                'project_id' => '',
                'project_code' => '',
                'project_name' => '',
                'project_name_display' => '',
                'project_start' => '',
                'project_end' => '',
                'contract_id' => '',
                'contract_name' => '',
                'project_status_id' => '',
                'project_status_name' => '',
                'project_group_id' => '',
                'project_group_name' => '',
                'status' => 'active',
            ];
        } else {
            $sql = "SELECT 
                p.*, c.contract_id, c.contract_name, s.project_status_id, s.project_status_name, g.project_group_id, g.project_group_name
            FROM wp_project p
            LEFT JOIN wp_contract c on c.contract_id = p.contract_id
            LEFT JOIN wp_project_status s on s.project_status_id = p.project_status_id
            LEFT JOIN wp_project_group g on g.project_group_id = p.project_group_id
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
    public function background($id) {
        $default = [
            'project_background' => '',
            'project_opacity' => 0
        ];
        if (!$id) {
            return $default;
        }
        $sql = "SELECT project_background, project_opacity FROM wp_project WHERE project_id = ?"; 
        $stmt = $this->db->prepare($sql);
        $stmt->execute([(int)$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: $default;
    }
    public function save($data) {
        $project_id = $data['project_id'] ?? null;
        $contract_id = (!empty($data['contract_id'])) ? $data['contract_id'] : null;
        $group = (!empty($data['group'])) ? $data['group'] : null;
        $project_code = $data['project_code'] ?? '';
        $project_name = $data['project_name'] ?? '';
        $project_name_display = $data['project_name_display'] ?? '';
        $status = $data['status'] ?? 'active';
        if ($this->isDuplicateProjectName($project_name, $project_id)) {
            return [
                'status'  => false,
                'message' => 'already_project'
            ];
        }
        $project_status = $data['project_status'] ?? '';
        $startObj = DateTime::createFromFormat('d/m/Y', trim($data['project_start']));
        $endObj   = DateTime::createFromFormat('d/m/Y', trim($data['project_end']));
        $project_start = ($startObj) ? convertTimeZoneUTC($startObj->format('Y-m-d'), 'Y-m-d') : null;
        $project_end   = ($endObj) ? convertTimeZoneUTC($endObj->format('Y-m-d'), 'Y-m-d') : null;
        $pdo = $this->db;
        if ($project_id) {
            $sql = "UPDATE wp_project SET 
                        contract_id = :contract_id, 
                        project_code = :project_code, 
                        project_name = :project_name, 
                        project_name_display = :project_name_display, 
                        project_start = :project_start, 
                        project_end = :project_end, 
                        project_status_id = :project_status, 
                        project_group_id = :group, 
                        status = :status, 
                        updated_at = NOW() 
                    WHERE project_id = :project_id";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':project_id', (int)$project_id, PDO::PARAM_INT);
        } else {
            $sql = "INSERT INTO wp_project (
                        contract_id, project_code, project_name, project_name_display, 
                        project_start, project_end, project_status_id, project_group_id, 
                        created_at, updated_at
                    ) VALUES (
                        :contract_id, :project_code, :project_name, :project_name_display, 
                        :project_start, :project_end, :project_status, :group, :status,
                        NOW(), NOW()
                    )";
            $stmt = $pdo->prepare($sql);
        }
        $stmt->bindValue(':contract_id', $contract_id, $contract_id === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue(':group', $group, $group === null ? PDO::PARAM_NULL : PDO::PARAM_INT); 
        $stmt->bindValue(':project_code', $project_code);
        $stmt->bindValue(':project_name', $project_name);
        $stmt->bindValue(':project_name_display', $project_name_display);
        $stmt->bindValue(':project_start', $project_start);
        $stmt->bindValue(':project_end', $project_end);
        $stmt->bindValue(':project_status', $project_status);
        $stmt->bindValue(':status', $status);
        return $stmt->execute();
    }
    private function isDuplicateProjectName($project_name, $project_id = null) {
        $sql = "SELECT COUNT(*) FROM wp_project WHERE project_name = :project_name";
        if ($project_id) {
            $sql .= " AND project_id != :project_id";
        }
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':project_name', trim($project_name));
        if ($project_id) {
            $stmt->bindValue(':project_id', (int)$project_id, PDO::PARAM_INT);
        }
        $stmt->execute();
        return $stmt->fetchColumn() > 0;
    }
    public function saveBg($data) {
        $project_id = $data['project_id'];
        $opacity    = $data['bg_opacity'] ?: 0;
        $ex_cover   = $data['ex_cover']; 
        $table      = "wp_project"; 
        $col_bg     = "project_background";
        $col_op     = "project_opacity";
        $dir        = "uploads/project/";
        $uploadPath = $this->basePath . DIRECTORY_SEPARATOR . $dir;
        $dbPath     = null;
        if (isset($data['cover']) && $data['cover']['error'] === UPLOAD_ERR_OK) {
            $file = $data['cover'];
            if (!is_dir($uploadPath)) mkdir($uploadPath, 0755, true);
            $imgInfo  = @getimagesize($file['tmp_name']);
            $baseName = md5($project_id . time());
            if ($imgInfo && function_exists('imagewebp')) {
                $image = match ($imgInfo['mime']) {
                    'image/jpeg' => imagecreatefromjpeg($file['tmp_name']),
                    'image/png'  => (function($path) {
                        $img = imagecreatefrompng($path);
                        imagepalettetotruecolor($img);
                        imagealphablending($img, true);
                        imagesavealpha($img, true);
                        return $img;
                    })($file['tmp_name']),
                    'image/gif'  => imagecreatefromgif($file['tmp_name']),
                    'image/webp' => imagecreatefromwebp($file['tmp_name']), 
                    default      => false,
                };
                if ($image) {
                    $newName = $baseName . ".webp";
                    $fullPath = $uploadPath . $newName;
                    $quality = 85; 
                    $max_size = 1024 * 1024; 
                    do {
                        ob_start();
                        imagewebp($image, null, $quality);
                        $tempImageData = ob_get_contents();
                        ob_end_clean();
                        $currentSize = strlen($tempImageData);
                        if ($currentSize <= $max_size || $quality <= 15) {
                            if (file_put_contents($fullPath, $tempImageData)) {
                                $dbPath = $dir . $newName;
                            }
                            break;
                        }
                        $quality -= 10;
                    } while ($quality > 5);
                    imagedestroy($image);
                }
            }
            if (empty($dbPath)) {
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $newName = $baseName . "." . $ext;
                if (move_uploaded_file($file['tmp_name'], $uploadPath . $newName)) {
                    $dbPath = $dir . $newName;
                }
            }
            if ($dbPath && !empty($ex_cover) && file_exists($this->basePath . DIRECTORY_SEPARATOR . $ex_cover)) {
                @unlink($this->basePath . DIRECTORY_SEPARATOR . $ex_cover);
            }
        } else {
            $dbPath = !empty($ex_cover) ? $ex_cover : null;
        }
        $sql = "UPDATE $table SET $col_bg = ?, $col_op = ? WHERE project_id = ?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$dbPath, $opacity, $project_id]);
    }
}