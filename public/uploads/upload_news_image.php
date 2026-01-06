<?php
    $uploadDir = dirname(__DIR__, 2) . "/uploads/news/";
    $publicBase = "uploads/news/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $field = $_FILES['upload'] ?? $_FILES['file'] ?? null;
    if (!$field) {
        http_response_code(400);
        echo json_encode(['error' => ['message' => 'No file uploaded']]);
        exit;
    }
    if ($field['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => ['message' => 'Upload failed']]);
        exit;
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $field['tmp_name']);
    finfo_close($finfo);
    $allowed = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ];
    if (!in_array($mime, $allowed)) {
        echo json_encode(['error' => ['message' => 'Invalid file type']]);
        exit;
    }
    $extension = strtolower(pathinfo($field['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ['jpg','jpeg','png','gif','webp'])) {
        echo json_encode(['error' => ['message' => 'Invalid extension']]);
        exit;
    }
    $filename = uniqid("notif_", true) . "." . $extension;
    $destination = $uploadDir . $filename;
    if (!move_uploaded_file($field['tmp_name'], $destination)) {
        echo json_encode(['error' => ['message' => 'Cannot save file']]);
        exit;
    }
    $fileUrl = $publicBase . $filename;
    header('Content-Type: application/json');
    echo json_encode([
        "url" => $fileUrl,
        "uploaded" => 1,
        "fileName" => $filename
    ]);