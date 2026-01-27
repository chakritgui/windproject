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
        $ref_id = $_POST['ref_id'] ?? null;
        $project_id = $_POST['project_id'] ?? null;
        if (in_array($itemId, ['', 'null', 'undefined'])) $itemId = null;
        if (in_array($ref_id, ['', 'null', 'undefined'])) $ref_id = null;
        if (in_array($project_id, ['', 'null', 'undefined'])) $project_id = null;
        $filters = [
            'level' => intval($_POST['level'] ?? 1),
            'item'  => $itemId,
            'ref_id'  => $ref_id,
            'project_id'  => $project_id,
        ];
        $search = $_POST['search']['value'] ?? '';
        $result = $this->model->get($start, $length, $filters, $search);
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
            'ref_id'       => intval($_POST['ref_id'] ?? ''),
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
            'notification' => $_POST['notification'] ?? '',
            'parent_id'   => intval($_POST['parent_id'] ?? 0),
            'level'       => intval($_POST['level'] ?? 1),
            'ref_id'       => intval($_POST['ref_id'] ?? ''),
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
}