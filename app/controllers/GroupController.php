<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/GroupModel.php';
class GroupController extends BaseController {
    private $model;
    public function __construct() {
        $this->model = new GroupModel();
    }
    public function list() {
        $start    = intval($_POST['start'] ?? 0);
        $length   = intval($_POST['length'] ?? 10);
        $search   = $_POST['search']['value'] ?? '';
        $filters = [
            'status'=> $_POST['status'] ?? '',
        ];
        $colIndex = 1; 
        $orderDir = 'desc';
        if (!empty($_POST['order'][0])) {
            $colIndex = intval($_POST['order'][0]['column']);
            $orderDir = ($_POST['order'][0]['dir'] === 'desc') ? 'desc' : 'asc';
        }
        $res = $this->model->list($start, $length, $filters, $search, $colIndex, $orderDir);
        $this->json([
            "draw"            => intval($_POST['draw'] ?? 1),
            "recordsTotal"    => $res['total'],
            "recordsFiltered" => $res['total'], 
            "data"            => $res['data']
        ]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        if ($id <= 0) {
            return $this->json(['status' => false, 'message' => 'invalid_id']);
        }
        $this->json(['status' => $this->model->delete($id)]);
    }
    public function get() {
        $id = intval($_POST['id'] ?? 0);
        $data = $this->model->get($id);
        $this->json([
            'status' => $data ? true : false,
            'data'   => $data
        ]);
    }
    public function save() {
        $groupName = trim($_POST['project_group_name'] ?? '');
        if (empty($groupName)) {
            return $this->json(['status' => false, 'message' => 'name_required']);
        }
        $data = [
            'project_group_id'   => intval($_POST['project_group_id'] ?? 0),
            'project_group_name' => $groupName
        ];
        $result = $this->model->save($data);
        if ($result === true) {
            $this->json(['status' => true]);
        } elseif (is_array($result)) {
            $this->json($result); 
        } else {
            $this->json([
                'status'  => false,
                'message' => 'cannot_save'
            ]);
        }
    }
    public function updateStatus() {
        $id = intval($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? 'inactive';
        $result = $this->model->updateStatus($id, $status);
        $this->json(['status' => $result]);
    }
}