<?php
class fetchWindSpeed {
    private $db;
    private $levels = [
        "100m", "950hPa", "925hPa", "900hPa", "850hPa", "800hPa", 
        "700hPa", "600hPa", "500hPa", "400hPa", "300hPa", "250hPa", 
        "200hPa", "150hPa", "10hPa"
    ];
    public function __construct($db) {
        $this->db = $db;
    }
    public function getPoints() {
        $sql = "SELECT poles_id, poles_lat, poles_lng FROM wp_poles WHERE status <> 'deleted' AND poles_lat IS NOT NULL AND poles_lng IS NOT NULL";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }
    public function processBatch($batch) {
        $lats = []; $lngs = [];
        foreach ($batch as $s) {
            $lats[] = $s['poles_lat'];
            $lngs[] = $s['poles_lng'];
        }
        $apiParams = [];
        foreach ($this->levels as $lvl) {
            $apiParams[] = "wind_speed_{$lvl}";
            $apiParams[] = "wind_direction_{$lvl}";
        }
        $url = "https://api.open-meteo.com/v1/forecast?"
            . "latitude=" . implode(',', $lats)
            . "&longitude=" . implode(',', $lngs)
            . "&current=" . implode(',', $apiParams)
            . "&wind_speed_unit=ms";
        $data = $this->fetchWithRetry($url);
        if (!$data) return [];
        $responses = isset($data[0]) ? $data : [$data];
        $output = [];
        foreach ($batch as $i => $s) {
            if (!isset($responses[$i]['current'])) continue;
            $current = $responses[$i]['current'];
            $rowData = ['station_id' => $s['poles_id']];
            foreach ($this->levels as $lvl) {
                $speedCol = "wind_speed_{$lvl}";
                $dirCol = "wind_direction_{$lvl}";
                $rowData[$speedCol] = $current[$speedCol] ?? 0;
                $rowData[$dirCol] = $current[$dirCol] ?? 0;
            }
            $output[] = $rowData;
        }
        return $output;
    }
    public function saveBatch($results) {
        if (empty($results)) return;
        $cols = ["station_id", "source", "created_at", "updated_at"];
        $placeholders = [":station_id", ":source", "NOW()", "NOW()"];
        $updates = ["updated_at = NOW()"];
        foreach ($this->levels as $lvl) {
            $sCol = "wind_speed_{$lvl}";
            $dCol = "wind_direction_{$lvl}";
            $cols[] = $sCol;
            $cols[] = $dCol;
            $placeholders[] = ":{$sCol}";
            $placeholders[] = ":{$dCol}";
            $updates[] = "{$sCol} = VALUES({$sCol})";
            $updates[] = "{$dCol} = VALUES({$dCol})";
        }
        $sql = "INSERT INTO wp_wind_data (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $placeholders) . ") ON DUPLICATE KEY UPDATE " . implode(', ', $updates);
        $stmt = $this->db->prepare($sql);
        foreach ($results as $row) {
            $bindData = [
                ':station_id' => $row['station_id'],
                ':source'     => 'open-meteo'
            ];
            foreach ($this->levels as $lvl) {
                $sCol = "wind_speed_{$lvl}";
                $dCol = "wind_direction_{$lvl}";
                $bindData[":{$sCol}"] = $row[$sCol];
                $bindData[":{$dCol}"] = $row[$dCol];
            }
            $stmt->execute($bindData);
        }
    }
    private function fetchWithRetry($url, $maxRetry = 3) {
        for ($i = 0; $i <= $maxRetry; $i++) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_SSL_VERIFYPEER => false 
            ]);
            $response = curl_exec($ch);
            $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($code === 200 && $response) {
                return json_decode($response, true);
            }
            if ($code === 429) {
                sleep(pow(2, $i));
                continue;
            }
            break;
        }
        return null;
    }
    public function processSinglePoint($poles_id, $lat, $lng) {
        $apiParams = [];
        foreach ($this->levels as $lvl) {
            $apiParams[] = "wind_speed_{$lvl}";
            $apiParams[] = "wind_direction_{$lvl}";
        }
        $url = "https://api.open-meteo.com/v1/forecast?"
            . "latitude=" . $lat
            . "&longitude=" . $lng
            . "&current=" . implode(',', $apiParams)
            . "&wind_speed_unit=ms";
        $data = $this->fetchWithRetry($url);
        if (!$data || !isset($data['current'])) return false;
        $current = $data['current'];
        $rowData = ['station_id' => $poles_id];
        foreach ($this->levels as $lvl) {
            $speedCol = "wind_speed_{$lvl}";
            $dirCol = "wind_direction_{$lvl}";
            $rowData[$speedCol] = $current[$speedCol] ?? 0;
            $rowData[$dirCol] = $current[$dirCol] ?? 0;
        }
        $this->saveBatch([$rowData]);
        return true;
    }
}