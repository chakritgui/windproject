<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/PoleModel.php';
class PoleController extends BaseController {
    private $model;
    public function __construct() { 
        $this->model = new PoleModel(); 
    }
    private function getJsonInput() {
        header('Content-Type: application/json; charset=utf-8');
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?: [];
    }
    private function parseInputArray($value) {
        if (is_string($value)) {
            return array_filter(explode(',', $value));
        }
        return is_array($value) ? $value : [];
    }
    private function preparePayload($input) {
        if (!isset($input['poles_id']) || (!isset($input['sensors']) && !isset($input['sensors_data']))) {
            return null;
        }
        $sensorsInput = $input['sensors'] ?? $input['sensors_data'] ?? [];
        $sensors = $this->parseInputArray($sensorsInput);
        if (empty($sensors)) return null;
        return [
            'poles_id'  => (int)$input['poles_id'],
            'height_id' => (int)($input['height_id'] ?? 0),
            'start'     => $input['start'] ?? $input['startDate'], 'Y-m-d' ?? null,
            'end'       => $input['end'] ?? $input['endDate'], 'Y-m-d' ?? null,
            'sensors'   => $sensors,
            'levels'    => $this->parseInputArray($input['lv'] ?? $input['levels_data'] ?? [])
        ];
    }
    public function polestats() {
        $input = $this->getJsonInput();
        $payload = $this->preparePayload($input);
        if (!$payload) {
            return $this->json([]);
        }
        $result = $this->model->polestats($payload);
        $this->json($result ?: []);
    }
    public function poleval() {
        $input = $this->getJsonInput();
        $payload = $this->preparePayload($input);
        if (!$payload) {
            return $this->json([]);
        }
        $result = $this->model->poleval($payload);
        $this->json($result ?: []);
    }
    public function info() {
        $input = $this->getJsonInput();
        $payload = $this->preparePayload($input);
        if (!$payload) {
            return $this->json([]);
        }
        $result = $this->model->info($payload);
        $this->json($result ?: []);
    }
    public function level() {
        $input = $this->getJsonInput();
        if (!isset($input['height_id'])) {
            return $this->json(['error' => 'Missing height_id']);
        }
        $result = $this->model->level([
            'height_id' => (int)$input['height_id'],
        ]);
        $this->json($result ?: []);
    }
}