<?php
class WindModel {
    private $db;
    public function __construct() {
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
                i.imports_file, 
                i.import_start, 
                i.import_end, 
                i.status, 
                i.import_record, 
                i.import_type, 
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
                    $startDateUTC = convertTimeZoneUTC($startDate, 'Y-m-d');
                    $endDateUTC   = convertTimeZoneUTC($endDate, 'Y-m-d');
                    $where .= " AND (DATE(i.import_start) BETWEEN :start AND :end OR DATE(i.import_end) BETWEEN :start AND :end)";
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
        if (!empty($row['import_start'])) {
            $row['import_start'] = convertTimeZone($row['import_start'], 'd/m/Y H:i:s');
        }
        if (!empty($row['import_record'])) {
            $row['import_record'] = number_format($row['import_record']);
        }
        foreach (['import_end', 'import_end'] as $f) {
            if (!empty($row[$f])) {
                $row[$f] = convertTimeZone($row[$f], 'd/m/Y H:i:s');
            }
        }
    }
    public function get($id){
        return [
            "id"=>$id,
            "station"=>"สถานีลมตัวอย่าง #".$id,
            "wind_speed"=> rand(0,60),
            "wind_direction"=>"NE",
            "lat"=>14.25,
            "lng"=>100.75,
            "updated_at"=>date("Y-m-d H:i:s"),
            "status"=>"ok"
        ];
    }
}