<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ContentModel.php';
class ContentController extends Controller {
    private $model;
    public function __construct(){ $this->model = new ContentModel(); }
    public function getBySlug(){
        $slug = $_POST['slug'] ?? '';
        $mode = $_POST['mode'] ?? 'preview';
        $this->json(['status'=>'success','data'=>$this->model->getBySlug($slug,$mode)]);
    }
}