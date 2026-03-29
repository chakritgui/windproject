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
        $maxAttempts = $_ENV['LOGIN_MAX_ATTEMPTS'] ?? 5;
        $lockMinutes = $_ENV['LOGIN_LOCK_MINUTES'] ?? 10;
        $username     = $_POST['username'] ?? null;
        $pass         = $_POST['password'] ?? null;
        $timezone     = $_POST['timezone'] ?? null;
        $keepLoggedIn = filter_var($_POST['keepLoggedIn'] ?? false, FILTER_VALIDATE_BOOLEAN);
        if (!$username || !$pass) {
            echo json_encode(['status' => 'error', 'message' => 'missing_parameters']);
            exit;
        }
        $m = new Auth();
        $user = $m->findMember($username);
        if (!$user) {
            echo json_encode(['status' => 'error', 'message' => 'user_not_found']);
            exit;
        }
        if ($user['lock_until']) {
            $now = new DateTime('now', new DateTimeZone('UTC'));
            $unlockDate = new DateTime($user['lock_until'], new DateTimeZone('UTC'));
            if ($unlockDate > $now) {
                $diff = $unlockDate->getTimestamp() - $now->getTimestamp();
                $minutesLeft = ceil($diff / 60);
                if ($minutesLeft <= 0) $minutesLeft = 1;
                if ($timezone) {
                    try {
                        $unlockDate->setTimezone(new DateTimeZone($timezone));
                    } catch (Exception $e) { }
                }
                $unlockTimeFormatted = $unlockDate->format('H:i'); 
                echo json_encode([
                    'status' => 'error', 
                    'message' => 'account_locked',
                    'wait_time' => (int)$minutesLeft,
                    'unlock_time' => $unlockTimeFormatted
                ]);
                exit;
            } else {
                $m->updateLockStatus($user['member_id'], 0, null);
                $user['login_attempts'] = 0;
            }
        }
        if ($pass !== decryptToken($user['password_hash'])) {
            $newAttempts = $user['login_attempts'] + 1;
            if ($newAttempts >= $maxAttempts) {
                $date = new DateTime('now', new DateTimeZone('UTC'));
                $date->modify("+$lockMinutes minutes");
                $lockUntilUTC = $date->format('Y-m-d H:i:s');
                $m->updateLockStatus($user['member_id'], $newAttempts, $lockUntilUTC);
                $unlockDate = clone $date;
                if ($timezone) {
                    try {
                        $unlockDate->setTimezone(new DateTimeZone($timezone));
                    } catch (Exception $e) { }
                }
                $unlockTimeFormatted = $unlockDate->format('H:i');
                echo json_encode([
                    'status' => 'error', 
                    'message' => 'too_many_attempts',
                    'wait_time' => (int)$lockMinutes,
                    'unlock_time' => $unlockTimeFormatted
                ]);
            } else {
                $m->updateLockStatus($user['member_id'], $newAttempts, null);
                echo json_encode([
                    'status' => 'error', 
                    'message' => 'invalid_password', 
                    'remaining' => ($maxAttempts - $newAttempts)
                ]);
            }
            exit;
        }
        if ($user['status'] !== 'active') {
            echo json_encode(['status' => 'error', 'message' => 'account_restricted']);
            exit;
        }
        $m->updateLockStatus($user['member_id'], 0, null);
        session_regenerate_id(true); 
        $session_id = session_id();  
        $m->updateLogin($user['member_id'], $timezone, $session_id);
        $allowedPaths = [];
        if ($user['role'] === 'user') {
            $allowedPaths = $m->getMemberMenus($user['privileges_id']);
        }
        $_SESSION['session_id'] = $session_id;
        $_SESSION['user'] = [
            'id'   => $user['member_id'],
            'role' => $user['role'],
            'privileges' => $user['privileges_id'],
            'allowedPaths' => $allowedPaths,
        ];
        if ($timezone) {
            $_SESSION['timezone'] = $timezone;
        }
        if ($keepLoggedIn) {
            $selector = bin2hex(random_bytes(6));
            $validator = bin2hex(random_bytes(16));
            $expires_days = 7;
            $expires_timestamp = time() + (86400 * $expires_days);
            $expires_at_utc = convertTimeZoneUTC(date('Y-m-d H:i:s', $expires_timestamp), 'Y-m-d H:i:s');
            $m->setRememberToken($user['member_id'], $selector, hash('sha256', $validator), $expires_at_utc);
            setcookie(
                'remember_me',
                $selector . ':' . $validator,
                [
                    'expires' => $expires_timestamp,
                    'path' => '/',
                    'httponly' => true,
                    'secure' => true,
                    'samesite' => 'Lax'
                ]
            );
        }
        session_write_close();
        $location = ($user['role'] == 'user') ? "home" : "dashboard";
        echo json_encode([
            'status' => 'success', 
            'location' => $location
        ]);
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
        $lat      = $data['lat'] ?? null;
        $lng      = $data['lng'] ?? null;
        if (!$timezone) {
            echo json_encode([
                'status'  => 'error',
                'message' => 'timezone_invalid_format'
            ]);
            exit;
        }
        $m = new Auth();
        $result = $m->updateTimeZone($timezone, $lat, $lng);
        if ($result === 'success') {
            echo json_encode([
                'status'  => 'success',
                'message' => 'timezone_and_location_updated_success'
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