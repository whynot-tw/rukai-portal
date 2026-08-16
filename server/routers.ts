import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { COOKIE_NAME } from "@shared/const";
import {
  listPages,
  listUpdates,
  listWeeklySnapshots,
  savePage,
  saveUpdate,
  saveWeeklySnapshot,
} from "./db";
import { portalProject, versionStages } from "./portalContent";
import {
  createPortalSession,
  hasValidPortalSession,
  PORTAL_SESSION_COOKIE,
  PORTAL_SESSION_MAX_AGE_MS,
  readCookie,
  verifyPortalPassword,
} from "./passwordAuth";
import { sortUpdatesNewestFirst, summarizePages } from "../shared/portal";

async function hasPortalAccess(req: { headers: { cookie?: string } }) {
  const token = readCookie(req.headers.cookie, PORTAL_SESSION_COOKIE);
  return hasValidPortalSession(token);
}

async function requirePortalAccess(req: { headers: { cookie?: string } }) {
  if (!(await hasPortalAccess(req))) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "請先輸入專案存取密碼。" });
  }
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
  // 保留模板既有 auth 端點以支援未使用的框架元件；Portal 存取不依賴此帳號資訊。
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  portal: router({
    passwordStatus: publicProcedure.query(async ({ ctx }) => ({ authenticated: await hasPortalAccess(ctx.req) })),
    passwordLogin: publicProcedure
      .input(z.object({ password: z.string().min(1).max(256) }))
      .mutation(async ({ ctx, input }) => {
        if (!verifyPortalPassword(input.password)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "密碼不正確，請再試一次。" });
        }
        const token = await createPortalSession();
        ctx.res.cookie(PORTAL_SESSION_COOKIE, token, {
          ...getSessionCookieOptions(ctx.req),
          maxAge: PORTAL_SESSION_MAX_AGE_MS,
        });
        return { success: true };
      }),
    passwordLogout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(PORTAL_SESSION_COOKIE, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true };
    }),
    dashboard: publicProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.req);
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
    updates: publicProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.req);
      return sortUpdatesNewestFirst(await listUpdates());
    }),
    needsAttention: publicProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.req);
      return listPages();
    }),
    adminData: publicProcedure.query(async ({ ctx }) => {
      await requirePortalAccess(ctx.req);
      const [pages, updates, snapshots] = await Promise.all([listPages(), listUpdates(), listWeeklySnapshots()]);
      return { pages, updates: sortUpdatesNewestFirst(updates), snapshots };
    }),
    savePage: publicProcedure.input(pageInput).mutation(async ({ ctx, input }) => {
      await requirePortalAccess(ctx.req);
      return { id: await savePage({ ...input, pngUpdatedAt: input.pngUrl ? new Date() : null }) };
    }),
    saveUpdate: publicProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
      await requirePortalAccess(ctx.req);
      return { id: await saveUpdate(input) };
    }),
    saveWeeklySnapshot: publicProcedure.input(weeklyInput).mutation(async ({ ctx, input }) => {
      await requirePortalAccess(ctx.req);
      return { id: await saveWeeklySnapshot(input) };
    }),
  }),
});

export type AppRouter = typeof appRouter;
