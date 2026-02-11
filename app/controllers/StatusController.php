<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/StatusModel.php';
class StatusController extends BaseController {
    private $model;
    public function __construct() { $this->model = new StatusModel(); }
    public function list() {
        $start = intval($_POST['start'] ?? 0);
        $length = intval($_POST['length'] ?? 10);
        $search = $_POST['search']['value'] ?? '';
        $colIndex = !empty($_POST['order'][0]) ? intval($_POST['order'][0]['column']) : 1;
        $orderDir = ($_POST['order'][0]['dir'] ?? 'desc') === 'desc' ? 'desc' : 'asc';

        $res = $this->model->list($start, $length, $search, $colIndex, $orderDir);
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function get() {
        $id = intval($_POST['id'] ?? 0);
        $data = $this->model->get($id);
        $this->json(['status' => !empty($data), 'data' => $data]);
    }
    public function save() {
        $name = trim($_POST['project_status_name'] ?? '');
        if (empty($name)) { return $this->json(['status' => false, 'message' => 'name_required']); }
        $data = [
            'project_status_id' => intval($_POST['project_status_id'] ?? 0),
            'project_status_name' => $name,
            'project_status_color' => $_POST['project_status_color'] ?? '#3b82f6'
        ];
        $result = $this->model->save($data);
        if ($result === true) {
            $this->json(['status' => true]);
        } else {
            $this->json(is_array($result) ? $result : ['status' => false, 'message' => 'cannot_save']);
        }
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status' => $this->model->delete($id)]);
    }
}