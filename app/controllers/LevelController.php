<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/LevelModel.php';
class LevelController extends BaseController {
    private $model;
    public function __construct() {
        $this->model = new LevelModel();
    }
    public function list() {
        $start    = intval($_POST['start'] ?? 0);
        $length   = intval($_POST['length'] ?? 10);
        $search   = $_POST['search']['value'] ?? '';
        $colIndex = 1; 
        $orderDir = 'desc';
        if (!empty($_POST['order'][0])) {
            $colIndex = intval($_POST['order'][0]['column']);
            $orderDir = ($_POST['order'][0]['dir'] === 'desc') ? 'desc' : 'asc';
        }
        $res = $this->model->list($start, $length, $search, $colIndex, $orderDir);
        $this->json([
            "draw"            => intval($_POST['draw'] ?? 1),
            "recordsTotal"    => $res['total'],
            "recordsFiltered" => $res['total'], 
            "data"            => $res['data']
        ]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            return $this->json(['status' => false, 'message' => 'invalid_id']);
        }
        $this->json(['status' => $this->model->delete($id)]);
    }
    public function get() {
        $id = intval($_POST['id'] ?? 0);
        $data = $this->model->get($id);
        $this->json([
            'status' => $data ? true : false,
            'data'   => $data
        ]);
    }
    public function save() {
        $height_name = trim($_POST['height_name'] ?? '');
        $height_levels = $_POST['height_levels'] ?? '';
        if (empty($height_name)) {
            return $this->json(['status' => false, 'message' => 'name_required']);
        }
        $data = [
            'height_id'     => intval($_POST['height_id'] ?? 0),
            'height_limit'     => intval($_POST['height_limit'] ?? 3),
            'height_name'   => $height_name,
            'height_levels' => $height_levels 
        ];
        $result = $this->model->save($data);
        if ($result === true) {
            $this->json(['status' => true]);
        } elseif (is_array($result)) {
            $this->json($result); 
        } else {
            $this->json(['status' => false, 'message' => 'cannot_save']);
        }
    }
}