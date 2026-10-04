-- SQL Schema cho bài tập thực hành JWT
-- Bảng người dùng (User) theo yêu cầu Phụ lục

CREATE DATABASE IF NOT EXISTS `jwt_demo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `jwt_demo_db`;

DROP TABLE IF EXISTS `User`;

CREATE TABLE `User` (
  `IdUser` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `UserName` VARCHAR(255) NOT NULL UNIQUE,
  `Password` VARCHAR(255) NOT NULL,
  `Token` VARCHAR(255) NULL
);

-- Dữ liệu mẫu (Sample data):
-- 1. admin: Mật khẩu '123456' dạng Base64 => 'MTIzNDU2'
-- 2. user1: Mật khẩu '123456' dạng MD5    => 'e10adc3949ba59abbe56e057f20f883e'
-- 3. testuser: Mật khẩu plaintext 'password123' mã hoá Base64 => 'cGFzc3dvcmQxMjM='

INSERT INTO `User` (`IdUser`, `UserName`, `Password`, `Token`) VALUES
(1, 'admin', 'MTIzNDU2', NULL),
(2, 'user1', 'e10adc3949ba59abbe56e057f20f883e', NULL),
(3, 'testuser', 'cGFzc3dvcmQxMjM=', NULL);
