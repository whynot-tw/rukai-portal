import { describe, expect, it } from "vitest";
import { buildProofStorageKey, isSupportedProofMimeType, sanitizeProofFilename } from "./proofUpload";

describe("校稿圖片上傳規則", () => {
  it("只接受常見圖片格式", () => {
    expect(isSupportedProofMimeType("image/png")).toBe(true);
    expect(isSupportedProofMimeType("image/jpeg")).toBe(true);
    expect(isSupportedProofMimeType("application/pdf")).toBe(false);
  });

  it("清理中文與特殊檔名，避免產生不穩定儲存路徑", () => {
    expect(sanitizeProofFilename("P10 proof.png")).toBe("p10-proof.png");
  });

  it("以頁碼與檔名建立可追蹤的儲存鍵", () => {
    expect(buildProofStorageKey("P10", "P10 proof.png")).toBe("rukai-proof/p10/p10-proof.png");
  });
});
