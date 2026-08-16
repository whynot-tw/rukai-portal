import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ENV } from "./_core/env";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllowedEmail,
  listAllowedEmails,
  listPages,
  listUpdates,
  listWeeklySnapshots,
  saveAllowedEmail,
  savePage,
  saveUpdate,
  saveWeeklySnapshot,
  setAllowedEmailActive,
} from "./db";
import { portalProject, versionStages } from "./portalContent";
import { resolveWhitelistAccess, sortUpdatesNewestFirst, summarizePages } from "../shared/portal";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";

async function resolveAccess(user: { openId: string; email: string | null }) {
  const allowed = user.email ? await getAllowedEmail(user.email) : null;
  return resolveWhitelistAccess({
    isOwner: user.openId === ENV.ownerOpenId,
    record: allowed ? { isActive: allowed.isActive, role: allowed.role } : null,
  });
}

async function requirePortalAccess(user: { openId: string; email: string | null }) {
  const access = await resolveAccess(user);
  if (!access.allowed) throw new TRPCError({ code: "FORBIDDEN", message: "此帳號尚未獲得 Portal 存取權限。" });
  return access;
}

async function requireAdminAccess(user: { openId: string; email: string | null }) {
  const access = await requirePortalAccess(user);
  if (access.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "僅限管理員操作。" });
}

const pageInput = z.object({
  id: z.number().int().positive().optional(),
  pageNumber: z.string().trim().min(1).max(32),
  title: z.string().trim().min(1).max(512),
  chapter: z.string().trim().min(1).max(255),
  layoutStatus: z.string().trim().min(1).max(128),
  assetStatus: z.string().trim().min(1).max(128),
  notes: z.string().nullable(),
  pngUrl: z.string().url().nullable(),
  sortOrder: z.number().int().min(0),
});

const updateInput = z.object({
  id: z.number().int().positive().optional(),
  displayDate: z.string().trim().min(1).max(32),
  scope: z.string().trim().min(1).max(255),
  updateType: z.string().trim().min(1).max(255),
  summary: z.string().trim().min(1),
  affectedPages: z.string().trim().min(1).max(512),
  status: z.string().trim().min(1).max(128),
});

const weeklyInput = z.object({
  id: z.number().int().positive().optional(),
  weekOf: z.string().trim().min(1).max(32),
  completedChapters: z.string(),
  completedPages: z.string(),
  latestPageOrder: z.string(),
  newConfirmations: z.string(),
  resolvedItems: z.string(),
  versionChanges: z.string(),
  nextStage: z.string(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  portal: router({
    access: protectedProcedure.query(async ({ ctx }) => resolveAccess(ctx.user)),
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.user);
      const [pages, updateRows, snapshots] = await Promise.all([listPages(), listUpdates(8), listWeeklySnapshots()]);
      const updates = sortUpdatesNewestFirst(updateRows);
      return {
        project: portalProject,
        versions: versionStages,
        pages,
        updates,
        latestUpdate: updates[0] ?? null,
        weeklySnapshot: snapshots[0] ?? null,
        summary: summarizePages(pages),
      };
    }),
    updates: protectedProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.user);
      return sortUpdatesNewestFirst(await listUpdates());
    }),
    needsAttention: protectedProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.user);
      return listPages();
    }),
    adminData: protectedProcedure.query(async ({ ctx }) => {
      await requireAdminAccess(ctx.user);
      const [pages, updates, snapshots, emails] = await Promise.all([
        listPages(),
        listUpdates(),
        listWeeklySnapshots(),
        listAllowedEmails(),
      ]);
      return { pages, updates, snapshots, emails };
    }),
    savePage: protectedProcedure.input(pageInput).mutation(async ({ ctx, input }) => {
      await requireAdminAccess(ctx.user);
      return { id: await savePage({ ...input, pngUpdatedAt: input.pngUrl ? new Date() : null }) };
    }),
    saveUpdate: protectedProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
      await requireAdminAccess(ctx.user);
      return { id: await saveUpdate(input) };
    }),
    saveWeeklySnapshot: protectedProcedure.input(weeklyInput).mutation(async ({ ctx, input }) => {
      await requireAdminAccess(ctx.user);
      return { id: await saveWeeklySnapshot(input) };
    }),
    saveAllowedEmail: protectedProcedure
      .input(z.object({ email: z.string().trim().email(), role: z.enum(["client", "admin"]), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await requireAdminAccess(ctx.user);
        await saveAllowedEmail(input);
        return { success: true };
      }),
    setAllowedEmailActive: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), isActive: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await requireAdminAccess(ctx.user);
        await setAllowedEmailActive(input.id, input.isActive);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
