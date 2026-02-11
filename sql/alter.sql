ALTER TABLE `wp_project` ADD `project_group_id` BIGINT NULL DEFAULT NULL AFTER `contract_id`;
ALTER TABLE `wp_project_status` ADD `project_status_color` VARCHAR(255) NULL DEFAULT NULL AFTER `project_status_name`;
ALTER TABLE `wp_project_status` CHANGE `project_status_color` `project_status_color` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT '#3b82f6';
ALTER TABLE `wp_project` ADD `project_status_id` BIGINT NULL DEFAULT NULL AFTER `project_group_id`;
ALTER TABLE `wp_project` ADD `project_background` VARCHAR(255) NULL DEFAULT NULL AFTER `updated_at`, ADD `project_opacity` BIGINT NOT NULL DEFAULT '0' AFTER `project_background`;