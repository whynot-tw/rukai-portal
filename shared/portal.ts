export const PAGE_STATUS_OPTIONS = [
  "目前採用",
  "待確認",
  "未開始",
  "排版中",
  "已排待重編頁碼",
  "尚未排版",
  "頁序尚未鎖定",
] as const;

export const LAYOUT_STATUS_OPTIONS = ["齊全", "缺電子檔", "待製作"] as const;
export const ASSET_STATUS_OPTIONS = LAYOUT_STATUS_OPTIONS;

export function formatPublishedDate(timestamp: number) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date).replace(/\//g, "/");
}

export const ATTENTION_STATUSES = [
  "待確認",
  "缺電子檔",
  "待製作",
  "尚未排版",
  "頁序尚未鎖定",
] as const;

export type WorkPage = {
  id: number;
  sortOrder: number;
  layoutStatus: string;
  assetStatus: string;
};

export type PortalAccess = { allowed: boolean; role: "admin" | "client" | null };

export function resolveWhitelistAccess({
  isOwner,
  record,
}: {
  isOwner: boolean;
  record?: { isActive: boolean; role: "admin" | "client" } | null;
}): PortalAccess {
  if (isOwner) return { allowed: true, role: "admin" };
  if (!record?.isActive) return { allowed: false, role: null };
  return { allowed: true, role: record.role };
}

export function sortByWorkOrder<T extends { sortOrder: number }>(items: T[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function sortUpdatesNewestFirst<T extends { displayDate: string }>(items: T[]) {
  return [...items].sort((a, b) => b.displayDate.localeCompare(a.displayDate));
}

export function isAttentionItem(page: Pick<WorkPage, "layoutStatus" | "assetStatus">) {
  return ATTENTION_STATUSES.includes(
    page.layoutStatus as (typeof ATTENTION_STATUSES)[number]
  ) || ATTENTION_STATUSES.includes(page.assetStatus as (typeof ATTENTION_STATUSES)[number]);
}

export function summarizePages(pages: WorkPage[]) {
  return pages.reduce(
    (summary, page) => {
      if (page.layoutStatus === "目前採用") summary.completed += 1;
      if (page.layoutStatus === "排版中" || page.layoutStatus === "已排待重編頁碼") {
        summary.inProgress += 1;
      }
      if (isAttentionItem(page)) summary.needsAttention += 1;
      return summary;
    },
    { completed: 0, inProgress: 0, needsAttention: 0 }
  );
}
