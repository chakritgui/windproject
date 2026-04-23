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
            if (is_string($data['map_settings']['default_style'])) {
                $data['map_settings']['default_style'] = json_decode($data['map_settings']['default_style'], true);
            }
            if (is_string($data['map_settings']['mode_settings'])) {
                $data['map_settings']['mode_settings'] = json_decode($data['map_settings']['mode_settings'], true);
            }
            foreach ($data['polygons'] as &$poly) {
                if (is_string($poly['custom_style'])) {
                    $poly['custom_style'] = json_decode($poly['custom_style'], true);
                }
                if (is_string($poly['geo_data'])) {
                    $poly['geo_data'] = json_decode($poly['geo_data'], true);
                }
            }
            unset($poly);
            echo json_encode(['status' => true, 'data' => $data]);
        } else {
            echo json_encode(['status' => false, 'message' => 'Data not found']);
        }
    }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->list(
            $start,
            $length,
            $search,
            $colIndex,
            $orderDir
        );
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function update() {
        $id = intval($_POST['id'] ?? 0);
        $type = $_POST['type'] ?? 'area';
        $status = $_POST['status'] ?? 'yes';
        $result = $this->model->update($id, $type, $status);
        if ($result === true) {
            echo json_encode(['status' => true]);
        } else {
            echo json_encode(['status' => false, 'message' => $result]);
        }
    }
}