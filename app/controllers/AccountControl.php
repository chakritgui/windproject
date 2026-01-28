<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/AccountModel.php';
class AccountControl extends BaseController {
    private $model;
    public function __construct(){ $this->model = new AccountModel(); }
    public function get() {
        $this->json($this->model->get());
    }
    public function update() {
        $field = $_POST['field'] ?? '';
        $value = $_POST['value'] ?? '';
        $member_id = $_SESSION['user']['id'];
        $this->json($this->model->update($field, $value, $member_id));
    }
    public function history() {
        $offset = (int)($_POST['offset'] ?? 0);
        $limit = 10;
        $data = $this->model->getLoginLogs($offset, $limit);
        $this->json([
            'status' => true,
            'data' => $data,
            'has_more' => (count($data) == $limit) 
        ]);
    }
}
