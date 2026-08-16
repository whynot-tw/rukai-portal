import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { ADMIN_SESSION_COOKIE, PORTAL_SESSION_COOKIE } from "./passwordAuth";

const dbMocks = vi.hoisted(() => ({
  listPages: vi.fn(),
  listUpdates: vi.fn(),
  listWeeklySnapshots: vi.fn(),
  savePage: vi.fn(),
  saveUpdate: vi.fn(),
  saveWeeklySnapshot: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

type CookieCall = { name: string; value?: string; options: Record<string, unknown> };

function createContext(portalSession?: string, adminSession?: string) {
  const cookies: CookieCall[] = [];
  const cookieHeader = [
    portalSession ? `${PORTAL_SESSION_COOKIE}=${encodeURIComponent(portalSession)}` : null,
    adminSession ? `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(adminSession)}` : null,
  ].filter(Boolean).join("; ");
  const ctx = {
    user: null,
    req: {
      protocol: "https",
      headers: cookieHeader ? { cookie: cookieHeader } : {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
      clearCookie: (name: string, options: Record<string, unknown>) => cookies.push({ name, options }),
    } as TrpcContext["res"],
  };
  return { ctx, cookies };
}

const validPage = {
  pageNumber: "P14",
  title: "測試頁面",
  chapter: "第一章",
  layoutStatus: "排版中",
  assetStatus: "待製作",
  notes: null,
  pngUrl: null,
  sortOrder: 14,
};

describe("Portal 客戶與管理員權限", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("接受設定的專案密碼並建立 httpOnly session cookie", async () => {
    const configuredPassword = process.env.PORTAL_ACCESS_PASSWORD ?? "";
    expect(configuredPassword.length).toBeGreaterThan(0);

    const { ctx, cookies } = createContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.portal.passwordLogin({ password: configuredPassword })).resolves.toEqual({ success: true });
    expect(cookies[0]?.name).toBe(PORTAL_SESSION_COOKIE);
    expect(cookies[0]?.value).toBeTruthy();
    expect(cookies[0]?.options).toMatchObject({ httpOnly: true, secure: true });
  });

  it("拒絕錯誤密碼、沒有 session 的閱讀請求與沒有管理員 session 的維護請求", async () => {
    const { ctx } = createContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.portal.passwordLogin({ password: "incorrect-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.portal.dashboard()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.portal.savePage(validPage)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("允許一般專案 session 讀取客戶資料，但拒絕資料維護", async () => {
    const configuredPassword = process.env.PORTAL_ACCESS_PASSWORD ?? "";
    const login = createContext();
    await appRouter.createCaller(login.ctx).portal.passwordLogin({ password: configuredPassword });
    const session = login.cookies[0]?.value;
    expect(session).toBeTruthy();

    dbMocks.listPages.mockResolvedValue([]);
    dbMocks.listUpdates.mockResolvedValue([]);
    dbMocks.listWeeklySnapshots.mockResolvedValue([]);
    dbMocks.savePage.mockResolvedValue(14);
    const caller = appRouter.createCaller(createContext(session).ctx);
    await expect(caller.portal.dashboard()).resolves.toMatchObject({ summary: { completed: 0 } });
    await expect(caller.portal.savePage(validPage)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("接受管理員密碼並允許管理員 session 維護 Portal 資料", async () => {
    const configuredPassword = process.env.PORTAL_ADMIN_PASSWORD ?? "";
    expect(configuredPassword.length).toBeGreaterThan(0);
    const login = createContext();
    await expect(appRouter.createCaller(login.ctx).portal.adminPasswordLogin({ password: configuredPassword })).resolves.toEqual({ success: true });
    const adminSession = login.cookies[0]?.value;
    expect(login.cookies[0]?.name).toBe(ADMIN_SESSION_COOKIE);
    expect(adminSession).toBeTruthy();

    dbMocks.listPages.mockResolvedValue([]);
    dbMocks.listUpdates.mockResolvedValue([]);
    dbMocks.listWeeklySnapshots.mockResolvedValue([]);
    dbMocks.savePage.mockResolvedValue(14);
    const caller = appRouter.createCaller(createContext(undefined, adminSession).ctx);
    await expect(caller.portal.adminData()).resolves.toMatchObject({ pages: [] });
    await expect(caller.portal.savePage(validPage)).resolves.toEqual({ id: 14 });
  });

  it("可清除專案 session 以登出", async () => {
    const { ctx, cookies } = createContext("temporary-session", "temporary-admin-session");
    await expect(appRouter.createCaller(ctx).portal.passwordLogout()).resolves.toEqual({ success: true });
    expect(cookies[0]?.name).toBe(PORTAL_SESSION_COOKIE);
    expect(cookies[0]?.options).toMatchObject({ maxAge: -1 });
    expect(cookies[1]?.name).toBe(ADMIN_SESSION_COOKIE);
  });
});
