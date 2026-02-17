<?php
class AuthController extends Controller {
    public function login() {
        if (!empty($_SESSION['user'])) {
            $this->redirect(BASE_URL);
            exit;
        }
        $this->view('auth/login');
    }
    public function doLogin() {
        header('Content-Type: application/json; charset=utf-8');
        $username = $_POST['username'] ?? null;
        $pass = $_POST['password'] ?? null;
        $timezone = $_POST['timezone'] ?? null;
        $keepLoggedIn = filter_var($_POST['keepLoggedIn'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (!$username || !$pass) {
            echo json_encode(['status' => 'error', 'message' => 'missing_parameters']);
            exit;
        }
        $m = new Auth();
        $user = $m->findMember($username);
        if ($user && $pass === decryptToken($user['password_hash']) && $user['status'] === 'active') {
            session_regenerate_id(true); 
            $session_id = session_id();  
            $m->updateLogin($user['member_id'], $timezone, $session_id);
            $_SESSION['session_id'] = $session_id;
            $_SESSION['user'] = [
                'id'   => $user['member_id'],
                'role' => $user['role']
            ];
            if($timezone) {
                $_SESSION['timezone'] = $timezone;
            }
            if ($keepLoggedIn) {
                $selector = bin2hex(random_bytes(6));
                $validator = bin2hex(random_bytes(16));
                $expires_days = 30;
                $expires_at = convertTimeZoneUTC(date('Y-m-d H:i:s', time() + (86400 * $expires_days)), 'Y-m-d H:i:s');
                $m->setRememberToken($user['member_id'], $selector, hash('sha256', $validator), $expires_at);
                setcookie(
                    'remember_me',
                    $selector . ':' . $validator,
                    [
                        'expires' => time() + (86400 * $expires_days),
                        'path' => '/',
                        'httponly' => true,
                        'secure' => true,
                        'samesite' => 'Lax'
                    ]
                );
            }
            session_write_close();
            $location = ($user['role'] == 'user') ? "home" : "dashboard";
            echo json_encode(['status' => 'success', 'location' => $location]);
        } else {
            $message = ($user && $user['status'] !== 'active') ? 'account_inactive' : 'invalid_credentials';
            echo json_encode(['status' => 'error', 'message' => $message]);
        }
        exit;
    }
    public function logout() {
        $m = new Auth();
        $m->updateLogout($_SESSION['user']['id']);
        session_destroy();
        $this->redirect('login');
        exit;
    }
    public function forgot() {
        $m = new Auth();
        $settings = $m->getForgotSettings();
        if (!$settings || (
            $settings['is_email_link_enabled'] == 0 && 
            $settings['is_admin_contact_enabled'] == 0 && 
            $settings['is_system_request_enabled'] == 0
        )) {
            $this->redirect('login'); 
            exit;
        }
        $this->view('auth/forgot');
    }
    public function reset() {
        $this->view('auth/reset');
    }
    public function sendReset() {
        header('Content-Type: application/json; charset=utf-8');
        $email = $_POST['email'] ?? null;
        $lang = $_POST['lang'] ?? 'en';
        if (!$email) {
            echo json_encode(['status' => 'error', 'message' => 'missing_email']);
            exit;
        }
        $m = new Auth();
        $result = $m->findByEmail($email, $lang);
        if ($result === 'success') {
            echo json_encode([
                'status'  => 'success', 
                'message' => 'reset_success'
            ]);
        } else {
            echo json_encode([
                'status'  => 'error', 
                'message' => ($result === 'email_not_found') ? 'email_not_found' : 'process_failed'
            ]);
        }
        exit;
    }
    public function saveRequest() {
        header('Content-Type: application/json; charset=utf-8');
        $request_email = $_POST['request_email'] ?? null;
        $request_remark = $_POST['request_remark'] ?? null;
        $visitorId = $_POST['visitorId'] ?? null;
        if (!$request_email) {
            echo json_encode(['status' => 'error', 'message' => 'missing_email']);
            exit;
        }
        $m = new Auth();
        $result = $m->saveRequest($request_email, $request_remark, $visitorId);
        if ($result === 'success') {
            echo json_encode([
                'status'  => 'success', 
                'message' => 'request_success'
            ]);
        } else {
            echo json_encode([
                'status'  => 'error', 
                'message' => ($result === 'email_or_user_not_found') ? 'email_or_user_not_found' : 'process_failed'
            ]);
        }
        exit;
    }
    public function account() {
        ensure_login();
        $this->view('account');
    }
    public function updatePassword() {
        header('Content-Type: application/json; charset=utf-8');
        $token = $_POST['token'] ?? null;
        $password = $_POST['password'] ?? null;
        $lang = $_POST['lang'] ?? 'en';
        if (!$token || !$password) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'password_invalid_format'
            ]);
            exit;
        }
        $m = new Auth();
        $result = $m->resetNewPassword($token, $password);
        if ($result === 'success') {
            echo json_encode([
                'status'  => 'success',
                'message' => 'password_updated_success'
            ]);
        } else {
            echo json_encode([
                'status'  => 'error',
                'message' => $result 
            ]);
        }
        exit;
    }
    public function updateTimeZone() {
        header('Content-Type: application/json; charset=utf-8');
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        $timezone = $data['timezone'] ?? null;
        if (!$timezone) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'timezone_invalid_format'
            ]);
            exit;
        }
        $m = new Auth();
        $result = $m->updateTimeZone($timezone);
        if ($result === 'success') {
            echo json_encode([
                'status'  => 'success',
                'message' => 'timezone_updated_success'
            ]);
        } else {
            echo json_encode([
                'status'  => 'error',
                'message' => $result 
            ]);
        }
        exit;
    }
    public function getLatestPendingRequest() {
        header('Content-Type: application/json');
        $visitor_id = $_POST['visitor_id'] ?? null;
        if (!$visitor_id) {
            echo json_encode(['status' => 'error', 'message' => 'no_id']);
            exit;
        }
        $m = new Auth();
        $data = $m->getPendingByVisitor($visitor_id);
        echo json_encode([
            'status' => 'success',
            'data' => $data
        ]);
        exit;
    }
}