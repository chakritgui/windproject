<?php
class ContentModel {
    private $db;
    public function __construct() {
        $this->db = Database::getInstance()->pdo;
    }
    public function getBySlug($slug) {
        $pdo = $this->db;
        $stmt = $pdo->prepare("SELECT content_id, status, cover FROM wp_content WHERE content_slug = ? AND status != 'deleted'");
        $stmt->execute([$slug]);
        $n = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$n) return null;
        $contentId = $n['content_id'];
        $stmt = $pdo->prepare("SELECT content_lang, content_subject, content_body FROM wp_content_item WHERE content_id = ?");
        $stmt->execute([$contentId]);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $title = ["th" => "", "lo" => "", "en" => ""];
        $body = ["th" => "", "lo" => "", "en" => ""];
        foreach ($items as $row) {
            $lang = $row['content_lang'];
            if (isset($title[$lang])) {
                $title[$lang] = $row['content_subject'];
                $body[$lang] = $row['content_body'];
            }
        }
        $stmt = $pdo->prepare("SELECT id as id, file_path as url, file_name as name, file_type FROM wp_content_media WHERE content_id = ? AND status = 'active'");
        $stmt->execute([$contentId]);
        $media = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $images = [];
        $images360 = [];
        $attachments = [];
        foreach ($media as $m) {
            if ($m['file_type'] === 'image') $images[] = $m;
            elseif ($m['file_type'] === 'image360') $images360[] = $m;
            elseif ($m['file_type'] === 'attachment') $attachments[] = $m;
        }
        return [
            "id" => $contentId,
            "status" => $n['status'],
            "cover" => $n['cover'],
            "title" => $title,
            "content" => $body,
            "images" => $images,
            "images360" => $images360,
            "attachments" => $attachments
        ];
    }
}