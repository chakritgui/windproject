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
        $username      = $_POST['username'] ?? null;
        $pass          = $_POST['password'] ?? null;
        $keepLoggedIn  = $_POST['keepLoggedIn'] ?? false;
        if (!$username || !$pass) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'missing_parameters'
            ]);
            exit;
        }
        $m = new Auth();
        $user = $m->findByEmail($username);
        if ($user && md5($pass) === $user['password']) {
            $_SESSION['user'] = [
                'id'   => $user['id'],
                'role' => 'user'
            ];
            echo json_encode([
                'status' => 'success'
            ]);
        } else {
            echo json_encode([
                'status'  => 'error',
                'message' => 'invalid_credentials'
            ]);
        }
        exit;
    }
    public function logout() {
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
    public function switchAdmin() {
        if (!empty($_SESSION['user'])) {
            $_SESSION['user']['role'] = 'admin';
        }

         $this->redirect(BASE_URL);
        exit;
    }
    public function switchUser() {
        if (!empty($_SESSION['user'])) {
            $_SESSION['user']['role'] = 'user';
        }
        $this->redirect(BASE_URL);
        exit;
    }
    public function account() {
        ensure_login();
        $this->view('account');
    }
}