<?php
use Box\Spout\Reader\Common\Creator\ReaderEntityFactory;
class WindModel{
    private PDO $db;
    public function __construct(){
        $this->db = Database::getInstance()->pdo;
    }
    public function list($start = 0, $length = 10, $filters = [], $search = '') {
        list($where, $params) = $this->buildListWhere($filters, $search);
        $sqlTotal = "SELECT COUNT(*) FROM wp_imports i {$where}";
        $stmt = $this->db->prepare($sqlTotal);
        $stmt->execute($params);
        $total = (int)$stmt->fetchColumn();
        $sql = "SELECT
                i.imports_id, 
                i.import_start, 
                i.import_end, 
                i.status, 
                i.import_record, 
                i.remark
            FROM wp_imports i
            {$where}
            ORDER BY i.imports_id DESC
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
    private function buildListWhere($filters, $search) {
        $where  = " WHERE 1=1 ";
        $params = [];
        if (!empty($filters['date'])) {
            $dateParts = explode(' - ', $filters['date']);
            if (count($dateParts) == 2) {
                $startObj = DateTime::createFromFormat('d/m/Y', trim($dateParts[0]));
                $endObj   = DateTime::createFromFormat('d/m/Y', trim($dateParts[1]));
                if ($startObj && $endObj) {
                    $startDate = $startObj->format('Y-m-d');
                    $endDate   = $endObj->format('Y-m-d');
                    $startDateUTC = convertTimeZoneUTC($startDate.' 00:00:00');
                    $endDateUTC   = convertTimeZoneUTC($endDate.' 23:59:59');
                    $where .= " AND (
                        (i.import_start BETWEEN :start AND :end)
                        OR
                        (i.import_end BETWEEN :start AND :end)
                    )";
                    $params[':start'] = $startDateUTC;
                    $params[':end']   = $endDateUTC;
                }
            }
        }
        if (!empty($search)) {
            $where .= " AND i.remark LIKE :search";
            $params[':search'] = "%{$search}%";
        }
        return [$where, $params];
    }
    private function formatImportRow(&$row) {
        foreach (['import_start', 'import_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
        if (!empty($row['import_record'])) {
            $row['import_record'] = number_format($row['import_record']);
        }
    }
    public function import(array $data): array{
        if (!isset($_FILES['wind_file'])) {
            return ['status' => false, 'message' => 'No file'];
        }
        if ($_FILES['wind_file']['error'] !== UPLOAD_ERR_OK) {
            return ['status' => false, 'message' => 'Upload error'];
        }
        $importId = null;
        $importStart = date('Y-m-d H:i:s');
        try {
            $stmt = $this->db->prepare("
                INSERT INTO wp_imports
                (import_start, status, import_record, remark)
                VALUES (:start, 'complete', 0, 'Importing...')
            ");
            $stmt->execute([
                ':start' => $importStart
            ]);
            $importId = (int)$this->db->lastInsertId();
            $importRecord = $this->handleFileImport($_FILES['wind_file']);
            $stmt = $this->db->prepare("UPDATE wp_imports
                SET
                    import_end = NOW(),
                    status = 'complete',
                    import_record = :cnt,
                    remark = :remark
                WHERE imports_id = :id
            ");
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
                $stmt = $this->db->prepare("UPDATE wp_imports
                    SET
                        import_end = NOW(),
                        status = 'failed',
                        remark = :remark
                    WHERE imports_id = :id
                ");
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
        $tmpDir = sys_get_temp_dir() . '/wind_import';
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
        $this->db->beginTransaction();
        try {
            $counter = 0;
            foreach ($csvFiles as $csv) {
                $counter += $importer->import($csv['file'], $csv['sheet']);
            }
            $this->db->commit();
        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
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
        $target = "{$dir}/uploaded.csv";
        move_uploaded_file($file['tmp_name'], $target);
        return $target;
    }
    private function detectImporter(): ImporterInterface{
        return new BatchImporter($this->db);
    }
    private function cleanup(string $dir): void {
        foreach (glob("$dir/*") as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        @rmdir($dir);
    }
}
interface ImporterInterface{
    public function import(string $csvPath, string $sheet): int;
}
class LoadDataImporter implements ImporterInterface{
    private PDO $db;
    public function __construct(PDO $db){
        $this->db = $db;
    }
    public function import(string $csvPath, string $sheet): int{
        $path = realpath($csvPath);
        if (!$path) {
            throw new Exception('CSV file not found');
        }
        $sql = "
            LOAD DATA LOCAL INFILE " . $this->db->quote($path) . "
            INTO TABLE wind_measurements
            FIELDS TERMINATED BY ','
            ENCLOSED BY '\"'
            LINES TERMINATED BY '\n'
            IGNORE 1 LINES
            (
                @no,  
                @contract,
                @project,
                @code,
                @type,
                @installation_qty,
                @year,
                @measure_date,
                @measure_time,
                @measure_datetime,
                @height_label,
                @height_level,
                @latitude,
                @longitude,
                @wind_speed,
                @wind_direction,
                @air_density,
                @pressure,
                @humidity,
                @temperature,
                @turbulence_intensity
            )
            SET
                contract = NULLIF(@contract,''),
                project  = NULLIF(@project,''),
                code     = NULLIF(@code,''),
                type     = NULLIF(@type,''),
                installation_qty = NULLIF(@installation_qty,''),
                year     = NULLIF(@year,''),
                measure_date = STR_TO_DATE(@measure_date, '%Y-%m-%d'),
                measure_time = STR_TO_DATE(@measure_time, '%h:%i %p'),
                measure_datetime = STR_TO_DATE(
                    CONCAT(
                        DATE(STR_TO_DATE(@measure_date, '%Y-%m-%d %H:%i:%s')),
                        ' ',
                        STR_TO_DATE(@measure_time, '%h:%i %p')
                    ),
                    '%Y-%m-%d %H:%i:%s'
                ),
                height_label = NULLIF(@height_label,''),
                height_level = NULLIF(@height_level,''),
                latitude  = NULLIF(@latitude,''),
                longitude = NULLIF(@longitude,''),
                wind_speed = NULLIF(@wind_speed,''),
                wind_direction = NULLIF(@wind_direction,''),
                air_density = NULLIF(@air_density,''),
                pressure = NULLIF(@pressure,''),
                humidity = NULLIF(@humidity,''),
                temperature = NULLIF(@temperature,''),
                turbulence_intensity = NULLIF(@turbulence_intensity,''),
                created_at = NOW()
        ";
        $affected = $this->db->exec($sql);
        return (int)$affected;
    }
}
class BatchImporter implements ImporterInterface{
    private PDO $db;
    private int $batchSize = 1000;
    public function __construct(PDO $db){
        $this->db = $db;
    }
    public function import(string $csvPath, string $sheet): int{
        $fp = fopen($csvPath, 'r');
        fgetcsv($fp); 
        $rows = [];
        $total = 0;
        while ($r = fgetcsv($fp)) {
            $rows[] = $r;
            if (count($rows) >= $this->batchSize) {
                $total += $this->insert($rows, $sheet);
                $rows = [];
            }
        }
        if ($rows) {
            $total += $this->insert($rows, $sheet);
        }
        fclose($fp);
        return $total;
    }
    private function insert(array $rows, string $sheet): int{
        $counter = 0;
        $sql = "INSERT INTO wp_winds
            (
                poles_id, year, wind_date, wind_time, wind_datetime, levels_id,
                latitude, longitude, wind_speed, wind_direction, air_density,
                pressure, humidity, temperature, turbulence_intensity
            )
            VALUES
            (
                :poles,:year,:d,:t,:dt,:lvl,
                :lat,:lng,:ws,:wd,:ad,
                :p,:h,:temp,:ti
            )
            ON DUPLICATE KEY UPDATE
                latitude = VALUES(latitude),
                longitude = VALUES(longitude),
                wind_speed = VALUES(wind_speed),
                wind_direction = VALUES(wind_direction),
                air_density = VALUES(air_density),
                pressure = VALUES(pressure),
                humidity = VALUES(humidity),
                temperature = VALUES(temperature),
                turbulence_intensity = VALUES(turbulence_intensity)
        ";
        $stmt = $this->db->prepare($sql);
        foreach ($rows as $r) {
            $contractName = trim($r[1]);
            $projectName  = trim($r[2]);
            $code         = trim($r[3]);
            $typeName     = trim($r[4]);
            $installation = $r[5];
            $year         = (int)$r[6];
            $windDateObj = DateTime::createFromFormat('Y-m-d H:i:s', trim($r[7]));
            $windTimeObj = DateTime::createFromFormat('h:i A', trim($r[8]));
            $windDateStr = $windDateObj?->format('Y-m-d');
            $windTimeStr = $windTimeObj?->format('H:i:s');
            $windDateTimeStr = ($windDateStr && $windTimeStr)
                ? "{$windDateStr} {$windTimeStr}"
                : null;
            $heightName  = trim($r[10]);
            $heightLevel = $r[11];
            $lat         = $r[12];
            $lng         = $r[13];
            $contractId = $this->getOrCreateId('contract_id', 'wp_contract', 'contract_name', $contractName);
            $projectId  = $this->getOrCreateProject($contractId, $projectName);
            $typeId     = $this->getOrCreateId('type_id', 'wp_type', 'type_name', $typeName);
            $heightId   = $this->getOrCreateId('height_id', 'wp_height', 'height_name', $heightName);
            $levelsId   = $this->getOrCreateHeightLevel($heightId, $heightLevel);
            $polesId = $this->getOrCreatePole([
                'code'        => $code,
                'project_id'  => $projectId,
                'type_id'     => $typeId,
                'installation'=> $installation,
                'lat'         => $lat,
                'lng'         => $lng
            ]);
            $stmt->execute([
                ':poles' => $polesId,
                ':year'  => $year,
                ':d'     => $windDateStr,
                ':t'     => $windTimeStr,
                ':dt'    => $windDateTimeStr,
                ':lvl'   => $levelsId,
                ':lat'   => $lat,
                ':lng'   => $lng,
                ':ws'    => $r[14],
                ':wd'    => $r[15],
                ':ad'    => $r[16],
                ':p'     => $r[17],
                ':h'     => $r[18],
                ':temp'  => $r[19],
                ':ti'    => $r[20],
            ]);
            $counter++;
        }
        return $counter;
    }
    private function getOrCreateId($column, $table, $keyColumn, $value, array $extra = []) {
        $sql = "SELECT {$column} FROM {$table} WHERE {$keyColumn} = :v LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':v' => $value]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }
        $cols = array_merge([$keyColumn], array_keys($extra));
        $params = array_merge([$value], array_values($extra));
        $sql = "INSERT INTO {$table} (" . implode(',', $cols) . ",created_at, updated_at) VALUES (" . rtrim(str_repeat('?,', count($cols)), ',') . ",NOW(), NOW())";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int)$this->db->lastInsertId();
    }
    private function getOrCreateProject($contractId, $projectName){
        $sql = "SELECT project_id FROM wp_project WHERE contract_id = :cid AND project_name = :projectName LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cid' => (int)$contractId,
            ':projectName' => $projectName
        ]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }
        $sql = "INSERT INTO wp_project (contract_id, project_name, created_at, updated_at) VALUES (:cid, :projectName, NOW(), NOW())";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':cid' => $contractId,
            ':projectName' => $projectName
        ]);
        return (int)$this->db->lastInsertId();
    }
    private function getOrCreateHeightLevel($heightId, $level){
        $sql = "SELECT levels_id FROM wp_height_levels WHERE height_id = :hid AND height_levels = :lvl LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':hid' => $heightId,
            ':lvl' => number_format((float)$level, 2, '.', '')
        ]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }
        $sql = "INSERT INTO wp_height_levels (height_id, height_levels, created_at, updated_at) VALUES (:hid, :lvl, NOW(), NOW())";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':hid' => $heightId,
            ':lvl' => number_format((float)$level, 2, '.', '')
        ]);
        return (int)$this->db->lastInsertId();
    }
    private function getOrCreatePole(array $data){
        $sql = "SELECT poles_id FROM wp_poles WHERE poles_code = :code LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':code' => $data['code']]);
        $id = $stmt->fetchColumn();
        if ($id) {
            return (int)$id;
        }
        $sql = "INSERT INTO wp_poles (poles_code, project_id, type_id, installation, poles_lat, poles_lng, status, created_at, updated_at) VALUES
            (:code,:project,:type,:install,:lat,:lng,'online',NOW(),NOW())";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':code'    => $data['code'],
            ':project' => $data['project_id'],
            ':type'    => $data['type_id'],
            ':install' => $data['installation'],
            ':lat'     => $data['lat'],
            ':lng'     => $data['lng'],
        ]);
        return (int)$this->db->lastInsertId();
    }
}