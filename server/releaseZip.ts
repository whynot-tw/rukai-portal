import { unzipSync } from "fflate";
import { storageGetSignedUrl, storagePutExact } from "./storage";

export const LATEST_RELEASE_FILENAME = "rukai-book-latest.zip";
export const LATEST_RELEASE_STORAGE_KEY = "rukai/release/rukai-book-latest.zip";
export const MAX_RELEASE_UPLOAD_SIZE = 300 * 1024 * 1024;

const PAGE_FILE_PATTERN = /^(P\d{1,3})\.png$/i;

export type ReleaseZipManifest = {
  pageNumbers: string[];
  pageCount: number;
  latestPage: string;
};

function pageSortValue(pageNumber: string) {
  return Number.parseInt(pageNumber.slice(1), 10);
}

export function validateReleaseEntryNames(entryNames: string[]): ReleaseZipManifest {
  const pageNumbers: string[] = [];
  const seen = new Set<string>();

  for (const entryName of entryNames) {
    if (entryName.endsWith("/")) continue;
    const normalized = entryName.replace(/\\/g, "/");
    const basename = normalized.split("/").pop() || "";
    const match = basename.match(PAGE_FILE_PATTERN);
    if (!match || normalized !== basename) {
      throw new Error(`ZIP 只可包含依頁碼命名的 PNG，例如 P01.png；無法使用：${entryName}`);
    }

    const pageNumber = match[1].toUpperCase();
    if (seen.has(pageNumber)) {
      throw new Error(`ZIP 含有重複頁碼：${pageNumber}`);
    }
    seen.add(pageNumber);
    pageNumbers.push(pageNumber);
  }

  if (!pageNumbers.length) throw new Error("ZIP 中沒有可發布的頁面 PNG。");
  pageNumbers.sort((a, b) => pageSortValue(a) - pageSortValue(b));

  return {
    pageNumbers,
    pageCount: pageNumbers.length,
    latestPage: pageNumbers.at(-1)!,
  };
}

export function validateReleaseZip(bytes: Uint8Array): ReleaseZipManifest {
  let archive: Record<string, Uint8Array>;
  try {
    archive = unzipSync(bytes);
  } catch {
    throw new Error("ZIP 無法正常解壓，請確認檔案完整後再發布。");
  }
  return validateReleaseEntryNames(Object.keys(archive));
}

export async function storeLatestReleaseZip(bytes: Uint8Array) {
  const manifest = validateReleaseZip(bytes);
  const stored = await storagePutExact(
    LATEST_RELEASE_STORAGE_KEY,
    bytes,
    "application/zip",
  );
  return { ...stored, ...manifest };
}

export async function getLatestReleaseZip() {
  const signedUrl = await storageGetSignedUrl(LATEST_RELEASE_STORAGE_KEY);
  const response = await fetch(signedUrl);
  // 目前儲存服務對尚未建立的固定 key 可能回傳 403 或 404。
  // 在第一份確認 ZIP 發布前，兩者都代表尚無 release artifact。
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) throw new Error(`最新版 ZIP 讀取失敗（${response.status}）。`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, ...validateReleaseZip(bytes) };
}
