<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/NotificationModel.php';
class NotificationController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new NotificationModel(); }
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
    public function get(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>'success','data'=>$this->model->get($id)]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>$this->model->delete($id)]);
    }
    public function save() {
        $data = [
            'notifications_id' => intval($_POST['notifications_id'] ?? 0),
            'status' => $_POST['status'] ?? '',
            'publish_at' => $_POST['publish_at'] ?? '',
            'title_en' => $_POST['title_en'] ?? '',
            'title_lo' => $_POST['title_lo'] ?? '',
            'title_th' => $_POST['title_th'] ?? '',
            'content_en' => $_POST['content_en'] ?? '',
            'content_lo' => $_POST['content_lo'] ?? '',
            'content_th' => $_POST['content_th'] ?? ''
        ];
        $this->json(['status'=>$this->model->save($data)]);
    }
    public function change() {
        $id = intval($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? 'public';
        $this->json(['status'=>$this->model->change($id, $status)]);
    }
    public function load() {
        $this->json(['status'=> true, 'data' => $this->model->load()]);
    }
}
