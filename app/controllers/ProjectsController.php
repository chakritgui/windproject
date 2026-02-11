<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ProjectsModel.php';
class ProjectsController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new ProjectsModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'status'=> $_POST['status'] ?? '',
            'contract'=> $_POST['contract'] ?? '',
            'group'=> $_POST['group'] ?? '',
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
            'project_id' => intval($_POST['project_id'] ?? 0),
            'contract_id' => intval($_POST['contract_id'] ?? 0),
            'project_code' => $_POST['project_code'] ?? '',
            'project_name' => $_POST['project_name'] ?? '',
            'project_name_display' => $_POST['project_name_display'] ?? '',
            'project_start' => $_POST['project_start'] ?? '',
            'project_end' => $_POST['project_end'] ?? '',
            'status' => $_POST['status'] ?? '',
            'group' => $_POST['group'] ?? ''
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