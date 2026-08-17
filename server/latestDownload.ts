import { zipSync } from "fflate";
import { listPages } from "./db";
import { storageGetSignedUrl } from "./storage";
export const LATEST_DOWNLOAD_FILENAME = "rukai-book-latest.zip";

export function normalizePageFileName(pageNumber: string) {
  const safePageNumber = pageNumber.replace(/[^A-Za-z0-9_-]/g, "_");
  return `${safePageNumber || "page"}.png`;
}

export function storageKeyFromUrl(url: string) {
  const marker = "/manus-storage/";
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

async function resolveImageUrl(url: string) {
  const storageKey = storageKeyFromUrl(url);
  if (storageKey) return storageGetSignedUrl(storageKey);
  if (/^https?:\/\//i.test(url)) return url;
  throw new Error("校稿圖片來源網址無法解析。");
}

async function fetchImage(url: string) {
  const resolvedUrl = await resolveImageUrl(url);
  const response = await fetch(resolvedUrl);
  if (!response.ok) throw new Error(`校稿圖片讀取失敗（${response.status}）。`);
  return new Uint8Array(await response.arrayBuffer());
}

export async function buildLatestProofZip() {
  const pages = (await listPages())
    .filter((page) => Boolean(page.pngUrl))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (!pages.length) throw new Error("目前沒有可下載的校稿頁面圖檔。");

  const entries: Record<string, Uint8Array> = {};
  for (const page of pages) {
    if (!page.pngUrl) continue;
    entries[normalizePageFileName(page.pageNumber)] = await fetchImage(page.pngUrl);
  }

  return { bytes: zipSync(entries, { level: 6 }), pageCount: pages.length };
}
