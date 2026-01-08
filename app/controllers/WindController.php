<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/WindModel.php';
class WindController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new WindModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $res = $this->model->list($start,$length);
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
}