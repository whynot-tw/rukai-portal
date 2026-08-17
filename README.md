# 魯凱族文化手冊 Client Portal

《榮耀之冠・百合之約》魯凱族文化手冊的私有 Client Project Portal。正式網址：<https://rukaiportal-qpd8adcj.manus.space>。

本專案提供繁體中文客戶入口、P01–P14 校稿相簿、進度摘要、待確認事項、V1–V4 公開版本摘要，以及獨立管理員後台。P01–P14 目前已有 PNG mapping；P09–P13 metadata 已依 Google Sheet 最新頁序對照同步，校稿狀態維持「待校稿」。

## 給接手的 AI

開始修改前，請先閱讀 [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md)、[`todo.md`](todo.md)、[`drizzle/schema.ts`](drizzle/schema.ts) 與最新 Git log。`AI_HANDOFF.md` 是完整的操作規範，包含 Google Drive／Google Sheet 批次流程、Import Manifest、metadata 衝突處理、權限、QA、checkpoint 與 GitHub 協作規則。

## 常用指令

```bash
pnpm install
pnpm check
pnpm test --run
pnpm dev
```

不要在 repository 中放置 `.env`、密碼、session cookie、Drive token、暫存 PNG 或其他秘密。所有大型圖片應使用 WebDev storage／S3；批次處理必須先建立 Manifest 並取得使用者明確確認。

## 主要文件

| 文件 | 說明 |
|---|---|
| [`docs/AI_HANDOFF.md`](docs/AI_HANDOFF.md) | 其他 AI 接手維護的完整手冊 |
| [`docs/google-sheet-sync.md`](docs/google-sheet-sync.md) | Google Sheet 同步流程 |
| [`client-portal-qa.md`](client-portal-qa.md) | Portal QA 紀錄 |
| [`verification-notes.md`](verification-notes.md) | 驗證與資料核對紀錄 |
| [`todo.md`](todo.md) | 不可刪除的工作歷史與目前待辦 |
| [`drizzle/schema.ts`](drizzle/schema.ts) | 資料模型 |

## GitHub

GitHub repository：<https://github.com/whynot-tw/rukai-portal>。WebDev 部署用 remote 與 GitHub remote 分開管理；推送前請先確認 `git remote -v`，並執行 `pnpm check` 與 `pnpm test --run`。
