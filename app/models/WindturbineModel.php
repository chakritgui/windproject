<?php
class WindturbineModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function listGroupedByProject($filters = [], $search = '') {
        $sqlProjects = "SELECT project_id, project_name 
                        FROM wp_project 
                        WHERE status != 'deleted' 
                        ORDER BY ifnull(item_order, project_id) ASC";
        $stmtP = $this->db->prepare($sqlProjects);
        $stmtP->execute();
        $projects = $stmtP->fetchAll(PDO::FETCH_ASSOC);
        list($where, $params) = $this->buildListWhere($filters, $search);

        $sql = "SELECT
                    w.id, 
                    w.project_id,
                    p.project_name,
                    w.windturbine_lat,
                    w.windturbine_lng,
                    w.status,
                    w.created_at
                FROM wp_windturbine w
                LEFT JOIN wp_project p ON p.project_id = w.project_id
                {$where}
                ORDER BY p.project_name ASC, w.created_at DESC";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatDocumentRow($row);
        }
        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row['project_id']][] = $row;
        }
        $result = [];
        foreach ($projects as $project) {
            $pid = $project['project_id'];
            $result[] = [
                'project_id'   => $pid,
                'project_name' => $project['project_name'],
                'items'        => $grouped[$pid] ?? [] 
            ];
        }
        return $result;
    }
    private function buildListWhere($filters, $search) {
        $where  = " WHERE w.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND w.status = :status";
            $params[':status'] = $filters['status'];
        }
        if (!empty($filters['project'])) {
            $where .= " AND w.project_id = :project";
            $params[':project'] = $filters['project'];
        }
        if (!empty($search)) {
            $where .= " AND type_name LIKE :search ";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatDocumentRow(&$row) {
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
        $where = '';
        switch ($type) {
            case 'status':
                $staticData = [
                    ['id' => 'active', 'text' => 'Active'],
                    ['id' => 'inactive', 'text' => 'Inactive']
                ];
                if ($searchTerm !== '') {
                    $staticData = array_values(array_filter($staticData, function ($item) use ($searchTerm) {
                        return stripos($item['text'], $searchTerm) !== false;
                    }));
                }
                $totalCount = count($staticData);
                $items = array_slice($staticData, $offset, $limit);
                break;
            case 'project':
                $where = "WHERE status <> 'deleted'";
                if ($searchTerm !== '') {
                    $where .= " AND project_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_project {$where}");
                $stmtCount->execute($params);
                $totalCount = (int)$stmtCount->fetchColumn();
                $sql = "SELECT project_id AS id, project_name AS text
                        FROM wp_project
                        {$where}
                        ORDER BY project_id DESC
                        LIMIT :limit OFFSET :offset";   
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
        $sql = "UPDATE wp_windturbine SET status=?, updated_at=NOW() WHERE id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute(['deleted', (int)$id]);
    }
    public function clear(){
        $sql = "UPDATE wp_windturbine SET status = 'deleted' where status = 'active'";
        $this->db->exec($sql);
        return [
            'status'  => true,
        ];
    }
    public function import($data) {
        $file = $data['wind_file'];
        $mode = $data['import_mode']; 
        if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
            return ['status' => false, 'message' => 'Invalid file.'];
        }
        $filePath = $file['tmp_name'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $rows = [];
        try {
            if ($ext === 'csv') {
                $rows = $this->readCsvToArray($filePath);
            } elseif ($ext === 'xlsx') {
                $tmpDir = __DIR__ . '/../../storage/wind_import_tmp';
                if (!is_dir($tmpDir)) mkdir($tmpDir, 0777, true);
                $csvFiles = $this->convertXlsxToCsv($filePath, $tmpDir);
                if (!empty($csvFiles)) {
                    $rows = $this->readCsvToArray($csvFiles[0]['file']);
                    @unlink($csvFiles[0]['file']);
                }
            } else {
                return ['status' => false, 'message' => 'Unsupported file format.'];
            }
            if (empty($rows)) return ['status' => false, 'message' => 'No data found in file.'];
            $this->db->beginTransaction();
            $existingProjects = $this->db->query("SELECT project_name, project_id FROM wp_project")->fetchAll(PDO::FETCH_KEY_PAIR);
            $projectNamesInFile = array_unique(array_column($rows, 0)); 
            foreach ($projectNamesInFile as $name) {
                $name = trim($name);
                if ($name !== '' && !isset($existingProjects[$name])) {
                    $stmt = $this->db->prepare("INSERT INTO wp_project (project_name, created_at, updated_at) VALUES (?, NOW(), NOW())");
                    $stmt->execute([$name]);
                    $existingProjects[$name] = $this->db->lastInsertId();
                }
            }
            if ($mode === 'replace') {
                $this->db->query("UPDATE wp_windturbine SET status = 'deleted'"); 
            }
            $sql = "INSERT INTO wp_windturbine (project_id, windturbine_lat, windturbine_lng, status, created_at, updated_at) VALUES ";
            $placeholders = [];
            $values = [];
            foreach ($rows as $row) {
                $pName = trim($row[0]);
                $pId = $existingProjects[$pName] ?? null;
                $lat = $row[1];
                $lng = $row[2];
                if ($pId && is_numeric($lat) && is_numeric($lng)) {
                    $placeholders[] = "(?, ?, ?, 'active', NOW(), NOW())";
                    $values[] = $pId;
                    $values[] = $lat;
                    $values[] = $lng;
                }
            }
            if (!empty($placeholders)) {
                $sql .= implode(', ', $placeholders);
                $sql .= " ON DUPLICATE KEY UPDATE 
                            status = 'active', 
                            updated_at = NOW()";
                $stmt = $this->db->prepare($sql);
                $stmt->execute($values);
            }
            $this->db->commit();
            return ['status' => true, 'message' => 'Import completed successfully. Items processed: ' . count($placeholders)];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            return ['status' => false, 'message' => 'Error: ' . $e->getMessage()];
        }
    }
    private function readCsvToArray($path) {
        $data = [];
        if (($handle = fopen($path, "r")) !== FALSE) {
            fgetcsv($handle);
            while (($row = fgetcsv($handle)) !== FALSE) {
                if(!empty($row[0])) $data[] = $row;
            }
            fclose($handle);
        }
        return $data;
    }
    private function convertXlsxToCsv(string $xlsx, string $tmpDir): array {
        $reader = \Box\Spout\Reader\Common\Creator\ReaderEntityFactory::createXLSXReader();
        $reader->open($xlsx);
        $files = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            $name = preg_replace('/[^a-zA-Z0-9_]/', '_', $sheet->getName());
            $csvPath = "{$tmpDir}/{$name}.csv";
            $fp = fopen($csvPath, 'w');
            foreach ($sheet->getRowIterator() as $rowIndex => $row) {
                $cells = $row->toArray();
                if ($rowIndex === 1) { 
                    fputcsv($fp, $cells);
                    continue;
                }
                $cleanRow = $this->validateAndCleanRow($cells, $rowIndex, $sheet->getName());
                fputcsv($fp, $cleanRow);
            }
            fclose($fp);
            $files[] = ['sheet' => $name, 'file' => $csvPath];
        }
        $reader->close();
        return $files;
    }
    private function validateAndCleanRow(array $cells, int $rowIndex, string $sourceName): array {
        if (count($cells) < 3) {
            throw new Exception("[$sourceName] Row $rowIndex: Data is incomplete. Expected at least 3 columns (Project, Lat, Lng).");
        }
        $cleanRow = [];
        foreach ($cells as $index => $cell) {
            $value = $this->normalizeCell($cell);
            $colLetter = chr(65 + $index);
            if ($index <= 2) {
                if ($value === null || $value === '') {
                    throw new Exception("[$sourceName] Row $rowIndex: The value in column $colLetter must not be empty.");
                }
                if ($index === 1 || $index === 2) {
                    if (!is_numeric($value)) {
                        throw new Exception("[$sourceName] Row $rowIndex: Column $colLetter must contain a numeric coordinate value (Lat/Lng).");
                    }
                    $value = (float)$value;
                }
            }
            $cleanRow[] = $value;
        }
        return $cleanRow;
    }
    private function normalizeCell($cell): string {
        if ($cell instanceof DateTime) {
            return $cell->format('Y-m-d H:i:s');
        }
        if ($cell === null) return '';
        $value = trim(str_replace(["\r", "\n"], ' ', (string)$cell));
        if ($value === '') return '';
        $formats = ['j/n/Y H:i', 'd/m/Y H:i', 'd/m/Y H:i:s', 'd/m/Y h:i:s A', 'Y-m-d H:i:s'];
        foreach ($formats as $format) {
            $d = DateTime::createFromFormat($format, $value);
            if ($d && $d->format($format) === $value) {
                return $d->format('Y-m-d H:i:s');
            }
        }
        return $value;
    }
    public function updateStatus($id, $status) {
        $sql = "UPDATE wp_windturbine SET status=?, updated_at=NOW() WHERE id=?";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([$status, (int)$id]);
    }
    public function get($icon_type) {
        $sql = "SELECT * FROM wp_windturbind_icon WHERE icon_type = ? LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$icon_type]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['zoom_level'] = !empty($row['zoom_level']) ? json_decode($row['zoom_level'], true) : [];
            $row['zoom_val']   = !empty($row['zoom_val']) ? json_decode($row['zoom_val'], true) : [];
        }  
        return $row;
    }
    public function save($data) {
        try {
            $map_id = 1; 
            $icon_type = $_POST['icon_type'] ?? '';
            $icon_color = $_POST['icon_color'] ?? null;
            $zoom_raw = $_POST['zoom_settings'] ?? '[]';
            $zoom_settings = json_decode($zoom_raw, true);
            if (!is_array($zoom_settings)) $zoom_settings = [];
            $zoom_levels_json = json_encode(array_column($zoom_settings, 'zoom'));
            $zoom_vals_json   = json_encode(array_column($zoom_settings, 'val'));
            $final_cover = ($icon_type === 'windturbine') ? ($data['ex_cover'] ?? null) : null;
            $stmt = $this->db->prepare("SELECT id FROM wp_windturbind_icon WHERE map_id = ? AND icon_type = ? LIMIT 1");
            $stmt->execute([$map_id, $icon_type]);
            $existing_row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($existing_row) {
                $target_id = $existing_row['id'];
                $sql = "UPDATE wp_windturbind_icon SET cover = ?, zoom_level = ?, zoom_val = ?, updated_at = NOW(), icon_color = ? WHERE id = ?";
                $this->db->prepare($sql)->execute([$final_cover, $zoom_levels_json, $zoom_vals_json, $icon_color, $target_id]);
            } else {
                $sql = "INSERT INTO wp_windturbind_icon (map_id, icon_type, cover, zoom_level, zoom_val, created_at, updated_at, icon_color) VALUES (?, ?, ?, ?, ?, NOW(), NOW(), ?)";
                $this->db->prepare($sql)->execute([$map_id, $icon_type, $final_cover, $zoom_levels_json, $zoom_vals_json, $icon_color]);
                $target_id = $this->db->lastInsertId();
            }
            if($icon_type === 'windturbine') {
                if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
                    $this->handleFileUpload($target_id, $_FILES['cover']);
                } else if (empty($final_cover)) {
                    $this->handleFileDelete($target_id);
                }
            } else {
                $this->db->prepare("UPDATE wp_windturbind_icon SET cover = NULL WHERE id = ?")->execute([$target_id]);
            }
            return true; 
        } catch (Exception $e) {
            return [
                'status'  => false,
                'message' => $e->getMessage()
            ];
        }
    }
    private function handleFileUpload($id, $file) {
        $this->handleFileDelete($id);  
        $dir = "uploads/windturbine/";
        $baseDir = dirname(__DIR__, 2) . '/' . $dir;
        if (!is_dir($baseDir)) mkdir($baseDir, 0755, true);
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $image = false;
        switch ($ext) {
            case 'jpeg':
            case 'jpg':  $image = @imagecreatefromjpeg($file['tmp_name']); break;
            case 'png':   $image = @imagecreatefrompng($file['tmp_name']);  break;
            case 'gif':   $image = @imagecreatefromgif($file['tmp_name']);  break;
            case 'webp':  $image = @imagecreatefromwebp($file['tmp_name']); break;
        }
        if ($image) {
            $newName = $id . "_" . time() . ".webp";
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            $quality = 85;
            do {
                ob_start();
                imagewebp($image, null, $quality);
                $imageData = ob_get_contents();
                ob_end_clean();
                if (strlen($imageData) <= 1048576 || $quality <= 20) {
                    break;
                }
                $quality -= 10;
            } while ($quality > 10);
            if (file_put_contents($targetFull, $imageData)) {
                $this->db->prepare("UPDATE wp_windturbind_icon SET cover=? WHERE id =?")->execute([$dbPath, $id]);
            }
            imagedestroy($image);

        } else {
            $newName = $id . "_" . time() . "." . $ext;
            $targetFull = $baseDir . $newName;
            $dbPath = $dir . $newName;
            if (move_uploaded_file($file['tmp_name'], $targetFull)) {
                $this->db->prepare("UPDATE wp_windturbind_icon SET cover=? WHERE id =?")->execute([$dbPath, $id]);
            }
        }
    }
    private function handleFileDelete($id){
        $stmt = $this->db->prepare("SELECT cover FROM wp_windturbind_icon WHERE id = ?");
        $stmt->execute([$id]);
        $old = $stmt->fetchColumn();
        if (!$old) {
            return;
        }
        $basePath = realpath(dirname(__DIR__, 2));
        if ($basePath === false) {
            error_log("Base path not found");
            return;
        }
        $old = ltrim($old, '/');
        if (strpos($old, '..') !== false) {
            error_log("Invalid file path: " . $old);
            return;
        }
        $oldPath = $basePath . '/' . $old;
        if (!file_exists($oldPath)) {
            error_log("File not found: " . $oldPath);
            return;
        }
        if (!is_file($oldPath)) {
            error_log("Not a file: " . $oldPath);
            return;
        }
        $this->db->beginTransaction();
        try {
            if (!unlink($oldPath)) {
                throw new Exception("Cannot delete file: " . $oldPath);
            }
            $this->db->prepare("UPDATE wp_windturbind_icon SET cover = NULL WHERE id = ?")->execute([$id]);
            $this->db->commit();
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
        }
    }
    public function listByProject($projectId, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $where .= " AND w.project_id = :project_id";
        $params[':project_id'] = $projectId;
        $sql = "SELECT
                    w.id,
                    w.project_id,
                    p.project_name,
                    w.windturbine_lat,
                    w.windturbine_lng,
                    w.status,
                    w.created_at
                FROM wp_windturbine w
                LEFT JOIN wp_project p ON p.project_id = w.project_id
                {$where}
                ORDER BY w.created_at DESC";
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatDocumentRow($row);
        }
        return $rows;
    }
    public function deleteByProject($projectId) {
        $sql  = "UPDATE wp_windturbine SET status = 'deleted', updated_at=NOW() WHERE project_id = :project_id AND status != 'deleted'";
        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':project_id', $projectId);
        return $stmt->execute();
    }
}