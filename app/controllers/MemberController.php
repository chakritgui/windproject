<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/MemberModel.php';
class MemberController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new MemberModel(); }
    public function index(){ $this->view('member/index'); }
    public function list(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'role'=> $_POST['role'] ?? '',
            'status'=> $_POST['status'] ?? '',
        ];
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->list(
            $start,
            $length,
            $filters,
            $search,
            $colIndex,
            $orderDir
        );
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function history(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'date'=> $_POST['date'] ?? '',
            'member'=> $_POST['member'] ?? '',
            'role'=> $_POST['role'] ?? '',
            'device'=> $_POST['device'] ?? '',
            'browser'=> $_POST['browser'] ?? '',
            'timezone'=> $_POST['timezone'] ?? '',
        ];
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->history(
            $start,
            $length,
            $filters,
            $search,
            $colIndex,
            $orderDir
        );
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function request(){
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $filters = [
            'status'=> $_POST['status'] ?? '',
            'date'=> $_POST['date'] ?? '',
            'member'=> $_POST['member'] ?? '',
            'role'=> $_POST['role'] ?? '',
        ];
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->request(
            $start,
            $length,
            $filters,
            $search,
            $colIndex,
            $orderDir
        );
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function get(){
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>true,'data'=>$this->model->get($id)]);
    }
    public function delete() {
        $id = intval($_POST['id'] ?? 0);
        $this->json(['status'=>$this->model->delete($id)]);
    }
    public function reject() {
        $id = intval($_POST['id'] ?? 0);
        $note = $_POST['note'] ?? null;
        $this->json(['status'=>$this->model->reject($id, $note)]);
    }
    public function approved() {
        $id = intval($_POST['id'] ?? 0);
        $member_id = intval($_POST['member_id'] ?? 0);
        $password = $_POST['password'] ?? null;
        $send_notification = $_POST['send_notification'] ?? 'no';
        $this->json(['status'=>$this->model->approved($id, $member_id, $password, $send_notification)]);
    }
    public function save() {
        $data = [
            'member_id' => intval($_POST['member_id'] ?? 0),
            'username' => $_POST['username'] ?? '',
            'first_name' => $_POST['first_name'] ?? '',
            'last_name' => $_POST['last_name'] ?? '',
            'email' => $_POST['email'] ?? '',
            'phone' => $_POST['phone'] ?? '',
            'role' => $_POST['role'] ?? '',
            'status' => $_POST['status'] ?? '',
            'password' => $_POST['password'] ?? ''
        ];
        $this->json($this->model->save($data));
    }
    public function checkemail() {
        $email = $_POST['email'] ?? '';
        $member_id = $_POST['member_id'] ?? '';
        $exists = $this->model->checkEmailExists($email, $member_id);
        $this->json(['exists' => $exists]);
    }
    public function checkusername() {
        $username = $_POST['username'] ?? '';
        $member_id = $_POST['member_id'] ?? '';
        $exists = $this->model->checkUsernameExists($username, $member_id);
        $this->json(['exists' => $exists]);
    }
    public function filter() {
        $page = intval($_POST['page'] ?? 0);
        $limit = intval($_POST['limit'] ?? 10);
        $searchTerm = $_POST['searchTerm'] ?? '';
        $type = $_POST['type'] ?? '';
        $this->json(['status'=>true , 'data' => $this->model->filter($page, $limit, $type, $searchTerm)]);
    }
    public function permission() {
        $this->json(['status'=>true , 'data' => $this->model->permission()]);
    }
    public function update_permissions() {
        $permissions = $_POST['permissions'] ?? [];
        if (empty($permissions)) {
            $this->json(['status' => false, 'message' => 'ไม่มีข้อมูลส่งมา']);
            return;
        }
        $result = $this->model->saveAllPermissions($permissions);
        if ($result) {
            $this->json(['status' => true, 'message' => 'saved_successfully']);
        } else {
            $this->json(['status' => false, 'message' => 'cannot_save']);
        }
    }
}