# Rukai Client Portal｜AI 共同維護指南

本指南說明如何讓其他 AI 代理（Agent）接手並共同維護《榮耀之冠・百合之約》魯凱族文化手冊的 Client Project Portal。

## 1. 專案交接與環境準備

當新的 AI 代理接手時，請提供以下資訊：

1. **GitHub Repository**：`https://github.com/whynot-tw/rukai-portal`
2. **專案網址**：`https://rukaiportal-qpd8adcj.manus.space`
3. **必讀文件**：要求 AI 優先讀取專案根目錄的 `docs/AI_HANDOFF.md` 與 `docs/RELEASE_SKILL_V2.md`。

AI 代理必須在安全的沙盒環境中 clone repository，並使用 `pnpm install` 準備環境。所有秘密（如資料庫連線字串、API 金鑰、管理員密碼）必須由環境變數注入，不得寫入程式碼或文件。

## 2. 正式發布流程（Release Skill v2）

Portal 已進入維護模式（Maintenance Mode），不再進行大規模功能開發。後續的正式發布必須嚴格遵守 **Release Skill v2**：

- **唯一輸入**：使用者提供的 `rukai-book-latest.zip` 與已確認的更新內容紀錄。
- **不重新掃描**：AI 不應自行掃描 Google Drive 或重新判斷專案狀態。
- **ZIP 規則**：ZIP 內只能包含根目錄的 `PXX.png`；不接受重複頁碼、無法辨識的檔名或子目錄。
- **執行方式**：使用 `pnpm tsx scripts/publish-release-zip.mjs /path/to/rukai-book-latest.zip` 將 ZIP 寫入固定的 storage key。
- **進度同步**：依使用者提供的紀錄，更新首頁「目前排版更新至 PXX」、最近更新與 `weeklySnapshots.latestPageOrder`。

## 3. 權限隔離與資料安全

- **雙密碼 Session**：客戶入口與管理員入口使用不同的密碼與伺服器端 session。一般使用者只能讀取公開 dashboard；管理員才可讀取 `adminData` 與上傳 PNG。
- **資料隔離**：一般使用者不得看到工作 ID、PNG mapping、資產版本、管理欄位或管理入口。
- **缺頁處理**：若發布包缺少某些頁面，預設保留既有 Portal 資料並標示「本批未覆蓋」，**不得自動刪除**。
- **衝突處理**：若 ZIP 內容與更新紀錄、頁碼 mapping 有衝突，必須將衝突項目標為 **Needs Confirmation**，等待使用者明確指示。

## 4. QA 與 GitHub 同步

每次修改或發布後，AI 必須執行以下 QA：

1. **型別與測試**：執行 `pnpm check` 與 `pnpm test --run`。
2. **一致性核對**：確認首頁進度、`latestPageOrder`、實際頁面、頁面預覽、完整相簿與 ZIP 內容一致。
3. **跨裝置驗證**：確認 Desktop、Mobile 與 Tablet 的響應式呈現未受破壞。

QA 通過後，AI 必須將變更同步至 GitHub `main` 分支，留下清楚的 commit 紀錄，並在 WebDev 環境中保存正式 checkpoint。

## 5. 禁止事項

- 不得捏造頁面、評論、校稿結果或使用者確認。
- 不得未經確認批次上傳、取代、刪除或同步 metadata。
- 不得把 Google Drive 的缺頁當成 Portal 刪除指令。
- 不得把 asset upload 當成 review approval。
- 不得在公開 API 暴露管理欄位或密碼。
- 不得將大型資產（如 ZIP 或 PNG）放入 Git repository；必須由 WebDev storage／S3 管理。
- 不得自行重新設計網站、重排頁序或因單次更新重建整個 Portal。
