# Rukai Portal Release Skill v2

## 發布輸入

每次正式發布只接受兩項使用者已確認的輸入：`rukai-book-latest.zip` 與本次更新內容紀錄。ZIP 是目前正式頁面 PNG 的唯一發布包，同時也是 Hero「下載最新版」的實際下載內容；它不取代逐頁 PNG 與資料庫 mapping 的來源角色。

## ZIP 規則

ZIP 僅可包含直接置於根目錄、以 `PXX.png` 命名的頁面 PNG。系統會拒絕空 ZIP、子目錄、非 PNG、無法辨識頁碼與重複頁碼。固定 storage key 只保留一份 `rukai-book-latest.zip`；下一次確認發布會直接覆寫，沒有 ZIP 歷史版本或日期檔名。

## 發布順序

先檢查 ZIP 並建立頁碼 manifest；再依使用者提供的更新內容同步頁面 mapping、首頁目前排版進度、最近更新、待確認事項、下一步與 `weeklySnapshots.latestPageOrder`。若 ZIP 與更新紀錄、頁碼 mapping 或缺頁安全有衝突，將衝突項目標為 **Needs Confirmation**，不自行猜測或刪除既有頁面。

完成後必須核對首頁進度、`latestPageOrder`、實際頁面、頁面預覽、完整相簿、ZIP 頁面數與 ZIP 最新頁碼的一致性，並執行型別檢查、Vitest、Desktop／Mobile／Tablet QA、GitHub 同步與 checkpoint。

## 維護操作

沒有新的管理 UI。收到使用者提供的已確認 ZIP 後，維護者可使用：

```bash
pnpm tsx scripts/publish-release-zip.mjs /absolute/path/rukai-book-latest.zip
```

指令只會在 ZIP 通過頁碼與內容檢查後，以固定 object key 覆寫唯一發布包。首次直傳 ZIP 前，下載端點暫時相容既有已發布 PNG 的動態包；不應將此相容輸出誤報為使用者提交的正式 ZIP。
