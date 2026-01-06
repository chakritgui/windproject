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
                'footer'     => $data['footerText'] ?? null
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
    public function saveLanguageSetting($data) {
        $this->db->beginTransaction();
        try {
            if (!empty($data['languages'])) {
                $this->updateSetting('language', $data['languages']);
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
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    private function uploadAndSave($inputName, $settingType) {
        if (empty($_FILES[$inputName]) || $_FILES[$inputName]['error'] !== UPLOAD_ERR_OK) {
            return;
        }
        $dir = "uploads/website/";
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        $file = $_FILES[$inputName];
        $safeName = preg_replace("/[^A-Za-z0-9_\.-]/", "_", basename($file['name']));
        $filePath = $dir . $settingType . "_" . $safeName;
        $target   = dirname(__DIR__, 2) . "/" . $filePath;
        if (move_uploaded_file($file['tmp_name'], $target)) {
            $this->updateSetting($settingType, $filePath);
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
}
