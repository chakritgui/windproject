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
    private function buildSuffix(string $level): string{
        if ($level === '100m') return '100m';
        $numeric = preg_replace('/[^0-9]/', '', $level);
        return $numeric . 'hPa';
    }
    private function getLevel(): string{
        $level = $_GET['level'] ?? '';
        return empty($level) ? $this->model->getSetting('DEFAULT_LEVEL') : $level;
    }
    private function getCoords(): array|false{
        $lat = preg_replace('/[^0-9.\-]/', '', $_GET['lat'] ?? '');
        $lon = preg_replace('/[^0-9.\-]/', '', $_GET['lon'] ?? '');
        if (!$lat || !$lon) return false;
        return ['lat' => $lat, 'lon' => $lon];
    }
    private function getCached(string $cacheFile, int $ttl): string|false{
        if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $ttl) {
            return file_get_contents($cacheFile);
        }
        return false;
    }
    private function saveCache(string $cacheDir, string $cacheFile, string $json): void{
        if (!is_dir($cacheDir)) mkdir($cacheDir, 0755, true);
        file_put_contents($cacheFile, $json);
    }
    public function weatherWind(): void{
        $coords = $this->getCoords();
        if (!$coords) {
            http_response_code(400);
            echo json_encode(['error' => true, 'reason' => 'Missing coordinates']);
            return;
        }
        $suffix    = $this->buildSuffix($this->getLevel());
        $CACHE_TTL = 1800;
        $cacheDir  = sys_get_temp_dir() . '/weather_wind_cache';
        $cacheKey  = round((float)$coords['lat'], 2) . '_' . round((float)$coords['lon'], 2) . '_' . $suffix;
        $cacheFile = "{$cacheDir}/{$cacheKey}.json";
        if ($cached = $this->getCached($cacheFile, $CACHE_TTL)) {
            header('Content-Type: application/json');
            echo $cached;
            return;
        }
        $gustRatioMap = [
            '100m'   => null, '950hPa' => 1.30, '925hPa' => 1.25,
            '900hPa' => 1.20, '850hPa' => 1.15, '800hPa' => 1.12,
            '700hPa' => 1.10, '600hPa' => 1.08, '500hPa' => 1.06,
            '400hPa' => 1.05, '300hPa' => 1.04, '250hPa' => 1.03,
            '200hPa' => 1.03, '150hPa' => 1.02, '10hPa'  => 1.02,
        ];
        $windParams = "wind_speed_{$suffix},wind_direction_{$suffix},wind_gusts_10m";
        if ($suffix !== '100m') $windParams .= ',wind_speed_10m';
        $url = "https://api.open-meteo.com/v1/forecast"
            . "?latitude={$coords['lat']}&longitude={$coords['lon']}"
            . "&current={$windParams}&wind_speed_unit=ms";
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        $body = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $windData         = $code === 200 ? (json_decode($body, true)['current'] ?? null) : null;
        $windSpeedAtLevel = isset($windData["wind_speed_{$suffix}"])
            ? round($windData["wind_speed_{$suffix}"], 1) : null;
        if ($suffix === '100m') {
            $windGusts = isset($windData['wind_gusts_10m'])
                ? round($windData['wind_gusts_10m'], 1) : null;
        } else {
            $gust10m  = $windData['wind_gusts_10m'] ?? null;
            $speed10m = $windData['wind_speed_10m'] ?? null;
            if ($gust10m !== null && $speed10m !== null && $speed10m > 0) {
                $dynamicRatio  = $gust10m / $speed10m;
                $fallbackRatio = $gustRatioMap[$suffix] ?? 1.1;
                $ratio         = max(min($dynamicRatio, $fallbackRatio), 1.0);
            } else {
                $ratio = $gustRatioMap[$suffix] ?? 1.1;
            }
            $windGusts = $windSpeedAtLevel !== null ? round($windSpeedAtLevel * $ratio, 1) : null;
        }
        $result = [
            'wind_speed'     => $windSpeedAtLevel,
            'wind_direction' => $windData["wind_direction_{$suffix}"] ?? null,
            'wind_gusts'     => $windGusts,
        ];
        header('Content-Type: application/json');
        $json = json_encode($result);
        $this->saveCache($cacheDir, $cacheFile, $json);
        echo $json;
    }
    public function weatherCurrent(): void{
        $coords = $this->getCoords();
        if (!$coords) {
            http_response_code(400);
            echo json_encode(['error' => true, 'reason' => 'Missing coordinates']);
            return;
        }
        $CACHE_TTL = 1800;
        $cacheDir  = sys_get_temp_dir() . '/weather_current_cache';
        $cacheKey  = round((float)$coords['lat'], 2) . '_' . round((float)$coords['lon'], 2);
        $cacheFile = "{$cacheDir}/{$cacheKey}.json";
        if ($cached = $this->getCached($cacheFile, $CACHE_TTL)) {
            header('Content-Type: application/json');
            echo $cached;
            return;
        }
        $apiKey = 'bb3dbebb270f08db6036bb5c4d01cc70';
        $urls = [
            'weather' => "https://api.openweathermap.org/data/2.5/weather?lat={$coords['lat']}&lon={$coords['lon']}&appid={$apiKey}&units=metric",
            'air'     => "https://api.openweathermap.org/data/2.5/air_pollution?lat={$coords['lat']}&lon={$coords['lon']}&appid={$apiKey}",
        ];
        $multi = curl_multi_init();
        $handles = [];
        foreach ($urls as $key => $url) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
            curl_multi_add_handle($multi, $ch);
            $handles[$key] = $ch;
        }
        $running = null;
        do { curl_multi_exec($multi, $running); curl_multi_select($multi); } while ($running > 0);
        $responses = [];
        foreach ($handles as $key => $ch) {
            $responses[$key] = ['body' => curl_multi_getcontent($ch), 'code' => curl_getinfo($ch, CURLINFO_HTTP_CODE)];
            curl_multi_remove_handle($multi, $ch);
            curl_close($ch);
        }
        curl_multi_close($multi);
        $w   = $responses['weather']['code'] === 200 ? json_decode($responses['weather']['body'], true) : null;
        $air = $responses['air']['code']     === 200 ? json_decode($responses['air']['body'],     true) : null;
        $result = [
            'temperature' => $w   ? round($w['main']['temp'], 1) : null,
            'humidity' => $w   ? round($w['main']['humidity'], 0) : null,
            'precipitation' => $w   ? round($w['rain']['1h'] ?? 0, 1) : null,
            'pm25' => $air ? round($air['list'][0]['components']['pm2_5'] ?? 0, 1) : null,
        ];
        header('Content-Type: application/json');
        $json = json_encode($result);
        $this->saveCache($cacheDir, $cacheFile, $json);
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
    public function weatherWindFromDB(): void{
        $stationId = $_GET['station_id'] ?? '';
        $suffix = $this->buildSuffix($this->getLevel());
        $speedCol = "wind_speed_{$suffix}";
        $dirCol   = "wind_direction_{$suffix}";
        $allowedSuffixes = [
            '100m','950hPa','925hPa','900hPa','850hPa','800hPa',
            '700hPa','600hPa','500hPa','400hPa','300hPa','250hPa',
            '200hPa','150hPa','10hPa'
        ];
        if (!in_array($suffix, $allowedSuffixes, true)) {
            http_response_code(400);
            echo json_encode(['error' => true, 'reason' => 'Invalid level']);
            return;
        }
        $stationId = (int) $stationId;
        $row = $this->model->getLatestWindByStation($stationId, $speedCol, $dirCol);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => true, 'reason' => 'No data found']);
            return;
        }
        $result = [
            'wind_speed'     => $row[$speedCol] !== null ? round((float)$row[$speedCol], 1) : null,
            'wind_direction' => $row[$dirCol]   !== null ? round((float)$row[$dirCol],   1) : null,
            'level_label'    => $suffix,
            'source'         => 'database',
        ];
        header('Content-Type: application/json');
        $json = json_encode($result);
        echo $json;
    }
}