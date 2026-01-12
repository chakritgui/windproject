<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/MapModel.php';
class  MapController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new MapModel(); }
    public function windarea() {
        $result = $this->model->windarea();
        $this->json($result);
    }
    public function poleslocation() {
        $result = $this->model->poleslocation();
        $this->json($result);
    }
    public function project() {
        $result = $this->model->project();
        $this->json($result);
    }
    public function type() {
        $input = json_decode(file_get_contents('php://input'), true);
        $project_id = $input['project_id'] ?? ($_POST['project_id'] ?? 0);
        $result = $this->model->type($project_id);
        $this->json($result);
    }
    public function station() {
        $input = json_decode(file_get_contents('php://input'), true);
        $project_id = $input['project_id'] ?? ($_POST['project_id'] ?? 0);
        $type_id = $input['type_id'] ?? ($_POST['type_id'] ?? 0);
        $result = $this->model->station($project_id, $type_id);
        $this->json($result);
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
}