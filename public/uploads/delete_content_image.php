<?php
    header('Content-Type: application/json');
    $data = json_decode(file_get_contents("php://input"), true);
    $url  = $data['url'] ?? '';
    if (!$url) {
        http_response_code(400);
        echo json_encode(['error' => 'no url']);
        exit;
    }
    $relativePath = ltrim(parse_url($url, PHP_URL_PATH), '/');
    $docRoot = $_SERVER['DOCUMENT_ROOT']; 
    $fullPath = $docRoot . '/' . $relativePath;
    if (!str_contains($fullPath, '/uploads/content/')) {
        http_response_code(403);
        echo json_encode(['error' => 'invalid path']);
        exit;
    }
    if (file_exists($fullPath)) {
        unlink($fullPath);
        echo json_encode(['status' => 'deleted']);
    } else {
        echo json_encode([
            'status' => 'not_found',
            'path' => $fullPath
        ]);
    }
