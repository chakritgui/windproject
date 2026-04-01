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
}