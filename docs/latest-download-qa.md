# 最新版下載 QA 紀錄

## Release Skill v2

正式發布包固定為 `rukai-book-latest.zip`，優先讀取使用者已確認並直傳至固定 storage key 的唯一 ZIP。Hero 顯示日期仍由 `/__manus__/version.json` 的正式發布 timestamp 取得。第一份直傳 ZIP 前，端點保留既有頁面 PNG 動態整理的相容輸出，以避免現有下載中斷；此相容包不是使用者確認的發布來源。

- 日期：2026/08/17
- 預覽網址：目前 WebDev preview
- 客戶 session：已登入
- Hero：顯示「下載最新版（2026/08/17）」；未顯示 ZIP 實際檔名。
- 前台資料：P01–P14 均在頁面預覽清單中，既有校稿縮圖與相簿入口仍可見。
- 未登入端點：`GET /api/portal/download-latest` 回傳 HTTP 401，確認下載受 Portal session 保護。
- 待補驗證：已登入點擊後的 ZIP 實際內容與檔案數量，需於儲存服務可讀取時完成端到端檢查。

- 已登入點擊 Hero 下載按鈕：按鈕先進入整理中的 loading 狀態，完成後恢復可用；頁面未顯示錯誤訊息。
- Hero 桌機預覽：下載按鈕與既有兩個主要操作並列，中文文字與日期清楚可讀。

- 已登入實際下載：HTTP 200，`Content-Type: application/zip`，`Content-Length: 1066946`，`X-Portal-Page-Count: 14`，且 `Cache-Control: private, no-store`。
- 已檢查下載檔內容：ZIP 共 14 個檔案，依序為 `P01.png` 至 `P14.png`；未建立 ZIP 版本資料或額外 metadata，ZIP 僅作目前頁面圖檔的衍生下載包。
- 下載檔案名稱由瀏覽器下載流程提供中文顯示名稱；Hero 本身不顯示 ZIP 實際檔名。

## 自動發布日期回歸

本次改造後，Hero 會讀取 WebDev 自動產生的 `/__manus__/version.json`，以其中的 checkpoint timestamp 轉換為 `zh-TW`／Asia-Taipei 的 `YYYY/MM/DD` 顯示。瀏覽器驗證結果為「下載最新版（2026/08/17）」。ZIP 下載檔名改為固定的 `rukai-book-latest.zip`，因此不再需要手動更新 ZIP 檔名日期。

自動發布日期改造後再次實測：Hero 顯示「下載最新版（2026/08/17）」；點擊後按鈕進入整理狀態並恢復可用，頁面沒有錯誤提示，P01–P14 頁面預覽仍完整可讀。

## Release Skill v2 相容下載回歸

在第一份使用者確認的 `rukai-book-latest.zip` 尚未上傳前，已登入端點回傳 HTTP 200、`Content-Type: application/zip`、`Content-Disposition: rukai-book-latest.zip`、`X-Portal-Page-Count: 14` 與 `X-Portal-Release-Source: legacy-generated`。這表示既有下載沒有中斷，同時不把相容輸出誤記為使用者確認的 release ZIP。
