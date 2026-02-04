<?php
require 'vendor/PHPMailer/src/Exception.php';
require 'vendor/PHPMailer/src/PHPMailer.php';
require 'vendor/PHPMailer/src/SMTP.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
class MailHelper {
    private $db;
    private $MAIL_HOST;
    private $MAIL_USER;
    private $MAIL_PASS;
    private $DOMAIN_NAME;
    private $MAIL_PORT;
    public function __construct($db) {
        $this->db = $db;
        $this->MAIL_HOST = MAIL_HOST;
        $this->MAIL_USER = MAIL_USER;
        $this->MAIL_PASS = MAIL_PASS;
        $this->DOMAIN_NAME = DOMAIN_NAME;
        $this->MAIL_PORT = MAIL_PORT;
    }
    private function getSettings() {
        $stmt = $this->db->prepare("SELECT setting_type, setting_value FROM wp_setting");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $settings = [];
        foreach ($rows as $row) {
            $settings[$row['setting_type']] = $row['setting_value'];
        }
        return $settings;
    }
    public function sendMail($email, $lang, $token) {
        $settings = $this->getSettings(); 
        $senderName = $settings["website_$lang"] ?? 'Phongsupthavy Group';
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = $this->MAIL_HOST;
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->MAIL_USER;
            $mail->Password   = $this->MAIL_PASS; 
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; 
            $mail->Port       = $this->MAIL_PORT;
            $mail->CharSet    = 'UTF-8';
            $content = $this->getEmailContent($lang, $token);
            $mail->setFrom($this->MAIL_USER, $senderName);
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
        $settings = $this->getSettings(); 
        $logoUrl    = $this->DOMAIN_NAME . "/" . $settings['logo'];
        $resetLink  = $this->DOMAIN_NAME . "/reset-password?t=" . $token;
        $footerText = $settings['footer'] ?? 'Copyright © 2026 iWind Corporation Limited';
        $siteName = $settings["website_$lang"] ?? ($settings["website_en"] ?? 'PHONGSUPTHAVY GROUP');
        $date = new DateTime("now", new DateTimeZone('UTC'));
        $date->modify('+1 hour'); 
        $displayTime = $date->setTimezone(new DateTimeZone('Asia/Bangkok'))->format('H:i');
        $logoHtml = "
        <div style='text-align: center; padding: 25px 0; background-color: #ffffff; border-bottom: 2px solid #f0f0f0;'>
            <img src='$logoUrl' alt='Logo' style='max-width: 150px; height: auto;'>
        </div>";
        $styles = "style='font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 550px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'";
        $btnStyle = "display: inline-block; padding: 14px 30px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;";
        $templates = [
            'en' => [
                'subject' => "Password Reset - $siteName",
                'body'    => "<div $styles>$logoHtml<div style='padding: 40px; background-color: #fff;'>
                                <h2 style='color: #0056b3; margin-top: 0;'>Reset Your Password?</h2>
                                <p>We received a request to reset the password for your account. This link is valid until <b>$displayTime (ICT)</b>.</p>
                                <div style='text-align: center; margin: 35px 0;'>
                                    <a href='$resetLink' $btnStyle>Reset Password</a>
                                </div>
                                <p style='font-size: 13px; color: #888;'>If you didn't request this, you can safely ignore this email.</p>
                             </div>
                             <div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;'>$footerText</div></div>"
            ],
            'th' => [
                'subject' => "รีเซ็ตรหัสผ่าน - $siteName",
                'body'    => "<div $styles>$logoHtml<div style='padding: 40px; background-color: #fff;'>
                                <h2 style='color: #0056b3; margin-top: 0;'>รีเซ็ตรหัสผ่านของคุณ</h2>
                                <p>เราได้รับคำขอเพื่อเปลี่ยนรหัสผ่านสำหรับบัญชีของคุณ ลิงก์นี้สามารถใช้งานได้ถึงเวลา <b>$displayTime</b> (เวลาประเทศไทย)</p>
                                <div style='text-align: center; margin: 35px 0;'>
                                    <a href='$resetLink' $btnStyle>ตั้งรหัสผ่านใหม่</a>
                                </div>
                                <p style='font-size: 13px; color: #888;'>หากคุณไม่ได้เป็นผู้ส่งคำขอ กรุณามองข้ามอีเมลฉบับนี้</p>
                             </div>
                             <div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;'>$footerText</div></div>"
            ],
            'lo' => [
                'subject' => "ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່ - $siteName",
                'body'    => "<div $styles>$logoHtml<div style='padding: 40px; background-color: #fff;'>
                                <h2 style='color: #0056b3; margin-top: 0;'>ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່</h2>
                                <p>ພວກເຮົາໄດ້ຮັບຄຳຂໍປ່ຽນລະຫັດຜ່ານສຳລັບບັນຊີຂອງທ່ານ. ລິ້ງນີ້ຈະໝົດອາຍຸໃນເວລາ <b>$displayTime</b>.</p>
                                <div style='text-align: center; margin: 35px 0;'>
                                    <a href='$resetLink' $btnStyle>ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່</a>
                                </div>
                                <p style='font-size: 13px; color: #888;'>ຫາກທ່ານບໍ່ໄດ້ເປັນຜູ້ຂໍປ່ຽນລະຫັດຜ່ານ, ກະລຸນາເມີີນເສີຍຕໍ່ອີເມວນີ້.</p>
                             </div>
                             <div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;'>$footerText</div></div>"
            ]
        ];
        return $templates[$lang] ?? $templates['en'];
    }
}