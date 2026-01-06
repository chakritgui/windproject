<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/NotificationModel.php';
class  NotificationController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new NotificationModel(); }
    public function load() {
        $this->json(['status'=> true, 'data' => $this->model->load()]);
    }
    public function read() {
        $this->json(['status'=> $this->model->read()]);
    }
    public function loadlist() {
        $page  = isset($_POST['page']) ? intval($_POST['page']) : 1;
        $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 10;
        $this->json(['status'=> true, 'data' => $this->model->loadlist($page, $limit)]);
    }
}