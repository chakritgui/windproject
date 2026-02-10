<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/InstallationsModel.php';
class InstallationsController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new InstallationsModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'status'=> $_POST['status'] ?? '',
            'project'=> $_POST['project'] ?? '',
            'type'=> $_POST['type'] ?? '',
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
    public function filter() {
        $page = intval($_POST['page'] ?? 0);
        $limit = intval($_POST['limit'] ?? 10);
        $searchTerm = $_POST['searchTerm'] ?? '';
        $type = $_POST['type'] ?? '';
        $this->json(['status'=>true , 'data' => $this->model->filter($page, $limit, $type, $searchTerm)]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>$this->model->delete($id)]);
    }
    public function get(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>true,'data'=>$this->model->get($id)]);
    }
    public function save() {
        $data = [
            'installations_id' => intval($_POST['installations_id'] ?? 0),
            'installations_name' => $_POST['installations_name'] ?? '',
            'installations_name_display' => $_POST['installations_name_display'] ?? '',
            'project'      => (int)($_POST['project'] ?? 0),
            'type'         => (int)($_POST['type'] ?? 0),
            'status' => $_POST['status'] ?? ''
        ];
        $result = $this->model->save($data);
        if ($result === true) {
            $this->json([
                'status' => true
            ]);
        } elseif (is_array($result)) {
            $this->json($result); 
        } else {
            $this->json([
                'status'  => false,
                'message' => 'cannot_save'
            ]);
        }
    }
}