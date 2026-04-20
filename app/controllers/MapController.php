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
    public function weatherCurrent() {
        $lat = $_GET['lat'] ?? '';
        $lon = $_GET['lon'] ?? '';
        $level = $_GET['level'] ?? '';
        if(empty($level)) {
            $level = $this->model->getSetting('DEFAULT_LEVEL');
        }
        echo $suffix = ($level === '100m') ? '100m' : $level . 'Pa';
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
            'wind'    => "https://api.open-meteo.com/v1/forecast?latitude={$lat}&longitude={$lon}&current=wind_speed_{$suffix},wind_direction_{$suffix}&wind_speed_unit=ms"
        ];
        echo "https://api.open-meteo.com/v1/forecast?latitude={$lat}&longitude={$lon}&current=wind_speed_{$suffix},wind_direction_{$suffix}&wind_speed_unit=ms";
        $multi   = curl_multi_init();
        $handles = [];
        foreach ($urls as $key => $url) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10
            ]);
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
        $w    = $responses['weather']['code'] === 200 ? json_decode($responses['weather']['body'], true) : null;
        $air  = $responses['air']['code']     === 200 ? json_decode($responses['air']['body'], true)     : null;
        $wind = $responses['wind']['code']    === 200 ? json_decode($responses['wind']['body'], true)    : null;
        $windSpeedKey = "wind_speed_{$suffix}";
        $windDirKey   = "wind_direction_{$suffix}";
        $windSpeed = $wind['current'][$windSpeedKey] ?? null;
        $windDir   = $wind['current'][$windDirKey] ?? null;
        $result = [
            'temperature'   => $w ? round($w['main']['temp'], 1) : null,
            'humidity'      => $w ? round($w['main']['humidity'], 0) : null,
            'wind_speed'    => $windSpeed !== null ? round($windSpeed, 1) : null,
            'wind_direction'=> $windDir,
            'precipitation' => $w ? round($w['rain']['1h'] ?? 0, 1) : null,
            'pm25'          => $air ? round($air['list'][0]['components']['pm2_5'] ?? 0, 1) : null,
        ];
        header('Content-Type: application/json');
        $json = json_encode($result);
        file_put_contents($cacheFile, $json);
        echo $json;
    }
    public function getLatestWind() {
        header('Content-Type: application/json');
        try {
            $data = $this->model->getLatestWind();
            echo json_encode([
                'status' => true,
                'data' => $data
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => false,
                'message' => $e->getMessage()
            ]);
        }
    }
}