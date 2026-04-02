<?php
    class Auth {
        private $db;
        public function __construct() {
            $this->db = Database::getInstance()->pdo;
        }
        public function findMember($username) {
            $stmt = $this->db->prepare('SELECT member_id, password_hash, role, status, privileges_id, login_attempts, lock_until FROM wp_members WHERE username = ? LIMIT 1');
            $stmt->execute([$username]);
            return $stmt->fetch();
        }
        public function getMemberMenus($privileges_id) {
            if (empty(trim((string)$privileges_id))) {
                $sql = "SELECT path FROM wp_menus 
                        WHERE target_group = 'user' 
                        AND is_active = 1 AND status = 'active'
                        ORDER BY id ASC";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
            } else {
                $sql = "SELECT m.path 
                        FROM wp_menus m
                        INNER JOIN wp_members_privileges_config c ON m.id = c.menu_id
                        WHERE c.privileges_id = ? 
                        AND c.status = 'active' 
                        AND m.is_active = 1
                        ORDER BY m.id ASC";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([$privileges_id]);
            }
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        public function findByEmail($email, $lang) {
            $stmt = $this->db->prepare('SELECT member_id FROM wp_members WHERE email = ? LIMIT 1');
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            if (!$user) {
                return 'email_not_found';
            }
            $updateStmt = $this->db->prepare("UPDATE wp_password_resets SET is_valid = 0 WHERE email = ? AND is_valid = 1");
            $updateStmt->execute([$email]);
            $token = bin2hex(random_bytes(32));
            $date = new DateTime("now", new DateTimeZone('UTC'));
            $stmt = $this->db->prepare("INSERT INTO wp_password_resets (email, token, created_at, expires_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR))");
            $stmt->execute([$email, $token]);
            $mailHelper = new MailHelper($this->db);
            $sendResult = $mailHelper->sendMail($email, $lang, $token);
            return $sendResult ? 'success' : 'mail_error';
        }
        public function updateLogin($member_id, $timezone, $session_id) {
            $stmt = $this->db->prepare('UPDATE wp_members SET last_login_at = NOW() WHERE member_id = ?');
            $stmt->execute([$member_id]);
            $stmt = $this->db->prepare("UPDATE wp_login_logs SET logout_at = NOW(), log_type = 'kick' WHERE member_id = ? AND logout_at IS NULL");
            $stmt->execute([$member_id]);
            $stmt = $this->db->prepare('INSERT INTO wp_login_logs (member_id, login_at, ip_address, login_device, timezone, session_id) VALUES (?, NOW(), ?, ?, ?, ?)');
            $ip_address = getClientIp();
            if ($ip_address === '::1') $ip_address = '127.0.0.1';
            $login_device = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            $stmt->execute([$member_id, $ip_address, $login_device, $timezone, $session_id]);
        }
        public function setRememberToken($member_id, $selector, $validator_hash, $expires_at) {
            $stmt = $this->db->prepare('UPDATE wp_members SET remember_selector = ?, remember_validator_hash = ?, remember_expires_at = ? WHERE member_id = ?');
            $stmt->execute([$selector, $validator_hash, $expires_at, $member_id]);
        }
        public function checkRememberMe() {
            $cookie = $_COOKIE['remember_me'] ?? null;
            if (!$cookie || !strpos($cookie, ':')) return false;
            list($selector, $validator) = explode(':', $cookie);
            $stmt = $this->db->prepare('SELECT * FROM wp_members WHERE remember_selector = ? AND remember_expires_at > NOW() AND status = "active"');
            $stmt->execute([$selector]);
            $user = $stmt->fetch();
            if (!$user) return false;
            if (hash_equals($user['remember_validator_hash'], hash('sha256', $validator))) {
                $allowedPaths = [];
                if ($user['role'] === 'user') {
                    $allowedPaths = $this->getMemberMenus($user['privileges_id']);
                }
                return [
                    'user' => $user,
                    'allowedPaths' => $allowedPaths
                ];
            } else {
                return false;
            }
        }
        public function updateLogout($member_id) {
            $stmt = $this->db->prepare("UPDATE wp_login_logs SET logout_at = NOW(), log_type = 'logout' WHERE member_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1");
            $stmt->execute([$member_id]);  
            $stmt = $this->db->prepare("UPDATE wp_members SET remember_selector = NULL, remember_validator_hash = NULL, remember_expires_at = NULL WHERE member_id = ?");
            $stmt->execute([$member_id]);
        } 
        public function resetNewPassword($token, $new_password) {
            try {
                $stmt = $this->db->prepare("SELECT email FROM wp_password_resets WHERE token = ? AND is_valid = 1 AND expires_at > UTC_TIMESTAMP() LIMIT 1");
                $stmt->execute([$token]);
                $resetRequest = $stmt->fetch(PDO::FETCH_ASSOC);
                if (!$resetRequest) {
                    return 'invalid_or_expired_token';
                }
                $email = $resetRequest['email'];
                $hashedPassword = encryptToken($new_password);
                $this->db->beginTransaction();
                $updateUser = $this->db->prepare("UPDATE wp_members SET password_hash = ? WHERE email = ?");
                $updateUser->execute([$hashedPassword, $email]);
                $disableToken = $this->db->prepare("UPDATE wp_password_resets SET is_valid = 0 WHERE token = ?");
                $disableToken->execute([$token]);
                $this->db->commit();
                return 'success';
            } catch (Exception $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                return 'process_failed';
            }
        }
        public function updateTimeZone($timezone, $lat = null, $lng = null) {
            $member_id = $_SESSION['user']['id'];
            $_SESSION['timezone'] = $timezone;
            $login_location = null;
            if ($lat !== null && $lng !== null) {
                $login_location = $lat . ',' . $lng;
            }
            $sql = "UPDATE wp_login_logs 
                    SET timezone = :timezone,
                        login_location = :login_location
                    WHERE logs_id = (
                        SELECT MAX(logs_id) 
                        FROM (SELECT logs_id FROM wp_login_logs WHERE member_id = :member_id_inner) AS tmp
                    )";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':timezone'       => $timezone,
                ':login_location' => $login_location,
                ':member_id_inner' => $member_id
            ]);
            return 'success';
        }
        public function getForgotSettings() {
            try {
                $sql = "SELECT * FROM wp_password_reset_settings WHERE id = 1 LIMIT 1";
                $stmt = $this->db->prepare($sql);
                $stmt->execute();
                return $stmt->fetch(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                error_log("Get Forgot Settings Error: " . $e->getMessage());
                return null;
            }
        }
        public function saveRequest($request_email, $request_remark, $visitorId) {
            $stmt = $this->db->prepare('SELECT member_id FROM wp_members WHERE email = ? OR username = ? LIMIT 1');
            $stmt->execute([$request_email, $request_email]); 
            $user = $stmt->fetch();
            if (!$user) {
                return 'email_or_user_not_found';
            }
            $stmt = $this->db->prepare("SELECT request_id FROM wp_password_reset_requests WHERE visitorId = ? AND status = 'pending' LIMIT 1");
            $stmt->execute([$visitorId]);
            $existingRequest = $stmt->fetch();
            if ($existingRequest) {
                $stmt = $this->db->prepare("UPDATE wp_password_reset_requests SET user_email = ?, user_note = ?, created_at = NOW() WHERE request_id = ?");
                $stmt->execute([$request_email, $request_remark, $existingRequest['request_id']]);
                return 'success';
            } else {
                $stmt = $this->db->prepare("INSERT INTO wp_password_reset_requests (visitorId, user_email, user_note, status, created_at) VALUES (?, ?, ?, 'pending', NOW())");
                $stmt->execute([$visitorId, $request_email, $request_remark]);
                return 'success';
            }
        }
        public function getPendingByVisitor($visitor_id) {
            $stmt = $this->db->prepare("SELECT user_email, user_note, status, created_at FROM wp_password_reset_requests WHERE visitorId = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1");    
            $stmt->execute([$visitor_id]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                $result['created_at'] = convertTimeZone($result['created_at'], 'd/m/Y H:i:s');
                return $result;
            }
            return null; 
        }
        public function updateLockStatus($member_id, $attempts, $lock_until = null) {
            $sql = "UPDATE wp_members SET login_attempts = ?, lock_until = ? WHERE member_id = ?";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([$attempts, $lock_until, $member_id]);
        }
        public function getActiveDisclaimer() {
            $userId = $_SESSION['user']['id'] ?? null;
            $targetLang = 'en'; 
            if ($userId) {
                $stmtLang = $this->db->prepare("SELECT language FROM wp_members_language WHERE member_id = :member_id LIMIT 1");
                $stmtLang->execute([':member_id' => $userId]);
                $row = $stmtLang->fetch(PDO::FETCH_ASSOC);
                if ($row) { $targetLang = $row['language']; }
            }
            $sql = "SELECT d.*, dt.title, dt.content, dt.lang_code 
                    FROM wp_disclaimers d
                    JOIN wp_disclaimer_translations dt ON d.id = dt.disclaimer_id
                    WHERE d.is_active = 1 
                    AND d.deleted_at IS NULL
                    ORDER BY 
                        CASE 
                            WHEN dt.lang_code = :target_lang THEN 1
                            WHEN dt.lang_code = 'en' THEN 2
                            WHEN dt.lang_code = 'th' THEN 3
                            WHEN dt.lang_code = 'lo' THEN 4
                            ELSE 5 
                        END ASC
                    LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':target_lang' => $targetLang]);
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        public function checkUserAcceptedDisclaimer($userId, $disclaimerId, $currentVersion, $showMode) {
            if ($showMode === 'every_login') {
                return false; 
            }
            $sql = "SELECT id FROM wp_user_disclaimer_accepts 
                    WHERE user_id = :user_id 
                    AND disclaimer_id = :disclaimer_id";
            if ($showMode === 'version_change') {
                $sql .= " AND version = :version";
                $params = [
                    'user_id' => $userId,
                    'disclaimer_id' => $disclaimerId,
                    'version' => $currentVersion
                ];
            } else {
                $params = [
                    'user_id' => $userId,
                    'disclaimer_id' => $disclaimerId
                ];
            }
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch() ? true : false;
        }
        public function acceptDisclaimer($userId, $disclaimerId, $version) {
            $sql = "INSERT INTO wp_user_disclaimer_accepts (user_id, disclaimer_id, version, accepted_at) 
                    VALUES (:user_id, :disclaimer_id, :version, NOW())
                    ON DUPLICATE KEY UPDATE version = :version, accepted_at = NOW()";
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([
                'user_id' => $userId,
                'disclaimer_id' => $disclaimerId,
                'version' => $version
            ]);
        }
    }