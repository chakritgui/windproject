<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/WindturbineModel.php';
class WindturbineController extends BaseController {
    private $model;
    public function __construct() { 
        $this->model = new WindturbineModel(); 
    }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'project'=> $_POST['project'] ?? '',
            'status'=> $_POST['status'] ?? '',
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
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>$this->model->delete($id)]);
    }
    public function import() {
        $data = [
            'wind_file' => $_FILES['wind_file'] ?? null,
            'import_mode' => $_POST['import_mode'] ?? 'append'
        ];
        $result = $this->model->import($data);
        $this->json($result);
    }
    public function updateStatus() {
        $id = intval($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? 'inactive';
        $result = $this->model->updateStatus($id, $status);
        $this->json(['status' => $result]);
    }
    public function clear() {
        $result = $this->model->clear();
        $this->json($result);
    }
}