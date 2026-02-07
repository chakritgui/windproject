-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 07, 2026 at 01:26 PM
-- Server version: 10.1.31-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `windproject`
--

-- --------------------------------------------------------

--
-- Table structure for table `email_queue`
--

CREATE TABLE `email_queue` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `recipient_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'อีเมลผู้รับ',
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'หัวข้ออีเมล',
  `body` longtext COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'เนื้อหาอีเมล (HTML/Text)',
  `priority` tinyint(1) DEFAULT '3' COMMENT '1:ด่วนมาก, 2:ด่วน, 3:ปกติ',
  `status` enum('pending','processing','sent','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'สถานะการส่ง',
  `retry_count` int(11) DEFAULT '0' COMMENT 'จำนวนครั้งที่พยายามส่งใหม่',
  `max_retries` int(11) DEFAULT '3' COMMENT 'จำนวนครั้งสูงสุดที่จะลองส่งใหม่',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT 'เก็บ Error ล่าสุดที่เจอ',
  `scheduled_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่ตั้งคิวไว้',
  `sent_at` datetime DEFAULT NULL COMMENT 'เวลาที่ส่งออกสำเร็จ',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `push_subscriptions`
--

CREATE TABLE `push_subscriptions` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `endpoint` text NOT NULL,
  `p256dh` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `platform` enum('pwa','web') NOT NULL DEFAULT 'pwa',
  `browser` varchar(50) DEFAULT NULL,
  `os` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `pwa_notification_queue`
--

CREATE TABLE `pwa_notification_queue` (
  `id` int(11) NOT NULL,
  `subscription_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `status` enum('pending','processing','sent','failed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `scheduled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อตัวแปรสำหรับการเรียกใช้',
  `setting_value` text COLLATE utf8mb4_unicode_ci COMMENT 'ค่าของข้อมูล',
  `setting_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'GENERAL' COMMENT 'หมวดหมู่ เช่น API, MAIL, GENERAL',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คำอธิบายตัวแปร',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `translate_usage_log`
--

CREATE TABLE `translate_usage_log` (
  `id` int(11) NOT NULL,
  `content_id` int(11) DEFAULT NULL,
  `part` enum('subject','body') NOT NULL,
  `source_lang` varchar(10) DEFAULT NULL,
  `target_lang` varchar(10) DEFAULT NULL,
  `char_count` int(11) DEFAULT NULL,
  `word_count` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `translate_usage_summary`
--

CREATE TABLE `translate_usage_summary` (
  `id` int(11) NOT NULL,
  `year_month` varchar(7) DEFAULT NULL,
  `total_chars` int(11) DEFAULT NULL,
  `total_words` int(11) DEFAULT NULL,
  `total_requests` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `wind_staging`
--

CREATE TABLE `wind_staging` (
  `id` bigint(20) NOT NULL,
  `contract_name` varchar(255) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `poles_code` varchar(100) DEFAULT NULL,
  `type_name` varchar(100) DEFAULT NULL,
  `installations_name` varchar(255) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `measure_datetime` datetime DEFAULT NULL,
  `height_name` varchar(100) DEFAULT NULL,
  `height_level` varchar(255) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `wind_speed` decimal(6,2) DEFAULT NULL,
  `wind_direction` decimal(6,2) DEFAULT NULL,
  `air_density` decimal(6,3) DEFAULT NULL,
  `pressure` decimal(7,2) DEFAULT NULL,
  `humidity` decimal(6,2) DEFAULT NULL,
  `temperature` decimal(6,2) DEFAULT NULL,
  `turbulence_intensity` decimal(6,3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_content`
--

CREATE TABLE `wp_content` (
  `content_id` int(11) NOT NULL,
  `type` enum('news','project','pole') NOT NULL DEFAULT 'news',
  `cover` longtext,
  `content_slug` varchar(255) DEFAULT NULL,
  `status` enum('scheduled','draft','published','deleted','active','inactive') NOT NULL DEFAULT 'draft',
  `publish_at` datetime DEFAULT NULL,
  `content_view` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_content_item`
--

CREATE TABLE `wp_content_item` (
  `item_id` bigint(20) NOT NULL,
  `content_id` bigint(20) NOT NULL,
  `content_subject` varchar(255) DEFAULT NULL,
  `content_body` longtext,
  `content_lang` enum('en','th','lo') NOT NULL DEFAULT 'en',
  `is_default` enum('yes','no') NOT NULL DEFAULT 'no',
  `translate_with` enum('self','ai') NOT NULL DEFAULT 'self',
  `status` enum('wait','ready','success','failed') NOT NULL DEFAULT 'wait',
  `response` longtext,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_content_media`
--

CREATE TABLE `wp_content_media` (
  `id` int(11) NOT NULL,
  `content_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_type` enum('attachment','image','image360') NOT NULL,
  `file_size` int(11) DEFAULT NULL,
  `status` enum('active','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `wp_contract`
--

CREATE TABLE `wp_contract` (
  `contract_id` bigint(20) NOT NULL,
  `contract_no` varchar(255) DEFAULT NULL,
  `contract_name` varchar(255) NOT NULL,
  `contract_name_display` varchar(255) DEFAULT NULL,
  `contract_start` date DEFAULT NULL,
  `contract_end` date DEFAULT NULL,
  `status` enum('active','inactive','expired','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_documents`
--

CREATE TABLE `wp_documents` (
  `document_id` bigint(20) NOT NULL,
  `contract_id` bigint(20) DEFAULT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `type_id` bigint(20) DEFAULT NULL,
  `installations_id` bigint(20) DEFAULT NULL,
  `poles_id` bigint(20) DEFAULT NULL,
  `document_name` varchar(255) NOT NULL,
  `document_type` varchar(255) NOT NULL,
  `document_size` bigint(20) NOT NULL DEFAULT '0',
  `document_start` datetime NOT NULL,
  `document_end` datetime NOT NULL,
  `document_path` longtext NOT NULL,
  `status` enum('public','private','deleted') NOT NULL,
  `document_file_name` varchar(255) DEFAULT NULL,
  `document_download` bigint(20) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_documents_download_logs`
--

CREATE TABLE `wp_documents_download_logs` (
  `logs_id` bigint(20) NOT NULL,
  `document_id` bigint(20) NOT NULL,
  `member_id` bigint(20) NOT NULL,
  `download_date` datetime NOT NULL,
  `download_device` longtext
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_folder`
--

CREATE TABLE `wp_folder` (
  `id` bigint(20) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `type` enum('root','folder','content') NOT NULL DEFAULT 'root',
  `level` bigint(20) DEFAULT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `ref_id` bigint(20) DEFAULT NULL,
  `content_id` bigint(20) DEFAULT NULL,
  `notification_status` enum('yes','no') NOT NULL DEFAULT 'no',
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_height`
--

CREATE TABLE `wp_height` (
  `height_id` bigint(20) NOT NULL,
  `height_name` varchar(255) DEFAULT NULL,
  `status` enum('active','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_height_levels`
--

CREATE TABLE `wp_height_levels` (
  `levels_id` bigint(20) NOT NULL,
  `height_id` bigint(20) NOT NULL,
  `height_levels` varchar(50) DEFAULT NULL,
  `status` enum('active','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_imports`
--

CREATE TABLE `wp_imports` (
  `imports_id` bigint(20) NOT NULL,
  `import_start` datetime NOT NULL,
  `import_end` datetime DEFAULT NULL,
  `status` enum('complete','failed') NOT NULL DEFAULT 'complete',
  `import_record` bigint(20) NOT NULL,
  `remark` longtext
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_installations`
--

CREATE TABLE `wp_installations` (
  `installations_id` bigint(20) NOT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `type_id` bigint(20) DEFAULT NULL,
  `installations_name` varchar(500) DEFAULT NULL,
  `installations_name_display` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_login_logs`
--

CREATE TABLE `wp_login_logs` (
  `logs_id` bigint(20) NOT NULL,
  `member_id` bigint(20) NOT NULL,
  `login_at` datetime NOT NULL,
  `log_type` enum('login','logout','kick') NOT NULL DEFAULT 'login',
  `ip_address` varchar(100) DEFAULT NULL,
  `logout_at` datetime DEFAULT NULL,
  `login_device` longtext,
  `timezone` longtext,
  `session_id` longtext
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_map_master`
--

CREATE TABLE `wp_map_master` (
  `map_id` bigint(20) NOT NULL,
  `map_name` varchar(255) NOT NULL,
  `center_lat` decimal(11,8) DEFAULT NULL,
  `center_lng` decimal(11,8) DEFAULT NULL,
  `zoom_level` int(11) NOT NULL DEFAULT '0',
  `default_style` text NOT NULL,
  `polygon_visibility` enum('open','close') NOT NULL DEFAULT 'close',
  `show_country_line` enum('show','hide') NOT NULL DEFAULT 'hide',
  `country_layers_data` longtext,
  `map_labels` enum('yes','no') NOT NULL DEFAULT 'yes',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_map_polygons`
--

CREATE TABLE `wp_map_polygons` (
  `poly_id` bigint(20) NOT NULL,
  `map_id` bigint(20) NOT NULL,
  `area_name` varchar(255) DEFAULT NULL,
  `custom_style` text NOT NULL,
  `geo_data` longtext NOT NULL,
  `project_id` bigint(20) DEFAULT NULL,
  `status` enum('active','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_members`
--

CREATE TABLE `wp_members` (
  `member_id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(150) DEFAULT NULL,
  `last_name` varchar(150) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('user','administrator','admin') DEFAULT 'user',
  `status` enum('active','inactive','banned','deleted') DEFAULT 'active',
  `last_login_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remember_selector` char(12) DEFAULT NULL,
  `remember_validator_hash` char(64) DEFAULT NULL,
  `remember_expires_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_members_language`
--

CREATE TABLE `wp_members_language` (
  `id` bigint(20) NOT NULL,
  `member_id` bigint(20) NOT NULL,
  `language` enum('en','lo','th') NOT NULL DEFAULT 'en',
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_notification_targets`
--

CREATE TABLE `wp_notification_targets` (
  `targets_id` bigint(20) NOT NULL,
  `notifications_target` enum('news','project','pole') DEFAULT NULL,
  `notifications_item` bigint(20) DEFAULT NULL,
  `member_id` bigint(20) NOT NULL,
  `publish_at` datetime DEFAULT NULL,
  `status` enum('draft','published','deleted') NOT NULL,
  `read_at` datetime DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_password_resets`
--

CREATE TABLE `wp_password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) DEFAULT '0',
  `is_valid` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_poles`
--

CREATE TABLE `wp_poles` (
  `poles_id` bigint(20) NOT NULL,
  `poles_code` varchar(255) DEFAULT NULL,
  `project_id` bigint(20) NOT NULL,
  `type_id` bigint(20) NOT NULL,
  `installations_id` bigint(20) DEFAULT NULL,
  `poles_lat` decimal(10,7) DEFAULT NULL,
  `poles_lng` decimal(10,7) DEFAULT NULL,
  `content_id` bigint(20) DEFAULT NULL,
  `status` enum('online','inactive','deleted') NOT NULL DEFAULT 'online',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_project`
--

CREATE TABLE `wp_project` (
  `project_id` bigint(20) NOT NULL,
  `contract_id` bigint(20) DEFAULT NULL,
  `project_code` varchar(255) DEFAULT NULL,
  `project_name` varchar(255) NOT NULL,
  `project_name_display` varchar(255) DEFAULT NULL,
  `project_start` date DEFAULT NULL,
  `project_end` date DEFAULT NULL,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_project_pole_type`
--

CREATE TABLE `wp_project_pole_type` (
  `id` bigint(20) NOT NULL,
  `project_id` bigint(20) NOT NULL,
  `type_id` bigint(20) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_setting`
--

CREATE TABLE `wp_setting` (
  `setting_id` bigint(20) NOT NULL,
  `setting_type` varchar(255) NOT NULL,
  `setting_value` longtext,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_type`
--

CREATE TABLE `wp_type` (
  `type_id` bigint(20) NOT NULL,
  `type_name` varchar(255) NOT NULL,
  `type_name_display` varchar(255) DEFAULT NULL,
  `type_icon` longtext,
  `status` enum('active','inactive','deleted') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `wp_winds`
--

CREATE TABLE `wp_winds` (
  `id` bigint(20) NOT NULL,
  `poles_id` bigint(20) DEFAULT NULL,
  `year` int(4) DEFAULT NULL,
  `wind_datetime` datetime DEFAULT NULL,
  `levels_id` bigint(20) NOT NULL,
  `wind_speed` double(20,2) DEFAULT '0.00',
  `wind_direction` double(20,2) DEFAULT '0.00',
  `air_density` double(20,3) NOT NULL DEFAULT '0.000',
  `pressure` double(20,2) NOT NULL DEFAULT '0.00',
  `humidity` double(20,2) NOT NULL DEFAULT '0.00',
  `temperature` double(20,2) NOT NULL DEFAULT '0.00',
  `turbulence_intensity` double(20,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','deleted') NOT NULL DEFAULT 'active'
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `email_queue`
--
ALTER TABLE `email_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status_priority` (`status`,`priority`,`scheduled_at`),
  ADD KEY `idx_recipient` (`recipient_email`(191));

--
-- Indexes for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_endpoint` (`endpoint`(191)),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `pwa_notification_queue`
--
ALTER TABLE `pwa_notification_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subscription_id` (`subscription_id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_setting_key` (`setting_key`),
  ADD KEY `idx_setting_group` (`setting_group`);

--
-- Indexes for table `translate_usage_log`
--
ALTER TABLE `translate_usage_log`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `translate_usage_summary`
--
ALTER TABLE `translate_usage_summary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `year_month` (`year_month`);

--
-- Indexes for table `wind_staging`
--
ALTER TABLE `wind_staging`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_poles_code` (`poles_code`),
  ADD KEY `idx_measure_datetime` (`measure_datetime`),
  ADD KEY `idx_height_level` (`height_level`),
  ADD KEY `idx_code_level_dt` (`poles_code`,`height_level`,`measure_datetime`);

--
-- Indexes for table `wp_content`
--
ALTER TABLE `wp_content`
  ADD PRIMARY KEY (`content_id`);

--
-- Indexes for table `wp_content_item`
--
ALTER TABLE `wp_content_item`
  ADD PRIMARY KEY (`item_id`),
  ADD UNIQUE KEY `notifications_id` (`content_id`,`content_lang`);

--
-- Indexes for table `wp_content_media`
--
ALTER TABLE `wp_content_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `content_id` (`content_id`);

--
-- Indexes for table `wp_contract`
--
ALTER TABLE `wp_contract`
  ADD PRIMARY KEY (`contract_id`),
  ADD UNIQUE KEY `uq_contract_name` (`contract_name`);

--
-- Indexes for table `wp_documents`
--
ALTER TABLE `wp_documents`
  ADD PRIMARY KEY (`document_id`);

--
-- Indexes for table `wp_documents_download_logs`
--
ALTER TABLE `wp_documents_download_logs`
  ADD PRIMARY KEY (`logs_id`);

--
-- Indexes for table `wp_folder`
--
ALTER TABLE `wp_folder`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_height`
--
ALTER TABLE `wp_height`
  ADD PRIMARY KEY (`height_id`),
  ADD UNIQUE KEY `uq_height_name` (`height_name`);

--
-- Indexes for table `wp_height_levels`
--
ALTER TABLE `wp_height_levels`
  ADD PRIMARY KEY (`levels_id`),
  ADD UNIQUE KEY `uq_height_levels` (`height_id`,`height_levels`);

--
-- Indexes for table `wp_imports`
--
ALTER TABLE `wp_imports`
  ADD PRIMARY KEY (`imports_id`);

--
-- Indexes for table `wp_installations`
--
ALTER TABLE `wp_installations`
  ADD PRIMARY KEY (`installations_id`),
  ADD UNIQUE KEY `uniq_project_type_name` (`project_id`,`type_id`,`installations_name`(191));

--
-- Indexes for table `wp_login_logs`
--
ALTER TABLE `wp_login_logs`
  ADD PRIMARY KEY (`logs_id`);

--
-- Indexes for table `wp_map_master`
--
ALTER TABLE `wp_map_master`
  ADD PRIMARY KEY (`map_id`);

--
-- Indexes for table `wp_map_polygons`
--
ALTER TABLE `wp_map_polygons`
  ADD PRIMARY KEY (`poly_id`),
  ADD UNIQUE KEY `unique_area_per_map` (`map_id`,`area_name`);

--
-- Indexes for table `wp_members`
--
ALTER TABLE `wp_members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `wp_members_language`
--
ALTER TABLE `wp_members_language`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `member_id` (`member_id`);

--
-- Indexes for table `wp_notification_targets`
--
ALTER TABLE `wp_notification_targets`
  ADD PRIMARY KEY (`targets_id`),
  ADD UNIQUE KEY `notifications_item` (`notifications_item`,`member_id`);

--
-- Indexes for table `wp_password_resets`
--
ALTER TABLE `wp_password_resets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `wp_poles`
--
ALTER TABLE `wp_poles`
  ADD PRIMARY KEY (`poles_id`),
  ADD UNIQUE KEY `uq_poles_code` (`poles_code`),
  ADD UNIQUE KEY `uq_pole` (`poles_code`),
  ADD KEY `idx_project` (`project_id`),
  ADD KEY `idx_type` (`type_id`),
  ADD KEY `installations_id` (`installations_id`);

--
-- Indexes for table `wp_project`
--
ALTER TABLE `wp_project`
  ADD PRIMARY KEY (`project_id`),
  ADD UNIQUE KEY `uq_project_contract` (`project_name`,`contract_id`);

--
-- Indexes for table `wp_project_pole_type`
--
ALTER TABLE `wp_project_pole_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `project_id` (`project_id`,`type_id`);

--
-- Indexes for table `wp_setting`
--
ALTER TABLE `wp_setting`
  ADD PRIMARY KEY (`setting_id`);

--
-- Indexes for table `wp_type`
--
ALTER TABLE `wp_type`
  ADD PRIMARY KEY (`type_id`),
  ADD UNIQUE KEY `uq_type_name` (`type_name`);

--
-- Indexes for table `wp_winds`
--
ALTER TABLE `wp_winds`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_wind` (`poles_id`,`levels_id`,`wind_datetime`),
  ADD KEY `idx_pole_datetime` (`poles_id`,`wind_datetime`),
  ADD KEY `idx_wind_datetime` (`wind_datetime`),
  ADD KEY `idx_levels_id` (`levels_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `email_queue`
--
ALTER TABLE `email_queue`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `push_subscriptions`
--
ALTER TABLE `push_subscriptions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pwa_notification_queue`
--
ALTER TABLE `pwa_notification_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `system_settings`
--
ALTER TABLE `system_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `translate_usage_log`
--
ALTER TABLE `translate_usage_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `translate_usage_summary`
--
ALTER TABLE `translate_usage_summary`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wind_staging`
--
ALTER TABLE `wind_staging`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_content`
--
ALTER TABLE `wp_content`
  MODIFY `content_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_content_item`
--
ALTER TABLE `wp_content_item`
  MODIFY `item_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_content_media`
--
ALTER TABLE `wp_content_media`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_contract`
--
ALTER TABLE `wp_contract`
  MODIFY `contract_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_documents`
--
ALTER TABLE `wp_documents`
  MODIFY `document_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_documents_download_logs`
--
ALTER TABLE `wp_documents_download_logs`
  MODIFY `logs_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_folder`
--
ALTER TABLE `wp_folder`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_height`
--
ALTER TABLE `wp_height`
  MODIFY `height_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_height_levels`
--
ALTER TABLE `wp_height_levels`
  MODIFY `levels_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_imports`
--
ALTER TABLE `wp_imports`
  MODIFY `imports_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_installations`
--
ALTER TABLE `wp_installations`
  MODIFY `installations_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_login_logs`
--
ALTER TABLE `wp_login_logs`
  MODIFY `logs_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_map_master`
--
ALTER TABLE `wp_map_master`
  MODIFY `map_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_map_polygons`
--
ALTER TABLE `wp_map_polygons`
  MODIFY `poly_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_members`
--
ALTER TABLE `wp_members`
  MODIFY `member_id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_members_language`
--
ALTER TABLE `wp_members_language`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_notification_targets`
--
ALTER TABLE `wp_notification_targets`
  MODIFY `targets_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_password_resets`
--
ALTER TABLE `wp_password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_poles`
--
ALTER TABLE `wp_poles`
  MODIFY `poles_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_project`
--
ALTER TABLE `wp_project`
  MODIFY `project_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_project_pole_type`
--
ALTER TABLE `wp_project_pole_type`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_setting`
--
ALTER TABLE `wp_setting`
  MODIFY `setting_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_type`
--
ALTER TABLE `wp_type`
  MODIFY `type_id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `wp_winds`
--
ALTER TABLE `wp_winds`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
