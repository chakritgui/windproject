<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/PolesModel.php';
class PolesController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new PolesModel(); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'status'=> $_POST['status'] ?? '',
            'project'=> $_POST['project'] ?? '',
            'type'=> $_POST['type'] ?? '',
            'installation'=> $_POST['installation'] ?? '',
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
            'poles_id'     => (int)($_POST['poles_id'] ?? 0),
            'poles_code'   => trim($_POST['poles_code'] ?? ''),
            'latitude'     => $_POST['latitude'] ?? null,
            'longitude'    => $_POST['longitude'] ?? null,
            'project'      => (int)($_POST['project'] ?? 0),
            'type'         => (int)($_POST['type'] ?? 0),
            'installation' => (int)($_POST['installation'] ?? 0),
            'status'       => $_POST['status'] ?? 'inactive'
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
    public function gets(){
        $poles_id = intval($_POST['poles_id'] ?? 0);
        $content_id = intval($_POST['content_id'] ?? 0);
        $this->json(['status'=>'success','data'=>$this->model->gets($poles_id, $content_id)]);
    }
    public function saveContent() {
        $data = [
            'poles_id'    => intval($_POST['poles_id'] ?? 0),
            'content_id' => intval($_POST['content_id'] ?? 0),
            'title_en' => $_POST['title_en'] ?? '',
            'title_lo' => $_POST['title_lo'] ?? '',
            'title_th' => $_POST['title_th'] ?? '',
            'content_en' => $_POST['content_en'] ?? '',
            'content_lo' => $_POST['content_lo'] ?? '',
            'content_th' => $_POST['content_th'] ?? '',
            'ex_cover'   => $_POST['ex_cover'] ?? '',
            'cover'      => $_FILES['cover'] ?? null,
            'existing_attachments' => $_POST['existing_attachments'] ?? [],
            'new_attachments'      => $_FILES['new_attachments'] ?? null,
            'existing_images'      => $_POST['existing_images'] ?? [],
            'new_images'           => $_FILES['new_images'] ?? null,
            'existing_images360'   => $_POST['existing_images360'] ?? [],
            'new_images360'        => $_FILES['new_images360'] ?? null,
            'auto_translate' => $_POST['auto_translate'] ?? 'no'
        ];
        $result = $this->model->saveContent($data);
        $this->json(['status' => $result ? 'success' : 'error']);
    }
    public function deleteContent() {
        $poles_id = intval($_POST['poles_id'] ?? 0);
        $content_id = intval($_POST['content_id'] ?? 0);
        $this->json(['status'=>$this->model->deleteContent($poles_id, $content_id)]);
    }
}