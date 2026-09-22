# CAE Knowledge Base

部門共用的 CAE 工程知識庫（HyperMesh / LS-DYNA 等）。三欄式介面：分類導覽、條目列表、詳情與圖片。資料存於 **Supabase**（Postgres + Storage），無登入。

## 本機開發

```bash
cp .env.example .env
# 填入 VITE_SUPABASE_URL、VITE_SUPABASE_ANON_KEY

npm install
npm run dev
```

預設開發伺服器：`http://127.0.0.1:43127`

未設定 `.env` 時會以**示範模式**啟動（記憶體種子資料，重整後重置），方便預覽 UI。正式使用請接上 Supabase。

## Supabase 設定（必要，一次性）

1. 建立 [Supabase](https://supabase.com) 專案。
2. **Project Settings → API**：複製 Project URL 與 `anon` `public` key 到 `.env`。
3. **SQL Editor**：貼上並執行 [`supabase/migrations/20260322000000_initial.sql`](supabase/migrations/20260322000000_initial.sql)（建立 tables、RLS、Storage bucket、種子資料）。
4. 重啟 `npm run dev`。側欄應顯示「已同步至共用雲端」。

勿使用或提交 `service_role` key。

## 功能

- 動態分類 CRUD／排序（預設 HyperMesh、LS-DYNA；All 為虛擬篩選）
- 知識條目完整 CRUD、搜尋、排序、我的最愛、最近查看
- 軟刪除／還原／永久刪除（並清除 Storage 圖片）
- 圖片：多檔上傳、拖放、縮圖、排序、lightbox、單張／全部下載（jpg/jpeg/png/webp）
- 響應式：桌面三欄；平板可收合側欄；手機列表／詳情切換

## 技術堆疊

React 19 · Vite · TypeScript · Tailwind CSS v4 · Supabase JS

## 建置

```bash
npm run build
npm run preview
```

正式建置的 `base` 為 `/CAE-Knowledge-Base/`（GitHub Pages 專案路徑）；本機 `npm run dev` 仍使用 `/`。

## GitHub Pages

推送到 `main` 會透過 [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) 自動建置並部署。

正式網址：https://ayay2270.github.io/CAE-Knowledge-Base/

若要在 Pages 上使用 Supabase（非示範模式），於 GitHub repo **Settings → Secrets and variables → Actions** 新增：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

未設定時網站仍可開啟，並以**示範模式**運作。

## 授權

內部工程工具；依貴部門政策使用。
