# 魯凱族文化手冊 Client Portal｜AI 接手維護手冊

> 本文件是其他 AI 或維護者接手 `rukai-client-portal` 時的第一份必讀文件。所有資料更新都必須遵守「先核對、再建立 Manifest、取得明確確認、最後才寫入」的順序。

## 1. 專案定位與目前狀態

本專案是《榮耀之冠・百合之約》魯凱族文化手冊的私有 Client Project Portal。正式網址為 `https://rukaiportal-qpd8adcj.manus.space`。客戶端使用繁體中文，提供目前進度、頁面預覽、待確認／待提供、最近更新與首頁底部 V1–V4 公開版本摘要；管理員端提供完整頁面資料、PNG mapping、更新紀錄與維護功能。

目前最新 WebDev checkpoint 為 `8f2268e0`。P01–P14 已完成 PNG mapping，P15、P16 明確排除。P09–P13 的頁面 metadata 已依 Google Sheet「最新頁序對照」同步；這五頁的 PNG mapping、`pngUpdatedAt` 與 `sortOrder` 保留，`assetVersion` 為 `batch-20260819`，`reviewStatus` 為「待校稿」。

## 2. 開始工作前的安全檢查

開始任何工作前，先讀取本文件、`todo.md`、`drizzle/schema.ts`、`server/routers.ts` 與相關測試。接著確認 Git 狀態、目前 checkpoint、Google Drive／Google Sheet 來源範圍與使用者要求。不要把環境變數、密碼、session cookie、Drive token 或任何秘密值寫入 GitHub。

秘密只可以透過專案環境或秘密管理介面取得。程式碼與文件只能記錄變數名稱及用途，不得記錄實際值。主要變數包括 `PORTAL_ACCESS_PASSWORD`、`PORTAL_ADMIN_PASSWORD`、`PORTAL_TEST_BASE_URL`、`DATABASE_URL`、`JWT_SECRET`、`BUILT_IN_FORGE_API_KEY`、`BUILT_IN_FORGE_API_URL` 及 Google Workspace 連線所需的既有設定。

## 3. 重要目錄與檔案

| 路徑 | 用途 |
|---|---|
| `client/src/pages/Home.tsx` | 一般使用者首頁與公開版本摘要、頁面預覽入口 |
| `client/src/pages/Admin.tsx` | 管理員維護頁、PNG 上傳與頁面資料管理 |
| `client/src/components/PortalGate.tsx` | 客戶／管理員密碼入口與顯示／隱藏密碼按鈕 |
| `client/src/components/PortalHeader.tsx` | 導覽列、校稿相簿入口與管理入口可見性 |
| `server/routers.ts` | dashboard、adminData、密碼登入與管理程序的 tRPC 合約 |
| `server/db.ts` | projectPages、projectUpdates 等資料庫查詢與保存邏輯 |
| `server/portalContent.ts` | Portal 公開內容、版本摘要及公開欄位轉換 |
| `server/proofUpload.ts` | PNG 檔名清理與 storage key 產生器 |
| `server/_core/index.ts` | Express 啟動與 `/api/admin/upload-proof` 上傳端點 |
| `drizzle/schema.ts` | 資料模型；目前包含 `assetVersion` 與 `reviewStatus` |
| `drizzle/0002_strong_bucky.sql` | 新增 `assetVersion`、`reviewStatus` 的 migration |
| `scripts/sync-google-sheet.mjs` | Google Sheet 唯讀／同步相關腳本 |
| `docs/google-sheet-sync.md` | Google Sheet 同步說明 |
| `todo.md` | 不可刪除的工作歷史與目前待辦 |

## 4. 權限與登入規則

客戶入口與管理員入口使用不同密碼與伺服器端 session。一般使用者只能讀取公開 dashboard；管理員才可讀取 `adminData`、維護頁面、上傳 PNG、修改管理資料。管理員密碼不可由 UI 查詢，只能透過安全設定重新設定或更換。

所有前台文字維持繁體中文。不要重新引入 Manus OAuth、Google OAuth、Email 白名單或任何不符合目前雙密碼 session 設計的登入方式。一般使用者不得看到工作 ID、PNG mapping、資產版本、管理欄位或管理入口。

## 5. projectPages 資料規則

`projectPages` 是逐頁資料來源。一般更新不得改變頁碼排序或誤刪頁面。PNG 上傳只應更新 `pngUrl`、`pngUpdatedAt` 與可追蹤的 `assetVersion`；新上傳或取代後 `reviewStatus` 必須維持或設定為「待校稿」，不可自動標記「已確認」。metadata 同步才可更新已由來源核對的標題、章節、排版狀態、資產狀況與備註。

目前 P09–P13 的可驗證欄位如下：`assetVersion=batch-20260819`、`reviewStatus=待校稿`、PNG mapping 存在、`sortOrder` 依頁碼排列。若未來要將任一頁標記為已確認，必須先取得專案管理者明確確認，並保留變更原因與時間。

## 6. Google Drive／Google Sheet 批次流程

批次流程不得直接從檔名或修改時間推斷正式版本。先以 Google Workspace 唯讀盤點來源資料夾，確認檔名、Drive file ID、修改時間、頁碼、版本與重複檔案。檔名應盡量符合 `P01.png` 至 `P14.png`；P15、P16 若未被明確納入本批次，必須排除。

接著建立 Import Manifest。每筆至少記錄 `pageNumber`、`driveFileId`、`sourceFileName`、`sourceModifiedTime`、`action`、`targetPageId`、`assetVersion`、`reviewStatusBefore`、`reviewStatusAfter`、`conflicts` 與 `needsConfirmation`。Manifest 未完成前禁止寫入 Portal；有重複、頁碼不明、來源衝突或內容無法核對時，狀態必須是 `Needs Confirmation`。

執行前必須取得使用者明確確認，例如「確認開始 P01–P14 上傳測試」。確認後才可依頁碼上傳／取代。缺少的頁面不代表刪除，預設保留舊資料；除非使用者明確要求撤回或刪除，否則不得下架。上傳完成後要以 storage 與資料庫回讀確認，不得只依上傳 HTTP 200 回報成功。

## 7. 三道執行閘門

第一道是匯入前閘門：來源範圍、檔案完整性、頁碼、重複、Manifest、衝突與使用者確認都必須完成。第二道是變更閘門：每頁只能更新 Manifest 允許的欄位，保留原有 layout／review 狀態，遇到部分失敗立即停止或標記 `Partial`。第三道是發布後閘門：重新讀取資料庫、dashboard、adminData、前台縮圖、手機與桌機畫面，並執行 TypeScript 與 Vitest；所有結果都要記錄在 checkpoint。

## 8. QA 最低門檻

每批至少驗證 P01–P14 是否完整、頁碼是否重複、PNG 是否可讀、前台是否顯示縮圖、P14 等邊界頁是否能正常處理、管理員 mapping 是否完整、一般使用者是否看不到管理欄位、客戶／管理員登入是否成功，以及桌機與手機版是否可用。型別檢查使用 `pnpm check`，單元測試使用 `pnpm test --run`。

對 P09–P13 等容易發生 metadata 錯置的頁面，必須同時比對 PNG 圖面可讀頁碼／主題、Google Sheet 主版本、Portal card title 與 API 回應。若圖面與 Portal metadata 不一致，不得把「有 PNG」誤報為「內容已核對」；應回報 `SOURCE_CONFLICT` 或 `Partial`。

## 9. Checkpoint 與回報格式

每個批次都要保存 checkpoint。摘要至少包括來源資料夾與 Sheet、處理範圍、成功新增、成功取代、未變更、排除頁面、衝突、待確認項目、`reviewStatus`、QA 結果、是否可繼續校稿及未解決問題。完整成功使用 `Complete`，部分成功或有衝突使用 `Partial`，尚未執行或被閘門阻擋使用 `Not Executed`。

不得用「全部完成」掩蓋 metadata 衝突、圖片缺失、部分失敗或未執行的 QA。若 PNG mapping 已完成但頁面標題尚未核對，應明確寫成「PNG mapping 完成；metadata 待確認」，並說明是否仍可在限制下繼續校稿。

## 10. GitHub 協作規則

目前 WebDev 的 `origin` 是部署用遠端，不要任意改名或刪除。GitHub repository 是 `https://github.com/whynot-tw/rukai-portal`，預設分支為 `main`。同步前先執行 `git status --short --branch`、`git remote -v` 與 `git log --oneline -8`。若遠端有其他人的新 commit，先 fetch 並檢查差異，不可使用 `git reset --hard` 覆蓋工作。

提交訊息應清楚描述資料或程式變更，例如 `docs: add AI handoff runbook`、`fix: sync P09-P13 metadata`。推送前必須執行 `pnpm check`、`pnpm test --run`，並確認沒有 `.env`、密碼、cookie、token、暫存 PNG 或包含秘密的 log 被加入 commit。若要讓其他 AI 接手，先閱讀本文件、`todo.md`、最新 checkpoint 與 `git log`。

## 11. 禁止事項

不得捏造頁面、評論、校稿結果、使用者確認或任何圖片內容。不得未經確認批次上傳、取代、刪除或同步 metadata。不得把 Google Drive 的缺頁當成 Portal 刪除指令。不得把 asset upload 當成 review approval。不得在公開 API 暴露管理欄位或密碼。不得將大型資產放入 Git repository；圖片應由 WebDev storage／S3 管理。

## 12. 建議接手順序

新 AI 接手時，先閱讀本文件與 `todo.md`，再檢查最新 checkpoint 與 Git 狀態。第二步是只讀回讀 dashboard、adminData 與資料庫頁面數；第三步才核對 Google Drive／Sheet。若使用者要求批次處理，先產生 Manifest 並回報待確認清單，取得明確確認後才執行。完成後跑完整 QA、更新 checkpoint、更新 `todo.md`，最後才同步 GitHub。

## 13. 目前可繼續工作

目前最適合的下一步是由專案管理者逐頁確認 P09–P13，確認後再將 `reviewStatus` 從「待校稿」改為適當狀態。下一批 PNG 應沿用 Import Manifest 與 `batch-YYYYMMDD` assetVersion 命名，並明確排除未納入範圍的頁面。任何 metadata 衝突都應先停在 `Needs Confirmation`，而不是猜測修正。

最後更新：2026-08-17。
