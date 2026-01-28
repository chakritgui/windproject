<?php   
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/UserModel.php';
class UserController extends Controller {
    private $model;
    public function __construct(){ $this->model = new UserModel(); }
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
    public function news() {
        ensure_login();
        $this->view('user/news');
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
    public function documentList() {
        $page     = max(1, (int)($_POST['page'] ?? 1));
        $type_id  = ($_POST['type_id'] !== '') ? (int)$_POST['type_id'] : null;
        $date     = trim($_POST['date'] ?? '');
        $keyword  = trim($_POST['keyword'] ?? '');
        $view     = $_POST['view'] ?? 'grid';
        $limit = ($view === 'list') ? 15 : 9;
        $data = $this->model->documentList(
            $page,
            $limit,
            $type_id,
            $date ?: null,
            $keyword ?: null
        );
        $this->json([
            'status' => true,
            'data'   => $data
        ]);
    }
    public function documentDownload() {
    if (empty($_POST['id'])) {
            $this->json([
                'status'  => false,
                'message' => 'Invalid document id'
            ]);
            return;
        }
        $result = $this->model->documentDownload([
            'id' => $_POST['id']
        ]);
        $this->json([
            'status' => $result ? true : false
        ]);
    }
    public function documentDownloadHistory() {
        $page  = $_POST['page']  ?? 1;
        $limit = 10;
        $data = $this->model->documentDownloadHistory($page, $limit);
        $this->json([
            'status' => true,
            'data'   => $data
        ]);
    }
}