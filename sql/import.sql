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

INSERT INTO `wp_menus` (`id`, `icon`, `path`, `sort_order`, `target_group`, `is_default`) VALUES
(1, 'fas fa-home', '/home', 1, 'user', 1),
(2, 'fas fa-newspaper', '/news', 2, 'user', 1),
(3, 'fas fa-project-diagram', '/pstg', 3, 'user', 0),
(4, 'fas fa-file-alt', '/document', 4, 'user', 0),
(5, 'fas fa-download', '/download', 5, 'user', 0); 


INSERT INTO `wp_menu_translations` (`menu_id`, `language_code`, `menu_name`) VALUES
(1, 'en', 'Home'),
(1, 'th', 'หน้าแรก'),
(1, 'lo', 'ໜ້າທຳອິດ'),
(2, 'en', 'News'),
(2, 'th', 'ข่าวสาร'),
(2, 'lo', 'ຂ່າວສານ'),
(3, 'en', 'PSTG Project'),
(3, 'th', 'โครงการ PSTG'),
(3, 'lo', 'ໂຄງການ PSTG'),
(4, 'en', 'Document'),
(4, 'th', 'เอกสาร'),
(4, 'lo', 'ເອກະສານ'),
(5, 'en', 'Download'),
(5, 'th', 'ดาวน์โหลด'),
(5, 'lo', 'ດາວໂຫລດ');


INSERT INTO `wp_menus` (`id`, `icon`, `path`, `sort_order`, `target_group`, `is_default`) VALUES
(6, 'fas fa-chart-line', '/dashboard', 1, 'admin', 1),
(7, 'fas fa-users', '/member', 2, 'admin', 0), 
(8, 'fas fa-file-medical', '/document', 3, 'admin', 0),
(9, 'fas fa-edit', '/news', 4, 'admin', 0),
(10, 'fas fa-wind', '/wind', 5, 'admin', 0),
(11, 'fas fa-tasks', '/project', 6, 'admin', 0),
(12, 'fas fa-map-marked-alt', '/map', 7, 'admin', 0),
(13, 'fas fa-database', '/master', 8, 'admin', 0),
(14, 'fas fa-cog', '/setting', 9, 'admin', 1),
(15, 'fas fa-external-link-alt', '/shortcut', 10, 'admin', 0); 

INSERT INTO `wp_menu_translations` (`menu_id`, `language_code`, `menu_name`) VALUES
(6, 'en', 'Dashboard'), (6, 'th', 'แผงควบคุม'), (6, 'lo', 'ແຜງຄວບຄຸມ'),
(7, 'en', 'Members'), (7, 'th', 'จัดการสมาชิก'), (7, 'lo', 'ຈັດການສະມາຊິກ'),
(8, 'en', 'Manage Documents'), (8, 'th', 'จัดการเอกสาร'), (8, 'lo', 'ຈັດການເອກະສານ'),
(9, 'en', 'Manage News'), (9, 'th', 'จัดการข่าวสาร'), (9, 'lo', 'ຈັດການຂ່າວສານ'),
(10, 'en', 'Wind Data'), (10, 'th', 'ข้อมูลลม'), (10, 'lo', 'ຂໍ້ມູນລົມ'),
(11, 'en', 'Projects'), (11, 'th', 'จัดการโครงการ'), (11, 'lo', 'ຈັດການໂຄງການ'),
(12, 'en', 'Map View'), (12, 'th', 'มุมมองแผนที่'), (12, 'lo', 'ມຸມມອງແຜນທີ່'),
(13, 'en', 'Master Data'), (13, 'th', 'ข้อมูลหลัก'), (13, 'lo', 'ຂໍ້ມູນຫຼັກ'),
(14, 'en', 'System Settings'), (14, 'th', 'ตั้งค่าระบบ'), (14, 'lo', 'ຕັ້ງຄ່າລະບົບ'),
(15, 'en', 'Shortcuts'), (15, 'th', 'ทางลัด'), (15, 'lo', 'ທາງລັດ');