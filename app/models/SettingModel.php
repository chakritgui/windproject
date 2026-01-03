<?php
class SettingModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function save1($data){
        $pdo = $this->db;
        $pdo->beginTransaction();
        try {
            $nameEn   = $data['nameEn'];
            $nameLo  = $data['nameLo'];
            $nameTh    = $data['nameTh'];
            if($nameEn) {
                $pdo = $this->db;
                $sql = "UPDATE wp_setting SET setting_value= ?, updated_at=NOW() WHERE setting_type = 'website_en'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nameEn]);
            }
            if($nameLo) {
                $pdo = $this->db;
                $sql = "UPDATE wp_setting SET setting_value= ?, updated_at=NOW() WHERE setting_type = 'website_lo'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nameLo]);
            }
            if($nameTh) {
                $pdo = $this->db;
                $sql = "UPDATE wp_setting SET setting_value= ?, updated_at=NOW() WHERE setting_type = 'website_th'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nameTh]);
            }
            $logoInput = $_FILES['logoInput'] ?? null;
            $iconInput = $_FILES['iconInput'] ?? null;
            if ($logoInput && $logoInput['error'] == UPLOAD_ERR_OK) {
                $dir = "uploads/website/";
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                $safeName = preg_replace("/[^A-Za-z0-9_\.-]/", "_", basename($logoInput['name']));
                $logo_path = $dir . "logo_" . $safeName;
                $target = dirname(__DIR__,2) . "/" . $logo_path;
                move_uploaded_file($logoInput['tmp_name'], $target);
                $pdo = $this->db;
                $sql = "UPDATE wp_setting SET setting_value= ?, updated_at=NOW() WHERE setting_type = 'logo'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$logo_path]);
            }
            if ($iconInput && $iconInput['error'] == UPLOAD_ERR_OK) {
                $dir = "uploads/website/";
                if (!is_dir($dir)) {
                    mkdir($dir, 0755, true);
                }
                $safeName = preg_replace("/[^A-Za-z0-9_\.-]/", "_", basename($iconInput['name']));
                $icon_path = $dir . "icon_" . $safeName;
                $target = dirname(__DIR__,2) . "/" . $icon_path;
                move_uploaded_file($iconInput['tmp_name'], $target);
                $pdo = $this->db;
                $sql = "UPDATE wp_setting SET setting_value= ?, updated_at=NOW() WHERE setting_type = 'icon'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$icon_path]);
            }
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $pdo->rollBack();
            return false;
        }
    }
    public function save3($data){
        $pdo = $this->db;
        $pdo->beginTransaction();
        try {
            $languages   = $data['languages'];
            if($languages) {
                $pdo = $this->db;
                $sql = "UPDATE wp_setting SET setting_value= ?, updated_at=NOW() WHERE setting_type = 'language'";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$languages]);
            }
            $pdo->commit();
            return true;
        } catch (Exception $e) {
            $pdo->rollBack();
            return false;
        }
    }
    public function get() {
        $pdo = $this->db;
        $sql = "SELECT * FROM wp_setting";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }
}