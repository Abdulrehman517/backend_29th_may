CREATE TABLE users IF NOT EXISTS (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_name` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(200) NOT NULL,
    `last_name` VARCHAR(200) NOT NULL,
    `email` VARCHAR(200) NOT NULL,
    `password` VARCHAR(200) NOT NULL
);

CREATE TABLE djs IF NOT EXISTS (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `dj_name` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(200) NULL,
    `last_name` VARCHAR(200) NULL,
    `gender` VARCHAR(50) NULL,
    `date_of_birth` DATE DEFAULT NULL,
    `phone` VARCHAR(20),
    `email` VARCHAR(50),
    `instagram_url` VARCHAR(255) NULL,
    `guest_list_url` VARCHAR(255) NULL,
    `payment_method` VARCHAR(50) NULL,
    `rating` INT NULL,
    `total_is` INT NULL,
    `total_in` INT NULL,
    `conversion_rate` VARCHAR(50) NULL,
    `notes` VARCHAR(255) NULL,
    `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


INSERT INTO users (`user_name`, `first_name`, `last_name`, `email`, `password`) VALUES
('yasir', 'yasir', 'rose', 'yasirrose@gmail.com', '$2a$12$z/ptSYB1BBX9jG5inQ/Il.i36tDE.jy.ZWRNEohGUki5sNkWy2Ltm');

CREATE TABLE venues IF NOT EXISTS (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `venue_name` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL
);


CREATE TABLE events IF NOT EXISTS (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `venue_id` INT NULL,
    `type` VARCHAR(255) NULL,
    `event_name` VARCHAR(255) NULL,
    `date` DATETIME DEFAULT NULL,
    `fee` INT NULL,
    `added_by` VARCHAR(255) NULL,
    `notes` VARCHAR(255) NULL,
    `end_event_time` VARCHAR(255) NULL,
    `start_event_time` VARCHAR(255) NULL
);

CREATE TABLE event_set_times IF NOT EXISTS (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `dj_id` INT NULL,
    `event_id` INT NULL,
    `start_time` VARCHAR(255) NULL,
    `end_time` VARCHAR(255) NULL,
    `fee` INT DEFAULT NULL,
    `added_by` VARCHAR(50) NULL,
    `notes` VARCHAR(200) NULL
);


CREATE TABLE IF NOT EXISTS `fee_list` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `fee` INT NOT NULL
);


CREATE TABLE IF NOT EXISTS `users_list` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL
);

CREATE TABLE entry_team IF NOT EXISTS (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `entry_member_name` VARCHAR(50) NOT NULL,
    `first_name` VARCHAR(200) NULL,
    `last_name` VARCHAR(200) NULL,
    `gender` VARCHAR(50) NULL,
    `phone` VARCHAR(20),
    `email` VARCHAR(50),
    `instagram_url` VARCHAR(255) NULL,
    `payment_method` VARCHAR(50) NULL,
    `create_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `update_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `event_entry_teams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `entry_team_id` int NULL DEFAULT NULL,
  `event_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `dj_guests_history` (
    `id` int NOT NULL AUTO_INCREMENT,
    `dj_id` int NULL DEFAULT NULL,
    `event_id` int NULL DEFAULT NULL,
    `listed` int NULL DEFAULT NULL,
    `attended` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `event_brite_details`  (	
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NULL DEFAULT NULL,
  `eb_comp_listed` int NULL DEFAULT NULL,
  `eb_comp_attended` int NULL DEFAULT NULL,
  `eb_paid_listed` int NULL DEFAULT NULL,
  `eb_paid_attended` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `performers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `performer_member_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `gender` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instagram_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` timestamp(0) NOT NULL DEFAULT current_timestamp(0),
  `update_time` timestamp(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  `lead_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `set_rate` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)
CREATE TABLE IF NOT EXISTS `event_performers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `performer_id` int NULL DEFAULT NULL,
  `event_id` int NULL DEFAULT NULL,
  `set_rate` int NULL DEFAULT NULL,
  `paid_status` tinyint NULL DEFAULT NULL,
  `created_by` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `performer_schedules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `performer_id` int NULL DEFAULT NULL,
  `schedule_date` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `performer_affiliations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `performer_id` int NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE  IF NOT EXISTS `promoters`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `promoter_member_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `gender` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `instagram_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `payment_method` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `create_time` timestamp(0) NOT NULL DEFAULT current_timestamp(0),
  `update_time` timestamp(0) NOT NULL DEFAULT current_timestamp(0) ON UPDATE CURRENT_TIMESTAMP(0),
  `guest_list_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `lead_by` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `total_listed` int NULL DEFAULT NULL,
  `total_attended` int NULL DEFAULT NULL,
  `hourly_rate` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)
CREATE TABLE IF NOT EXISTS `promoter_schedules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `promoter_id` int NULL DEFAULT NULL,
  `schedule_date` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)
CREATE TABLE  IF NOT EXISTS `promoter_guests_history`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `promoter_id` int NULL DEFAULT NULL,
  `event_id` int NULL DEFAULT NULL,
  `guest_listed` int NULL DEFAULT NULL,
  `guest_attended` int NULL DEFAULT NULL,
  `comp_listed` int NULL DEFAULT NULL,
  `comp_attended` int NULL DEFAULT NULL,
  `male_comp_guest_attended` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `female_comp_guest_attended` varchar(45) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `total_earned` varchar(11) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL DEFAULT NULL,
  `paid_status` tinyint(1) NULL DEFAULT NULL,
  `created_by` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `dj_affiliations`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `dj_id` int NULL DEFAULT NULL,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)
CREATE TABLE IF NOT EXISTS `dj_schedules`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `dj_id` int NULL DEFAULT NULL,
  `schedule_date` date NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `activities`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `actor` int NULL DEFAULT NULL,
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `record_id` int NULL DEFAULT NULL,
  `date_time` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `change_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `activity_id` int NULL DEFAULT NULL,
  `field_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `old_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `new_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `email_content`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `radius` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `fee_structure` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `important` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `guest_list` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `opportunities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `invoicing` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `set_times` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`) USING BTREE
)

CREATE TABLE IF NOT EXISTS `email_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `event_id` int NULL DEFAULT NULL,
  `dj_id` int NULL DEFAULT NULL,
  `time_set_id` int NULL DEFAULT NULL,
  `status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `date_time` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
)