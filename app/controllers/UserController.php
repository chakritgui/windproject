<?php   
    class UserController extends Controller {
        public function user() {
            ensure_login();
            $this->view('user/map');
        }
        public function news() {
            ensure_login();
            $this->view('user/news');
        }
        public function document() {
            ensure_login();
            $this->view('user/document');
        }
        public function download() {
            ensure_login();
            $this->view('user/download');
        }
        public function newsDetail($slug) {
            ensure_login();
            $news = 1;
            if (!$news) {
                http_response_code(404);
                exit('News not found');
            }
            $this->view('user/news/detail', [
                'news' => $news
            ]);
        }
        public function pole($slug) {
            ensure_login();
            $pole = 1;
            if (!$pole) {
                http_response_code(404);
                exit('News not found');
            }
            $this->view('user/pole', [
                'pole' => $pole
            ]);
        }
    }