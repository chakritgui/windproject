<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/SettingModel.php';
class SettingController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new SettingModel(); }
    public function save1() {
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
    public function save3() {
        $data = [
            'languages' => $_POST['languages'] ?? 'en',
        ];
        $this->json(['status'=>$this->model->saveLanguageSetting($data)]);
    }
    public function get() {
        $this->json(['status'=> true, 'data' => $this->model->getAll()]);
    }
}