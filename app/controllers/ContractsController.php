<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ContractsModel.php';
class ContractsController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new ContractsModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'status'=> $_POST['status'] ?? '',
        ];
        $search = $_POST['search']['value'] ?? '';
        $res = $this->model->list($start,$length,$filters,$search);
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
            'contract_id' => intval($_POST['contract_id'] ?? 0),
            'contract_no' => $_POST['contract_no'] ?? '',
            'contract_name' => $_POST['contract_name'] ?? '',
            'contract_start' => $_POST['contract_start'] ?? '',
            'contract_end' => $_POST['contract_end'] ?? '',
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