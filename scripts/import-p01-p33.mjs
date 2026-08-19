import { readFile } from "node:fs/promises";
import { unzipSync } from "fflate";
import { storagePut } from "../server/storage";
import { listPages, savePage, saveUpdate, saveWeeklySnapshot } from "../server/db";

const zipPath = process.argv[2];
const manifestPath = process.argv[3];
if (!zipPath || !manifestPath) {
  throw new Error("用法：pnpm tsx scripts/import-p01-p33.mjs /path/to/canonical.zip /path/to/manifest.json");
}

const [zipBytes, manifestText] = await Promise.all([
  readFile(zipPath),
  readFile(manifestPath, "utf8"),
]);
const manifest = JSON.parse(manifestText);
const entries = unzipSync(new Uint8Array(zipBytes));
const existingPages = await listPages();
const existingByPage = new Map(existingPages.map((page) => [page.pageNumber, page]));
const version = manifest.batchId;
const results = [];

for (const item of manifest.files) {
  const filename = `${item.pageNumber}.png`;
  const bytes = entries[filename];
  if (!bytes) throw new Error(`Manifest 頁面 ${filename} 不在 canonical ZIP。`);
  const existing = existingByPage.get(item.pageNumber);
  const upload = await storagePut(`rukai-proof/${item.pageNumber.toLowerCase()}/${filename}`, bytes, "image/png");
  const notes = [existing?.notes, item.note].filter(Boolean).join("；") || null;
  const savedId = await savePage({
    id: existing?.id,
    pageNumber: item.pageNumber,
    title: item.title,
    chapter: existing?.chapter ?? "待確認",
    layoutStatus: existing?.layoutStatus ?? "排版中",
    assetStatus: item.note ? "待確認" : "齊全",
    notes,
    pngUrl: upload.url,
    pngUpdatedAt: new Date(),
    assetVersion: version,
    reviewStatus: item.reviewStatus,
    sortOrder: Number(item.pageNumber.slice(1)),
  });
  results.push({
    pageNumber: item.pageNumber,
    action: existing ? "replace" : "add",
    id: savedId,
    pngUrl: upload.url,
    reviewStatus: item.reviewStatus,
    note: item.note ?? null,
  });
}

await saveWeeklySnapshot({
  weekOf: "2026-08-19",
  completedChapters: "P01–P33 最新版頁面圖檔已整理",
  completedPages: "P01–P33；P03–P05 頁碼最後排；P23／P32 缺原始圖檔待處理",
  latestPageOrder: "P33",
  newConfirmations: "P03–P05 頁碼最後排；P23／P32 缺原始圖檔",
  resolvedItems: "P01–P33 頁面 PNG 已更新至 Portal",
  versionChanges: version,
  nextStage: "依盤點表處理 P03–P05 頁碼最後排與 P23／P32 缺原始圖檔",
});

await saveUpdate({
  displayDate: "2026-08-19",
  scope: "P01–P33",
  updateType: "最新版 PNG 批次更新",
  summary: "P01–P33 最新版頁面圖檔已更新；P03–P05 頁碼最後排，P23／P32 尚有缺原始圖檔項目，均保留為待處理狀態。",
  affectedPages: "P01–P33",
  status: "待確認",
});

console.log(JSON.stringify({ batchId: version, pageCount: results.length, results }, null, 2));
