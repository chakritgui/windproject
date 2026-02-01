<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/ContentModel.php';
class ContentController extends Controller {
    private $model;
    public function __construct(){ $this->model = new ContentModel(); }
    public function get(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>'success','data'=>$this->model->get($id)]);
    }
    public function content($mode, $slug) {
        $decoded_slug = urldecode($slug);
        // $content = $this->model->getBySlug($decoded_slug);
        // if (!$content) {
        //     http_response_code(404);
        //     die("Content not found");
        // }
        // if ($mode === 'preview') {
        //     if (!is_admin()) {
        //         http_response_code(403);
        //         die("Access denied");
        //     }
        // } elseif ($mode !== 'view') {
        //     http_response_code(400);
        //     die("Invalid mode");
        // }
        $this->view('content/view', ['decoded_slug' => $decoded_slug, 'mode' => $mode]);
    }
}