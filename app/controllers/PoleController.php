<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/PoleModel.php';
class PoleController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new PoleModel(); }
    public function polestats() {
        header('Content-Type: application/json; charset=utf-8');
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            $this->json([]);
            return;
        }
        if (!isset($input['poles_id']) || !isset($input['sensors'])) {
            $this->json([]);
            return;
        }
        $sensors = $input['sensors'];
        if (is_string($sensors)) {
            $sensors = array_filter(explode(',', $sensors));
        }
        if (!is_array($sensors) || count($sensors) === 0) {
            $this->json([]);
            return;
        }
        $result = $this->model->polestats([
            'poles_id'  => (int)$input['poles_id'],
            'height_id' => (int)($input['height_id'] ?? 0),
            'start'     => $input['start'] ?? null,
            'end'       => $input['end'] ?? null,
            'sensors'   => $sensors
        ]);
        $this->json($result ?: []);
    }
    public function poleval() {
        header('Content-Type: application/json; charset=utf-8');
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            $this->json([]);
            return;
        }
        if (!isset($input['poles_id']) || !isset($input['sensors'])) {
            $this->json([]);
            return;
        }
        $sensors = $input['sensors'];
        if (is_string($sensors)) {
            $sensors = array_filter(explode(',', $sensors));
        }
        if (!is_array($sensors) || count($sensors) === 0) {
            $this->json([]);
            return;
        }
        $result = $this->model->poleval([
            'poles_id'  => (int)$input['poles_id'],
            'height_id' => (int)($input['height_id'] ?? 0),
            'start'     => $input['start'] ?? null,
            'end'       => $input['end'] ?? null,
            'sensors'   => $sensors
        ]);
        $this->json($result ?: []);
    }
    public function info() {
        header('Content-Type: application/json; charset=utf-8');
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            $this->json([]);
            return;
        }
        if (!isset($input['poles_id']) || !isset($input['sensors'])) {
            $this->json([]);
            return;
        }
        $sensors = $input['sensors'];
        if (is_string($sensors)) {
            $sensors = array_filter(explode(',', $sensors));
        }
        if (!is_array($sensors) || count($sensors) === 0) {
            $this->json([]);
            return;
        }
        $result = $this->model->info([
            'poles_id'  => (int)$input['poles_id'],
            'height_id' => (int)($input['height_id'] ?? 0),
            'start'     => $input['start'] ?? null,
            'end'       => $input['end'] ?? null,
            'sensors'   => $sensors
        ]);
        $this->json($result ?: []);
    }
}