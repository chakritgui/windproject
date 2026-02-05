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
            $this->uploadAndSave('loginInput', 'login_bg');
            $this->uploadAndSave('loginMobileInput', 'login_mobile_bg');
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
    public function getAll() {
        $sql = "SELECT * FROM wp_setting";
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $userLanguage = null;
        if(!empty($_SESSION['user']['id'])) {
            $sql = "SELECT language FROM wp_members_language WHERE member_id = ?";
            $stmtLang = $this->db->prepare($sql); 
            $stmtLang->execute([(int)$_SESSION['user']['id']]);
            $row = $stmtLang->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                $userLanguage = $row['language'];
            }
        }
        return [
            'settings' => $settings,
            'user_lang' => $userLanguage
        ];
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
        $imgInfo = getimagesize($file['tmp_name']);
        if ($imgInfo === false) {
            return;
        }
        $dir = dirname(__DIR__, 2) . "/uploads/website/";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $filename = $settingType . ".webp";
        $target   = $dir . $filename;
        switch ($imgInfo['mime']) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($file['tmp_name']);
                break;
            case 'image/png':
                $image = imagecreatefrompng($file['tmp_name']);
                imagepalettetotruecolor($image);
                imagealphablending($image, true);
                imagesavealpha($image, true);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($file['tmp_name']);
                break;
            default:
                return;
        }
        imagewebp($image, $target, 80);
        imagedestroy($image);
        $filePath = "uploads/website/" . $filename;
        $this->updateSetting($settingType, $filePath);
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
}