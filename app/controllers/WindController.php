<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/WindModel.php';
class WindController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new WindModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'date'=> $_POST['date'] ?? '',
            'project'=> $_POST['project'] ?? '',
            'pole'=> $_POST['pole'] ?? '',
            'type'=> $_POST['type'] ?? '',
            'installation'=> $_POST['installation'] ?? '',
            'height'=> $_POST['height'] ?? '',
        ];
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->list(
            $start,
            $length,
            $filters,
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
    public function history(){
        $start = intval($_POST['start'] ?? 0);
        $length = intval($_POST['length'] ?? 10);
        $search = $_POST['search']['value'] ?? '';
        $res = $this->model->history($start,$length,$search);
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function import() {
        $data = [
            'wind_file' => $_FILES['wind_file'] ?? null,
        ];
        $result = $this->model->import($data);
        $this->json($result);
    }
    public function clear() {
        $result = $this->model->clear();
        $this->json($result);
    }
    public function filter() {
        $page = intval($_POST['page'] ?? 0);
        $limit = intval($_POST['limit'] ?? 10);
        $searchTerm = $_POST['searchTerm'] ?? '';
        $type = $_POST['type'] ?? '';
        $this->json(['status'=>true , 'data' => $this->model->filter($page, $limit, $type, $searchTerm)]);
    }
}