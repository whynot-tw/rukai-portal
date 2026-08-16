import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  getAllowedEmail: vi.fn(),
  listAllowedEmails: vi.fn(),
  listPages: vi.fn(),
  listUpdates: vi.fn(),
  listWeeklySnapshots: vi.fn(),
  saveAllowedEmail: vi.fn(),
  savePage: vi.fn(),
  saveUpdate: vi.fn(),
  saveWeeklySnapshot: vi.fn(),
  setAllowedEmailActive: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

type Role = "admin" | "user";

function createContext(email: string, openId = "not-the-owner", role: Role = "user") {
  return {
    user: {
      id: 99,
      openId,
      email,
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  } as TrpcContext;
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

const validUpdate = {
  displayDate: "2026/08/03",
  scope: "第二章",
  updateType: "頁序確認",
  summary: "測試更新摘要",
  affectedPages: "P14–P20",
  status: "待確認",
};

const validWeeklySnapshot = {
  weekOf: "2026/08/03",
  completedChapters: "第二章",
  completedPages: "P14–P20",
  latestPageOrder: "0803 確認頁序",
  newConfirmations: "P20 圖片待確認",
  resolvedItems: "P14 頁碼修正",
  versionChanges: "V3",
  nextStage: "補足素材",
};

describe("Portal 受保護程序", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbMocks.getAllowedEmail.mockResolvedValue(null);
  });

  it("拒絕未列入白名單的使用者讀取 Portal", async () => {
    const caller = appRouter.createCaller(createContext("unknown@example.com"));
    await expect(caller.portal.dashboard()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("允許白名單閱讀者查看內容，但拒絕其讀取管理資料與寫入頁面", async () => {
    dbMocks.getAllowedEmail.mockResolvedValue({ isActive: true, role: "client" });
    dbMocks.listPages.mockResolvedValue([]);
    dbMocks.listUpdates.mockResolvedValue([]);
    dbMocks.listWeeklySnapshots.mockResolvedValue([]);
    const caller = appRouter.createCaller(createContext("client@example.com"));

    await expect(caller.portal.dashboard()).resolves.toMatchObject({ summary: { completed: 0 } });
    await expect(caller.portal.adminData()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.savePage(validPage)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.saveUpdate(validUpdate)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.saveWeeklySnapshot(validWeeklySnapshot)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.saveAllowedEmail({ email: "new@example.com", role: "client", isActive: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.portal.setAllowedEmailActive({ id: 1, isActive: false })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("允許白名單管理員寫入所有管理資料", async () => {
    dbMocks.getAllowedEmail.mockResolvedValue({ isActive: true, role: "admin" });
    dbMocks.savePage.mockResolvedValue(14);
    dbMocks.saveUpdate.mockResolvedValue(15);
    dbMocks.saveWeeklySnapshot.mockResolvedValue(16);
    const caller = appRouter.createCaller(createContext("admin@example.com"));

    await expect(caller.portal.savePage(validPage)).resolves.toEqual({ id: 14 });
    await expect(caller.portal.saveUpdate(validUpdate)).resolves.toEqual({ id: 15 });
    await expect(caller.portal.saveWeeklySnapshot(validWeeklySnapshot)).resolves.toEqual({ id: 16 });
    await expect(caller.portal.saveAllowedEmail({ email: "new@example.com", role: "client", isActive: true })).resolves.toEqual({ success: true });
    await expect(caller.portal.setAllowedEmailActive({ id: 1, isActive: false })).resolves.toEqual({ success: true });
    expect(dbMocks.savePage).toHaveBeenCalledWith(expect.objectContaining({ pageNumber: "P14", sortOrder: 14 }));
    expect(dbMocks.saveUpdate).toHaveBeenCalledWith(expect.objectContaining({ updateType: "頁序確認" }));
    expect(dbMocks.saveWeeklySnapshot).toHaveBeenCalledWith(expect.objectContaining({ weekOf: "2026/08/03" }));
    expect(dbMocks.saveAllowedEmail).toHaveBeenCalledWith({ email: "new@example.com", role: "client", isActive: true });
    expect(dbMocks.setAllowedEmailActive).toHaveBeenCalledWith(1, false);
  });

  it("向已授權閱讀者提供完整更新歷史，而不是首頁摘要的八筆限制", async () => {
    dbMocks.getAllowedEmail.mockResolvedValue({ isActive: true, role: "client" });
    dbMocks.listUpdates.mockResolvedValue([
      { id: 7, displayDate: "2026/07/31" },
      { id: 9, displayDate: "2026/08/03" },
      { id: 8, displayDate: "2026/08/01" },
    ]);
    const caller = appRouter.createCaller(createContext("client@example.com"));

    await expect(caller.portal.updates()).resolves.toEqual([
      { id: 9, displayDate: "2026/08/03" },
      { id: 8, displayDate: "2026/08/01" },
      { id: 7, displayDate: "2026/07/31" },
    ]);
    expect(dbMocks.listUpdates).toHaveBeenCalledWith();
  });
});
