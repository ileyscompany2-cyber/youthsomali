-- YPP native MySQL 8 schema. Existing data is preserved; do not run against a populated database.
-- Create/backup the target database separately, then select it before applying this file.
CREATE TABLE `AdminUser` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR') NOT NULL DEFAULT 'EDITOR',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    INDEX `AdminUser_active_role_idx`(`active`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AdminSession` (
    `id` VARCHAR(30) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `userId` VARCHAR(30) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdminSession_tokenHash_key`(`tokenHash`),
    INDEX `AdminSession_userId_expiresAt_idx`(`userId`, `expiresAt`),
    INDEX `AdminSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `LoginAttempt` (
    `id` VARCHAR(30) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `addressHash` CHAR(64) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 1,
    `windowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `blockedUntil` DATETIME(3) NULL,

    INDEX `LoginAttempt_blockedUntil_idx`(`blockedUntil`),
    UNIQUE INDEX `LoginAttempt_email_addressHash_key`(`email`, `addressHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArticleCategory` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ArticleCategory_name_key`(`name`),
    UNIQUE INDEX `ArticleCategory_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Article` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `seoTitle` VARCHAR(180) NULL,
    `seoDescription` VARCHAR(320) NULL,
    `featuredImageUrl` VARCHAR(2048) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `categoryId` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `Article_slug_key`(`slug`),
    INDEX `Article_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `Article_categoryId_status_idx`(`categoryId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArticleTag` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(60) NOT NULL,

    UNIQUE INDEX `ArticleTag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Program` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `slug` VARCHAR(180) NOT NULL,
    `description` VARCHAR(1000) NOT NULL,
    `objectives` JSON NOT NULL,
    `activities` JSON NOT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Program_slug_key`(`slug`),
    INDEX `Program_status_sortOrder_idx`(`status`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Project` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `summary` VARCHAR(500) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `objectives` JSON NOT NULL,
    `location` VARCHAR(180) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `projectStatus` VARCHAR(60) NOT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `beneficiaries` VARCHAR(1000) NULL,
    `verifiedResults` LONGTEXT NULL,
    `reportUrl` VARCHAR(2048) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `programId` VARCHAR(30) NULL,

    UNIQUE INDEX `Project_slug_key`(`slug`),
    INDEX `Project_status_startsAt_idx`(`status`, `startsAt`),
    INDEX `Project_programId_status_idx`(`programId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Event` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `slug` VARCHAR(200) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `location` VARCHAR(180) NOT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Event_slug_key`(`slug`),
    INDEX `Event_status_startsAt_idx`(`status`, `startsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `GalleryImage` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `caption` VARCHAR(500) NULL,
    `altText` VARCHAR(300) NOT NULL,
    `category` VARCHAR(80) NOT NULL,
    `imageUrl` VARCHAR(2048) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GalleryImage_status_category_sortOrder_idx`(`status`, `category`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `TeamMember` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `position` VARCHAR(140) NOT NULL,
    `biography` VARCHAR(1500) NOT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TeamMember_status_sortOrder_idx`(`status`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Partner` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(160) NOT NULL,
    `websiteUrl` VARCHAR(2048) NULL,
    `description` VARCHAR(1000) NULL,
    `logoUrl` VARCHAR(2048) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Partner_status_name_idx`(`status`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Publication` (
    `id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `category` VARCHAR(80) NOT NULL,
    `documentUrl` VARCHAR(2048) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Publication_status_publishedAt_idx`(`status`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContactMessage` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `subject` VARCHAR(180) NOT NULL,
    `message` VARCHAR(5000) NOT NULL,
    `status` ENUM('UNREAD', 'READ', 'REPLIED', 'ARCHIVED') NOT NULL DEFAULT 'UNREAD',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ContactMessage_status_createdAt_idx`(`status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Testimonial` (
    `id` VARCHAR(30) NOT NULL,
    `quote` VARCHAR(1500) NOT NULL,
    `authorName` VARCHAR(120) NOT NULL,
    `authorRole` VARCHAR(140) NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `imageUrl` VARCHAR(2048) NULL,
    `consentToPublish` BOOLEAN NOT NULL DEFAULT false,
    `approved` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Testimonial_approved_createdAt_idx`(`approved`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ContactRateLimit` (
    `addressHash` CHAR(64) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 1,
    `windowStart` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`addressHash`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WebsiteSetting` (
    `key` VARCHAR(100) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MediaAsset` (
    `id` VARCHAR(30) NOT NULL,
    `storageKey` VARCHAR(512) NOT NULL,
    `publicUrl` VARCHAR(2048) NOT NULL,
    `originalName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(80) NOT NULL,
    `sizeBytes` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MediaAsset_storageKey_key`(`storageKey`),
    INDEX `MediaAsset_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `AuditLog` (
    `id` VARCHAR(30) NOT NULL,
    `userId` VARCHAR(30) NULL,
    `action` VARCHAR(120) NOT NULL,
    `entity` VARCHAR(80) NOT NULL,
    `entityId` VARCHAR(80) NULL,
    `details` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `AuditLog_entity_entityId_createdAt_idx`(`entity`, `entityId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `_ArticleToArticleTag` (
    `A` VARCHAR(30) NOT NULL,
    `B` VARCHAR(30) NOT NULL,

    UNIQUE INDEX `_ArticleToArticleTag_AB_unique`(`A`, `B`),
    INDEX `_ArticleToArticleTag_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AdminSession` ADD CONSTRAINT `AdminSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AdminUser`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Article` ADD CONSTRAINT `Article_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `ArticleCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Project` ADD CONSTRAINT `Project_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `_ArticleToArticleTag` ADD CONSTRAINT `_ArticleToArticleTag_A_fkey` FOREIGN KEY (`A`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `_ArticleToArticleTag` ADD CONSTRAINT `_ArticleToArticleTag_B_fkey` FOREIGN KEY (`B`) REFERENCES `ArticleTag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Verified YPP program areas.
INSERT IGNORE INTO `Program` (`id`,`title`,`slug`,`description`,`objectives`,`activities`,`imageUrl`,`status`,`sortOrder`,`createdAt`,`updatedAt`) VALUES
('program-01','Community Peace Forums','community-peace-forums','Community forums focused on dialogue, peacebuilding, and participation.',JSON_ARRAY(),JSON_ARRAY(),'/images/about-youth.jpg','PUBLISHED',0,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('program-02','Youth Forums on Peace and Security','youth-forums-peace-security','Forums for young people to engage with peace and security issues.',JSON_ARRAY(),JSON_ARRAY(),'/images/gallery-02.jpg','PUBLISHED',1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('program-03','Sports for Peace and Development','sports-peace-development','Sports activities as an approach to peacebuilding and community development.',JSON_ARRAY(),JSON_ARRAY(),'/images/gallery-03.jpg','PUBLISHED',2,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('program-04','Peace Education in Schools','peace-education-schools','Peace education activities for school communities.',JSON_ARRAY(),JSON_ARRAY(),'/images/project-education.jpg','PUBLISHED',3,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('program-05','Conflict Prevention and Resolution','conflict-prevention-resolution','Initiatives focused on preventing and resolving conflict.',JSON_ARRAY(),JSON_ARRAY(),'/images/project-dialogue.jpg','PUBLISHED',4,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('program-06','Youth Leadership and Participation in Peacebuilding','youth-leadership-peacebuilding','Youth leadership and participation in peacebuilding.',JSON_ARRAY(),JSON_ARRAY(),'/images/news-community.jpg','PUBLISHED',5,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('program-07','Dialogue, Mediation and Reconciliation','dialogue-mediation-reconciliation','Dialogue, mediation, and reconciliation initiatives.',JSON_ARRAY(),JSON_ARRAY(),'/images/gallery-01.jpg','PUBLISHED',6,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- Verified Executive Director.
INSERT IGNORE INTO `TeamMember` (`id`,`name`,`position`,`biography`,`status`,`sortOrder`,`createdAt`,`updatedAt`) VALUES ('ypp-executive-director','Ibrahim Aden Ali','Executive Director','Executive Director of Youth for Peace and Prosperous (YPP).','PUBLISHED',0,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));

-- Official organization and contact settings. Values are JSON strings, matching MySQL JSON fields.
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('contact.email',JSON_QUOTE('youthforpeace15@gmail.com'),CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('contact.phone',JSON_QUOTE('+252 612 029 321'),CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('contact.location',JSON_QUOTE('Southwest State of Somalia and Mogadishu, Somalia'),CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('organization.founded',JSON_QUOTE('5 February 2017'),CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('organization.executiveDirector',JSON_QUOTE('Ibrahim Aden Ali'),CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('organization.mission',JSON_QUOTE('Empower young people and communities through peacebuilding, leadership, capacity development, and inclusive initiatives.'),CURRENT_TIMESTAMP(3));
INSERT IGNORE INTO `WebsiteSetting` (`key`,`value`,`updatedAt`) VALUES ('organization.vision',JSON_QUOTE('A peaceful, inclusive, and prosperous society where young people actively contribute to peacebuilding and sustainable development.'),CURRENT_TIMESTAMP(3));

-- Gallery records refer to image files committed in public/images/gallery.
INSERT IGNORE INTO `GalleryImage` (`id`,`title`,`altText`,`category`,`imageUrl`,`status`,`sortOrder`,`createdAt`,`updatedAt`) VALUES
('ypp-1f6a0929','YPP community photograph 1','Youth for Peace and Prosperous community photograph 1','YPP community','/images/gallery/1F6A0929.webp','PUBLISHED',1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0934','YPP community photograph 2','Youth for Peace and Prosperous community photograph 2','YPP community','/images/gallery/1F6A0934.webp','PUBLISHED',2,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0935','YPP community photograph 3','Youth for Peace and Prosperous community photograph 3','YPP community','/images/gallery/1F6A0935.webp','PUBLISHED',3,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0937','YPP community photograph 4','Youth for Peace and Prosperous community photograph 4','YPP community','/images/gallery/1F6A0937.webp','PUBLISHED',4,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0938','YPP community photograph 5','Youth for Peace and Prosperous community photograph 5','YPP community','/images/gallery/1F6A0938.webp','PUBLISHED',5,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0939','YPP community photograph 6','Youth for Peace and Prosperous community photograph 6','YPP community','/images/gallery/1F6A0939.webp','PUBLISHED',6,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0940','YPP community photograph 7','Youth for Peace and Prosperous community photograph 7','YPP community','/images/gallery/1F6A0940.webp','PUBLISHED',7,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0941','YPP community photograph 8','Youth for Peace and Prosperous community photograph 8','YPP community','/images/gallery/1F6A0941.webp','PUBLISHED',8,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0942','YPP community photograph 9','Youth for Peace and Prosperous community photograph 9','YPP community','/images/gallery/1F6A0942.webp','PUBLISHED',9,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0943','YPP community photograph 10','Youth for Peace and Prosperous community photograph 10','YPP community','/images/gallery/1F6A0943.webp','PUBLISHED',10,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0944','YPP community photograph 11','Youth for Peace and Prosperous community photograph 11','YPP community','/images/gallery/1F6A0944.webp','PUBLISHED',11,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0945','YPP community photograph 12','Youth for Peace and Prosperous community photograph 12','YPP community','/images/gallery/1F6A0945.webp','PUBLISHED',12,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0946','YPP community photograph 13','Youth for Peace and Prosperous community photograph 13','YPP community','/images/gallery/1F6A0946.webp','PUBLISHED',13,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0947','YPP community photograph 14','Youth for Peace and Prosperous community photograph 14','YPP community','/images/gallery/1F6A0947.webp','PUBLISHED',14,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0948','YPP community photograph 15','Youth for Peace and Prosperous community photograph 15','YPP community','/images/gallery/1F6A0948.webp','PUBLISHED',15,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0949','YPP community photograph 16','Youth for Peace and Prosperous community photograph 16','YPP community','/images/gallery/1F6A0949.webp','PUBLISHED',16,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0950','YPP community photograph 17','Youth for Peace and Prosperous community photograph 17','YPP community','/images/gallery/1F6A0950.webp','PUBLISHED',17,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0951','YPP community photograph 18','Youth for Peace and Prosperous community photograph 18','YPP community','/images/gallery/1F6A0951.webp','PUBLISHED',18,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0952','YPP community photograph 19','Youth for Peace and Prosperous community photograph 19','YPP community','/images/gallery/1F6A0952.webp','PUBLISHED',19,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0953','YPP community photograph 20','Youth for Peace and Prosperous community photograph 20','YPP community','/images/gallery/1F6A0953.webp','PUBLISHED',20,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0954','YPP community photograph 21','Youth for Peace and Prosperous community photograph 21','YPP community','/images/gallery/1F6A0954.webp','PUBLISHED',21,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0955','YPP community photograph 22','Youth for Peace and Prosperous community photograph 22','YPP community','/images/gallery/1F6A0955.webp','PUBLISHED',22,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0956','YPP community photograph 23','Youth for Peace and Prosperous community photograph 23','YPP community','/images/gallery/1F6A0956.webp','PUBLISHED',23,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0957','YPP community photograph 24','Youth for Peace and Prosperous community photograph 24','YPP community','/images/gallery/1F6A0957.webp','PUBLISHED',24,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0958','YPP community photograph 25','Youth for Peace and Prosperous community photograph 25','YPP community','/images/gallery/1F6A0958.webp','PUBLISHED',25,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0959','YPP community photograph 26','Youth for Peace and Prosperous community photograph 26','YPP community','/images/gallery/1F6A0959.webp','PUBLISHED',26,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0960','YPP community photograph 27','Youth for Peace and Prosperous community photograph 27','YPP community','/images/gallery/1F6A0960.webp','PUBLISHED',27,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0962','YPP community photograph 28','Youth for Peace and Prosperous community photograph 28','YPP community','/images/gallery/1F6A0962.webp','PUBLISHED',28,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0963','YPP community photograph 29','Youth for Peace and Prosperous community photograph 29','YPP community','/images/gallery/1F6A0963.webp','PUBLISHED',29,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0964','YPP community photograph 30','Youth for Peace and Prosperous community photograph 30','YPP community','/images/gallery/1F6A0964.webp','PUBLISHED',30,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0965','YPP community photograph 31','Youth for Peace and Prosperous community photograph 31','YPP community','/images/gallery/1F6A0965.webp','PUBLISHED',31,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0966','YPP community photograph 32','Youth for Peace and Prosperous community photograph 32','YPP community','/images/gallery/1F6A0966.webp','PUBLISHED',32,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0967','YPP community photograph 33','Youth for Peace and Prosperous community photograph 33','YPP community','/images/gallery/1F6A0967.webp','PUBLISHED',33,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0968','YPP community photograph 34','Youth for Peace and Prosperous community photograph 34','YPP community','/images/gallery/1F6A0968.webp','PUBLISHED',34,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0969','YPP community photograph 35','Youth for Peace and Prosperous community photograph 35','YPP community','/images/gallery/1F6A0969.webp','PUBLISHED',35,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0971','YPP community photograph 36','Youth for Peace and Prosperous community photograph 36','YPP community','/images/gallery/1F6A0971.webp','PUBLISHED',36,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0972','YPP community photograph 37','Youth for Peace and Prosperous community photograph 37','YPP community','/images/gallery/1F6A0972.webp','PUBLISHED',37,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0973','YPP community photograph 38','Youth for Peace and Prosperous community photograph 38','YPP community','/images/gallery/1F6A0973.webp','PUBLISHED',38,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0977','YPP community photograph 39','Youth for Peace and Prosperous community photograph 39','YPP community','/images/gallery/1F6A0977.webp','PUBLISHED',39,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0978','YPP community photograph 40','Youth for Peace and Prosperous community photograph 40','YPP community','/images/gallery/1F6A0978.webp','PUBLISHED',40,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0979','YPP community photograph 41','Youth for Peace and Prosperous community photograph 41','YPP community','/images/gallery/1F6A0979.webp','PUBLISHED',41,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0980','YPP community photograph 42','Youth for Peace and Prosperous community photograph 42','YPP community','/images/gallery/1F6A0980.webp','PUBLISHED',42,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0982','YPP community photograph 43','Youth for Peace and Prosperous community photograph 43','YPP community','/images/gallery/1F6A0982.webp','PUBLISHED',43,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0983','YPP community photograph 44','Youth for Peace and Prosperous community photograph 44','YPP community','/images/gallery/1F6A0983.webp','PUBLISHED',44,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0984','YPP community photograph 45','Youth for Peace and Prosperous community photograph 45','YPP community','/images/gallery/1F6A0984.webp','PUBLISHED',45,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0985','YPP community photograph 46','Youth for Peace and Prosperous community photograph 46','YPP community','/images/gallery/1F6A0985.webp','PUBLISHED',46,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0986','YPP community photograph 47','Youth for Peace and Prosperous community photograph 47','YPP community','/images/gallery/1F6A0986.webp','PUBLISHED',47,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0987','YPP community photograph 48','Youth for Peace and Prosperous community photograph 48','YPP community','/images/gallery/1F6A0987.webp','PUBLISHED',48,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0989','YPP community photograph 49','Youth for Peace and Prosperous community photograph 49','YPP community','/images/gallery/1F6A0989.webp','PUBLISHED',49,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0990','YPP community photograph 50','Youth for Peace and Prosperous community photograph 50','YPP community','/images/gallery/1F6A0990.webp','PUBLISHED',50,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0991','YPP community photograph 51','Youth for Peace and Prosperous community photograph 51','YPP community','/images/gallery/1F6A0991.webp','PUBLISHED',51,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0992','YPP community photograph 52','Youth for Peace and Prosperous community photograph 52','YPP community','/images/gallery/1F6A0992.webp','PUBLISHED',52,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0993','YPP community photograph 53','Youth for Peace and Prosperous community photograph 53','YPP community','/images/gallery/1F6A0993.webp','PUBLISHED',53,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0994','YPP community photograph 54','Youth for Peace and Prosperous community photograph 54','YPP community','/images/gallery/1F6A0994.webp','PUBLISHED',54,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0995','YPP community photograph 55','Youth for Peace and Prosperous community photograph 55','YPP community','/images/gallery/1F6A0995.webp','PUBLISHED',55,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0996','YPP community photograph 56','Youth for Peace and Prosperous community photograph 56','YPP community','/images/gallery/1F6A0996.webp','PUBLISHED',56,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0997','YPP community photograph 57','Youth for Peace and Prosperous community photograph 57','YPP community','/images/gallery/1F6A0997.webp','PUBLISHED',57,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a0998','YPP community photograph 58','Youth for Peace and Prosperous community photograph 58','YPP community','/images/gallery/1F6A0998.webp','PUBLISHED',58,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1000','YPP community photograph 59','Youth for Peace and Prosperous community photograph 59','YPP community','/images/gallery/1F6A1000.webp','PUBLISHED',59,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1001','YPP community photograph 60','Youth for Peace and Prosperous community photograph 60','YPP community','/images/gallery/1F6A1001.webp','PUBLISHED',60,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1002','YPP community photograph 61','Youth for Peace and Prosperous community photograph 61','YPP community','/images/gallery/1F6A1002.webp','PUBLISHED',61,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1003','YPP community photograph 62','Youth for Peace and Prosperous community photograph 62','YPP community','/images/gallery/1F6A1003.webp','PUBLISHED',62,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1004','YPP community photograph 63','Youth for Peace and Prosperous community photograph 63','YPP community','/images/gallery/1F6A1004.webp','PUBLISHED',63,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1005','YPP community photograph 64','Youth for Peace and Prosperous community photograph 64','YPP community','/images/gallery/1F6A1005.webp','PUBLISHED',64,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1006','YPP community photograph 65','Youth for Peace and Prosperous community photograph 65','YPP community','/images/gallery/1F6A1006.webp','PUBLISHED',65,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1007','YPP community photograph 66','Youth for Peace and Prosperous community photograph 66','YPP community','/images/gallery/1F6A1007.webp','PUBLISHED',66,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1008','YPP community photograph 67','Youth for Peace and Prosperous community photograph 67','YPP community','/images/gallery/1F6A1008.webp','PUBLISHED',67,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1009','YPP community photograph 68','Youth for Peace and Prosperous community photograph 68','YPP community','/images/gallery/1F6A1009.webp','PUBLISHED',68,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1010','YPP community photograph 69','Youth for Peace and Prosperous community photograph 69','YPP community','/images/gallery/1F6A1010.webp','PUBLISHED',69,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1011','YPP community photograph 70','Youth for Peace and Prosperous community photograph 70','YPP community','/images/gallery/1F6A1011.webp','PUBLISHED',70,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1012','YPP community photograph 71','Youth for Peace and Prosperous community photograph 71','YPP community','/images/gallery/1F6A1012.webp','PUBLISHED',71,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1013','YPP community photograph 72','Youth for Peace and Prosperous community photograph 72','YPP community','/images/gallery/1F6A1013.webp','PUBLISHED',72,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1014','YPP community photograph 73','Youth for Peace and Prosperous community photograph 73','YPP community','/images/gallery/1F6A1014.webp','PUBLISHED',73,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1015','YPP community photograph 74','Youth for Peace and Prosperous community photograph 74','YPP community','/images/gallery/1F6A1015.webp','PUBLISHED',74,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1016','YPP community photograph 75','Youth for Peace and Prosperous community photograph 75','YPP community','/images/gallery/1F6A1016.webp','PUBLISHED',75,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1017','YPP community photograph 76','Youth for Peace and Prosperous community photograph 76','YPP community','/images/gallery/1F6A1017.webp','PUBLISHED',76,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1018','YPP community photograph 77','Youth for Peace and Prosperous community photograph 77','YPP community','/images/gallery/1F6A1018.webp','PUBLISHED',77,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1019','YPP community photograph 78','Youth for Peace and Prosperous community photograph 78','YPP community','/images/gallery/1F6A1019.webp','PUBLISHED',78,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1020','YPP community photograph 79','Youth for Peace and Prosperous community photograph 79','YPP community','/images/gallery/1F6A1020.webp','PUBLISHED',79,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1022','YPP community photograph 80','Youth for Peace and Prosperous community photograph 80','YPP community','/images/gallery/1F6A1022.webp','PUBLISHED',80,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1024','YPP community photograph 81','Youth for Peace and Prosperous community photograph 81','YPP community','/images/gallery/1F6A1024.webp','PUBLISHED',81,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1025','YPP community photograph 82','Youth for Peace and Prosperous community photograph 82','YPP community','/images/gallery/1F6A1025.webp','PUBLISHED',82,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1026','YPP community photograph 83','Youth for Peace and Prosperous community photograph 83','YPP community','/images/gallery/1F6A1026.webp','PUBLISHED',83,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1029','YPP community photograph 84','Youth for Peace and Prosperous community photograph 84','YPP community','/images/gallery/1F6A1029.webp','PUBLISHED',84,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1031','YPP community photograph 85','Youth for Peace and Prosperous community photograph 85','YPP community','/images/gallery/1F6A1031.webp','PUBLISHED',85,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1033','YPP community photograph 86','Youth for Peace and Prosperous community photograph 86','YPP community','/images/gallery/1F6A1033.webp','PUBLISHED',86,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1034','YPP community photograph 87','Youth for Peace and Prosperous community photograph 87','YPP community','/images/gallery/1F6A1034.webp','PUBLISHED',87,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1035','YPP community photograph 88','Youth for Peace and Prosperous community photograph 88','YPP community','/images/gallery/1F6A1035.webp','PUBLISHED',88,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1036','YPP community photograph 89','Youth for Peace and Prosperous community photograph 89','YPP community','/images/gallery/1F6A1036.webp','PUBLISHED',89,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1037','YPP community photograph 90','Youth for Peace and Prosperous community photograph 90','YPP community','/images/gallery/1F6A1037.webp','PUBLISHED',90,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1038','YPP community photograph 91','Youth for Peace and Prosperous community photograph 91','YPP community','/images/gallery/1F6A1038.webp','PUBLISHED',91,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1039','YPP community photograph 92','Youth for Peace and Prosperous community photograph 92','YPP community','/images/gallery/1F6A1039.webp','PUBLISHED',92,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1040','YPP community photograph 93','Youth for Peace and Prosperous community photograph 93','YPP community','/images/gallery/1F6A1040.webp','PUBLISHED',93,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1041','YPP community photograph 94','Youth for Peace and Prosperous community photograph 94','YPP community','/images/gallery/1F6A1041.webp','PUBLISHED',94,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1042','YPP community photograph 95','Youth for Peace and Prosperous community photograph 95','YPP community','/images/gallery/1F6A1042.webp','PUBLISHED',95,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1043','YPP community photograph 96','Youth for Peace and Prosperous community photograph 96','YPP community','/images/gallery/1F6A1043.webp','PUBLISHED',96,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1044','YPP community photograph 97','Youth for Peace and Prosperous community photograph 97','YPP community','/images/gallery/1F6A1044.webp','PUBLISHED',97,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1045','YPP community photograph 98','Youth for Peace and Prosperous community photograph 98','YPP community','/images/gallery/1F6A1045.webp','PUBLISHED',98,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1046','YPP community photograph 99','Youth for Peace and Prosperous community photograph 99','YPP community','/images/gallery/1F6A1046.webp','PUBLISHED',99,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1047','YPP community photograph 100','Youth for Peace and Prosperous community photograph 100','YPP community','/images/gallery/1F6A1047.webp','PUBLISHED',100,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1048','YPP community photograph 101','Youth for Peace and Prosperous community photograph 101','YPP community','/images/gallery/1F6A1048.webp','PUBLISHED',101,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1049','YPP community photograph 102','Youth for Peace and Prosperous community photograph 102','YPP community','/images/gallery/1F6A1049.webp','PUBLISHED',102,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1051','YPP community photograph 103','Youth for Peace and Prosperous community photograph 103','YPP community','/images/gallery/1F6A1051.webp','PUBLISHED',103,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1054','YPP community photograph 104','Youth for Peace and Prosperous community photograph 104','YPP community','/images/gallery/1F6A1054.webp','PUBLISHED',104,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1056','YPP community photograph 105','Youth for Peace and Prosperous community photograph 105','YPP community','/images/gallery/1F6A1056.webp','PUBLISHED',105,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1057','YPP community photograph 106','Youth for Peace and Prosperous community photograph 106','YPP community','/images/gallery/1F6A1057.webp','PUBLISHED',106,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-1f6a1059','YPP community photograph 107','Youth for Peace and Prosperous community photograph 107','YPP community','/images/gallery/1F6A1059.webp','PUBLISHED',107,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9338','YPP community photograph 108','Youth for Peace and Prosperous community photograph 108','YPP community','/images/gallery/IMG_9338.webp','PUBLISHED',108,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9339','YPP community photograph 109','Youth for Peace and Prosperous community photograph 109','YPP community','/images/gallery/IMG_9339.webp','PUBLISHED',109,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9341','YPP community photograph 110','Youth for Peace and Prosperous community photograph 110','YPP community','/images/gallery/IMG_9341.webp','PUBLISHED',110,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9342','YPP community photograph 111','Youth for Peace and Prosperous community photograph 111','YPP community','/images/gallery/IMG_9342.webp','PUBLISHED',111,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9343','YPP community photograph 112','Youth for Peace and Prosperous community photograph 112','YPP community','/images/gallery/IMG_9343.webp','PUBLISHED',112,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9344','YPP community photograph 113','Youth for Peace and Prosperous community photograph 113','YPP community','/images/gallery/IMG_9344.webp','PUBLISHED',113,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9345','YPP community photograph 114','Youth for Peace and Prosperous community photograph 114','YPP community','/images/gallery/IMG_9345.webp','PUBLISHED',114,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9346','YPP community photograph 115','Youth for Peace and Prosperous community photograph 115','YPP community','/images/gallery/IMG_9346.webp','PUBLISHED',115,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9347','YPP community photograph 116','Youth for Peace and Prosperous community photograph 116','YPP community','/images/gallery/IMG_9347.webp','PUBLISHED',116,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9350','YPP community photograph 117','Youth for Peace and Prosperous community photograph 117','YPP community','/images/gallery/IMG_9350.webp','PUBLISHED',117,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9351','YPP community photograph 118','Youth for Peace and Prosperous community photograph 118','YPP community','/images/gallery/IMG_9351.webp','PUBLISHED',118,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9352','YPP community photograph 119','Youth for Peace and Prosperous community photograph 119','YPP community','/images/gallery/IMG_9352.webp','PUBLISHED',119,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9353','YPP community photograph 120','Youth for Peace and Prosperous community photograph 120','YPP community','/images/gallery/IMG_9353.webp','PUBLISHED',120,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9354','YPP community photograph 121','Youth for Peace and Prosperous community photograph 121','YPP community','/images/gallery/IMG_9354.webp','PUBLISHED',121,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9355','YPP community photograph 122','Youth for Peace and Prosperous community photograph 122','YPP community','/images/gallery/IMG_9355.webp','PUBLISHED',122,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9356','YPP community photograph 123','Youth for Peace and Prosperous community photograph 123','YPP community','/images/gallery/IMG_9356.webp','PUBLISHED',123,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9360','YPP community photograph 124','Youth for Peace and Prosperous community photograph 124','YPP community','/images/gallery/IMG_9360.webp','PUBLISHED',124,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9361','YPP community photograph 125','Youth for Peace and Prosperous community photograph 125','YPP community','/images/gallery/IMG_9361.webp','PUBLISHED',125,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9363','YPP community photograph 126','Youth for Peace and Prosperous community photograph 126','YPP community','/images/gallery/IMG_9363.webp','PUBLISHED',126,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9365','YPP community photograph 127','Youth for Peace and Prosperous community photograph 127','YPP community','/images/gallery/IMG_9365.webp','PUBLISHED',127,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9367','YPP community photograph 128','Youth for Peace and Prosperous community photograph 128','YPP community','/images/gallery/IMG_9367.webp','PUBLISHED',128,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9369','YPP community photograph 129','Youth for Peace and Prosperous community photograph 129','YPP community','/images/gallery/IMG_9369.webp','PUBLISHED',129,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9371','YPP community photograph 130','Youth for Peace and Prosperous community photograph 130','YPP community','/images/gallery/IMG_9371.webp','PUBLISHED',130,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9372','YPP community photograph 131','Youth for Peace and Prosperous community photograph 131','YPP community','/images/gallery/IMG_9372.webp','PUBLISHED',131,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9373','YPP community photograph 132','Youth for Peace and Prosperous community photograph 132','YPP community','/images/gallery/IMG_9373.webp','PUBLISHED',132,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9374','YPP community photograph 133','Youth for Peace and Prosperous community photograph 133','YPP community','/images/gallery/IMG_9374.webp','PUBLISHED',133,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9375','YPP community photograph 134','Youth for Peace and Prosperous community photograph 134','YPP community','/images/gallery/IMG_9375.webp','PUBLISHED',134,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9376','YPP community photograph 135','Youth for Peace and Prosperous community photograph 135','YPP community','/images/gallery/IMG_9376.webp','PUBLISHED',135,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9378','YPP community photograph 136','Youth for Peace and Prosperous community photograph 136','YPP community','/images/gallery/IMG_9378.webp','PUBLISHED',136,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9379','YPP community photograph 137','Youth for Peace and Prosperous community photograph 137','YPP community','/images/gallery/IMG_9379.webp','PUBLISHED',137,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9380','YPP community photograph 138','Youth for Peace and Prosperous community photograph 138','YPP community','/images/gallery/IMG_9380.webp','PUBLISHED',138,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9381','YPP community photograph 139','Youth for Peace and Prosperous community photograph 139','YPP community','/images/gallery/IMG_9381.webp','PUBLISHED',139,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9382','YPP community photograph 140','Youth for Peace and Prosperous community photograph 140','YPP community','/images/gallery/IMG_9382.webp','PUBLISHED',140,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9383','YPP community photograph 141','Youth for Peace and Prosperous community photograph 141','YPP community','/images/gallery/IMG_9383.webp','PUBLISHED',141,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9384','YPP community photograph 142','Youth for Peace and Prosperous community photograph 142','YPP community','/images/gallery/IMG_9384.webp','PUBLISHED',142,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9385','YPP community photograph 143','Youth for Peace and Prosperous community photograph 143','YPP community','/images/gallery/IMG_9385.webp','PUBLISHED',143,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9386','YPP community photograph 144','Youth for Peace and Prosperous community photograph 144','YPP community','/images/gallery/IMG_9386.webp','PUBLISHED',144,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9387','YPP community photograph 145','Youth for Peace and Prosperous community photograph 145','YPP community','/images/gallery/IMG_9387.webp','PUBLISHED',145,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9388','YPP community photograph 146','Youth for Peace and Prosperous community photograph 146','YPP community','/images/gallery/IMG_9388.webp','PUBLISHED',146,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9389','YPP community photograph 147','Youth for Peace and Prosperous community photograph 147','YPP community','/images/gallery/IMG_9389.webp','PUBLISHED',147,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9390','YPP community photograph 148','Youth for Peace and Prosperous community photograph 148','YPP community','/images/gallery/IMG_9390.webp','PUBLISHED',148,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9391','YPP community photograph 149','Youth for Peace and Prosperous community photograph 149','YPP community','/images/gallery/IMG_9391.webp','PUBLISHED',149,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9392','YPP community photograph 150','Youth for Peace and Prosperous community photograph 150','YPP community','/images/gallery/IMG_9392.webp','PUBLISHED',150,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9393','YPP community photograph 151','Youth for Peace and Prosperous community photograph 151','YPP community','/images/gallery/IMG_9393.webp','PUBLISHED',151,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9394','YPP community photograph 152','Youth for Peace and Prosperous community photograph 152','YPP community','/images/gallery/IMG_9394.webp','PUBLISHED',152,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9395','YPP community photograph 153','Youth for Peace and Prosperous community photograph 153','YPP community','/images/gallery/IMG_9395.webp','PUBLISHED',153,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9396','YPP community photograph 154','Youth for Peace and Prosperous community photograph 154','YPP community','/images/gallery/IMG_9396.webp','PUBLISHED',154,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9397','YPP community photograph 155','Youth for Peace and Prosperous community photograph 155','YPP community','/images/gallery/IMG_9397.webp','PUBLISHED',155,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9398','YPP community photograph 156','Youth for Peace and Prosperous community photograph 156','YPP community','/images/gallery/IMG_9398.webp','PUBLISHED',156,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9399','YPP community photograph 157','Youth for Peace and Prosperous community photograph 157','YPP community','/images/gallery/IMG_9399.webp','PUBLISHED',157,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9400','YPP community photograph 158','Youth for Peace and Prosperous community photograph 158','YPP community','/images/gallery/IMG_9400.webp','PUBLISHED',158,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9401','YPP community photograph 159','Youth for Peace and Prosperous community photograph 159','YPP community','/images/gallery/IMG_9401.webp','PUBLISHED',159,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9402','YPP community photograph 160','Youth for Peace and Prosperous community photograph 160','YPP community','/images/gallery/IMG_9402.webp','PUBLISHED',160,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9403','YPP community photograph 161','Youth for Peace and Prosperous community photograph 161','YPP community','/images/gallery/IMG_9403.webp','PUBLISHED',161,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9404','YPP community photograph 162','Youth for Peace and Prosperous community photograph 162','YPP community','/images/gallery/IMG_9404.webp','PUBLISHED',162,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9405','YPP community photograph 163','Youth for Peace and Prosperous community photograph 163','YPP community','/images/gallery/IMG_9405.webp','PUBLISHED',163,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9406','YPP community photograph 164','Youth for Peace and Prosperous community photograph 164','YPP community','/images/gallery/IMG_9406.webp','PUBLISHED',164,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9407','YPP community photograph 165','Youth for Peace and Prosperous community photograph 165','YPP community','/images/gallery/IMG_9407.webp','PUBLISHED',165,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9408','YPP community photograph 166','Youth for Peace and Prosperous community photograph 166','YPP community','/images/gallery/IMG_9408.webp','PUBLISHED',166,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9409','YPP community photograph 167','Youth for Peace and Prosperous community photograph 167','YPP community','/images/gallery/IMG_9409.webp','PUBLISHED',167,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3)),
('ypp-img_9410','YPP community photograph 168','Youth for Peace and Prosperous community photograph 168','YPP community','/images/gallery/IMG_9410.webp','PUBLISHED',168,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3));
