<?php
    $uploadDir  = dirname(__DIR__, 2) . "/uploads/content/";
    $publicBase = "uploads/content/";
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    $field = $_FILES['upload'] ?? $_FILES['file'] ?? null;
    if (!$field || $field['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => ['message' => 'Upload failed']]);
        exit;
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $field['tmp_name']);
    finfo_close($finfo);
    $allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!in_array($mime, $allowed)) {
        echo json_encode(['error' => ['message' => 'Invalid file type']]);
        exit;
    }
    $filenameBase = "notif_" . date('Ymd_His') . "_" . bin2hex(random_bytes(4));
    $targetFile = null;
    $filename   = "";
    if (function_exists('imagewebp') && $mime !== 'image/webp') {
        switch ($mime) {
            case 'image/jpeg': $img = imagecreatefromjpeg($field['tmp_name']); break;
            case 'image/png':
                $img = imagecreatefrompng($field['tmp_name']);
                imagepalettetotruecolor($img);
                imagealphablending($img, true);
                imagesavealpha($img, true);
                break;
            case 'image/gif':  $img = imagecreatefromgif($field['tmp_name']); break;
            default: $img = false;
        }
        if ($img) {
            $filename   = $filenameBase . ".webp";
            $targetFile = $uploadDir . $filename;
            imagewebp($img, $targetFile, 80);
            imagedestroy($img);
        }
    }
    if (!$targetFile) {
        $ext = strtolower(pathinfo($field['name'], PATHINFO_EXTENSION));
        if (empty($ext)) {
            $extMap = ['image/jpeg'=>'jpg', 'image/png'=>'png', 'image/gif'=>'gif', 'image/webp'=>'webp'];
            $ext = $extMap[$mime] ?? 'bin';
        }
        $filename   = $filenameBase . "." . $ext;
        $targetFile = $uploadDir . $filename;
        if (!move_uploaded_file($field['tmp_name'], $targetFile)) {
            echo json_encode(['error' => ['message' => 'Cannot save file']]);
            exit;
        }
    }
    header('Content-Type: application/json');
    echo json_encode([
        "uploaded" => 1,
        "fileName" => $filename,
        "url"      => $publicBase . $filename
    ]);