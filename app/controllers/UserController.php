<?php   
    class UserController extends Controller {
        public function user() {
            ensure_login();
            $this->view('user/map');
        }
        public function project() {
            ensure_login();
            $this->view('user/project');
        }
        public function document() {
            ensure_login();
            $this->view('user/document');
        }
        public function download() {
            ensure_login();
            $this->view('user/download');
        }
        public function projectDetail($slug) {
            ensure_login();
            $project = 1;
            if (!$project) {
                http_response_code(404);
                exit('Project not found');
            }
            $this->view('user/project/detail', [
                'project' => $project
            ]);
        }
        public function pole($slug) {
            ensure_login();
            $pole = 1;
            if (!$pole) {
                http_response_code(404);
                exit('Project not found');
            }
            $this->view('user/pole', [
                'pole' => $pole
            ]);
        }
    }