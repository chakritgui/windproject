<?php
class ContentModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function get($id) {
        $pdo = $this->db;
        if (!$id) {
            return [
                "id" => "", "status" => "active", "cover" => "", "notification_status" => "no",
                "attachments" => [],
                "images" => [],
                "images360" => [],
                "title" => ["th" => "", "lo" => "", "en" => ""],
                "content" => ["th" => "", "lo" => "", "en" => ""]
            ];
        }
        $stmt = $pdo->prepare("SELECT content_id, status, cover FROM wp_content WHERE content_id = ?");
        $stmt->execute([$id]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$id]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $content = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            $title[$lang] = $row['content_subject'];
            $content[$lang] = $row['content_body'];
        }
        $stmt2 = $pdo->prepare("SELECT notification_status FROM wp_folder WHERE content_id = ? LIMIT 1");
        $stmt2->execute([$id]);
        $row_folder = $stmt2->fetch(PDO::FETCH_ASSOC);
        $stmt = $pdo->prepare("SELECT id, file_path, file_name, file_type, file_size FROM wp_content_media WHERE content_id = ? and status = 'active'");
        $stmt->execute([$id]);
        $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $attachments = [];
        $images = [];
        $images360 = [];
        foreach ($media as $m) {
            $item = [
                "id" => $m['id'],
                "url" => $m['file_path'], 
                "name" => $m['file_name'],
                "size" => $m['file_size']
            ];
            if ($m['file_type'] === 'attachment') {
                $attachments[] = $item;
            } elseif ($m['file_type'] === 'image') {
                $images[] = $item;
            } elseif ($m['file_type'] === 'image360') {
                $images360[] = $item;
            }
        }
        return [
            "id" => $n['content_id'],
            "status" => $n['status'],
            "cover" => $n['cover'],
            "title" => $title,
            "content" => $content,
            "notification_status" => $row_folder ? $row_folder['notification_status'] : "no",
            "attachments" => $attachments,
            "images" => $images,
            "images360" => $images360
        ];
    }
}