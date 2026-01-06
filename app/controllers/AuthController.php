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
        $keepLoggedIn  = $_POST['keepLoggedIn'] ?? false;
        if (!$username || !$pass) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'missing_parameters'
            ]);
            exit;
        }
        $m = new Auth();
        $user = $m->findMember($username);
        if ($user && $pass === decryptToken($user['password_hash']) && $user['status'] === 'active') {
            $m->updateLogin($user['member_id'], $timezone);
            $_SESSION['user'] = [
                'id'   => $user['member_id'],
                'role' => $user['role']
            ];
            if($timezone) {
                $_SESSION['timezone'] = $timezone;
            }
            echo json_encode([
                'status' => 'success'
            ]);
        } else {
            if($user && $user['status'] !== 'active') {
                $message = 'account_inactive';
            } else {
                $message = 'invalid_credentials';
            }
            echo json_encode([
                'status'  => 'error',
                'message' => $message
            ]);
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
        $this->view('auth/forgot');
    }
    public function sendReset() {
        header('Content-Type: application/json; charset=utf-8');
        $email = $_POST['email'] ?? null;
        if (!$email) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'missing_email'
            ]);
            exit;
        }
        $m = new Auth();
        $user = $m->findByEmail($email);
        echo json_encode([
            'status'  => $user ? 'success' : 'error',
            'message' => $user ? 'reset_success' : 'email_not_found'
        ]);
        exit;
    }
    public function account() {
        ensure_login();
        $this->view('account');
    }
}