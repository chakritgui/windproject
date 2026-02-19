<?php
class SettingModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function saveWebsiteSetting($data) {
        $this->db->beginTransaction();
        try {
            $this->updateSettings(array(
                'website_en' => $data['nameEn'] ?? null,
                'website_lo' => $data['nameLo'] ?? null,
                'website_th' => $data['nameTh'] ?? null,
                'footer' => $data['footerText'] ?? null,
                'site_assessment' => $data['site_assessment'] ?? null
            ));
            $this->uploadAndSave('logoInput', 'logo');
            $this->uploadAndSave('iconInput', 'icon');
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function saveBgImage($data) {
        $this->db->beginTransaction();
        try {
            if (empty($data['oldLoginBg']) && (empty($_FILES['loginInput']) || $_FILES['loginInput']['error'] === UPLOAD_ERR_NO_FILE)) {
                $this->updateSetting('login_bg', null);
            }
            if (empty($data['oldLoginMobileBg']) && (empty($_FILES['loginMobileInput']) || $_FILES['loginMobileInput']['error'] === UPLOAD_ERR_NO_FILE)) {
                $this->updateSetting('login_mobile_bg', null);
            }
            if (empty($data['oldinfographyBg']) && (empty($_FILES['infographyInput']) || $_FILES['infographyInput']['error'] === UPLOAD_ERR_NO_FILE)) {
                $this->updateSetting('infography', null);
            }
            $this->uploadAndSave('loginInput', 'login_bg');
            $this->uploadAndSave('loginMobileInput', 'login_mobile_bg');
            $this->uploadAndSave('infographyInput', 'infography');
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function saveLanguageSetting($data) {
        $this->db->beginTransaction();
        try {
            if (!empty($data['languages'])) {
                $this->updateSetting('language', $data['languages']);
            }
            if (!empty($data['language_default'])) {
                $this->updateSetting('language_default', $data['language_default']);
            }
            if (!empty($data['language_content'])) {
                $this->updateSetting('language_content', $data['language_content']);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            return false;
        }
    }
    public function getAll(){
        try {
            $stmt = $this->db->prepare("SELECT * FROM wp_setting");
            $stmt->execute();
            $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $stmtConfig = $this->db->prepare("SELECT setting_key, setting_value FROM system_settings");
            $stmtConfig->execute();
            $configsRaw = $stmtConfig->fetchAll(PDO::FETCH_ASSOC);
            $systemConfigs = [];
            $secureKeys = ['MAIL_PASS', 'WINDY_KEY', 'GOOGLE_API_KEY'];
            foreach ($configsRaw as $row) {
                $key   = $row['setting_key'];
                $value = $row['setting_value'];
                if (in_array($key, $secureKeys, true) && !empty($value)) {
                    $value = decryptToken($value);
                }
                $systemConfigs[$key] = $value;
            }
            $userLanguage = null;
            $userId = !empty($_SESSION['user']['id']) 
                ? (int)$_SESSION['user']['id'] 
                : null;
            if ($userId) {
                $stmtLang = $this->db->prepare("SELECT language FROM wp_members_language WHERE member_id = :member_id LIMIT 1");
                $stmtLang->execute([
                    ':member_id' => $userId
                ]);
                $row = $stmtLang->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    $userLanguage = $row['language'];
                }
            }
            $stmtForgot = $this->db->prepare("SELECT * FROM wp_password_reset_settings WHERE id = 1 LIMIT 1");
            $stmtForgot->execute();
            $forgotSystem = $stmtForgot->fetch(PDO::FETCH_ASSOC);
            return [
                'settings'        => $settings,
                'system_configs'  => $userId ? $systemConfigs : [],
                'user_lang'       => $userLanguage,
                'forgot_system'   => $forgotSystem ?: []
            ];
        } catch (Exception $e) {
            error_log("Get Settings Error: " . $e->getMessage());
            return [
                'settings'        => [],
                'system_configs'  => [],
                'user_lang'       => null,
                'forgot_system'   => []
            ];
        }
    }
    public function getMenu() {
        try {
            $sql = "SELECT m.*, t.language_code, t.menu_name 
                    FROM wp_menus m
                    LEFT JOIN wp_menu_translations t ON m.id = t.menu_id
                    WHERE m.status = 'active' ORDER BY m.target_group, m.sort_order ASC";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $menus = [];
            foreach ($rows as $row) {
                $id = $row['id'];
                if (!isset($menus[$id])) {
                    $menus[$id] = [
                        'id' => $row['id'],
                        'parent_id' => $row['parent_id'],
                        'icon' => $row['icon'],
                        'path' => $row['path'],
                        'sort_order' => $row['sort_order'],
                        'target_group' => $row['target_group'],
                        'is_active' => $row['is_active'],
                        'is_default' => $row['is_default'],
                        'translations' => []
                    ];
                }
                if ($row['language_code']) {
                    $menus[$id]['translations'][$row['language_code']] = $row['menu_name'];
                }
            }
            return array_values($menus);
        } catch (Exception $e) {
            return [];
        }
    }
    public function insertMenu($data) {
        try {
            $this->db->beginTransaction();
            $group = in_array($data['target_group'], ['user', 'admin']) ? $data['target_group'] : 'user';
            $stmtOrder = $this->db->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM wp_menus WHERE target_group = ?");
            $stmtOrder->execute([$group]);
            $nextOrder = $stmtOrder->fetchColumn();
            $sql = "INSERT INTO wp_menus (icon, path, sort_order, target_group, is_active, is_default) 
                    VALUES (:icon, :path, :ord, :group, :active, 0)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':icon'   => $data['icon'] ?: 'bi-question-circle',
                ':path'   => $data['path'],
                ':ord'    => $nextOrder,
                ':group'  => $group,
                ':active' => $data['is_active']
            ]);
            $newId = $this->db->lastInsertId();
            $this->updateTranslations($newId, $data);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }
    private function updateTranslations($menuId, $data) {
        $languages = ['th', 'en', 'lo'];
        $sql = "INSERT INTO wp_menu_translations (menu_id, language_code, menu_name) 
                VALUES (:id, :lang, :name)
                ON DUPLICATE KEY UPDATE menu_name = :name_update";
        $stmt = $this->db->prepare($sql);
        foreach ($languages as $lang) {
            $val = $data['name_' . $lang] ?? '';
            $stmt->execute([
                ':id' => $menuId,
                ':lang' => $lang,
                ':name' => $val,
                ':name_update' => $val
            ]);
        }
    }
    public function updateSingleMenu($data) {
        try {
            $this->db->beginTransaction();
            $icon = !empty($data['icon']) ? $data['icon'] : 'bi-question-circle';
            $sqlMenu = "UPDATE wp_menus SET 
                        icon = :icon, 
                        path = CASE WHEN is_default = 1 THEN path ELSE :path END,
                        is_active = :is_active 
                        WHERE id = :id";
            $stmt = $this->db->prepare($sqlMenu);
            $stmt->execute([
                ':icon'      => $icon,
                ':path'      => $data['path'],
                ':is_active' => $data['is_active'],
                ':id'        => $data['id']
            ]);
            $this->updateTranslations($data['id'], $data);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log($e->getMessage()); 
            return false;
        }
    }
    public function reorderMenus($orders) {
        try {
            $this->db->beginTransaction(); 
            $stmt = $this->db->prepare("UPDATE wp_menus SET sort_order = :sort WHERE id = :id");
            foreach ($orders as $index => $item) {
                $menuId = filter_var($item['id'], FILTER_VALIDATE_INT);
                if ($menuId) {
                    $stmt->execute([
                        ':sort' => $index + 1,
                        ':id'   => $menuId
                    ]);
                }
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Reorder Error: " . $e->getMessage());
            return false;
        }
    }
    public function updateStatus($id, $status) {
        try {
            $stmt = $this->db->prepare("UPDATE wp_menus SET is_active = ? WHERE id = ?");
            return $stmt->execute([$status, $id]);
        } catch (Exception $e) {
            return false;
        }
    }
    public function deleteMenu($id) {
        try {
            $sql = "UPDATE wp_menus SET status = 'deleted', updated_at = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':id' => $id]);
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }
    private function updateSettings(array $settings) {
        foreach ($settings as $type => $value) {
            if ($value !== null && $value !== '') {
                $this->updateSetting($type, $value);
            }
        }
    }
    private function updateSetting($type, $value) {
        $sql = "UPDATE wp_setting SET setting_value = ?, updated_at = NOW() WHERE setting_type = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$value, $type]);
    }
    private function uploadAndSave($inputName, $settingType){
        if (empty($_FILES[$inputName]) || $_FILES[$inputName]['error'] !== UPLOAD_ERR_OK) {
            return;
        }
        $file = $_FILES[$inputName];
        $mimeType = mime_content_type($file['tmp_name']); 
        $dir = dirname(__DIR__, 2) . "/uploads/website/";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        if (str_contains($mimeType, 'video/')) {
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = $settingType . "." . $extension; 
            $target = $dir . $filename;
            if (move_uploaded_file($file['tmp_name'], $target)) {
                $filePath = "uploads/website/" . $filename;
                $this->updateSetting($settingType, $filePath);
            }
        } else if (str_contains($mimeType, 'image/')) {
            $filename = $settingType . ".webp";
            $target = $dir . $filename;
            $image = null;
            switch ($mimeType) {
                case 'image/jpeg': $image = imagecreatefromjpeg($file['tmp_name']); break;
                case 'image/png': 
                    $image = imagecreatefrompng($file['tmp_name']);
                    imagepalettetotruecolor($image);
                    break;
                case 'image/gif':  $image = imagecreatefromgif($file['tmp_name']); break;
                case 'image/avif': 
                    if (function_exists('imagecreatefromavif')) {
                        $image = imagecreatefromavif($file['tmp_name']);
                    }
                    break;
                case 'image/webp': $image = imagecreatefromwebp($file['tmp_name']); break;
            }
            if ($image) {
                imagealphablending($image, true);
                imagesavealpha($image, true);
                imagewebp($image, $target, 80);
                imagedestroy($image);
                $filePath = "uploads/website/" . $filename;
                $this->updateSetting($settingType, $filePath);
            }
        }
    }
    public function saveShortcut($data){
        $iconDir = __DIR__ . "/../../public/icons/";
        if (!file_exists($iconDir)) {
            mkdir($iconDir, 0777, true);
        }
        if (!empty($data['androidIcon']['tmp_name'])) {
            $androidFile = $iconDir . "icon-android.png";
            move_uploaded_file($data['androidIcon']['tmp_name'], $androidFile);
        }
        if (!empty($data['iosIcon']['tmp_name'])) {
            $iosFile = $iconDir . "icon-ios.png";
            move_uploaded_file($data['iosIcon']['tmp_name'], $iosFile);
        }
        $manifest = [
            "name" => $data['name'],
            "short_name" => $data['short_name'],
            "description" => $data['description'],
            "start_url" => "/",
            "display" => $data['display'],
            "orientation" => $data['orientation'],
            "theme_color" => $data['theme_color'],
            "background_color" => $data['background_color'],
            "icons" => [
                [
                    "src" => "icons/icon-android.png",
                    "sizes" => "512x512",
                    "type" => "image/png",
                    "purpose" => "any"
                ],
                [
                    "src" => "icons/icon-ios.png",
                    "sizes" => "512x512",
                    "type" => "image/png",
                    "purpose" => "maskable"
                ]
            ]
        ];
        file_put_contents(
            __DIR__ . "/../../public/manifest.json",
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
        $iosMeta = [
            "apple-mobile-web-app-capable" => $data['webAppCapable'],
            "apple-mobile-web-app-status-bar-style" => $data['statusBarStyle']
        ];
        file_put_contents(
            __DIR__ . "/../../public/ios_meta.json",
            json_encode($iosMeta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
        return true;
    }
    public function shortcut(){
        $publicPath   = __DIR__ . "/../../public/";
        $manifestFile = $publicPath . "manifest.json";
        $iconDir      = $publicPath . "icons/";
        if (!file_exists($manifestFile)) {
            return [];
        }
        $manifest = json_decode(file_get_contents($manifestFile), true);
        if (!$manifest) {
            return [];
        }
        $iosMetaFile = $publicPath . "ios_meta.json";
        $iosMeta = [];
        if (file_exists($iosMetaFile)) {
            $iosMeta = json_decode(file_get_contents($iosMetaFile), true);
        }
        $fileDate = function ($file) {
            return file_exists($file)
                ? date('Y/m/d H:i:s', filemtime($file))
                : null;
        };
        $data = [
            'name'             => $manifest['name'] ?? '',
            'short_name'       => $manifest['short_name'] ?? '',
            'description'      => $manifest['description'] ?? '',
            'display'          => $manifest['display'] ?? '',
            'orientation'      => $manifest['orientation'] ?? '',
            'theme_color'      => $manifest['theme_color'] ?? '',
            'background_color' => $manifest['background_color'] ?? '',
            'statusBarStyle' => $iosMeta['apple-mobile-web-app-status-bar-style'] ?? '',
            'webAppCapable'  => $iosMeta['apple-mobile-web-app-capable'] ?? '',
            'androidIcon' => [
                'path' => 'icons/icon-android.png',
                'date' => $fileDate($iconDir . 'icon-android.png'),
            ],
            'iosIcon' => [
                'path' => 'icons/icon-ios.png',
                'date' => $fileDate($iconDir . 'icon-ios.png'),
            ],
            'manifestDate' => $fileDate($manifestFile),
        ];
        return $data;
    }
    public function saveUserLanguage($userId, $lang) {
        $sql = "INSERT INTO wp_members_language (member_id, language, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE language = VALUES(language), updated_at = NOW()"; 
        try {
            $stmt = $this->db->prepare($sql);
            return $stmt->execute([(int)$userId, $lang]);
        } catch (PDOException $e) {
            error_log("Error saving user language: " . $e->getMessage());
            return false;
        }
    }
    public function saveSystemConfig($configs) {
        $sql = "INSERT INTO system_settings (setting_key, setting_value, updated_at) 
                VALUES (?, ?, NOW()) 
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value), 
                updated_at = NOW()";
        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare($sql);
            foreach ($configs as $key => $value) {
                $stmt->execute([$key, $value]);
            }
            $this->db->commit();
            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();
            error_log("Error saving system configuration: " . $e->getMessage());
            return false;
        }
    }
    public function getSetting($key) {
        try {
            $sql = "SELECT setting_value FROM system_settings WHERE setting_key = :key LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':key', $key, PDO::PARAM_STR);
            $stmt->execute();
            $result = $stmt->fetchColumn();
            return ($result !== false) ? $result : ''; 
        } catch (PDOException $e) {
            error_log("Error in getSetting Model: " . $e->getMessage());
            return null;
        }
    }
    public function updateSystemConfig($data) {
        try {
            $this->db->beginTransaction();
            foreach ($data as $key => $value) {
                $sql = "INSERT INTO system_settings (setting_key, setting_value, updated_at) 
                        VALUES (:key, :value, NOW()) 
                        ON DUPLICATE KEY UPDATE 
                        setting_value = :value_update, 
                        updated_at = NOW()";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([
                    ':key'          => $key,
                    ':value'        => $value,
                    ':value_update' => $value
                ]);
            }
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            error_log("Update Settings Error: " . $e->getMessage());
            return false;
        }
    }
    public function savePasswordSettings($data){
        try {
            $this->db->beginTransaction();  
            $sql = "INSERT INTO wp_password_reset_settings (
                        id, is_email_link_enabled, is_admin_contact_enabled, 
                        admin_email, admin_line_oa, admin_telegram, admin_tel,
                        admin_others, is_system_request_enabled, updated_at
                    ) VALUES (
                        1, :is_email_link, :is_admin_contact, 
                        :admin_email, :admin_line, :admin_tele, :admin_tel,
                        :admin_others, :is_system_req, NOW()
                    )
                    ON DUPLICATE KEY UPDATE
                        is_email_link_enabled      = VALUES(is_email_link_enabled),
                        is_admin_contact_enabled   = VALUES(is_admin_contact_enabled),
                        admin_email                = VALUES(admin_email),
                        admin_line_oa              = VALUES(admin_line_oa),
                        admin_telegram             = VALUES(admin_telegram),
                        admin_tel             = VALUES(admin_tel),
                        admin_others               = VALUES(admin_others),
                        is_system_request_enabled  = VALUES(is_system_request_enabled),
                        updated_at                 = NOW()";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':is_email_link'   => ($data['is_email_link_enabled'] == '1') ? 1 : 0,
                ':is_admin_contact'=> ($data['is_admin_contact_enabled'] == '1') ? 1 : 0,
                ':admin_email'     => $data['admin_email'] ?? null,
                ':admin_line'      => $data['admin_line_oa'] ?? null,
                ':admin_tele'      => $data['admin_telegram'] ?? null,
                ':admin_tel'      => $data['admin_tel'] ?? null,
                ':admin_others'    => $data['admin_others'] ?? null,
                ':is_system_req'   => ($data['is_system_request_enabled'] == '1') ? 1 : 0
            ]);
            $this->db->commit();
            return true;
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            error_log("Save Password Settings Error: " . $e->getMessage());
            return false;
        }
    }
}