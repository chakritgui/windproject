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
            . "&current=wind_speed_100m,wind_direction_100m,wind_speed_120m,wind_direction_120m"
            . "&wind_speed_unit=ms";
        $data = $this->fetchWithRetry($url);
        if (!$data) return [];
        $responses = isset($data[0]) ? $data : [$data];
        $output = [];
        foreach ($batch as $i => $s) {
            if (!isset($responses[$i]['current'])) continue;
            $current = $responses[$i]['current'];
            $ws100 = $current['wind_speed_100m'] ?? 0;
            $wd100 = $current['wind_direction_100m'] ?? 0;
            $ws120 = $current['wind_speed_120m'] ?? 0;
            $wd120 = $current['wind_direction_120m'] ?? 0;
            $alpha = 0.14;
            $ws150 = $ws100 * pow((150 / 100), $alpha);
            $ws200 = $ws100 * pow((200 / 100), $alpha);
            $output[] = [
                'station_id' => $s['poles_id'],
                'ws100'      => $ws100,
                'wd100'      => $wd100,
                'ws120'      => $ws120,
                'wd120'      => $wd120,
                'ws150'      => $ws150,
                'ws200'      => $ws200
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
                    calculated_150m,
                    calculated_200m,
                    source, 
                    created_at,
                    updated_at
                ) VALUES (
                    :station_id, 
                    :ws100, 
                    :wd100, 
                    :ws120, 
                    :wd120, 
                    :ws150,
                    :ws200,
                    :source, 
                    NOW(),
                    NOW()
                ) 
                ON DUPLICATE KEY UPDATE 
                    wind_speed_100m = VALUES(wind_speed_100m),
                    wind_direction_100m = VALUES(wind_direction_100m),
                    wind_speed_120m = VALUES(wind_speed_120m),
                    wind_direction_120m = VALUES(wind_direction_120m),
                    calculated_150m = VALUES(calculated_150m),
                    calculated_200m = VALUES(calculated_200m),
                    updated_at = NOW()";
        $stmt = $this->db->prepare($sql);
        foreach ($results as $row) {
            $stmt->execute([
                ':station_id' => $row['station_id'],
                ':ws100'      => $row['ws100'],
                ':wd100'      => $row['wd100'],
                ':ws120'      => $row['ws120'],
                ':wd120'      => $row['wd120'],
                ':ws150'      => $row['ws150'],
                ':ws200'      => $row['ws200'],
                ':source'     => 'open-meteo'
            ]);
        }
    }
    private function fetchWithRetry($url, $maxRetry = 3) {
        for ($i = 0; $i <= $maxRetry; $i++) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 15,
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
}