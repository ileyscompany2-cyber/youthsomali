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
