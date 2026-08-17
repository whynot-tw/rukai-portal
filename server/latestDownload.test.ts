import { describe, expect, it } from "vitest";
import {
  LATEST_DOWNLOAD_DATE,
  LATEST_DOWNLOAD_FILENAME,
  normalizePageFileName,
  storageKeyFromUrl,
} from "./latestDownload";

describe("最新版頁面圖檔下載包", () => {
  it("使用本次正式 Portal 更新日期與單一固定下載檔名", () => {
    expect(LATEST_DOWNLOAD_DATE).toBe("2026/08/17");
    expect(LATEST_DOWNLOAD_FILENAME).toBe("rukai-handbook-latest-2026-08-17.zip");
  });

  it("將頁碼轉成安全且可讀的 PNG 檔名", () => {
    expect(normalizePageFileName("P01")).toBe("P01.png");
    expect(normalizePageFileName("P/02 測試")).toBe("P_02___.png");
    expect(normalizePageFileName("///")).toBe("___.png");
  });

  it("只解析 Portal storage URL 的 object key", () => {
    expect(storageKeyFromUrl("/manus-storage/proofs/P01%20latest.png")).toBe("proofs/P01 latest.png");
    expect(storageKeyFromUrl("https://example.com/proof.png")).toBeNull();
  });
});
