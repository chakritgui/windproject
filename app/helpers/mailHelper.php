<?php
if (!class_exists('PHPMailer\PHPMailer\PHPMailer')) {
    require_once __DIR__ . '/../../vendor/PHPMailer/src/Exception.php';
    require_once __DIR__ . '/../../vendor/PHPMailer/src/PHPMailer.php';
    require_once __DIR__ . '/../../vendor/PHPMailer/src/SMTP.php';
}
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
    public function sendApproved($email, $lang, $password, $username) {
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
            $content = $this->getEmailReset($lang, $password, $username);
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
    public function sendQueueMail($email, $subject, $body, $lang = 'en') {
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
            $mail->setFrom($this->configs['MAIL_USER'] ?? '', $senderName);
            $mail->addAddress($email);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $body;
            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("Queue Mail Error: " . $mail->ErrorInfo);
            return false;
        }
    }
    private function getEmailReset($lang, $password, $username) {
        $domain = rtrim($this->configs['DOMAIN_NAME'] ?? '', '/');
        $logoUrl   = $domain . "/public/images/logo.png";
        $loginLink  = $domain . "/login"; 
        $footerText = $this->siteSettings['footer'] ?? 'Copyright © 2026 iWind Corporation Limited';
        $siteName   = $this->siteSettings["website_$lang"] ?? ($this->siteSettings["website_en"] ?? 'PHONGSUPTHAVY GROUP');
        $logoHtml = "<div style='text-align: center; padding: 25px 0; background-color: #ffffff; border-bottom: 2px solid #f0f0f0;'><img src='$logoUrl' alt='Logo' style='max-width: 180px; height: auto;'></div>";
        $styles = "style='font-family: \"Helvetica Neue\", Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 550px; margin: 20px auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);'";
        $infoBox = "style='background-color: #f8f9fa; border-radius: 6px; padding: 20px; margin: 25px 0; border: 1px dashed #0056b3;'";
        $btnStyle = "display: inline-block; padding: 14px 30px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;";
        $templates = [
            'en' => [
                'subject' => "Password Approved - $siteName",
                'body'    => "<div $styles>$logoHtml
                    <div style='padding: 40px; background-color: #fff;'>
                        <h2 style='color: #28a745;'>Password Reset Approved</h2>
                        <p>Your password reset request has been approved. You can now use the following credentials to log in:</p>
                        <div $infoBox>
                            <p style='margin: 0;'><b>Username:</b> $username</p>
                            <p style='margin: 10px 0 0 0;'><b>New Password:</b> <span style='color: #d63384; font-family: monospace; font-size: 18px;'>$password</span></p>
                        </div>
                        <p style='color: #666; font-size: 14px;'>*Please change your password after logging in for security reasons.</p>
                        <div style='text-align: center; margin: 35px 0;'>
                            <a href='$loginLink' $btnStyle>Login to System</a>
                        </div>
                    </div>
                    <div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;'>$footerText</div>
                </div>"
            ],
            'th' => [
                'subject' => "อนุมัติการเปลี่ยนรหัสผ่าน - $siteName",
                'body'    => "<div $styles>$logoHtml
                    <div style='padding: 40px; background-color: #fff;'>
                        <h2 style='color: #28a745;'>อนุมัติการเปลี่ยนรหัสผ่านเรียบร้อยแล้ว</h2>
                        <p>คำขอเปลี่ยนรหัสผ่านของคุณได้รับการอนุมัติแล้ว คุณสามารถเข้าสู่ระบบด้วยข้อมูลดังต่อไปนี้:</p>
                        <div $infoBox>
                            <p style='margin: 0;'><b>ชื่อผู้ใช้งาน:</b> $username</p>
                            <p style='margin: 10px 0 0 0;'><b>รหัสผ่านใหม่:</b> <span style='color: #d63384; font-family: monospace; font-size: 18px;'>$password</span></p>
                        </div>
                        <p style='color: #666; font-size: 14px;'>*เพื่อความปลอดภัย กรุณาเปลี่ยนรหัสผ่านทันทีหลังจากเข้าสู่ระบบ</p>
                        <div style='text-align: center; margin: 35px 0;'>
                            <a href='$loginLink' $btnStyle>เข้าสู่ระบบ</a>
                        </div>
                    </div>
                    <div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;'>$footerText</div>
                </div>"
            ],
            'lo' => [
                'subject' => "ອະນຸມັດການປ່ຽນລະຫັດຜ່ານ - $siteName",
                'body'    => "<div $styles>$logoHtml
                    <div style='padding: 40px; background-color: #fff;'>
                        <h2 style='color: #28a745;'>ອະນຸມັດການປ່ຽນລະຫັດຜ່ານສຳເລັດ</h2>
                        <p>ຄຳຂໍປ່ຽນລະຫັດຜ່ານຂອງທ່ານໄດ້ຮັບການອະນຸມັດແລ້ວ. ທ່ານສາມາດເຂົ້າສູ່ລະບົບດ້ວຍຂໍ້ມູນດັ່ງນີ້:</p>
                        <div $infoBox>
                            <p style='margin: 0;'><b>ຊື່ຜູ້ໃຊ້:</b> $username</p>
                            <p style='margin: 10px 0 0 0;'><b>ລະຫັດຜ່ານໃໝ່:</b> <span style='color: #d63384; font-family: monospace; font-size: 18px;'>$password</span></p>
                        </div>
                        <p style='color: #666; font-size: 14px;'>*ເພື່ອຄວາມປອດໄພ, ກະລຸນາປ່ຽນລະຫັດຜ່ານທັນທີຫຼັງຈາກເຂົ້າສູ່ລະບົບ.</p>
                        <div style='text-align: center; margin: 35px 0;'>
                            <a href='$loginLink' $btnStyle>ເຂົ້າສູ່ລະບົບ</a>
                        </div>
                    </div>
                    <div style='background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999;'>$footerText</div>
                </div>"
            ]
        ];
        return $templates[$lang] ?? $templates['en'];
    }
    private function getEmailContent($lang, $token) {
        $domain = rtrim($this->configs['DOMAIN_NAME'] ?? '', '/');
        $logoUrl   = $domain . "/public/images/logo.png";
        $resetLink = $domain . "/reset-password?t=" . $token;
        $footerText = $this->siteSettings['footer'] 
            ?? 'Copyright © 2026 iWind Corporation Limited';
        $siteName = $this->siteSettings["website_$lang"] 
            ?? ($this->siteSettings["website_en"] ?? 'PHONGSUPTHAVY GROUP');
        $date = new DateTime("now", new DateTimeZone('UTC'));
        $date->modify('+1 hour');
        $displayTime = $date
            ->setTimezone(new DateTimeZone('Asia/Bangkok'))
            ->format('H:i');
        $texts = [
            'en' => [
                'subject' => "Password Reset - $siteName",
                'title'   => "Reset Your Password",
                'desc'    => "We received a request to reset your password for your account at <strong>$siteName</strong>. This link will expire at <strong>$displayTime (ICT)</strong>.",
                'button'  => "Reset Password",
                'note'    => "If you did not request a password reset, please ignore this email."
            ],
            'th' => [
                'subject' => "รีเซ็ตรหัสผ่าน - $siteName",
                'title'   => "ตั้งรหัสผ่านใหม่",
                'desc'    => "เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี <strong>$siteName</strong> ลิงก์นี้จะหมดอายุเวลา <strong>$displayTime</strong> น.",
                'button'  => "ตั้งรหัสผ่านใหม่",
                'note'    => "หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาเพิกเฉยต่ออีเมลฉบับนี้"
            ],
            'lo' => [
                'subject' => "ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່ - $siteName",
                'title'   => "ຕັ້ງຄ່າລະຫັດຜ່ານໃໝ່",
                'desc'    => "ພວກເຮົາໄດ້ຮັບຄຳຂໍຕັ້ງລະຫັດຜ່ານໃໝ່ສຳລັບບັນຊີ <strong>$siteName</strong> ລິ້ງນີ້ຈະໝົດອາຍຸໃນເວລາ <strong>$displayTime</strong>.",
                'button'  => "ຕັ້ງຄ່າລະຫັດຜ່ານ",
                'note'    => "ຖ້າທ່ານບໍ່ໄດ້ຮ້ອງຂໍ ກະລຸນາບໍ່ສົນໃຈອີເມວນີ້"
            ]
        ];
        $t = $texts[$lang] ?? $texts['en'];
        $body = "
        <div style='font-family: Helvetica, Arial, sans-serif; 
                    line-height:1.6; 
                    color:#333; 
                    max-width:560px; 
                    margin:20px auto; 
                    border:1px solid #e5e5e5; 
                    border-radius:10px; 
                    overflow:hidden;
                    background:#ffffff;'>
            <div style='text-align:center; padding:30px 0; background:#ffffff; border-bottom:1px solid #f0f0f0;'>
                <img src='$logoUrl' alt='Logo' style='max-width:180px; height:auto;'>
            </div>
            <div style='padding:40px 35px;'>
                <h2 style='margin-top:0; color:#0056b3; font-weight:600;'>
                    {$t['title']}
                </h2>
                <p style='font-size:15px; color:#555;'>
                    {$t['desc']}
                </p>
                <div style='text-align:center; margin:35px 0;'>
                    <a href='$resetLink'
                    style='display:inline-block;
                            padding:14px 32px;
                            background:#0056b3;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:6px;
                            font-weight:600;
                            font-size:15px;'>
                        {$t['button']}
                    </a>
                </div>
                <p style='font-size:13px; color:#888;'>
                    {$t['note']}
                </p>
            </div>
            <div style='background:#f9f9f9; padding:18px; text-align:center; font-size:12px; color:#999;'>
                $footerText
            </div>
        </div>
        ";
        return [
            'subject' => $t['subject'],
            'body'    => $body
        ];
    }
}