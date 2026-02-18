INSERT INTO `system_settings`
(`setting_key`, `setting_value`, `setting_group`, `description`) VALUES
('WINDY_KEY', '', 'API', 'API Key สำหรับบริการ Windy.com'),
('GOOGLE_API_KEY', '', 'API', 'Google Maps/Services API Key'),
('MAIL_HOST', 'smtp.gmail.com', 'MAIL', 'Outgoing Mail Server (SMTP)'),
('MAIL_USER', '', 'MAIL', 'Email Account สำหรับส่งจดหมาย'),
('MAIL_PASS', '', 'MAIL', 'Password สำหรับ Email Account'),
('MAIL_PORT', '587', 'MAIL', 'Port สำหรับส่งเมล (เช่น 587, 465)'),
('DOMAIN_NAME', 'http://147.50.254.79', 'GENERAL', 'URL หลักของเว็บไซต์'),
('ENABLE_TRANSLATE', '0', 'GENERAL', 'ใช้งานระบบแปลภาษา (Google Translate)'),
('NOTIFY_EMAIL', '1', 'GENERAL', 'การแจ้งเตือนผ่านอีเมล'),
('NOTIFY_PWA', '1', 'GENERAL', 'การแจ้งเตือนผ่าน PWA Push');
('DEFAULT_LEVEL', '100m', 'API', 'DEFAULT MAP LEVEL');

INSERT INTO `wp_setting`
(`setting_type`, `setting_value`, `created_at`, `updated_at`) VALUES
('logo', NULL, NOW(), NOW()),
('icon', NULL, NOW(), NOW()),
('website_en', NULL, NOW(), NOW()),
('website_lo', NULL, NOW(), NOW()),
('website_th', NULL, NOW(), NOW()),
('language', NULL, NOW(), NOW()),
('footer', NULL, NOW(), NOW()),
('site_assessment', NULL, NOW(), NOW()),
('login_bg', NULL, NOW(), NOW()),
('login_mobile_bg', NULL, NOW(), NOW()),
('language_default', NULL, NOW(), NOW()),
('language_content', NULL, NOW(), NOW()),
('infography', NULL, NOW(), NOW());

INSERT INTO `wp_folder`
(`id`, `name`, `slug`, `type`, `level`, `parent_id`, `ref_id`, `content_id`,
 `notification_status`, `status`, `created_at`, `updated_at`) VALUES
(1, 'PROJECT', 'project', 'root', 1, NULL, NULL, NULL, 'no', 'active', NOW(), NOW()),
(2, 'MEASUREMENT STATION', 'measument-station', 'root', 1, NULL, NULL, NULL, 'no', 'active', NOW(), NOW()),
(3, 'EIA / EHIA', 'eia-ehia', 'root', 1, NULL, NULL, NULL, 'no', 'active', NOW(), NOW()),
(4, 'PDA / PPA / CA', 'pda-ppa-ca', 'root', 1, NULL, NULL, NULL, 'no', 'active', NOW(), NOW());

INSERT INTO `wp_members`
(`member_id`, `username`, `password_hash`, `first_name`, `last_name`,
 `email`, `phone`, `role`, `status`, `last_login_at`,
 `created_at`, `updated_at`,
 `remember_selector`, `remember_validator_hash`, `remember_expires_at`)
VALUES
(1,'admin@windproject',MD5('Wp2026'),'Admin','System','admin@windproject.wp',NULL,'admin','active',NULL,NOW(),NOW(),NULL,NULL,NULL);