<?php
class WindturbineModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 3, $orderDir = 'desc') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_windturbine w {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'created_at';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            0 => "p.project_name",
            1 => "w.windturbine_lat",
            2 => "w.windturbine_lng",
            3 => "w.created_at",
            4 => "w.status"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                w.id, 
                p.project_name,
                w.windturbine_lat,
                w.windturbine_lng,
                w.status,
                w.created_at
            FROM wp_windturbine w
            LEFT JOIN wp_project p ON p.project_id = w.project_id
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
        $where  = " WHERE w.status != 'deleted' ";
        $params = [];
        if (!empty($filters['status'])) {
            $where .= " AND status = :status";
            $params[':status'] = $filters['status'];
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
                if ($searchTerm !== '') {
                    $where = "WHERE project_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_project {$where}");
                $stmtCount->execute($params);
                $totalCount = (int)$stmtCount->fetchColumn();
                $sql = "SELECT project_id AS id, project_name AS text
                    FROM wp_project
                    {$where}
                    ORDER BY project_id DESC
                    LIMIT :limit OFFSET :offset
                ";
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
}