<?php
    $data = json_decode(file_get_contents("php://input"), true);
    $url = $data['url'] ?? '';
    $path = dirname(__DIR__, 2) . '/' . parse_url($url, PHP_URL_PATH);
    if (file_exists($path)) {
        unlink($path);
    }
    echo json_encode(['status' => 'ok']);
?>