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
            'logoInput' => $_FILES['logoInput'] ?? null,
            'iconInput' => $_FILES['iconInput'] ?? null,
        ];
        $this->json(['status'=>$this->model->saveWebsiteSetting($data)]);
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
        ];
        $this->json(['status'=>$this->model->saveLanguageSetting($data)]);
    }
    public function get() {
        $this->json(['status'=> true, 'data' => $this->model->getAll()]);
    }
    public function shortcut() {
        $this->json(['status'=> true, 'data' => $this->model->shortcut()]);
    }
}