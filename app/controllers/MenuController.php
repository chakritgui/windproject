<?php
require_once __DIR__ . '/MenuController.php';
require_once __DIR__ . '/../models/MenuModel.php';
class MenuController extends BaseController {
    private $model;
    public function __construct() {
        $this->model = new MenuModel();
    }
    public function load() {
        $menuData = $this->model->getMenu();
        $this->json([
            'status' => true, 
            'data' => [
                'menus'  => $menuData,
                'role' => $_SESSION['user']['role']
            ]
        ]);
    }
}