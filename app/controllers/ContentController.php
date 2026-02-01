<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ContentModel.php';
class ContentController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new ContentModel(); }
    public function get(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>'success','data'=>$this->model->get($id)]);
    }
}