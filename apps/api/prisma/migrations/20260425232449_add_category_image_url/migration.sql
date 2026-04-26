-- AlterTable
ALTER TABLE `categories` ADD COLUMN `imageUrl` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `commissions` ADD COLUMN `referenceNumber` VARCHAR(100) NULL;

-- AlterTable
ALTER TABLE `order_items` MODIFY `orderItemStatus` ENUM('Pending', 'InTransit', 'Completed', 'Cancelled', 'Disputed', 'RefundRequested', 'Refunded') NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `orders` MODIFY `orderStatus` ENUM('Pending', 'InTransit', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `products` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `sellers` MODIFY `shopStatus` ENUM('Pending', 'Active', 'Inactive', 'Banned') NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `user_addresses` ADD COLUMN `phoneNumber` VARCHAR(20) NULL,
    ADD COLUMN `recipientName` VARCHAR(255) NULL;
