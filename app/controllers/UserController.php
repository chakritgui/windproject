<?php   
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/UserModel.php';
class UserController extends Controller {
    private $model;
    private $db;
    public function __construct(){ 
        $this->model = new UserModel(); 
        $this->db = Database::getInstance()->pdo;
    }
    public function user() {
        ensure_login();
        $this->checkPermission('home');
        $this->view('user/map');
    }
    public function project($path = null){
        ensure_login();
        $this->checkPermission('pstg');
        $folderIds = [];
        if ($path) {
            $segments = explode('/', trim($path, '/'));
            foreach ($segments as $seg) {
                if (is_numeric($seg)) {
                    $folderIds[] = $seg;
                }
            }
        }
        $this->view('user/project', [
            'folderIds' => $folderIds
        ]);
    }
    public function document() {
        ensure_login();
        $this->checkPermission('document');
        $this->view('user/document');
    }
    public function download() {
        ensure_login();
        $this->checkPermission('download');
        $this->view('user/download');
    }
    public function news() {
        ensure_login();
        $this->checkPermission('news');
        $this->view('user/news');
    }
    public function pole($data = null){
        ensure_login();
        $this->checkPermission('home');
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
        $levels = [];
        if (!empty($filters['lv'])) {
            $levels = array_values(array_filter(explode(',', $filters['lv'])));
        }
        $startDateUTC = null;
        $endDateUTC   = null;
        $dateFormats = ['d/m/Y', 'Y-m-d'];
        if ($startDate) {
            foreach ($dateFormats as $fmt) {
                $obj = DateTime::createFromFormat($fmt, $startDate);
                if ($obj instanceof DateTime) {
                    $startDateUTC = $obj->format('Y-m-d') . ' 00:00:00';
                    break;
                }
            }
        }
        if ($endDate) {
            foreach ($dateFormats as $fmt) {
                $obj = DateTime::createFromFormat($fmt, $endDate);
                if ($obj instanceof DateTime) {
                    $endDateUTC = $obj->format('Y-m-d') . ' 23:59:59';
                    break;
                }
            }
        }
        $this->view('user/pole', [
            'id'        => $poles_id,
            'startDate' => $startDateUTC,
            'endDate'   => $endDateUTC,
            'height_id' => $height_id,
            'sensors'   => $sensors,
            'levels'   => $levels,
        ]);
    }
    private function checkPermission($path) {
        ensure_login();
        $allowed = $_SESSION['user']['allowedPaths'] ?? [];
        if (empty($allowed)) {
            header('Location: account'); 
            exit;
        }
        if (in_array($path, $allowed)) {
            return true;
        }
        header('Location: ' . $allowed[0]);
        exit;
    }
    public function documentList() {
        $input = json_decode(file_get_contents("php://input"), true);
        $page     = max(1, (int)($input['page'] ?? 1));
        $contract_id  = ($input['contract'] !== '') ? (int)$input['contract'] : null;
        $project_id  = ($input['project'] !== '') ? (int)$input['project'] : null;
        $type_id  = ($input['type'] !== '') ? (int)$_POST['type'] : null;
        $installations_id  = ($input['installations'] !== '') ? (int)$input['installations'] : null;
        $poles_id  = ($input['poles'] !== '') ? (int)$input['poles'] : null;
        $date     = trim($input['date'] ?? '');
        $keyword  = trim($input['keyword'] ?? '');
        $view     = $input['view'] ?? 'grid';
        $limit = ($view === 'list') ? 15 : 12;
        $order = $input['order'] ?? 'desc';
        $data = $this->model->documentList(
            $page,
            $limit,
            $contract_id,
            $project_id,
            $type_id,
            $installations_id,
            $poles_id,
            $date ?: null,
            $keyword ?: null,
            $order
        );
        $this->json([
            'status' => true,
            'data'   => $data,
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
        $input = json_decode(file_get_contents("php://input"), true);
        $page  = $input['page']  ?? 1;
        $limit = 10;
        $data = $this->model->documentDownloadHistory($page, $limit);
        $this->json([
            'status' => true,
            'data'   => $data
        ]);
    }
    public function newsList() {
        $page     = max(1, (int)($_POST['page'] ?? 1));
        $limit = 10;
        $order = $_POST['order'] ?? 'desc';
        $data = $this->model->newsList(
            $page,
            $limit,
            $order
        );
        $this->json([
            'status' => true,
            'data'   => $data
        ]);
    }
    public function info() {
        $start  = intval($_POST['start'] ?? 0);
        $length = intval($_POST['length'] ?? 20);
        $order  = $_POST['currentSort'] ?? 'asc';
        $breadcrumbs = [];
        $parentId = null;
        if (!empty($_POST['path']) && is_array($_POST['path'])) {
            foreach ($_POST['path'] as $slug) {
                $stmt = $this->db->prepare("SELECT id, name, slug, level, parent_id FROM wp_folder WHERE slug = :slug AND parent_id <=> :parent AND status = 'active' LIMIT 1");
                $stmt->execute([
                    ':slug'   => $slug,
                    ':parent' => $parentId
                ]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$row) break;
                $breadcrumbs[] = $row;
                $parentId = $row['id'];
            }
        }
        $filters = [
            'level'  => intval($_POST['level'] ?? 1),
            'item'   => $parentId,
        ];
        $result = $this->model->info($start, $length, $filters, $order);
        $this->json([
            'status' => true,
            'data' => $result,
            'breadcrumbs' => $breadcrumbs
        ]);
    }
}