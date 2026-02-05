<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/SettingModel.php';
class SettingController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new SettingModel(); }
    public function saveInfo() {
        $data = [
            'nameEn' => $_POST['nameEn'] ?? '',
            'nameLo' => $_POST['nameLo'] ?? '',
            'nameTh' => $_POST['nameTh'] ?? '',
            'footerText' => $_POST['footerText'] ?? '',
            'site_assessment' => $_POST['site_assessment'] ?? '',
            'logoInput' => $_FILES['logoInput'] ?? null,
            'iconInput' => $_FILES['iconInput'] ?? null,
        ];
        $this->json(['status'=>$this->model->saveWebsiteSetting($data)]);
    }
    public function saveBgImage() {
        $data = [
            'loginInput' => $_FILES['loginInput'] ?? null,
            'loginMobileInput' => $_FILES['loginMobileInput'] ?? null,
            'infographyInput' => $_FILES['infographyInput'] ?? null,
            'oldLoginBg' => $_POST['oldLoginBg'] ?? '',
            'oldLoginMobileBg' => $_POST['oldLoginMobileBg'] ?? '',
            'oldinfographyBg' => $_POST['oldinfographyBg'] ?? '',
        ];
        $this->json(['status'=>$this->model->saveBgImage($data)]);
    }
    public function saveShortcut(){
        $data = [
            'name'             => $_POST['name'] ?? '',
            'short_name'       => $_POST['short_name'] ?? '',
            'description'      => $_POST['description'] ?? '',
            'display'          => $_POST['display'] ?? '',
            'orientation'      => $_POST['orientation'] ?? '',
            'theme_color'      => $_POST['theme_color'] ?? '',
            'background_color' => $_POST['background_color'] ?? '',
            'statusBarStyle'   => $_POST['statusBarStyle'] ?? '',
            'webAppCapable'    => $_POST['webAppCapable'] ?? '',
            'androidIcon'      => $_FILES['androidIcon'] ?? null,
            'iosIcon'          => $_FILES['iosIcon'] ?? null,
        ];
        $status = $this->model->saveShortcut($data);
        $this->json([
            'status' => $status
        ]);
    }
    public function saveLang() {
        $data = [
            'languages' => $_POST['languages'] ?? 'en',
            'language_default' => $_POST['language_default'] ?? 'en',
            'language_content' => $_POST['language_content'] ?? 'en',
        ];
        $this->json(['status'=>$this->model->saveLanguageSetting($data)]);
    }
    public function get() {
        header('Content-Type: application/octet-stream');
        $this->json(['status'=> true, 'data' => $this->model->getAll()]);
    }
    public function shortcut() {
        $this->json(['status'=> true, 'data' => $this->model->shortcut()]);
    }
    public function updateLanguage() {
        $userId = $_SESSION['user']['id'] ?? null;
        if (!$userId) {
            echo json_encode(['status' => false, 'message' => 'Unauthorized']);
            return;
        }
        $lang = $_POST['language'] ?? '';
        $allowedLangs = ['en', 'lo', 'th'];
        if (!in_array($lang, $allowedLangs)) {
            echo json_encode(['status' => false, 'message' => 'Invalid language code']);
            return;
        }
        $result = $this->model->saveUserLanguage($userId, $lang);
        if ($result) {
            echo json_encode(['status' => true, 'message' => 'Language updated']);
        } else {
            echo json_encode(['status' => false, 'message' => 'Database error']);
        }
    }
    public function saveConfig() {
        $userId = $_SESSION['user']['id'] ?? null;
        if (!$userId) {
            echo json_encode(['status' => false, 'message' => 'Unauthorized']);
            return;
        }
        $configs = $_POST;
        $secureKeys = ['MAIL_PASS', 'WINDY_KEY', 'GOOGLE_API_KEY'];
        foreach ($configs as $key => $value) {
            if (in_array($key, $secureKeys)) {
                if (empty(trim($value))) {
                    unset($configs[$key]);
                    continue;
                }
                $configs[$key] = encryptToken($value);
            }
        }
        $result = $this->model->saveSystemConfig($configs);
        if ($result) {
            echo json_encode(['status' => true, 'message' => 'Configuration saved successfully']);
        } else {
            echo json_encode(['status' => false, 'message' => 'Database error']);
        }
    }
    public function getPublicConfig() {
        $publicKeys = [
            'WINDY_KEY',
        ];
        $publicData = [];
        foreach ($publicKeys as $key) {
            $encryptedValue = $this->model->getSetting($key);
            if (!empty($encryptedValue)) {
                $publicData[$key] = decryptToken($encryptedValue);
            }
        }
        $payload = base64_encode(json_encode($publicData));
        header('Content-Type: application/octet-stream');
        echo $payload;
        exit;
    }
}