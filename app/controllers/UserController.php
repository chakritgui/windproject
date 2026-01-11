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
        public function pole($data = null) {
            $filters = [];
            if ($data) {
                $decodedJson = base64_decode(urldecode($data));
                $filters = json_decode($decodedJson, true);
            }
            $poles_id = $filters['id'] ?? null;
            $startDate = $filters['start'] ?? null;
            $endDate   = $filters['end']   ?? null;
            $height_id = $filters['h']     ?? null;
            $sensors   = isset($filters['s']) ? explode(',', $filters['s']) : [];
            $this->view('user/pole', [
                'id'  => $poles_id,
                'startDate' => $startDate,
                'endDate'   => $endDate,
                'height_id' => $height_id,
                'sensors'   => $sensors,
                'filters'   => $filters 
            ]);
        }
    }