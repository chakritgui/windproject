<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ProjectModel.php';
class ProjectController extends BaseController {
    private $model;
    public function __construct() { 
        $this->model = new ProjectModel(); 
    }
    public function get() {
        $start = intval($_POST['start'] ?? 0);
        $length = intval($_POST['length'] ?? 20);
        $itemId = $_POST['item'] ?? null;
        if (in_array($itemId, ['', 'null', 'undefined'])) $itemId = null;
        $filters = [
            'level' => intval($_POST['level'] ?? 1),
            'item'  => $itemId,
        ];
        $search = $_POST['search']['value'] ?? '';
        $order = $_POST['order'] ?? 'asc';
        $result = $this->model->get($start, $length, $filters, $search, $order);
        $this->json([
            'status' => true,
            'data'   => $result
        ]);
    }
    public function save() {
        $data = [
            'folder_id'   => intval($_POST['folder_id'] ?? 0),
            'folder_name' => $_POST['folder_name'] ?? '',
            'parent_id'   => intval($_POST['parent_id'] ?? 0),
            'level'       => intval($_POST['level'] ?? 1),
            'status'       => $_POST['status'] ?? 'active',
            'cover' => $_FILES['cover'] ?? null,
            'ex_cover' => $_POST['ex_cover'] ?? null,
        ];
        $this->json(['status' => $this->model->save($data)]);
    }
    public function data() {
        $data = [
            'folder_id' => intval($_POST['folder_id'] ?? 0)
        ];
        $result = $this->model->data($data);
        if ($result) {
            $this->json(['status' => 'success', 'data' => $result]);
        } else {
            $this->json(['status' => 'error', 'message' => 'Data not found']);
        }
    }
    public function delete() {
        $data = [
            'folder_id' => intval($_POST['folder_id'] ?? 0)
        ];
        $result = $this->model->delete($data);
        if ($result) {
            $this->json(['status' => 'success', 'data' => $result]);
        } else {
            $this->json(['status' => 'error', 'message' => 'Data not found']);
        }
    }
    public function gets(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>'success','data'=>$this->model->gets($id)]);
    }
    public function filter() {
        $page = intval($_POST['page'] ?? 0);
        $limit = intval($_POST['limit'] ?? 10);
        $searchTerm = $_POST['searchTerm'] ?? '';
        $type = $_POST['type'] ?? '';
        $this->json(['status'=>true , 'data' => $this->model->filter($page, $limit, $type, $searchTerm)]);
    }
    public function saveContent() {
        $data = [
            'content_id'   => intval($_POST['content_id'] ?? 0),
            'status' => $_POST['status'] ?? '',
            'send_notification'    => $_POST['send_notification'] ?? 'no',
            'parent_id'   => intval($_POST['parent_id'] ?? 0),
            'level'       => intval($_POST['level'] ?? 1),
            'title_en' => $_POST['title_en'] ?? '',
            'title_lo' => $_POST['title_lo'] ?? '',
            'title_th' => $_POST['title_th'] ?? '',
            'content_en' => $_POST['content_en'] ?? '',
            'content_lo' => $_POST['content_lo'] ?? '',
            'content_th' => $_POST['content_th'] ?? '',
            'ex_cover' => $_POST['ex_cover'] ?? '',
            'cover' => $_FILES['cover'] ?? null,
            'existing_attachments' => $_POST['existing_attachments'] ?? [],
            'new_attachments'      => $_FILES['new_attachments'] ?? null,
            'existing_images'      => $_POST['existing_images'] ?? [],
            'new_images'           => $_FILES['new_images'] ?? null,
            'existing_images360'   => $_POST['existing_images360'] ?? [],
            'new_images360'        => $_FILES['new_images360'] ?? null,
            'existing_presentation'   => $_POST['existing_presentation'] ?? [],
            'new_presentation'        => $_FILES['new_presentation'] ?? null,
            'auto_translate' => $_POST['auto_translate'] ?? 'no',
            'cover_display' => $_POST['cover_display'] ?? 'no',
            'folder_show_admin'    => $_POST['folder_show_admin'] ?? 'no',
            'folder_show_user'    => $_POST['folder_show_user'] ?? 'no',
        ];
        $this->json(['status' => $this->model->saveContent($data)]);
    }
    public function deleteContent() {
        $data = [
            'content_id' => intval($_POST['content_id'] ?? 0)
        ];
        $result = $this->model->deleteContent($data);
        if ($result) {
            $this->json(['status' => 'success', 'data' => $result]);
        } else {
            $this->json(['status' => 'error', 'message' => 'Data not found']);
        }
    }
    public function unlink() {
        $data = [
            'folder_id' => intval($_POST['folder_id'] ?? 0),
            'content_id' => intval($_POST['content_id'] ?? 0),
        ];
        $result = $this->model->unlink($data);
        if ($result) {
            $this->json(['status' => 'success', 'data' => $result]);
        } else {
            $this->json(['status' => 'error', 'message' => 'Data not found']);
        }
    }
    public function sort() {
        $input = json_decode(file_get_contents("php://input"), true);
        if (!isset($input['items']) || !is_array($input['items'])) {
            $this->json([
                'status' => false,
                'message' => 'Invalid items'
            ]);
            return;
        }
        $result = $this->model->sort($input['items']);
        $this->json($result);
    }
}