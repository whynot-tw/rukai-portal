CREATE TABLE `allowedEmails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` enum('client','admin') NOT NULL DEFAULT 'client',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allowedEmails_id` PRIMARY KEY(`id`),
	CONSTRAINT `allowedEmails_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `projectPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageNumber` varchar(32) NOT NULL,
	`title` varchar(512) NOT NULL,
	`chapter` varchar(255) NOT NULL,
	`layoutStatus` varchar(128) NOT NULL,
	`assetStatus` varchar(128) NOT NULL,
	`notes` text,
	`pngUrl` text,
	`pngUpdatedAt` timestamp,
	`sortOrder` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectPages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`displayDate` varchar(32) NOT NULL,
	`scope` varchar(255) NOT NULL,
	`updateType` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`affectedPages` varchar(512) NOT NULL,
	`status` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklySnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`weekOf` varchar(32) NOT NULL,
	`completedChapters` text NOT NULL,
	`completedPages` text NOT NULL,
	`latestPageOrder` text NOT NULL,
	`newConfirmations` text NOT NULL,
	`resolvedItems` text NOT NULL,
	`versionChanges` text NOT NULL,
	`nextStage` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `weeklySnapshots_id` PRIMARY KEY(`id`)
);
