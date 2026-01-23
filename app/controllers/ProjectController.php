<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ProjectModel.php';
class ProjectController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new ProjectModel(); }
    public function get(){
        $this->json(['status'=>true,'data'=>$this->model->get()]);
    }
}