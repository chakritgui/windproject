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
    switch ($mime) {
        case 'image/jpeg':
            $img = imagecreatefromjpeg($field['tmp_name']);
            break;
        case 'image/png':
            $img = imagecreatefrompng($field['tmp_name']);
            imagepalettetotruecolor($img);
            imagealphablending($img, true);
            imagesavealpha($img, true);
            break;
        case 'image/gif':
            $img = imagecreatefromgif($field['tmp_name']);
            break;
        case 'image/webp':
            $img = imagecreatefromwebp($field['tmp_name']);
            break;
        default:
            $img = false;
    }
    if (!$img) {
        echo json_encode(['error' => ['message' => 'Cannot process image']]);
        exit;
    }
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($field['tmp_name']);
        if (!empty($exif['Orientation'])) {
            switch ($exif['Orientation']) {
                case 3: $img = imagerotate($img, 180, 0); break;
                case 6: $img = imagerotate($img, -90, 0); break;
                case 8: $img = imagerotate($img, 90, 0); break;
            }
        }
    }
    $maxWidth = 1600;
    $width  = imagesx($img);
    $height = imagesy($img);
    if ($width > $maxWidth) {
        $newWidth  = $maxWidth;
        $newHeight = intval(($height / $width) * $newWidth);
        $resized = imagecreatetruecolor($newWidth, $newHeight);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled(
            $resized, $img,
            0, 0, 0, 0,
            $newWidth, $newHeight,
            $width, $height
        );
        imagedestroy($img);
        $img = $resized;
    }
    $filenameBase = "content_" . date('Ymd_His') . "_" . bin2hex(random_bytes(4));
    $filename     = $filenameBase . ".webp";
    $targetFile   = $uploadDir . $filename;
    $maxSize  = 1 * 1024 * 1024;
    $quality  = 80;
    $minQuality = 60;
    do {
        imagewebp($img, $targetFile, $quality);
        clearstatcache();
        $currentSize = filesize($targetFile);
        if ($currentSize <= $maxSize) {
            break;
        }
        $quality -= 5;
    } while ($quality >= $minQuality);
    imagedestroy($img);
    header('Content-Type: application/json');
    echo json_encode([
        "uploaded" => 1,
        "fileName" => $filename,
        "url"      => $publicBase . $filename
    ]);