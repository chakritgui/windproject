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
            'footer_en' => $_POST['footer_en'] ?? '',
            'footer_lo' => $_POST['footer_lo'] ?? '',
            'footer_th' => $_POST['footer_th'] ?? '',
            'scrolling_en' => $_POST['scrolling_en'] ?? '',
            'scrolling_lo' => $_POST['scrolling_lo'] ?? '',
            'scrolling_th' => $_POST['scrolling_th'] ?? '',
            'site_assessment_en' => $_POST['site_assessment_en'] ?? '',
            'site_assessment_lo' => $_POST['site_assessment_lo'] ?? '',
            'site_assessment_th' => $_POST['site_assessment_th'] ?? '',
            'logoInput' => $_FILES['logoInput'] ?? null,
            'iconInput' => $_FILES['iconInput'] ?? null,
            'loginIconInput' => $_FILES['loginIconInput'] ?? null,
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
        $result = $this->model->saveShortcut($data);
        $this->json([
            'status'  => $result['status'],
            'message' => $result['message'] ?? ($result['status'] ? 'สำเร็จ' : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
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
    public function menu() {
        $this->json(['status' => true, 'data' => $this->model->getMenu()]);
    }
    public function saveSingleMenu() {
        $data = $_POST;
        if (empty($data['id'])) {
            return $this->json(['status' => false, 'message' => 'Missing ID']);
        }
        if (strpos($data['id'], 'new_') === 0) {
            $result = $this->model->insertMenu($data);
        } else {
            $result = $this->model->updateSingleMenu($data);
        }
        $this->json(['status' => $result]);
    }
    public function updateOrder() {
        $orders = $_POST['orders'] ?? []; 
        if (empty($orders) || !is_array($orders)) {
            return $this->json(['status' => false, 'message' => 'ไม่มีข้อมูลสำหรับการจัดเรียง']);
        }
        $result = $this->model->reorderMenus($orders);
        $this->json([
            'status' => $result,
            'message' => $result ? 'จัดเรียงสำเร็จ' : 'เกิดข้อผิดพลาดในระบบฐานข้อมูล'
        ]);
    }
    public function updateMenuStatus() {
        $id = $_POST['id'] ?? null;
        $status = $_POST['is_active'] ?? 0;
        if (!$id) return $this->json(['status' => false]);
        $result = $this->model->updateStatus($id, $status);
        $this->json(['status' => $result]);
    }
    public function deleteMenu() {
        $id = $_POST['id'] ?? null;
        if (!$id) return $this->json(['status' => false]);
        $result = $this->model->deleteMenu($id);
        $this->json(['status' => $result]);
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
    public function saveNotification() {
        $configKeys = ['NOTIFY_EMAIL', 'NOTIFY_PWA'];
        $updateData = [];
        foreach ($configKeys as $key) {
            if (isset($_POST[$key])) {
                $updateData[$key] = htmlspecialchars($_POST[$key]);
            }
        }
        if (empty($updateData)) {
            echo json_encode(['status' => false, 'message' => 'No data to update']);
            return;
        }
        $result = $this->model->updateSystemConfig($updateData);
        if ($result) {
            echo json_encode(['status' => true, 'message' => 'Settings saved successfully']);
        } else {
            echo json_encode(['status' => false, 'message' => 'Failed to save settings']);
        }
    }
    public function savePassword() {
        $keys = [
            'is_email_link_enabled', 
            'is_admin_contact_enabled', 
            'is_system_request_enabled', 
            'admin_email', 
            'admin_line_oa', 
            'admin_telegram', 
            'admin_tel', 
            'admin_others'
        ];
        $updateData = [];
        foreach ($keys as $key) {
            if (isset($_POST[$key])) {
                $updateData[$key] = htmlspecialchars($_POST[$key]);
            }
        }
        if (empty($updateData)) {
            echo json_encode(['status' => false, 'message' => 'No data to update']);
            return;
        }
        $result = $this->model->savePasswordSettings($updateData);
        echo json_encode([
            'status' => $result, 
            'message' => $result ? 'Settings saved successfully' : 'Failed to save settings'
        ]);
    }
    public function listDisclaimer() {
        $start = intval($_POST['start'] ?? 0);
        $length= intval($_POST['length'] ?? 10);
        $search = $_POST['search']['value'] ?? '';
        $orderDir    = 'asc';
        if (!empty($_POST['order'][0])) {
            $colIndex   = intval($_POST['order'][0]['column']);
            $orderDir   = $_POST['order'][0]['dir'] === 'desc' ? 'desc' : 'asc';
        }
        $res = $this->model->listDisclaimer(
            $start,
            $length,
            $search,
            $colIndex,
            $orderDir
        );
        $this->json([
            "draw" => intval($_POST['draw'] ?? 1),
            "recordsTotal" => $res['total'],
            "recordsFiltered" => $res['total'],
            "data" => $res['data']
        ]);
    }
    public function infoDisclaimer() {
        $id = intval($_POST['id'] ?? 0);
        $data = $this->model->getDisclaimerDetail($id);
        header('Content-Type: application/json; charset=utf-8');
        if ($data) {
            echo json_encode([
                'status' => 'success', 
                'data' => $data
            ]);
        } else {
            echo json_encode([
                'status' => 'error', 
                'message' => 'Data not found'
            ]);
        }
        exit;
    }
    public function deleteDisclaimer() {
        $id = intval($_POST['id'] ?? 0);
        $data = $this->model->deleteDisclaimer($id);
        header('Content-Type: application/json; charset=utf-8');
        if ($data) {
            echo json_encode([
                'status' => 'success'
            ]);
        } else {
            echo json_encode([
                'status' => 'error', 
            ]);
        }
        exit;
    }
    public function saveDisclaimer() {
        $id = intval($_POST['id'] ?? 0);   
        $data = [
            'id'             => $id,
            'enable'         => intval($_POST['enable'] ?? 0),
            'require_accept' => intval($_POST['require_accept'] ?? 0),
            'show_mode'      => $_POST['show_mode'] ?? 'version_change',
            'version'        => $_POST['version'] ?? '1.0',
            'translations'   => [
                'en' => ['title' => $_POST['title_en'] ?? '', 'content' => $_POST['content_en'] ?? ''],
                'lo' => ['title' => $_POST['title_lo'] ?? '', 'content' => $_POST['content_lo'] ?? ''],
                'th' => ['title' => $_POST['title_th'] ?? '', 'content' => $_POST['content_th'] ?? ''],
            ]
        ];
        $result = $this->model->saveDisclaimer($data);
        header('Content-Type: application/json');
        if ($result) {
            echo json_encode(['status' => true, 'message' => 'Success']);
        } else {
            echo json_encode(['status' => false, 'message' => 'Failed to save data']);
        }
        exit;
    }
}