-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: spacia_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `alembic_version`
--

DROP TABLE IF EXISTS `alembic_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL,
  PRIMARY KEY (`version_num`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `alembic_version`
--

LOCK TABLES `alembic_version` WRITE;
/*!40000 ALTER TABLE `alembic_version` DISABLE KEYS */;
INSERT INTO `alembic_version` VALUES ('14cc7b1b2099');
/*!40000 ALTER TABLE `alembic_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_activities`
--

DROP TABLE IF EXISTS `daily_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_activities` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `date` varchar(10) NOT NULL,
  `cards_reviewed` int NOT NULL,
  `games_played` int NOT NULL,
  `study_time_minutes` int NOT NULL,
  `xp_earned` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_date` (`user_id`,`date`),
  CONSTRAINT `daily_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_activities`
--

LOCK TABLES `daily_activities` WRITE;
/*!40000 ALTER TABLE `daily_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `flashcards`
--

DROP TABLE IF EXISTS `flashcards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `flashcards` (
  `id` char(36) NOT NULL,
  `folder_id` char(36) NOT NULL,
  `question` text NOT NULL,
  `answer` text NOT NULL,
  `status` enum('review','understood') DEFAULT 'review',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_flashcards_folder` (`folder_id`),
  CONSTRAINT `flashcards_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `flashcards`
--

LOCK TABLES `flashcards` WRITE;
/*!40000 ALTER TABLE `flashcards` DISABLE KEYS */;
INSERT INTO `flashcards` VALUES ('03c9a3d4-af1c-4d72-a001-c9b239e48671','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfd','fdfdfd','review','2026-08-23 10:57:02','2026-08-23 10:57:02'),('04ee362c-3538-4dfd-8aed-cd5ea1f89ac3','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','hshshsh','bsnsnsbs','review','2026-08-31 12:36:40','2026-08-31 12:36:40'),('0ba190de-58a9-4ccc-92c3-d1bc45445b0e','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','dfdfdfd','fdfdfdf','understood','2026-08-23 05:58:15','2026-08-27 02:41:56'),('1324515f-631a-498b-9ea9-1a837e295dac','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdf','fdfdfdfd','review','2026-08-23 10:57:16','2026-08-23 10:57:16'),('25c6972b-e4a9-4ad0-8125-6fbdbc0672ad','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdf','dfdfdfd','review','2026-08-23 10:57:07','2026-08-31 11:52:42'),('28ac532f-314d-4cce-8823-4ea739818966','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','jsjshs','hshshs','review','2026-08-31 12:36:39','2026-08-31 12:36:39'),('2b1f8ad0-06db-4b4f-965a-60cb309fe6ec','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','dfdfdfd','fdfdfdfdfd','review','2026-08-23 05:53:49','2026-08-23 06:03:38'),('30d43e93-5c19-48a2-bb74-82c60c5e444d','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdf','fdfdfdfd','review','2026-08-23 06:26:03','2026-08-27 02:33:28'),('4c9dacb8-3582-45fd-b5e7-075506a35a9a','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','gfgfgfgfg','fgfgfg','understood','2026-08-20 10:18:28','2026-08-27 02:41:56'),('54d5e0e1-fc4c-4533-a4bd-e98a92523a98','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdf','fdfdfdfd','review','2026-08-23 10:57:12','2026-08-23 10:57:12'),('5dcda36c-75ea-4817-be7f-a6427654a036','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdf','fdfdfd','review','2026-08-20 10:17:13','2026-08-23 06:39:12'),('6aeb7a8c-b2c6-47ad-ada4-abeb8182d9d2','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdfd','dfdfdfdfdf','review','2026-08-20 10:17:18','2026-08-27 02:33:27'),('6f4c20a3-7256-43c1-b014-64cf0606ad04','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfd','fdfdfdfdf','review','2026-08-23 10:57:21','2026-08-31 11:52:43'),('7f405069-71f1-4d76-b712-5a7a20209a44','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdfdfd','fdfdfdfd','review','2026-08-20 10:17:25','2026-08-27 02:41:40'),('8766f464-78ce-47c1-aa1e-12d6b6ac3e42','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdf','fdfdfdfdfd','review','2026-08-23 06:25:59','2026-08-27 02:39:49'),('87d201d1-1a13-443c-bf73-b55e20f5a067','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfd','fdfdfdfd','review','2026-08-23 10:57:29','2026-08-31 11:52:43'),('951bd6f1-d189-4f06-96a5-9e19d5a7dd39','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfd','fdfdfdfd','review','2026-08-23 10:57:42','2026-08-31 11:52:44'),('9904361a-0ca3-4a2a-acd2-ee30454f9d45','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdf','dfdfdfdfd','review','2026-08-23 05:58:21','2026-08-27 02:41:43'),('9a79c84e-d556-4789-a458-141ea3c3c249','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfd','fdfdfdfd','review','2026-08-23 10:57:38','2026-08-23 10:57:38'),('a742f1a7-555d-4b02-99ba-a3787261fe8d','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','','','review','2026-08-31 12:45:46','2026-08-31 12:45:46'),('ac489ba1-25af-4a8f-a557-2f68d7250054','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfdf','fdfdfdfdf','review','2026-08-23 10:57:25','2026-08-31 11:52:43'),('be4392bc-ac92-4d1e-9dee-ff75fa9e39c0','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfdfdf','fdfdfdfd','review','2026-08-23 10:57:55','2026-08-31 11:52:44'),('c349cd34-2c67-494f-a967-f095525e605b','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfdfd','dfdfdfdf','review','2026-08-23 10:57:34','2026-08-23 10:57:34'),('c5d0c7e7-f0ae-4817-ade3-f2f8a6ba8ca0','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','gfgfgfgf','g','review','2026-08-23 05:53:41','2026-08-27 02:41:42'),('d725e89d-d297-4837-93de-ef120976143e','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','bvbvbvbgfgfb','gfgfgfgf','review','2026-08-20 10:18:24','2026-08-27 02:41:42'),('f241d26b-77b9-4cff-ae14-5f47d54827c4','b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','fdfdfdfd','fdfdfdfdfd','review','2026-08-23 05:53:54','2026-08-23 05:53:54'),('f8597e45-2dd3-437b-94fd-d534d0b4a000','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','fdfdfdfdfd','fdfdfdfdfd','understood','2026-08-23 10:57:46','2026-08-31 11:52:55'),('f86d3168-5e78-46e7-b82f-931b02a5985b','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','hshshsh','hshshs','review','2026-08-31 12:36:39','2026-08-31 12:36:39'),('ff16e1a4-9bd6-4f79-a2bf-ebecce6add14','e5a2fea8-23af-46f1-91ce-ee7a04be56c5','','','review','2026-08-31 12:45:46','2026-08-31 12:45:46');
/*!40000 ALTER TABLE `flashcards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `folders`
--

DROP TABLE IF EXISTS `folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `folders` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `accent_color` varchar(20) DEFAULT '#4A90D9',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_folders_user` (`user_id`),
  CONSTRAINT `folders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `folders`
--

LOCK TABLES `folders` WRITE;
/*!40000 ALTER TABLE `folders` DISABLE KEYS */;
INSERT INTO `folders` VALUES ('14ef2621-24af-4127-bb0c-e825e53eeaea','739615b0-3f49-4f1b-a627-85d285f84419','nigga','#FFD166','2026-08-20 09:55:00','2026-08-20 09:55:00'),('7eea4e9a-2db0-4b3c-9fa5-f2769cfe26f3','1dfbbdf9-a479-404f-a624-47f9ccb68b28','math','#FFD166','2026-08-20 06:03:59','2026-08-20 06:03:59'),('b216db86-9ea2-4b06-adbf-0e65fc6e6ad9','09a28023-e317-4bbb-9c37-b9ec2886dc62','manok na pula','#3DDC84','2026-08-20 10:16:31','2026-08-20 10:16:31'),('d815ecf6-49b0-45f8-b064-689c18d61c41','09a28023-e317-4bbb-9c37-b9ec2886dc62','hey','#FB923C','2026-08-27 02:06:47','2026-08-27 02:06:47'),('e5a2fea8-23af-46f1-91ce-ee7a04be56c5','09a28023-e317-4bbb-9c37-b9ec2886dc62','burat','#E05C7A','2026-08-23 10:56:55','2026-08-23 10:56:55');
/*!40000 ALTER TABLE `folders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pdf_uploads`
--

DROP TABLE IF EXISTS `pdf_uploads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pdf_uploads` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_url` text NOT NULL,
  `file_size` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pdf_user` (`user_id`),
  CONSTRAINT `pdf_uploads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pdf_uploads`
--

LOCK TABLES `pdf_uploads` WRITE;
/*!40000 ALTER TABLE `pdf_uploads` DISABLE KEYS */;
/*!40000 ALTER TABLE `pdf_uploads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` varchar(50) NOT NULL,
  `folder_id` varchar(50) NOT NULL,
  `folder_name` varchar(255) NOT NULL,
  `card_ids` json NOT NULL,
  `schedule_type` varchar(50) NOT NULL,
  `custom_days` json DEFAULT NULL,
  `time` varchar(10) NOT NULL,
  `duration_minutes` int NOT NULL,
  `interval_minutes` int NOT NULL,
  `shuffle` tinyint(1) NOT NULL,
  `enabled` tinyint(1) NOT NULL,
  `created_at` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
INSERT INTO `schedules` VALUES ('5e9195f5-8b8c-4f95-903c-78a29709141f','cfce67f4-05a1-424b-a5fb-327c05a708b1','science','[\"0f074041-317f-4833-bbc3-b2c73a4bac6e\", \"20658232-6eea-4967-b9ac-3243d7e778fe\", \"2c8be8b0-e8bb-4989-b389-548f4a31c3fd\", \"30af3bbe-809c-40f8-8a2a-8ddf1414ff0d\"]','daily','[]','20:00',60,10,1,1,1783071308260);
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_sessions`
--

DROP TABLE IF EXISTS `study_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(36) NOT NULL,
  `started_at` datetime NOT NULL,
  `ended_at` datetime DEFAULT NULL,
  `duration_seconds` int DEFAULT NULL,
  `created_at` datetime DEFAULT (now()),
  PRIMARY KEY (`id`),
  KEY `ix_study_sessions_user_id` (`user_id`),
  CONSTRAINT `study_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_sessions`
--

LOCK TABLES `study_sessions` WRITE;
/*!40000 ALTER TABLE `study_sessions` DISABLE KEYS */;
INSERT INTO `study_sessions` VALUES (12,'09a28023-e317-4bbb-9c37-b9ec2886dc62','2026-08-23 05:58:38','2026-08-23 05:59:05',26,'2026-08-23 13:59:05');
/*!40000 ALTER TABLE `study_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `plan` enum('free','monthly','annual') NOT NULL,
  `status` enum('active','expired','cancelled') DEFAULT 'active',
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user` (`user_id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_challenges`
--

DROP TABLE IF EXISTS `user_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_challenges` (
  `user_id` varchar(36) NOT NULL,
  `challenge_id` varchar(50) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `reward_xp` int NOT NULL,
  `completed` tinyint(1) NOT NULL,
  `progress` int NOT NULL,
  `target` int NOT NULL,
  `date` varchar(10) NOT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_challenges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_challenges`
--

LOCK TABLES `user_challenges` WRITE;
/*!40000 ALTER TABLE `user_challenges` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_streaks`
--

DROP TABLE IF EXISTS `user_streaks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_streaks` (
  `user_id` varchar(36) NOT NULL,
  `current_streak` int NOT NULL,
  `longest_streak` int NOT NULL,
  `last_active_date` varchar(10) DEFAULT NULL,
  `freezes_available` int NOT NULL,
  `daily_goal_target` int NOT NULL,
  `cards_reviewed` int NOT NULL,
  `games_played` int NOT NULL,
  `study_time_minutes` int NOT NULL,
  `xp_earned` int NOT NULL,
  `ai_generations_count` int NOT NULL,
  `night_study_sessions` int NOT NULL,
  `created_at` datetime DEFAULT (now()),
  `updated_at` datetime DEFAULT (now()),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `user_streaks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_streaks`
--

LOCK TABLES `user_streaks` WRITE;
/*!40000 ALTER TABLE `user_streaks` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_streaks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('09a28023-e317-4bbb-9c37-b9ec2886dc62','tite','tite@gmail.com','$2b$10$NPsNf7tB0lY9Lw0f1VHMOuIuhQw1BhQD/.9OlzoqU0/ShDoVMcAKa','2026-08-20 10:15:16','2026-08-20 10:15:16'),('1dfbbdf9-a479-404f-a624-47f9ccb68b28','nigga','nigga@gmail.com','$2b$10$gt9tGPKEYEBXlZBHBdmVkuKtbUDqMiTyt7iV5GaUWw2futTg9zAMC','2026-08-20 05:59:14','2026-08-20 05:59:14'),('739615b0-3f49-4f1b-a627-85d285f84419','marcel','adelzarajhonmarcel@gmail.com','$2b$10$f8NI4a5bohqkdjTarw3ZN.wh9gFEEGdcxwGokoRK5YT5pqRxjSw.6','2026-08-19 08:13:39','2026-08-19 08:13:39');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-01 13:03:40
