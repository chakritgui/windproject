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
        public function pole($data = null){
            $filters = [];
            if (!empty($data)) {
                $json = base64_decode($data, true);
                if ($json !== false) {
                    $decoded = json_decode($json, true);
                    if (is_array($decoded)) {
                        $filters = $decoded;
                    }
                }
            }
            $poles_id  = $filters['id'] ?? null;
            $startDate = trim($filters['start'] ?? '');
            $endDate   = trim($filters['end']   ?? '');
            $height_id = $filters['h'] ?? null;
            $sensors = [];
            if (!empty($filters['s'])) {
                $sensors = array_values(array_filter(explode(',', $filters['s'])));
            }
            $startDateUTC = null;
            $endDateUTC   = null;
            $dateFormats = ['d/m/Y', 'Y-m-d'];
            if ($startDate) {
                foreach ($dateFormats as $fmt) {
                    $obj = DateTime::createFromFormat($fmt, $startDate);
                    if ($obj instanceof DateTime) {
                        $startDateUTC = convertTimeZoneUTC(
                            $obj->format('Y-m-d') . ' 00:00:00'
                        );
                        break;
                    }
                }
            }
            if ($endDate) {
                foreach ($dateFormats as $fmt) {
                    $obj = DateTime::createFromFormat($fmt, $endDate);
                    if ($obj instanceof DateTime) {
                        $endDateUTC = convertTimeZoneUTC(
                            $obj->format('Y-m-d') . ' 23:59:59'
                        );
                        break;
                    }
                }
            }
            $this->view('user/pole', [
                'id'        => $poles_id,
                'startDate' => $startDateUTC,
                'endDate'   => $endDateUTC,
                'height_id' => $height_id,
                'sensors'   => $sensors
            ]);
        }
    }