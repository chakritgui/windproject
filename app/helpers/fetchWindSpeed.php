<?php
class fetchWindSpeed {
    private $db;
    public function __construct($db) {
        $this->db = $db;
    }
    public function getPoints() {
        $sql = "SELECT poles_id, poles_lat, poles_lng FROM wp_poles WHERE status <> 'deleted' AND poles_lat IS NOT NULL AND poles_lng IS NOT NULL";
        return $this->db->query($sql)->fetchAll(PDO::FETCH_ASSOC);
    }
    public function processBatch($batch) {
        $lats = [];
        $lngs = [];
        foreach ($batch as $s) {
            $lats[] = $s['poles_lat'];
            $lngs[] = $s['poles_lng'];
        }
        $url = "https://api.open-meteo.com/v1/forecast?"
            . "latitude=" . implode(',', $lats)
            . "&longitude=" . implode(',', $lngs)
            . "&current=wind_speed_100m,wind_direction_100m"
            . "&wind_speed_unit=ms";
        $data = $this->fetchWithRetry($url);
        if (!$data) return [];
        $results = is_array($data) ? $data : [$data];
        $output = [];
        foreach ($batch as $i => $s) {
            if (!isset($results[$i]['current'])) continue;
            $speed = $results[$i]['current']['wind_speed_100m'] ?? 0;
            $dir   = $results[$i]['current']['wind_direction_100m'] ?? 0;
            $alpha = 0.14;
            $speed_150 = $speed * pow((150/100), $alpha);
            $output[] = [
                'station_id' => $s['poles_id'],
                'speed'      => $speed,
                'dir'        => $dir,
                'speed150'   => $speed_150
            ];
        }
        return $output;
    }
    public function saveBatch($results) {
        $sql = "INSERT INTO wp_wind_data (
                    station_id, 
                    wind_speed_100m, 
                    wind_direction_100m, 
                    wind_speed_120m, 
                    wind_direction_120m, 
                    source, 
                    created_at
                ) VALUES (
                    :station_id, 
                    :ws100, 
                    :wd100, 
                    :ws120, 
                    :wd120, 
                    :source, 
                    NOW()
                ) 
                ON DUPLICATE KEY UPDATE 
                    wind_speed_100m = VALUES(wind_speed_100m),
                    wind_direction_100m = VALUES(wind_direction_100m),
                    wind_speed_120m = VALUES(wind_speed_120m),
                    wind_direction_120m = VALUES(wind_direction_120m),
                    updated_at = NOW()";
        $stmt = $this->db->prepare($sql);
        foreach ($results as $row) {
            $stmt->execute([
                ':station_id' => $row['station_id'],
                ':ws100'      => $row['wind_speed_100m'],
                ':wd100'      => $row['wind_direction_100m'],
                ':ws120'      => $row['wind_speed_120m'],
                ':wd120'      => $row['wind_direction_120m'],
                ':source'     => 'open-meteo'
            ]);
        }
    }
    private function fetchWithRetry($url, $maxRetry = 3) {
        for ($i = 0; $i <= $maxRetry; $i++) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10
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
}