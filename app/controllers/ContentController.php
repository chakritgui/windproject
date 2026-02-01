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
    public function content($mode, $slug) {
        $decoded_slug = urldecode($slug);
        $this->view('content/view', ['decoded_slug' => $decoded_slug, 'mode' => $mode]);
    }
}