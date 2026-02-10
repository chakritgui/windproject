<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/DocumentModel.php';
class DocumentController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new DocumentModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'date'=> $_POST['date'] ?? '',
            'status'=> $_POST['status'] ?? '',
            'contract'=> $_POST['contract'] ?? '',
            'project'=> $_POST['project'] ?? '',
            'installation'=> $_POST['installation'] ?? '',
            'pole'=> $_POST['pole'] ?? '',
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
    public function get(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>'success','data'=>$this->model->get($id)]);
    }
    public function save() {
        $data = [
            'document_id' => intval($_POST['document_id'] ?? 0),
            'document_name' => $_POST['document_name'] ?? '',
            'document_start' => $_POST['document_start'] ?? '',
            'document_end' => $_POST['document_end'] ?? '',
            'status' => $_POST['status'] ?? '',
            'contract_id' => $_POST['contract_id'] ?? '',
            'project_id' => $_POST['project_id'] ?? '',
            'type_id' => $_POST['type_id'] ?? '',
            'installations_id' => $_POST['installations_id'] ?? '',
            'poles_id' => $_POST['poles_id'] ?? '',
            'document_file' => $_FILES['document_file'] ?? null,
        ];
        $this->json(['status'=>$this->model->save($data)]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>$this->model->delete($id)]);
    }
    public function filter() {
        $page = intval($_POST['page'] ?? 0);
        $limit = intval($_POST['limit'] ?? 10);
        $searchTerm = $_POST['searchTerm'] ?? '';
        $filter = [
            'contract_id'=> $_POST['contract_id'] ?? '',
            'project_id'=> $_POST['project_id'] ?? '',
            'type_id'=> $_POST['type_id'] ?? '',
            'installation_id'=> $_POST['installation_id'] ?? '',
        ];
        $type = $_POST['type'] ?? '';
        $this->json(['status'=>true , 'data' => $this->model->filter($page, $limit, $type, $searchTerm, $filter)]);
    }
    public function downloadHistory(){
        $start  = intval($_POST['start'] ?? 0);
        $length = intval($_POST['length'] ?? 10);
        $filters = [
            'date_start' => $_POST['start_date'] ?? '',
            'date_end'   => $_POST['end_date'] ?? '',
            'document_id'=> $_POST['document_id'] ?? ''
        ];
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->downloadHistory(
            $start,
            $length,
            $filters,
            $search,
            $colIndex,
            $orderDir
        );
        $this->json([
            "draw"            => intval($_POST['draw'] ?? 1),
            "recordsTotal"    => $res['total'],
            "recordsFiltered" => $res['total'],
            "data"            => $res['data']
        ]);
    }
}