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
            'source'=> $_POST['source'] ?? '',
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
            'source' => $_POST['source'] ?? '',
            'document_file' => $_FILES['document_file'] ?? null,
        ];
        $this->json(['status'=>$this->model->save($data)]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>$this->model->delete($id)]);
    }
    public function change() {
        $id = intval($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? 'public';
        $this->json(['status'=>$this->model->change($id, $status)]);
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
        $res = $this->model->downloadHistory($start, $length, $filters, $search);
        $this->json([
            "draw"            => intval($_POST['draw'] ?? 1),
            "recordsTotal"    => $res['total'],
            "recordsFiltered" => $res['total'],
            "data"            => $res['data']
        ]);
    }
}