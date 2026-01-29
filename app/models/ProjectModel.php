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
        $sql = "SELECT 
            f.id, f.name as folder_name, f.code, f.level, f.parent_id, f.created_at, f.type, f.ref_id as folder_ref_id, f.content_id, f.notification_status, c.cover
        FROM wp_folder f 
        LEFT JOIN wp_content c on c.content_id = f.content_id
        {$mainWhere} ORDER BY f.id ASC";
        $stmt = $this->db->prepare($sql);
        foreach ($mainParams as $k => $v) { $stmt->bindValue($k, $v); }
        $stmt->execute();
        $folderRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $finalItems = [];
        $config = [
            'contract'     => ['table' => 'wp_contract',     'id' => 'contract_id',      'name' => 'contract_name'],
            'project'      => ['table' => 'wp_project',       'id' => 'project_id',       'name' => 'project_name'],
            'type'         => ['table' => 'wp_type',          'id' => 'type_id',          'name' => 'type_name'],
            'installation' => ['table' => 'wp_installations', 'id' => 'installations_id', 'name' => 'installations_name']
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
            'installation' => ['table' => 'wp_installations', 'id' => 'installations_id']
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
                    $joinSql = " LEFT JOIN wp_project_pole_type p ON p.type_id = t.{$cfg['id']} ";
                    $subConditions[] = "p.project_id = :rid";
                    $params[':rid'] = $refId;
                } elseif ($code === 'installation' && !empty($refId)) {
                    $subConditions[] = "t.type_id = :rid";
                    $params[':rid'] = $refId;
                    if (!empty($project_id)) {
                        $subConditions[] = "t.project_id = :pid";
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
            $joinSql = " LEFT JOIN wp_project_pole_type p ON p.type_id = t.{$cfg['id']} ";
            $subConditions[] = "p.project_id = :ref_id";
            $subParams[':ref_id'] = $currentRefId;
            $extraSelect = ", p.project_id"; 
        } elseif ($code === 'installation' && !empty($currentRefId)) {
            $subConditions[] = " t.type_id = :ref_id ";
            $subParams[':ref_id'] = $currentRefId;
            if($currentProjectId) {
                $subConditions[] = " t.project_id = :proj_id ";
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
        $sql = "SELECT id, name as folder_name, parent_id, level FROM wp_folder WHERE id = :id AND status <> 'deleted' LIMIT 1";
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
    public function gets($id) {
        $pdo = $this->db;
        if (!$id) {
            return [
                "id" => "", "status" => "active", "cover" => "", "notification_status" => "no",
                "attachments" => [],
                "images" => [],
                "images360" => [],
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""]
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, cover FROM wp_content WHERE content_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $content = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            $title[$lang] = $row['content_subject'];
            $content[$lang] = $row['content_body'];
        }
        $stmt2 = $pdo->prepare("SELECT notification_status FROM wp_folder WHERE content_id = ? LIMIT 1");
        $stmt2->execute([$id]);
        $row_folder = $stmt2->fetch(PDO::FETCH_ASSOC);
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? and status = 'active'");
        $stmt->execute([$id]);
        $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $attachments = [];
        $images = [];
        $images360 = [];
        foreach ($media as $m) {
            $item = [
                "id" => $m['id'],
                "url" => $m['file_path'], 
                "name" => $m['file_name'],
                "size" => $m['file_size']
            ];
            if ($m['file_type'] === 'attachment') {
                $attachments[] = $item;
            } elseif ($m['file_type'] === 'image') {
                $images[] = $item;
            } elseif ($m['file_type'] === 'image360') {
                $images360[] = $item;
            }
        }
        return [
            "id" => $n['content_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "title" => $title,
            "content" => $content,
            "notification_status" => $row_folder ? $row_folder['notification_status'] : "no",
            "attachments" => $attachments,
            "images" => $images,
            "images360" => $images360
        ];
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
            case 'notification':
                $staticData = [
                    ['id' => 'yes', 'text' => 'Yes'],
                    ['id' => 'no', 'text' => 'No']
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
    public function saveContent($data) {
        $pdo = $this->db;
        $content_id = $data['content_id'] ?? null;
        $ex_cover = $data['ex_cover'] ?? null;
        $status = $data['status'] ?? 'active';
        $notification = $data['notification'] ?? 'no';
        $mediaHelper = new MediaHelper($pdo);
        try {
            $pdo->beginTransaction();
            if ($content_id) {
                $stmt = $pdo->prepare("UPDATE wp_content SET status = :status, updated_at = NOW() WHERE content_id = :content_id");
                $stmt->bindValue(':content_id', (int)$content_id, PDO::PARAM_INT);
            } else {
                $stmt = $pdo->prepare("INSERT INTO wp_content (status, created_at, updated_at, type) VALUES (:status, NOW(), NOW(), 'project')");
            }
            $stmt->bindValue(':status', $status);
            $stmt->execute();
            if (!$content_id) $content_id = $pdo->lastInsertId();
            $sqlItem = "INSERT INTO wp_content_item (content_id, content_subject, content_body, content_lang, created_at, updated_at) 
                        VALUES (:content_id, :subject, :body, :lang, NOW(), NOW()) 
                        ON DUPLICATE KEY UPDATE content_subject = VALUES(content_subject), content_body = VALUES(content_body), updated_at = NOW()";
            $stmtItem = $pdo->prepare($sqlItem);
            $langs = ['en', 'lo', 'th'];
            $all_html_content = "";
            foreach ($langs as $lang) {
                $subj = $data["title_$lang"] ?? '';
                $body = $data["content_$lang"] ?? '';
                $all_html_content .= $body;
                if ($subj !== '' || $body !== '') {
                    $stmtItem->execute([':content_id' => $content_id, ':subject' => $subj, ':body' => $body, ':lang' => $lang]);
                }
            }
            if(!$ex_cover) {
                $mediaHelper->deleteExistingCover($content_id, 'wp_content', 'cover');
            }
            if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                $mediaHelper->handleSingleUpload($content_id, $_FILES['cover']);
            }
            if ($data['content_id'] > 0) {
                $sql = "UPDATE wp_folder SET name = :name, updated_at = NOW(), notification_status = :notification WHERE content_id = :id";
                $stmtFolder = $pdo->prepare($sql);
                $stmtFolder->execute([
                    ':name' => $data["title_en"],
                    ':id'   => $data['content_id'],
                    ':notification' => $notification
                ]);
            } else {
                $parentId = (!empty($data['parent_id']) && $data['parent_id'] > 0) ? $data['parent_id'] : null;
                $ref_id = (!empty($data['ref_id']) && $data['ref_id'] > 0) ? $data['ref_id'] : null;
                $sql = "INSERT INTO wp_folder (name, parent_id, level, status, type, created_at, updated_at, ref_id, content_id, notification_status) VALUES (:name, :parent_id, :level, 'active', 'content', NOW(), NOW(), :ref_id, :content_id, :notification)";
                $stmtFolder = $pdo->prepare($sql);
                $stmtFolder->execute([
                    ':name'      => $data["title_en"],
                    ':parent_id' => $parentId,
                    ':level'     => $data['level'],
                    ':ref_id'    => $ref_id,
                    ':content_id' => $content_id,
                    ':notification' => $notification
                ]);
            }
            $mediaHelper->syncMedia($content_id, 'attachment', $data['existing_attachments'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image', $data['existing_images'] ?? []);
            $mediaHelper->syncMedia($content_id, 'image360', $data['existing_images360'] ?? []);
            $mediaHelper->handleMultiUpload($content_id, 'attachment', 'new_attachments');
            $mediaHelper->handleMultiUpload($content_id, 'image', 'new_images');
            $mediaHelper->handleMultiUpload($content_id, 'image360', 'new_images360');
            $this->notification($content_id, $notification);
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }
    public function notification($content_id, $notification) {
        $pdo = $this->db;
        $isExternalTrans = $pdo->inTransaction();
        try {
            if (!$isExternalTrans) $pdo->beginTransaction();
            if ($notification == 'yes') {
                $sql = "INSERT INTO wp_notification_targets (notifications_target, notifications_item, member_id, publish_at, status)
                        SELECT 'project', :nid, member_id, NOW(), 'published' 
                        FROM wp_members WHERE status = 'active'
                        ON DUPLICATE KEY UPDATE status = 'published', read_at = NULL";
                $pdo->prepare($sql)->execute([':nid' => $content_id]);
            } else {
                $stmt = $pdo->prepare("UPDATE wp_notification_targets SET status = :status, publish_at = NULL, read_at = NULL WHERE notifications_item = :id AND notifications_target = 'project'");
                $stmt->execute([':status' => 'draft', ':id' => $content_id]);
            }
            if (!$isExternalTrans) $pdo->commit();
        } catch (Exception $e) {
            if (!$isExternalTrans && $pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
    public function deleteContent($data) {
        $sql_folder = "UPDATE wp_folder SET status = 'deleted', updated_at = NOW() WHERE content_id = :id";
        $stmt_folder = $this->db->prepare($sql_folder);
        $res1 = $stmt_folder->execute([
            ':id' => $data['content_id']
        ]);
        $sql_content = "UPDATE wp_content SET status = 'deleted', updated_at = NOW() WHERE content_id = :id";
        $stmt_content = $this->db->prepare($sql_content);
        $res2 = $stmt_content->execute([
            ':id' => $data['content_id']
        ]);
        return ($res1 && $res2);
    }
}