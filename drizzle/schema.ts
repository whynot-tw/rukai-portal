import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing the Manus OAuth flow. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const allowedEmails = mysqlTable("allowedEmails", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  role: mysqlEnum("role", ["client", "admin"]).default("client").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projectPages = mysqlTable("projectPages", {
  id: int("id").autoincrement().primaryKey(),
  pageNumber: varchar("pageNumber", { length: 32 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  chapter: varchar("chapter", { length: 255 }).notNull(),
  layoutStatus: varchar("layoutStatus", { length: 128 }).notNull(),
  assetStatus: varchar("assetStatus", { length: 128 }).notNull(),
  notes: text("notes"),
  pngUrl: text("pngUrl"),
  pngUpdatedAt: timestamp("pngUpdatedAt"),
  sortOrder: int("sortOrder").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projectUpdates = mysqlTable("projectUpdates", {
  id: int("id").autoincrement().primaryKey(),
  displayDate: varchar("displayDate", { length: 32 }).notNull(),
  scope: varchar("scope", { length: 255 }).notNull(),
  updateType: varchar("updateType", { length: 255 }).notNull(),
  summary: text("summary").notNull(),
  affectedPages: varchar("affectedPages", { length: 512 }).notNull(),
  status: varchar("status", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const weeklySnapshots = mysqlTable("weeklySnapshots", {
  id: int("id").autoincrement().primaryKey(),
  weekOf: varchar("weekOf", { length: 32 }).notNull(),
  completedChapters: text("completedChapters").notNull(),
  completedPages: text("completedPages").notNull(),
  latestPageOrder: text("latestPageOrder").notNull(),
  newConfirmations: text("newConfirmations").notNull(),
  resolvedItems: text("resolvedItems").notNull(),
  versionChanges: text("versionChanges").notNull(),
  nextStage: text("nextStage").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
