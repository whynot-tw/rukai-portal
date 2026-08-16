import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  allowedEmails,
  InsertUser,
  projectPages,
  projectUpdates,
  users,
  weeklySnapshots,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getAllowedEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(allowedEmails)
    .where(eq(allowedEmails.email, email.toLowerCase()))
    .limit(1);
  return result[0];
}

export async function listPages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectPages).orderBy(asc(projectPages.sortOrder));
}

export async function listUpdates(limit?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(projectUpdates).orderBy(desc(projectUpdates.displayDate));
  return limit ? query.limit(limit) : query;
}

export async function listWeeklySnapshots() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(weeklySnapshots).orderBy(desc(weeklySnapshots.weekOf));
}

export async function listAllowedEmails() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allowedEmails).orderBy(asc(allowedEmails.email));
}

export async function savePage(input: typeof projectPages.$inferInsert & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  const { id, ...values } = input;
  if (id) {
    await db.update(projectPages).set(values).where(eq(projectPages.id, id));
    return id;
  }
  const result = await db.insert(projectPages).values(values);
  return result[0].insertId;
}

export async function saveUpdate(input: typeof projectUpdates.$inferInsert & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  const { id, ...values } = input;
  if (id) {
    await db.update(projectUpdates).set(values).where(eq(projectUpdates.id, id));
    return id;
  }
  const result = await db.insert(projectUpdates).values(values);
  return result[0].insertId;
}

export async function saveWeeklySnapshot(input: typeof weeklySnapshots.$inferInsert & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  const { id, ...values } = input;
  if (id) {
    await db.update(weeklySnapshots).set(values).where(eq(weeklySnapshots.id, id));
    return id;
  }
  const result = await db.insert(weeklySnapshots).values(values);
  return result[0].insertId;
}

export async function saveAllowedEmail(input: {
  email: string;
  role: "admin" | "client";
  isActive: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  const email = input.email.toLowerCase();
  await db.insert(allowedEmails).values({ email, role: input.role, isActive: input.isActive }).onDuplicateKeyUpdate({
    set: { role: input.role, isActive: input.isActive },
  });
}

export async function setAllowedEmailActive(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("資料庫目前無法使用");
  await db.update(allowedEmails).set({ isActive }).where(eq(allowedEmails.id, id));
}
