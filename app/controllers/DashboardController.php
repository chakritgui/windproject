<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/DashboardModel.php';
class DashboardController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new DashboardModel(); }
    public function getStats() {
        $data = $this->model->getStats();
        $this->json(['status' => true, 'data' => $data]);
    }
    public function loginHistory() {
        $data = $this->model->loginHistory();
        $this->json(['status' => true, 'data' => $data]);
    }
}