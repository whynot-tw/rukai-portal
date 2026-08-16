import { execFileSync } from "node:child_process";
import mysql from "mysql2/promise";

const spreadsheetId = process.env.RUKAI_SHEET_ID || "1549qtDu4Yk0b0-2gW4dkfhXCgdq9iKy98hncp9V9INo";
const apply = process.argv.includes("--apply");

function getSheetValues(sheetName) {
  const params = JSON.stringify({ spreadsheetId, range: `'${sheetName}'!A1:Z250`, majorDimension: "ROWS" });
  const output = execFileSync("gws", ["sheets", "spreadsheets", "values", "get", "--params", params], { encoding: "utf8" });
  return JSON.parse(output).values ?? [];
}

function asRecord(headers, row) {
  return Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim?.() ?? ""]));
}

function rowsAfterHeader(values, firstHeader) {
  const headerIndex = values.findIndex((row) => row.includes(firstHeader));
  if (headerIndex < 0) throw new Error(`找不到「${firstHeader}」欄位，請確認工作表結構。`);
  const headers = values[headerIndex];
  return values.slice(headerIndex + 1).filter((row) => row.some((cell) => String(cell).trim())).map((row) => asRecord(headers, row));
}

function parsePages(values) {
  return rowsAfterHeader(values, "章號")
    .filter((row) => /^P\d+$/i.test(row["最新內頁頁碼"] || ""))
    .map((row, index) => ({
      pageNumber: row["最新內頁頁碼"],
      chapter: row["章號"] || "未分類",
      title: row["頁面內容"] || "未命名頁面",
      layoutStatus: row["排版狀況"] || "待確認",
      assetStatus: row["資產狀況"] || "待確認",
      notes: [row["待確認／缺件"], row["備註"]].filter(Boolean).join("\n") || null,
      sortOrder: index + 1,
    }));
}

function parseUpdates(values) {
  return rowsAfterHeader(values, "更新日期")
    .filter((row) => row["更新日期"] && row["變更摘要"])
    .map((row) => ({
      displayDate: row["更新日期"],
      scope: row["範圍"] || "未註明",
      updateType: row["更新類型"] || "專案更新",
      summary: row["變更摘要"],
      affectedPages: row["影響頁面"] || "未註明",
      status: row["狀態"] || "待確認",
    }));
}

function updateKey(update) {
  return [update.displayDate, update.scope, update.updateType].join("\u0001");
}

const pages = parsePages(getSheetValues("最新頁序對照"));
const updates = parseUpdates(getSheetValues("更新紀錄"));
console.log(`已唯讀取得 ${pages.length} 筆頁面資料與 ${updates.length} 筆更新紀錄。`);

if (!apply) {
  console.log("目前為預覽模式，未寫入 Portal 資料庫。確認後請執行：pnpm sync:google --apply");
  process.exit(0);
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL 不存在，無法執行同步。請於受管理的專案環境執行。");
const db = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await db.beginTransaction();
  const [existingPages] = await db.query("SELECT id, pageNumber FROM projectPages");
  const existingPageByNumber = new Map(existingPages.map((page) => [page.pageNumber, page.id]));
  let insertedPages = 0;
  let updatedPages = 0;
  for (const page of pages) {
    const existingId = existingPageByNumber.get(page.pageNumber);
    if (existingId) {
      await db.execute("UPDATE projectPages SET title=?, chapter=?, layoutStatus=?, assetStatus=?, notes=?, sortOrder=? WHERE id=?", [page.title, page.chapter, page.layoutStatus, page.assetStatus, page.notes, page.sortOrder, existingId]);
      updatedPages += 1;
    } else {
      await db.execute("INSERT INTO projectPages (pageNumber, title, chapter, layoutStatus, assetStatus, notes, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?)", [page.pageNumber, page.title, page.chapter, page.layoutStatus, page.assetStatus, page.notes, page.sortOrder]);
      insertedPages += 1;
    }
  }

  const [existingUpdates] = await db.query("SELECT id, displayDate, scope, updateType FROM projectUpdates");
  const existingUpdateByKey = new Map(existingUpdates.map((update) => [updateKey(update), update.id]));
  let insertedUpdates = 0;
  let updatedUpdates = 0;
  for (const update of updates) {
    const existingId = existingUpdateByKey.get(updateKey(update));
    if (existingId) {
      await db.execute("UPDATE projectUpdates SET displayDate=?, scope=?, updateType=?, summary=?, affectedPages=?, status=? WHERE id=?", [update.displayDate, update.scope, update.updateType, update.summary, update.affectedPages, update.status, existingId]);
      updatedUpdates += 1;
    } else {
      await db.execute("INSERT INTO projectUpdates (displayDate, scope, updateType, summary, affectedPages, status) VALUES (?, ?, ?, ?, ?, ?)", [update.displayDate, update.scope, update.updateType, update.summary, update.affectedPages, update.status]);
      insertedUpdates += 1;
    }
  }
  await db.commit();
  console.log(`同步完成：更新 ${updatedPages} 筆頁面、新增 ${insertedPages} 筆頁面、更新 ${updatedUpdates} 筆既有紀錄、新增 ${insertedUpdates} 筆更新紀錄。PNG 對應保持原值，不會依檔名自動覆寫。`);
} catch (error) {
  await db.rollback();
  throw error;
} finally {
  await db.end();
}

process.exit(0);
