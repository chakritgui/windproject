<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/SortModel.php';
class SortController extends BaseController {
    private $model;
    public function __construct() { $this->model = new SortModel(); }
    public function list() {
        $type = $_POST['type'] ?? '';
        $this->json([
            'status' => true, 
            'data' => $this->model->list($type)
        ]);
    }
    public function save() {
        $type = $_POST['type'] ?? '';
        $orderIds = $_POST['order'] ?? [];
        $result = $this->model->saveOrder($type, $orderIds);
        $this->json(['status' => $result]);
    }
}