<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/MapSettingModel.php';
class MapSettingController extends BaseController {
    private $model;
    public function __construct() { 
        $this->model = new MapSettingModel(); 
    }
    public function save() {
        $payload = $_POST['payload'] ?? null;
        if (!$payload) {
            echo json_encode(['status' => false, 'message' => 'Missing Payload']);
            return;
        }
        $result = $this->model->saveMapData($payload);
        if ($result === true) {
            echo json_encode(['status' => true]);
        } else {
            echo json_encode(['status' => false, 'message' => $result]);
        }
    }
    public function load() {
        $data = $this->model->getMapData(1);
        if ($data) {
            $data['map_settings']['default_style'] = json_decode($data['map_settings']['default_style']);
            foreach ($data['polygons'] as &$poly) {
                $poly['area_style'] = json_decode($poly['area_style']);
                $poly['geo_data'] = json_decode($poly['geo_data']);
            }
            echo json_encode(['status' => true, 'data' => $data]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Data not found']);
        }
    }
}