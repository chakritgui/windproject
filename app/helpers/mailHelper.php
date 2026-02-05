<?php
require 'vendor/PHPMailer/src/Exception.php';
require 'vendor/PHPMailer/src/PHPMailer.php';
require 'vendor/PHPMailer/src/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
class MailHelper {
    private $db;
    private $configs = [];
    private $siteSettings = [];
    public function __construct($db) {
        $this->db = $db;
        $this->loadAllConfigs();
    }
    private function loadAllConfigs() {
        $stmt = $this->db->prepare("SELECT setting_key, setting_value FROM system_settings");
        $stmt->execute();
        $this->configs = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $stmt2 = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting");
        $stmt2->execute();
        $this->siteSettings = $stmt2->fetchAll(PDO::FETCH_KEY_PAIR);
    }
    private function decrypt($value) {
        if (empty($value)) return '';
        return decryptToken($value); 
    }
    public function sendMail($email, $lang, $token) {
        $senderName = $this->siteSettings["website_$lang"] ?? 'Phongsupthavy Group';
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $this->configs['MAIL_HOST'] ?? '';
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->configs['MAIL_USER'] ?? '';
            $mail->Password   = $this->decrypt($this->configs['MAIL_PASS'] ?? '');
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; 
            $mail->Port       = $this->configs['MAIL_PORT'] ?? 587;
            $mail->CharSet    = 'UTF-8';
            $content = $this->getEmailContent($lang, $token);
            $mail->setFrom($this->configs['MAIL_USER'] ?? '', $senderName);
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $content['subject'];
            $mail->Body    = $content['body'];
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Mail Error: " . $mail->ErrorInfo);
            return false;
        }
    }
    private function getEmailContent($lang, $token) {
        $domain = rtrim($this->configs['DOMAIN_NAME'] ?? '', '/');
        $logoUrl    = $domain . "/" . ($this->siteSettings['logo'] ?? '');
        $resetLink  = $domain . "/reset-password?t=" . $token;
        $footerText = $this->siteSettings['footer'] ?? 'Copyright © 2026 iWind Corporation Limited';
        $siteName   = $this->siteSettings["website_$lang"] ?? ($this->siteSettings["website_en"] ?? 'PHONGSUPTHAVY GROUP');
        $date = new DateTime("now", new DateTimeZone('UTC'));
        $date->modify('+1 hour'); 
        $displayTime = $date->setTimezone(new DateTimeZone('Asia/Bangkok'))->format('H:i');
        $logoHtml = "<div style='text-align: center; padding: 25px 0; background-color: #ffffff; border-bottom: 2px solid #f0f0f0;'><img src='$logoUrl' alt='Logo' style='max-width: 150px; height: auto;'></div>";
        $styles = "style='font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 550px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'";
        $btnStyle = "display: inline-block; padding: 14px 30px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;";
        $templates = [
            'en' => [
                'subject' => "Password Reset - $siteName",
                'body'    => "<div $styles>$logoHtml<div style='padding: 40px; background-color: #fff;'><h2 style='color: #0056b3;'>Reset Your Password?</h2><p>We received a request to reset your password. Valid until <b>$displayTime (ICT)</b>.</p><div style='text-align: center; margin: 35px 0;'><a href='$resetLink' $btnStyle>Reset Password</a></div></div><div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;'>$footerText</div></div>"
            ],
            'th' => [
                'subject' => "รีเซ็ตรหัสผ่าน - $siteName",
                'body'    => "<div $styles>$logoHtml<div style='padding: 40px; background-color: #fff;'><h2 style='color: #0056b3;'>รีเซ็ตรหัสผ่านของคุณ</h2><p>เราได้รับคำขอเพื่อเปลี่ยนรหัสผ่าน ลิงก์นี้ใช้งานได้ถึง <b>$displayTime</b>.</p><div style='text-align: center; margin: 35px 0;'><a href='$resetLink' $btnStyle>ตั้งรหัสผ่านใหม่</a></div></div><div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;'>$footerText</div></div>"
            ],
            'lo' => [
                'subject' => "ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່ - $siteName",
                'body'    => "<div $styles>$logoHtml<div style='padding: 40px; background-color: #fff;'><h2 style='color: #0056b3;'>ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່</h2><p>ພວກເຮົາໄດ້ຮັບຄຳຂໍປ່ຽນລະຫັດຜ່ານ. ລິ້ງນີ້ຈະໝົດອາຍຸໃນເວລາ <b>$displayTime</b>.</p><div style='text-align: center; margin: 35px 0;'><a href='$resetLink' $btnStyle>ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່</a></div></div><div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;'>$footerText</div></div>"
            ]
        ];
        return $templates[$lang] ?? $templates['en'];
    }
}