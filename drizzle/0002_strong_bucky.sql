ALTER TABLE `projectPages` ADD `assetVersion` varchar(64);--> statement-breakpoint
ALTER TABLE `projectPages` ADD `reviewStatus` varchar(128) DEFAULT '待校稿' NOT NULL;