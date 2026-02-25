<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/PushModel.php';
class  PushController extends BaseController {
    private $model;
    public function __construct(){ $this->model = new PushModel(); }
    public function saveSubscription() {
        $json = file_get_contents('php://input');
        $subscription = json_decode($json, true);
        if (!$subscription || !isset($subscription['endpoint'])) {
            $this->json([
                'status' => false, 
                'message' => 'Invalid subscription data'
            ]);
            return;
        }
        $result = $this->model->saveSubscription($subscription);
        if ($result) {
            $this->json(['status' => true, 'message' => 'Subscribed successfully']);
        } else {
            $this->json(['status' => false, 'message' => 'Failed to save subscription']);
        }
    }
    public function unsubscribe() {
        $json = file_get_contents('php://input');
        $data = json_decode($json, true);
        print_r($data);
        if (isset($data['endpoint'])) {
            $result = $this->model->disableSubscription($data['endpoint']);
            if ($result) {
                $this->json(['status' => true, 'message' => 'Unsubscribed successfully']);
            } else {
                $this->json(['status' => false, 'message' => 'Database update failed']);
            }
        } else {
            $this->json(['status' => false, 'message' => 'No endpoint provided']);
        }
    }
}