<?php
class ProjectModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function get($start = 0, $length = 20, $filters = [], $search = '') {
        $currentRefId = $filters['ref_id'] ?? null;
        $currentProjectId = $filters['project_id'] ?? null;
        list($mainWhere, $mainParams) = $this->buildListWhere($filters);
        $sql = "SELECT f.id, f.name as folder_name, f.code, f.level, f.parent_id, f.created_at, f.type, f.ref_id as folder_ref_id FROM wp_folder f {$mainWhere} ORDER BY f.id ASC";
        $stmt = $this->db->prepare($sql);
        foreach ($mainParams as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->execute();
        $folderRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $finalItems = [];
        $config = [
            'contract'     => ['table' => 'wp_contract',     'id' => 'contract_id',      'name' => 'contract_name'],
            'project'      => ['table' => 'wp_project',       'id' => 'project_id',       'name' => 'project_name'],
            'type'         => ['table' => 'wp_type',          'id' => 'type_id',          'name' => 'type_name'],
            'installation' => ['table' => 'wp_installations', 'id' => 'installations_id', 'name' => 'installations_name'],
            'process'      => ['table' => 'wp_process',       'id' => 'process_id',       'name' => 'process_name']
        ];
        foreach ($folderRows as $row) {
            if (empty($row['code'])) {
                if (!empty($search) && stripos($row['folder_name'], $search) === false) continue;
                $item = $this->formatRow($row);
                $activeRef = !empty($row['folder_ref_id']) ? $row['folder_ref_id'] : $currentRefId;
                $item['ref_id'] = $activeRef;
                $item['project_id'] = $currentProjectId;
                $item['child_count'] = $this->countChildren($row['id'], $row['level'], $activeRef, $currentProjectId);
                $finalItems[] = $item;
            } else {
                $code = strtolower($row['code']);
                if (isset($config[$code])) {
                    $cfg = $config[$code];
                    $subItems = $this->fetchDynamicData($cfg, $code, $currentRefId, $currentProjectId, $search);
                    foreach ($subItems as $sub) {
                        $activeProj = $sub['project_id'] ?? $currentProjectId;
                        $finalItems[] = [
                            'id'          => $row['id'],
                            'ref_id'      => $sub['r_id'],
                            'project_id'  => $activeProj,
                            'folder_name' => $sub['r_name'],
                            'code'        => $row['code'],
                            'type'        => $row['type'],
                            'level'       => $row['level'],
                            'parent_id'   => $row['parent_id'],
                            'created_at'  => $row['created_at'],
                            'child_count' => $this->countChildren($row['id'], $row['level'], $sub['r_id'], $activeProj)
                        ];
                    }
                }
            }
        }
        $totalCount = count($finalItems);
        if ($length > 0) {
            $finalItems = array_slice($finalItems, $start, $length);
        }
        return [
            'total' => $totalCount, 
            'data' => $finalItems,
            'hasMore' => ($length > 0) ? ($start + $length < $totalCount) : false
        ];
    }
    private function countChildren($folderId, $currentLevel, $refId, $project_id = null) {
        $nextLevel = (int)$currentLevel + 1;
        $sqlFolder = "SELECT id, code FROM wp_folder WHERE parent_id = :pid AND level = :lvl AND status <> 'deleted' AND (ref_id = :rid OR ref_id IS NULL OR ref_id = '')";
        $stmt = $this->db->prepare($sqlFolder);
        $stmt->execute([
            ':pid' => $folderId, 
            ':lvl' => $nextLevel,
            ':rid' => $refId
        ]);
        $nextFolders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($nextFolders)) return 0;
        $totalChild = 0;
        $config = [
            'contract'     => ['table' => 'wp_contract',     'id' => 'contract_id'],
            'project'      => ['table' => 'wp_project',       'id' => 'project_id'],
            'type'         => ['table' => 'wp_type',          'id' => 'type_id'],
            'installation' => ['table' => 'wp_installations', 'id' => 'installations_id'],
            'process'      => ['table' => 'wp_process',       'id' => 'process_id']
        ];
        foreach ($nextFolders as $nf) {
            $code = strtolower($nf['code'] ?? '');
            if (empty($code)) {
                $totalChild++; 
                continue;
            }
            if (isset($config[$code])) {
                $cfg = $config[$code];
                $params = [];
                $subConditions = ["t.status <> 'deleted'"];
                $joinSql = "";
                if ($code === 'project' && !empty($refId)) {
                    if ($refId === 'another') {
                        $subConditions[] = "(t.contract_id IS NULL OR t.contract_id = '')";
                    } else {
                        $subConditions[] = "t.contract_id = :rid";
                        $params[':rid'] = $refId;
                    }
                } elseif ($code === 'type' && !empty($refId)) {
                    $joinSql = " LEFT JOIN wp_poles p ON p.type_id = t.{$cfg['id']} ";
                    $subConditions[] = "p.project_id = :rid";
                    $params[':rid'] = $refId;
                } elseif ($code === 'installation' && !empty($refId)) {
                    $joinSql = " LEFT JOIN wp_poles p ON p.installations_id = t.{$cfg['id']} ";
                    $subConditions[] = "p.type_id = :rid";
                    $params[':rid'] = $refId;
                    if (!empty($project_id)) {
                        $subConditions[] = "p.project_id = :pid";
                        $params[':pid'] = $project_id;
                    }
                }
                $whereStr = " WHERE " . implode(' AND ', $subConditions);
                $sqlCount = "SELECT COUNT(DISTINCT t.{$cfg['id']}) FROM {$cfg['table']} t {$joinSql} {$whereStr}";
                $stCount = $this->db->prepare($sqlCount);
                $stCount->execute($params);
                $totalChild += (int)$stCount->fetchColumn();
            }
        }
        return $totalChild;
    }
    private function fetchDynamicData($cfg, $code, $currentRefId, $currentProjectId, $search) {
        $subParams = [];
        $subConditions = ["t.status <> 'deleted'"];
        $joinSql = ""; 
        $extraSelect = ""; 
        if (!empty($search)) {
            $subConditions[] = "t.{$cfg['name']} LIKE :search";
            $subParams[':search'] = "%$search%";
        }
        if ($code === 'project' && !empty($currentRefId)) {
            if ($currentRefId === 'another') { $subConditions[] = "(t.contract_id IS NULL OR t.contract_id = '')"; } 
            else { $subConditions[] = "t.contract_id = :ref_id"; $subParams[':ref_id'] = $currentRefId; }
        } elseif ($code === 'type' && !empty($currentRefId)) {
            $joinSql = " LEFT JOIN wp_poles p ON p.type_id = t.{$cfg['id']} ";
            $subConditions[] = "p.project_id = :ref_id";
            $subParams[':ref_id'] = $currentRefId;
            $extraSelect = ", p.project_id"; 
        } elseif ($code === 'installation' && !empty($currentRefId)) {
            $joinSql = " LEFT JOIN wp_poles p ON p.installations_id = t.{$cfg['id']} ";
            $subConditions[] = " p.type_id = :ref_id ";
            $subParams[':ref_id'] = $currentRefId;
            if($currentProjectId) {
                $subConditions[] = " p.project_id = :proj_id ";
                $subParams[':proj_id'] = $currentProjectId;
            }
        } 
        $whereStr = " WHERE " . implode(' AND ', $subConditions);
        $sqlSub = "SELECT t.{$cfg['id']} as r_id, t.{$cfg['name']} as r_name {$extraSelect} FROM {$cfg['table']} t {$joinSql} {$whereStr} GROUP BY t.{$cfg['id']}";
        $stmt = $this->db->prepare($sqlSub);
        $stmt->execute($subParams);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function save($data) {
        if ($data['folder_id'] > 0) {
            $sql = "UPDATE wp_folder SET name = :name, updated_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':name' => $data['folder_name'],
                ':id'   => $data['folder_id']
            ]);
        } else {
            $parentId = (!empty($data['parent_id']) && $data['parent_id'] > 0) ? $data['parent_id'] : null;
            $ref_id = (!empty($data['ref_id']) && $data['ref_id'] > 0) ? $data['ref_id'] : null;
            $sql = "INSERT INTO wp_folder (name, parent_id, level, status, type, created_at, updated_at, ref_id) VALUES (:name, :parent_id, :level, 'active', 'folder', NOW(), NOW(), :ref_id)";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                ':name'      => $data['folder_name'],
                ':parent_id' => $parentId,
                ':level'     => $data['level'],
                ':ref_id'     => $ref_id
            ]);
        }
    }
    public function data($data) {
        $folder_id = intval($data['folder_id']);
        $sql = "SELECT id, name as folder_name, parent_id, level 
                FROM wp_folder 
                WHERE id = :id AND status <> 'deleted' 
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $folder_id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    public function delete($data) {
        $sql = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':id'   => $data['folder_id']
        ]);
    }
    private function formatRow($row) {
        if (!empty($row['created_at'])) {
            $row['created_at'] = date('d/m/Y H:i:s', strtotime($row['created_at']));
        }
        return $row;
    }
    private function buildListWhere($filters) {
        $where  = " WHERE f.status != 'deleted' ";
        $params = [];
        if (!empty($filters['level'])) {
            $where .= " AND f.level = :level";
            $params[':level'] = $filters['level'];
        }
        if (isset($filters['item']) && ($filters['item'] !== '' && $filters['item'] !== null)) {
            $where .= " AND f.parent_id = :item";
            $params[':item'] = $filters['item'];
        } else {
            $where .= " AND f.parent_id IS NULL";
        }
        if (isset($filters['ref_id']) && $filters['ref_id'] !== '') {
            $where .= " AND (f.ref_id = :ref_id OR f.ref_id IS NULL OR f.ref_id = '')";
            $params[':ref_id'] = $filters['ref_id'];
        } else {
            $where .= " AND (f.ref_id IS NULL OR f.ref_id = '')";
        }
        return [$where, $params];
    }
}