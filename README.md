# CAE Knowledge Base

個人使用的 CAE 知識庫，用來整理技術知識與問題排除紀錄。內容只給一位 owner 使用。

## 線上版本

https://ayay2270.github.io/CAE-Knowledge-Base/

## 主要功能

- 技術知識 / 問題排除兩種內容類型
- CAE 軟體分類
- 全域搜尋
- 工程圖片與截圖
- 新增 / 編輯 / 刪除
- Supabase 私有資料
- Local prototype mode

## 系統架構

GitHub Pages + Vanilla JavaScript + Supabase。

頁面只透過 `KBData`（`js/data-provider.js`）讀寫資料。

```
index.html
css/styles.css
js/config.js             Supabase Project URL 與 publishable key
js/data-provider.js      選擇資料來源
js/provider-supabase.js  正式資料；讀寫都要 owner session
js/provider-local.js     本機範例 JSON
js/auth-ui.js            登入
js/core.js               狀態、分類、文字
js/figures.js            文章與圖片
js/ui.js                 列表、分類、搜尋
js/add-knowledge.js      新增 / 編輯表單
js/main.js               啟動
js/local-store.js        本機 prototype
data/knowledge-base.json 公開範例資料
assets/                  公開靜態圖檔
supabase/                SQL
scripts/serve.mjs        本機靜態伺服器
```

## 資料來源

### Supabase 模式

`js/config.js` 有 Project URL 與 publishable key 時使用。這是正式私人資料。

未登入時不載入文章與圖片。只有 `supabase/privileges.sql` 裡 `kb_is_owner()` 指定的 owner 可以：

- 讀取
- 新增
- 編輯
- 刪除

Supabase 模式不會把這個瀏覽器的 LocalStorage prototype 混進正式列表，也不會刪除那些 prototype。

### Local prototype 模式

網址加上 `?source=local`，或尚未設定 Supabase 時，使用本機範例。只給測試與 prototype。

表單仍是四步（基本資訊 → 內容填寫 → 附圖與其他 → 確認儲存），但儲存只寫入這個瀏覽器的 LocalStorage（`js/local-store.js`）。不會上傳圖片，文章會標成 **本機原型**。

以下都是 GitHub Pages 的公開靜態資源：

- `data/knowledge-base.json`
- `assets/`
- `?source=local`

不得存放：

- 公司內部 CAE 資料
- 客戶資料
- 私人工程截圖
- 其他敏感資訊

私人內容只應存在已登入的 Supabase database 與 `kb-images` Storage。

## Supabase 設定

在 SQL Editor 依序執行。都可以重複執行。

1. `supabase/schema.sql`：建立資料表與 private bucket `kb-images`。不授予權限，重跑也不會改權限。
2. `supabase/seed.sql`：範例資料。可由 `npm run seed:build` 從本機範例重新產生。
3. `supabase/phase5-content-types.sql`：加上技術知識 / 問題排除欄位。沒跑之前仍可讀舊文章；新欄位要等這個 migration 才能儲存。
4. `supabase/privileges.sql`：目前權限政策的最終基準。只有 owner 能讀寫；匿名與其他帳號不行。

接著把 **Project URL** 與 **publishable key**（`sb_publishable_…`）寫進 `js/config.js`。Publishable key 可以放在前端。

禁止放進這個 repository：

- secret key
- `service_role` key
- database password

`js/provider-supabase.js` 會拒絕 publishable key 以外的金鑰，也會拒絕舊的 V2 / V3 Supabase project。

Authentication → Email：關閉 **Allow new users to sign up**。Owner 必須先存在，而且 User UID 必須符合 `kb_is_owner()`。

`supabase/phase2-auth-write.sql`、`phase3-delete-own.sql`、`phase4-edit-own.sql` 已停用且內容是空的。重跑它們不會恢復舊的公開或多作者權限。

### 部署到正式環境

先鎖資料庫，再更新前端。舊前端暫時顯示空白或要求登入是可以接受的。

1. 執行 `supabase/privileges.sql`。
2. 只用 publishable key 確認讀不到 `entries` 與 `kb-images`。
3. 部署這個前端。
4. 以 owner 登入，確認讀取、新增、編輯、刪除，以及開啟或上傳圖片。

## 本機執行

需要 Node.js 18+，不用安裝套件。

```bash
npm start
```

開啟 http://localhost:8080。要換 port 可用 `PORT=3000 npm start`。必須用 HTTP 伺服器，因為頁面會 `fetch` `data/knowledge-base.json`；直接開 `index.html` 不會成功。`python -m http.server 8080` 也可以。

字型與圖示來自 Google Fonts 與 jsDelivr。

範例文章可用 `?figs=0` 到 `?figs=12`、`?long=1`、`#<entry id>`、`#cat/<category key>` 檢查版面。

## 測試

```bash
npm test
npm run test:navigation
npm run test:browser
npm run test:spcforce
```

`test:browser` 需要 Playwright 與 Chrome。可用 `BROWSER_CHANNEL` 換瀏覽器。若 Playwright 不在預設路徑，把 `PLAYWRIGHT_MODULE` 指到它的 package 目錄。`REVIEW_DIR` 是截圖與報告目錄，預設 `.local-review/`，不要 commit。

若 `test:browser` 的預設 8096 連接埠已占用，可用 `TEST_PORT` 指定另一個本機連接埠。

OCP Rail 的 [SPCFORCE 獨立教學](docs/knowledge/ocp-rail-spcforce-stress-limit.md) 可在此 review checkout 以 `?source=local#ocp-rail-spcforce-stress-limit-20261029` 審閱；亦可從兩篇 Force→SPCD 文章下方的「相關知識」開啟。索引、schema 與驗證範圍見[審核記錄](docs/knowledge/ocp-rail-spcforce-review-notes.md)。

瀏覽器測試用本機資料，並攔截 Supabase 請求。它不會對任何 Supabase 專案寫入。

## 部署

GitHub Pages 從 `main` 的根目錄部署到：

https://ayay2270.github.io/CAE-Knowledge-Base/

## 注意事項

- 正式資料在 Supabase。`data/`、`assets/` 與 `?source=local` 是公開 prototype，不要把私人 CAE 資料 commit 到 GitHub。
- 圖片在 private bucket `kb-images`，頁面用短時效 signed URL 顯示。登入狀態存在這個瀏覽器的 `cae-kb-v4-auth`。
- 儲存失敗時，已上傳成功的新圖片會在下一次沿用。只有資料列寫入明確回傳 HTTP 錯誤時，才刪除這次新上傳的檔案。
- `content_type` 為空白時，文章視為問題排除。切換內容類型不會清掉已寫的文字。
