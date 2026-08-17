import { describe, expect, it } from "vitest";
import { zipSync } from "fflate";
import {
  LATEST_DOWNLOAD_FILENAME,
  normalizePageFileName,
  storageKeyFromUrl,
  } from "./latestDownload";
import { validateReleaseEntryNames, validateReleaseZip } from "./releaseZip";
import { formatPublishedDate } from "@shared/portal";

describe("最新版頁面圖檔下載包", () => {
  it("使用本次正式 Portal 更新日期與單一固定下載檔名", () => {
    expect(LATEST_DOWNLOAD_FILENAME).toBe("rukai-book-latest.zip");
    expect(formatPublishedDate(Date.UTC(2026, 7, 17, 2, 0, 0))).toBe("2026/08/17");
    expect(formatPublishedDate(Number.NaN)).toBeNull();
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

  it("只接受唯一、依頁碼命名的正式 ZIP PNG 頁面", () => {
    expect(validateReleaseEntryNames(["P01.png", "P03.png", "P12.png"]))
      .toMatchObject({ pageNumbers: ["P01", "P03", "P12"], pageCount: 3, latestPage: "P12" });
    expect(() => validateReleaseEntryNames(["P01.png", "資料/P01.png"]))
      .toThrow("無法使用");
    expect(() => validateReleaseEntryNames(["P01.png", "封面.jpg"]))
      .toThrow("無法使用");
  });

  it("拒絕無法解壓或含重複頁碼的正式 ZIP", () => {
    const validZip = zipSync({ "P01.png": new Uint8Array([1]), "P16.png": new Uint8Array([2]) });
    expect(validateReleaseZip(validZip)).toMatchObject({ pageCount: 2, latestPage: "P16" });

    const duplicateZip = zipSync({ "P01.png": new Uint8Array([1]), "p01.png": new Uint8Array([2]) });
    expect(() => validateReleaseZip(duplicateZip)).toThrow("重複頁碼");
    expect(() => validateReleaseZip(new Uint8Array([1, 2, 3]))).toThrow("無法正常解壓");
  });
});
