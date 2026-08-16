import { describe, expect, it } from "vitest";
import { isAttentionItem, resolveWhitelistAccess, sortByWorkOrder, sortUpdatesNewestFirst, summarizePages } from "../shared/portal";

describe("Portal 工作紀錄規則", () => {
  it("依工作紀錄 sortOrder 排列，而非依頁碼文字或檔名排列", () => {
    const pages = sortByWorkOrder([
      { id: 3, sortOrder: 30 },
      { id: 1, sortOrder: 10 },
      { id: 2, sortOrder: 20 },
    ]);
    expect(pages.map((page) => page.id)).toEqual([1, 2, 3]);
  });

  it("以原始狀態文字計算進度與待確認項目", () => {
    const summary = summarizePages([
      { id: 1, sortOrder: 10, layoutStatus: "目前採用", assetStatus: "齊全" },
      { id: 2, sortOrder: 20, layoutStatus: "排版中", assetStatus: "待製作" },
      { id: 3, sortOrder: 30, layoutStatus: "待確認", assetStatus: "齊全" },
    ]);
    expect(summary).toEqual({ completed: 1, inProgress: 1, needsAttention: 2 });
    expect(isAttentionItem({ layoutStatus: "未開始", assetStatus: "缺電子檔" })).toBe(true);
  });

  it("僅允許專案擁有者與啟用的 Email 白名單帳號存取", () => {
    expect(resolveWhitelistAccess({ isOwner: true, record: null })).toEqual({ allowed: true, role: "admin" });
    expect(resolveWhitelistAccess({ isOwner: false, record: { isActive: true, role: "client" } })).toEqual({ allowed: true, role: "client" });
    expect(resolveWhitelistAccess({ isOwner: false, record: { isActive: true, role: "admin" } })).toEqual({ allowed: true, role: "admin" });
    expect(resolveWhitelistAccess({ isOwner: false, record: { isActive: false, role: "client" } })).toEqual({ allowed: false, role: null });
    expect(resolveWhitelistAccess({ isOwner: false, record: null })).toEqual({ allowed: false, role: null });
  });

  it("將完整更新歷史依日期由新到舊排列", () => {
    const updates = sortUpdatesNewestFirst([
      { id: 1, displayDate: "2026/07/31" },
      { id: 2, displayDate: "2026/08/03" },
      { id: 3, displayDate: "2026/08/01" },
    ]);
    expect(updates.map((update) => update.id)).toEqual([2, 3, 1]);
  });
});
