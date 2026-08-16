import { readFile } from "node:fs/promises";

const baseUrl = process.env.PORTAL_TEST_BASE_URL || "http://localhost:3000";
const password = process.env.PORTAL_ADMIN_PASSWORD;
const filePath = process.argv[2];

if (!password || !filePath) throw new Error("需要 PORTAL_ADMIN_PASSWORD 與圖片路徑");

const input = JSON.stringify({ 0: { json: { password } } });
const loginResponse = await fetch(`${baseUrl}/api/trpc/portal.adminPasswordLogin?batch=1`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: input,
});
if (!loginResponse.ok) throw new Error(`管理員登入失敗：${loginResponse.status}`);
const setCookie = loginResponse.headers.get("set-cookie");
const cookie = setCookie?.split(";")[0];
if (!cookie) throw new Error("管理員登入沒有建立 session");

const form = new FormData();
form.append("pageNumber", "P10");
form.append("file", new Blob([await readFile(filePath)], { type: "image/png" }), "qa-proof.png");
const uploadResponse = await fetch(`${baseUrl}/api/admin/upload-proof`, { method: "POST", headers: { cookie }, body: form });
const uploadResult = await uploadResponse.json();
if (!uploadResponse.ok || !uploadResult.url?.startsWith("/manus-storage/")) {
  throw new Error(uploadResult.message || `上傳失敗：${uploadResponse.status}`);
}
console.log(`Upload verified: ${uploadResult.url}`);
