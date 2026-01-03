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
}
