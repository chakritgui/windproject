<?php
use Box\Spout\Reader\Common\Creator\ReaderEntityFactory;
class WindModel{
    private PDO $db;
    public function __construct(){
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '', $colIndex = 4, $orderDir = 'desc') {
        list($whereBase, $whereJoin, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_winds w LEFT JOIN wp_poles p ON p.poles_id = w.poles_id
            LEFT JOIN wp_project pj ON pj.project_id = p.project_id
            LEFT JOIN wp_type t ON t.type_id = p.type_id
            LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
            LEFT JOIN wp_height_levels l ON l.levels_id = w.levels_id
            LEFT JOIN wp_height h ON h.height_id = l.height_id
            {$whereBase}
            {$whereJoin}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $order = 'w.wind_datetime';
        $orderDir = strtolower($orderDir) === 'desc' ? 'desc' : 'asc';
        $orderMap = [
            1 => "p.poles_code",
            2 => "pj.project_name",
            3 => "t.type_name",
            4 => "i.installations_name",
            5 => "w.year",
            6 => "w.wind_datetime",
            7 => "h.height_name",
            8 => "l.height_levels",
            9 => "w.wind_speed",
            10 => "w.wind_direction",
            11 => "w.air_density",
            12 => "w.pressure",
            13 => "w.humidity",
            14 => "w.temperature",
            15 => "w.turbulence_intensity"
        ];
        if (isset($orderMap[$colIndex])) {
            $order = $orderMap[$colIndex];
        }
        $sql = "SELECT
                w.id,
                w.poles_id,
                p.poles_code,
                pj.project_name,
                t.type_name,
                i.installations_name,
                h.height_name,
                l.height_levels,
                w.year,
                w.wind_datetime,
                w.levels_id,
                w.wind_speed,
                w.wind_direction,
                w.air_density,
                w.pressure,
                w.humidity,
                w.temperature,
                w.turbulence_intensity
            FROM wp_winds w
            LEFT JOIN wp_poles p ON p.poles_id = w.poles_id
            LEFT JOIN wp_project pj ON pj.project_id = p.project_id
            LEFT JOIN wp_type t ON t.type_id = p.type_id
            LEFT JOIN wp_installations i ON i.installations_id = p.installations_id
            LEFT JOIN wp_height_levels l ON l.levels_id = w.levels_id
            LEFT JOIN wp_height h ON h.height_id = l.height_id
            {$whereBase}
            {$whereJoin}
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
            $this->formatImportRow($row);
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    public function history($start = 0, $length = 10): array{
        $sqlTotal = "SELECT COUNT(*) FROM wp_imports";
        $total = (int)$this->db->query($sqlTotal)->fetchColumn();
        $sql = "SELECT
                import_start,
                import_end,
                status,
                import_record,
                remark
            FROM wp_imports
        ";
        if ($length != -1) {
            $sql .= " LIMIT :offset, :length";
        }
        $stmt = $this->db->prepare($sql);
        if ($length != -1) {
            $stmt->bindValue(':offset', (int)$start, PDO::PARAM_INT);
            $stmt->bindValue(':length', (int)$length, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $this->formatImportRow($row);
        }
        return [
            'total' => $total,
            'data'  => $rows
        ];
    }
    private function buildListWhere($filters, $search) {
        $whereBase  = " WHERE w.status = 'active' ";
        $whereJoin  = "";
        $params     = [];
        if (!empty($filters['date'])) {
            $dateParts = explode(' - ', $filters['date']);
            if (count($dateParts) === 2) {
                $startObj = DateTime::createFromFormat('d/m/Y', trim($dateParts[0]));
                $endObj   = DateTime::createFromFormat('d/m/Y', trim($dateParts[1]));
                $startDateUTC = convertTimeZoneUTC(
                    $startObj->format('Y-m-d') . ' 00:00:00'
                );
                $endDateUTC = convertTimeZoneUTC(
                    $endObj->format('Y-m-d') . ' 23:59:59'
                );
                $whereBase .= " AND w.wind_datetime BETWEEN :date_start AND :date_end ";
                $params[':date_start'] = $startDateUTC;
                $params[':date_end']   = $endDateUTC;
            }
        }
        if (!empty($filters['project'])) {
            $whereJoin .= " AND pj.project_id = :project ";
            $params[':project'] = $filters['project'];
        }
        if (!empty($filters['pole'])) {
            $whereJoin .= " AND p.poles_id = :pole ";
            $params[':pole'] = $filters['pole'];
        }
        if (!empty($filters['type'])) {
            $whereJoin .= " AND t.type_id = :type ";
            $params[':type'] = $filters['type'];
        }
        if (!empty($filters['installation'])) {
            $whereJoin .= " AND i.installations_id = :installation ";
            $params[':installation'] = $filters['installation'];
        }
        if (!empty($filters['height'])) {
            $whereJoin .= " AND l.levels_id = :height ";
            $params[':height'] = $filters['height'];
        }
        if (!empty($search)) {
            $whereJoin .= " AND (
                p.poles_code LIKE :search OR
                pj.project_name LIKE :search OR
                t.type_name LIKE :search OR
                i.installations_name LIKE :search OR
                h.height_name LIKE :search OR
                l.height_levels LIKE :search OR
                w.year LIKE :search
            ) ";
            $params[':search'] = "%{$search}%";
        }
        return [$whereBase, $whereJoin, $params];
    }
    private function formatImportRow(&$row) {
        foreach (['wind_datetime'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y h:i A');
            }
        }
        foreach (['import_start', 'import_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
        if (!empty($row['import_record'])) {
            $row['import_record'] = number_format($row['import_record']);
        }
    }
    public function clear(){
        $sql = "UPDATE wp_winds SET status = 'deleted' where status = 'active'";
        $this->db->exec($sql);
        return [
            'status'  => true,
        ];
    }
    public function import(array $data): array{
        if (!isset($_FILES['wind_file'])) {
            return ['status' => false, 'message' => 'No file'];
        }
        if ($_FILES['wind_file']['error'] !== UPLOAD_ERR_OK) {
            return ['status' => false, 'message' => 'Upload error'];
        }
        $importId = null;
        try {
            $stmt = $this->db->prepare("INSERT INTO wp_imports (import_start, status, import_record, remark) VALUES (NOW(), 'complete', 0, 'Importing...')");
            $stmt->execute();
            $importId = (int)$this->db->lastInsertId();
            $importRecord = $this->handleFileImport($_FILES['wind_file']);
            $stmt = $this->db->prepare("UPDATE wp_imports SET import_end = NOW(), status = 'complete', import_record = :cnt, remark = :remark WHERE imports_id = :id");
            $stmt->execute([
                ':cnt'    => $importRecord,
                ':remark' => 'Import success',
                ':id'     => $importId
            ]);
            return [
                'status'  => true,
                'message' => 'Import success',
                'record'  => $importRecord
            ];
        } catch (Throwable $e) {
            if ($importId) {
                $stmt = $this->db->prepare("UPDATE wp_imports SET import_end = NOW(), status = 'failed', remark = :remark WHERE imports_id = :id");
                $stmt->execute([
                    ':remark' => $e->getMessage(),
                    ':id'     => $importId
                ]);
            }
            return [
                'status'  => false,
                'message' => $e->getMessage()
            ];
        }
    }
    private function handleFileImport(array $file): int {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $tmpDir = __DIR__ . '/../../storage/wind_import';
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0777, true);
        }
        if ($ext === 'xlsx') {
            $csvFiles = $this->convertXlsxToCsv($file['tmp_name'], $tmpDir);
        } elseif ($ext === 'csv') {
            $csvFiles = [[
                'sheet' => 'DEFAULT',
                'file'  => $this->moveUploadedCsv($file, $tmpDir)
            ]];
        } else {
            throw new Exception('Unsupported file type');
        }
        $importer = $this->detectImporter();
        $counter = 0;
        foreach ($csvFiles as $csv) {
            $counter += $importer->import($csv['file'], $csv['sheet']);
        }
        $this->cleanup($tmpDir);
        return $counter;
    }
    private function normalizeCell($cell): string{
        if ($cell instanceof DateTime) {
            return $cell->format('Y-m-d H:i:s');
        }
        if ($cell === null) {
            return '';
        }
        $value = (string)$cell;
        $value = str_replace(["\r", "\n"], ' ', $value);
        $value = trim($value);
        return mb_convert_encoding($value, 'UTF-8', 'auto');
    }
    private function convertXlsxToCsv(string $xlsx, string $tmpDir): array {
        $reader = ReaderEntityFactory::createXLSXReader();
        $reader->open($xlsx);
        $files = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            $name = preg_replace('/[^a-zA-Z0-9_]/', '_', $sheet->getName());
            $csv  = "{$tmpDir}/{$name}.csv";
            $fp   = fopen($csv, 'w');
            foreach ($sheet->getRowIterator() as $row) {
                $cleanRow = [];
                foreach ($row->toArray() as $cell) {
                    $cleanRow[] = $this->normalizeCell($cell);
                }
                fputcsv($fp, $cleanRow);
            }
            fclose($fp);
            $files[] = ['sheet' => $name, 'file' => $csv];
        }
        $reader->close();
        return $files;
    }
    private function moveUploadedCsv(array $file, string $dir): string{
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new Exception('Invalid uploaded file');
        }
        $filename = $this->generateFilename('import', 'csv');
        $target   = $dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $target)) {
            throw new Exception('Failed to move uploaded CSV');
        }
        return $target;
    }
    private function detectImporter(): ImporterInterface{
        return new LoadDataStagingImporter($this->db);
    }
    private function generateFilename(string $prefix, string $ext): string{
        return sprintf(
            '%s_%s_%s.%s',
            $prefix,
            date('Ymd_His'),
            bin2hex(random_bytes(4)),
            $ext
        );
    }
    private function cleanup(string $dir): void {
        foreach (glob("$dir/*") as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
    }
    public function filter($page = 1, $limit = 10, $type = '', $searchTerm = ''){
        $offset = max(0, ($page - 1) * $limit);
        $items = [];
        $totalCount = 0;
        $params = [];
        switch ($type) {
            case 'project':
                $where = "";
                if ($searchTerm !== '') {
                    $where = "WHERE project_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_project {$where}");
                $stmtCount->execute($params);
                $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
                $sql = "SELECT project_id AS id, project_name AS text FROM wp_project {$where} ORDER BY project_id DESC LIMIT :limit OFFSET :offset";
                break;
            case 'pole':
                $where = "";
                if ($searchTerm !== '') {
                    $where = "WHERE poles_code LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_poles {$where}");
                $stmtCount->execute($params);
                $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
                $sql = "SELECT poles_id AS id, poles_code AS text FROM wp_poles {$where} ORDER BY poles_id DESC LIMIT :limit OFFSET :offset";
                break;
            case 'type':
                $where = "";
                if ($searchTerm !== '') {
                    $where = "WHERE type_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_type {$where}");
                $stmtCount->execute($params);
                $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
                $sql = "SELECT type_id AS id, type_name AS text FROM wp_type {$where} ORDER BY type_id ASC LIMIT :limit OFFSET :offset";
                break;
            case 'installation':
                $where = "";
                if ($searchTerm !== '') {
                    $where = "WHERE installations_name LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_installations {$where}");
                $stmtCount->execute($params);
                $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
                $sql = "SELECT installations_id AS id, installations_name AS text FROM wp_installations {$where} ORDER BY installations_id ASC LIMIT :limit OFFSET :offset";
                break;
            case 'height':
                $where = "";
                if ($searchTerm !== '') {
                    $where = "WHERE h.height_name LIKE :search OR l.height_levels LIKE :search";
                    $params[':search'] = "%{$searchTerm}%";
                }
                $join = "LEFT JOIN wp_height_levels l ON l.height_id = h.height_id";
                $stmtCount = $this->db->prepare("SELECT COUNT(*) FROM wp_height h {$join} {$where}");
                $stmtCount->execute($params);
                $totalCount = $stmtCount->fetch(PDO::FETCH_OBJ)->total;
                $sql = "SELECT l.levels_id AS id, CONCAT(h.height_name,' ',l.height_levels) AS text FROM wp_height h {$join} {$where} ORDER BY h.height_id ASC, l.levels_id ASC LIMIT :limit OFFSET :offset";
                break;
            default:
                return ['items' => [], 'total_count' => 0];
        }
        $stmt = $this->db->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
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
}
interface ImporterInterface{
    public function import(string $csvPath, string $sheet): int;
}
class LoadDataStagingImporter implements ImporterInterface {
    private PDO $db;
    public function __construct(PDO $db){
        $this->db = $db;
    }
    public function import(string $csvPath, string $sheet): int {
        $path = realpath($csvPath);
        if (!$path) {
            throw new Exception('CSV file not found');
        }
        $this->db->exec("TRUNCATE TABLE wind_staging");
        $sql = "
            LOAD DATA LOCAL INFILE " . $this->db->quote($path) . "
            INTO TABLE wind_staging
            FIELDS TERMINATED BY ',' ENCLOSED BY '\"'
            LINES TERMINATED BY '\n'
            IGNORE 1 LINES
            (
                @no,
                contract_name,
                project_name,
                poles_code,
                type_name,
                installations_name,
                year,
                @dt,
                height_name,
                height_level,
                lat,
                lng,
                wind_speed,
                wind_direction,
                air_density,
                pressure,
                humidity,
                temperature,
                turbulence_intensity
            )
            SET measure_datetime = CONVERT_TZ(STR_TO_DATE(@dt,'%Y-%m-%d %H:%i:%s'), '+07:00', '+00:00')
        ";
        $rows = (int)$this->db->exec($sql);
        $this->syncMasters();
        $this->mergeWinds();
        return $rows;
    }
    private function syncMasters(): void {
        $this->db->exec("INSERT IGNORE INTO wp_contract (contract_name, created_at, updated_at)
            SELECT DISTINCT contract_name, NOW(), NOW() FROM wind_staging
        ");
        $this->db->exec("INSERT IGNORE INTO wp_project (contract_id, project_name, created_at, updated_at)
            SELECT c.contract_id, s.project_name, NOW(), NOW() FROM wind_staging s JOIN wp_contract c ON c.contract_name = s.contract_name
        ");
        $this->db->exec("INSERT IGNORE INTO wp_type (type_name, created_at, updated_at)
            SELECT DISTINCT type_name, NOW(), NOW() FROM wind_staging
        ");
        $this->db->exec("INSERT IGNORE INTO wp_project_pole_type (project_id, type_id, created_at)
            SELECT 
               p.project_id, t.type_id, NOW()
            FROM 
                wind_staging s
            JOIN wp_project p ON p.project_name = s.project_name
            JOIN wp_type t ON t.type_name = s.type_name
        ");
        $this->db->exec("INSERT IGNORE INTO wp_height (height_name, created_at, updated_at)
            SELECT DISTINCT height_name, NOW(), NOW() FROM wind_staging
        ");
        $this->db->exec("INSERT IGNORE INTO wp_height_levels (height_id, height_levels, created_at, updated_at)
            SELECT h.height_id, s.height_level, NOW(), NOW() FROM wind_staging s JOIN wp_height h ON h.height_name = s.height_name
        ");
        $this->db->exec("INSERT IGNORE INTO wp_installations (project_id, type_id, installations_name, created_at, updated_at)
            SELECT 
               p.project_id, t.type_id, s.installations_name, NOW(), NOW() 
            FROM 
                wind_staging s
            JOIN wp_project p ON p.project_name = s.project_name
            JOIN wp_type t ON t.type_name = s.type_name
            WHERE s.installations_name IS NOT NULL
        ");
        $this->db->exec("INSERT IGNORE INTO wp_poles
            (poles_code, project_id, type_id, installations_id, poles_lat, poles_lng, status, created_at, updated_at)
            SELECT
                s.poles_code,
                p.project_id,
                t.type_id,
                i.installations_id,
                s.lat,
                s.lng,
                'online',
                NOW(), NOW()
            FROM wind_staging s
            JOIN wp_project p ON p.project_name = s.project_name
            JOIN wp_contract c ON c.contract_name = s.contract_name AND p.contract_id = c.contract_id
            JOIN wp_type t ON t.type_name = s.type_name
            JOIN wp_installations i ON i.installations_name = s.installations_name and i.project_id = p.project_id and i.type_id = t.type_id
        ");
    }
    private function mergeWinds(): void {
        $this->db->exec("INSERT INTO wp_winds
            (poles_id, year, wind_datetime, levels_id, wind_speed, wind_direction, air_density, pressure, humidity, temperature, turbulence_intensity)
            SELECT
                p.poles_id,
                s.year,
                s.measure_datetime,
                hl.levels_id,
                s.wind_speed,
                s.wind_direction,
                s.air_density,
                s.pressure,
                s.humidity,
                s.temperature,
                s.turbulence_intensity
            FROM wind_staging s
            JOIN wp_poles p ON p.poles_code = s.poles_code
            JOIN wp_height h ON h.height_name = s.height_name
            JOIN wp_height_levels hl ON hl.height_id = h.height_id AND hl.height_levels = s.height_level
            ON DUPLICATE KEY UPDATE
                wind_speed = VALUES(wind_speed),
                wind_direction = VALUES(wind_direction),
                air_density = VALUES(air_density),
                pressure = VALUES(pressure),
                humidity = VALUES(humidity),
                temperature = VALUES(temperature),
                turbulence_intensity = VALUES(turbulence_intensity),
                status = 'active'
        ");
    }
}