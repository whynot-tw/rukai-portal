import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import { listPages, listUpdates, listWeeklySnapshots, savePage, saveUpdate, saveWeeklySnapshot } from "./db";
import { portalProject, versionStages } from "./portalContent";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_MS,
  createAdminSession,
  createPortalSession,
  hasValidAdminSession,
  hasValidPortalSession,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE_MS,
  readCookie,
  verifyAdminPassword,
  verifyPortalPassword,
} from "./passwordAuth";
import { isAttentionItem, sortUpdatesNewestFirst, summarizePages } from "../shared/portal";

type RequestWithCookie = { headers: { cookie?: string } };

async function hasPortalAccess(req: RequestWithCookie) {
  return hasValidPortalSession(readCookie(req.headers.cookie, PORTAL_SESSION_COOKIE));
}

async function hasAdminAccess(req: RequestWithCookie) {
  return hasValidAdminSession(readCookie(req.headers.cookie, ADMIN_SESSION_COOKIE));
}

async function requirePortalAccess(req: RequestWithCookie) {
  if (!(await hasPortalAccess(req))) throw new TRPCError({ code: "UNAUTHORIZED", message: "請先輸入專案存取密碼。" });
}

async function requireAdminAccess(req: RequestWithCookie) {
  if (!(await hasAdminAccess(req))) throw new TRPCError({ code: "FORBIDDEN", message: "此功能僅限管理員使用。" });
}

function toClientPage(page: Awaited<ReturnType<typeof listPages>>[number]) {
  return {
    id: page.id,
    pageNumber: page.pageNumber,
    title: page.title,
    layoutStatus: page.layoutStatus,
    pngUrl: page.pngUrl,
    sortOrder: page.sortOrder,
  };
}

function toClientUpdate(update: Awaited<ReturnType<typeof listUpdates>>[number]) {
  return { id: update.id, displayDate: update.displayDate, summary: update.summary, status: update.status };
}

const pageInput = z.object({
  id: z.number().int().positive().optional(),
  pageNumber: z.string().trim().min(1).max(32),
  title: z.string().trim().min(1).max(512),
  chapter: z.string().trim().min(1).max(255),
  layoutStatus: z.string().trim().min(1).max(128),
  assetStatus: z.string().trim().min(1).max(128),
  notes: z.string().nullable(),
  pngUrl: z.string().trim().max(2048).refine((value) => value.startsWith("/") || /^https?:\/\//.test(value), "請輸入有效圖片網址").nullable(),
  sortOrder: z.number().int().min(0),
});

const updateInput = z.object({
  id: z.number().int().positive().optional(), displayDate: z.string().trim().min(1).max(32), scope: z.string().trim().min(1).max(255), updateType: z.string().trim().min(1).max(255), summary: z.string().trim().min(1), affectedPages: z.string().trim().min(1).max(512), status: z.string().trim().min(1).max(128),
});

const weeklyInput = z.object({
  id: z.number().int().positive().optional(), weekOf: z.string().trim().min(1).max(32), completedChapters: z.string(), completedPages: z.string(), latestPageOrder: z.string(), newConfirmations: z.string(), resolvedItems: z.string(), versionChanges: z.string(), nextStage: z.string(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  portal: router({
    passwordStatus: publicProcedure.query(async ({ ctx }) => ({ authenticated: await hasPortalAccess(ctx.req) })),
    adminStatus: publicProcedure.query(async ({ ctx }) => ({ authenticated: await hasAdminAccess(ctx.req) })),
    passwordLogin: publicProcedure.input(z.object({ password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
      if (!verifyPortalPassword(input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "密碼不正確，請再試一次。" });
      ctx.res.cookie(PORTAL_SESSION_COOKIE, await createPortalSession(), { ...getSessionCookieOptions(ctx.req), maxAge: PORTAL_SESSION_MAX_AGE_MS });
      return { success: true };
    }),
    adminPasswordLogin: publicProcedure.input(z.object({ password: z.string().min(1).max(256) })).mutation(async ({ ctx, input }) => {
      if (!verifyAdminPassword(input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "管理員密碼不正確，請再試一次。" });
      ctx.res.cookie(ADMIN_SESSION_COOKIE, await createAdminSession(), { ...getSessionCookieOptions(ctx.req), maxAge: ADMIN_SESSION_MAX_AGE_MS });
      return { success: true };
    }),
    passwordLogout: publicProcedure.mutation(({ ctx }) => {
      const options = { ...getSessionCookieOptions(ctx.req), maxAge: -1 };
      ctx.res.clearCookie(PORTAL_SESSION_COOKIE, options);
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, options);
      return { success: true };
    }),
    adminPasswordLogout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true };
    }),
    dashboard: publicProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.req);
      const [allPages, updateRows, snapshots] = await Promise.all([listPages(), listUpdates(5), listWeeklySnapshots()]);
      const updates = sortUpdatesNewestFirst(updateRows).slice(0, 5);
      return {
        project: { title: portalProject.title, currentBaseline: portalProject.currentBaseline, baselineUpdatedAt: portalProject.baselineUpdatedAt },
        pages: allPages.map(toClientPage),
        attentionPages: allPages.filter(isAttentionItem).map(toClientPage),
        recentUpdates: updates.map(toClientUpdate),
        latestUpdate: updates[0] ? toClientUpdate(updates[0]) : null,
        weeklyProgress: snapshots[0] ? { completedChapters: snapshots[0].completedChapters, completedPages: snapshots[0].completedPages, nextStage: snapshots[0].nextStage } : null,
        summary: summarizePages(allPages),
      };
    }),
    needsAttention: publicProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.req);
      return (await listPages()).filter(isAttentionItem).map(toClientPage);
    }),
    updates: publicProcedure.query(async ({ ctx }) => {
      await requireAdminAccess(ctx.req);
      return sortUpdatesNewestFirst(await listUpdates());
    }),
    adminData: publicProcedure.query(async ({ ctx }) => {
      await requireAdminAccess(ctx.req);
      const [pages, updates, snapshots] = await Promise.all([listPages(), listUpdates(), listWeeklySnapshots()]);
      return { pages, updates: sortUpdatesNewestFirst(updates), snapshots, versions: versionStages };
    }),
    savePage: publicProcedure.input(pageInput).mutation(async ({ ctx, input }) => {
      await requireAdminAccess(ctx.req);
      return { id: await savePage({ ...input, pngUpdatedAt: input.pngUrl ? new Date() : null }) };
    }),
    saveUpdate: publicProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
      await requireAdminAccess(ctx.req);
      return { id: await saveUpdate(input) };
    }),
    saveWeeklySnapshot: publicProcedure.input(weeklyInput).mutation(async ({ ctx, input }) => {
      await requireAdminAccess(ctx.req);
      return { id: await saveWeeklySnapshot(input) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
