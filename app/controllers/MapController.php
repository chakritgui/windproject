<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/MapModel.php';
class  MapController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new MapModel(); }
    public function master() {
        $this->json($this->model->master());
    }
    public function windarea() {
        $this->json($this->model->windarea());
    }
    public function poleslocation() {
        $result = $this->model->poleslocation();
        $this->json($result);
    }
    public function project() {
        $contract_id = (int)$this->input('contract_id', 0);
        $this->json($this->model->project($contract_id));
    }
    public function type() {
        $project_id = (int)$this->input('project_id', 0);
        $this->json($this->model->type($project_id));
    }
    public function station() {
        $project_id = (int)$this->input('project_id', 0);
        $type_id    = (int)$this->input('type_id', 0);
        $this->json($this->model->station($project_id, $type_id));
    }
    public function poledetails() {
        $input = json_decode(file_get_contents('php://input'), true);
        $poles_id = $input['id'] ?? ($_POST['id'] ?? 0);
        $start = $input['start'] ?? ($_POST['start'] ?? '');
        $end = $input['end'] ?? ($_POST['end'] ?? '');
        $height = $input['height'] ?? ($_POST['height'] ?? '');
        $result = $this->model->poledetails($poles_id, $start, $end, $height);
        $this->json($result);
    }
    public function height() {
        $page = intval($_POST['page'] ?? 0);
        $limit = intval($_POST['limit'] ?? 10);
        $searchTerm = $_POST['searchTerm'] ?? '';
        $poles_id = $_POST['poles_id'] ?? '';
        $this->json(['status'=>true , 'data' => $this->model->height($page, $limit, $searchTerm, $poles_id)]);
    }
    protected function input($key = null, $default = null) {
        static $data = null;
        if ($data === null) {
            $json = json_decode(file_get_contents('php://input'), true);
            $data = is_array($json) ? $json : [];
            $data = array_merge($_GET, $_POST, $data);
        }
        if ($key === null) {
            return $data;
        }
        return $data[$key] ?? $default;
    }
    public function windturbines() {
        $this->json($this->model->windturbines());
    }
    public function weatherProxy() {
        $lat    = $_GET['latitude']  ?? '';
        $lng    = $_GET['longitude'] ?? '';
        $apiKey = 'bb3dbebb270f08db6036bb5c4d01cc70';
        if (!$lat || !$lng) {
            http_response_code(400);
            echo json_encode(['error' => true, 'reason' => 'Missing coordinates']);
            return;
        }
        $lat = preg_replace('/[^0-9.,\-]/', '', $lat);
        $lng = preg_replace('/[^0-9.,\-]/', '', $lng);
        $latArr   = explode(',', $lat);
        $lngArr   = explode(',', $lng);
        $CACHE_TTL = 7200;
        $cacheDir  = sys_get_temp_dir() . '/wind_cache';
        if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
        $results    = [];
        $fetchQueue = [];
        foreach ($latArr as $i => $la) {
            $lo        = trim($lngArr[$i]);
            $la        = trim($la);
            $cacheKey  = round((float)$la, 2) . '_' . round((float)$lo, 2);
            $cacheFile = "{$cacheDir}/{$cacheKey}.json";
            if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $CACHE_TTL) {
                $results[$i] = json_decode(file_get_contents($cacheFile), true);
            } else {
                $results[$i]    = null;
                $fetchQueue[$i] = ['lat' => $la, 'lng' => $lo, 'cacheFile' => $cacheFile];
            }
        }
        if (!empty($fetchQueue)) {
            $multiHandle = curl_multi_init();
            $curlHandles = [];
            foreach ($fetchQueue as $i => $item) {
                $url = "https://api.openweathermap.org/data/2.5/weather"
                    . "?lat={$item['lat']}&lon={$item['lng']}&appid={$apiKey}&units=metric";
                $ch  = curl_init($url);
                curl_setopt_array($ch, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT        => 10,
                ]);
                curl_multi_add_handle($multiHandle, $ch);
                $curlHandles[$i] = $ch;
            }
            $running = null;
            do {
                curl_multi_exec($multiHandle, $running);
                curl_multi_select($multiHandle);
            } while ($running > 0);
            foreach ($fetchQueue as $i => $item) {
                $ch       = $curlHandles[$i];
                $res      = curl_multi_getcontent($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_multi_remove_handle($multiHandle, $ch);
                curl_close($ch);
                if ($httpCode === 200) {
                    $json   = json_decode($res, true);
                    $record = [
                        'current' => [
                            'wind_speed_100m'     => round($json['wind']['speed'] ?? 0, 2),
                            'wind_direction_100m' => $json['wind']['deg']          ?? 0,
                            'wind_gusts_10m'      => round($json['wind']['gust']   ?? 0, 2),
                        ]
                    ];
                    file_put_contents($item['cacheFile'], json_encode($record));
                    $results[$i] = $record;
                } elseif ($httpCode === 429 && file_exists($item['cacheFile'])) {
                    $results[$i] = json_decode(file_get_contents($item['cacheFile']), true);
                } else {
                    $results[$i] = ['current' => [
                        'wind_speed_100m'     => null,
                        'wind_direction_100m' => null,
                        'wind_gusts_10m'      => null,
                    ]];
                }
            }
            curl_multi_close($multiHandle);
            ksort($results);
        }
        header('Content-Type: application/json');
        echo json_encode(count($results) === 1 ? $results[0] : array_values($results));
    }
    public function weatherCurrent() {
        $lat = $_GET['lat'] ?? '';
        $lon = $_GET['lon'] ?? '';
        if (!$lat || !$lon) {
            http_response_code(400);
            echo json_encode(['error' => true, 'reason' => 'Missing coordinates']);
            return;
        }
        $lat = preg_replace('/[^0-9.\-]/', '', $lat);
        $lon = preg_replace('/[^0-9.\-]/', '', $lon);
        $CACHE_TTL = 1800;
        $cacheDir  = sys_get_temp_dir() . '/weather_current_cache';
        if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
        $cacheKey  = round((float)$lat, 2) . '_' . round((float)$lon, 2);
        $cacheFile = "{$cacheDir}/{$cacheKey}.json";
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $CACHE_TTL) {
            header('Content-Type: application/json');
            echo file_get_contents($cacheFile);
            return;
        }
        $apiKey = 'bb3dbebb270f08db6036bb5c4d01cc70';
        $urls = [
            'weather' => "https://api.openweathermap.org/data/2.5/weather?lat={$lat}&lon={$lon}&appid={$apiKey}&units=metric",
            'air'     => "https://api.openweathermap.org/data/2.5/air_pollution?lat={$lat}&lon={$lon}&appid={$apiKey}",
        ];
        $multi   = curl_multi_init();
        $handles = [];
        foreach ($urls as $key => $url) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
            curl_multi_add_handle($multi, $ch);
            $handles[$key] = $ch;
        }
        $running = null;
        do {
            curl_multi_exec($multi, $running);
            curl_multi_select($multi);
        } while ($running > 0);
        $responses = [];
        foreach ($handles as $key => $ch) {
            $responses[$key] = [
                'body' => curl_multi_getcontent($ch),
                'code' => curl_getinfo($ch, CURLINFO_HTTP_CODE),
            ];
            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);
        }
        curl_multi_close($multi);
        $w   = $responses['weather']['code'] === 200 ? json_decode($responses['weather']['body'], true) : null;
        $air = $responses['air']['code']     === 200 ? json_decode($responses['air']['body'],     true) : null;
        $result = [
            'temperature'  => $w ? round($w['main']['temp'],     1) : null,
            'humidity'     => $w ? round($w['main']['humidity'], 0) : null,
            'wind_speed'   => $w ? round($w['wind']['speed'],    1) : null, // m/s
            'precipitation'=> $w ? round($w['rain']['1h']        ?? 0, 1) : null,
            'pm25'         => $air ? round($air['list'][0]['components']['pm2_5'] ?? 0, 1) : null,
        ];
        header('Content-Type: application/json');
        $json = json_encode($result);
        file_put_contents($cacheFile, $json);
        echo $json;
    }
}