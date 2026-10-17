# CAE Knowledge Base V4

**Live site: https://ayay2270.github.io/CAE-Knowledge-Base-V4/** (GitHub Pages, served from `main`, root folder)

A CAE knowledge base for **technical knowledge** and **troubleshooting** articles. Each content type has its own
authoring and reading sections, with engineering figures linked to sections or numbered steps.

## Interface

- **Header** — Lenovo logo + "CAE Knowledge Base", global search, and a **+ 新增知識** button.
- **知識分類 sidebar** — 所有文章 · HyperWorks (HyperMesh, OptiStruct) · LS-DYNA, with article counts.
- **所有文章** (landing) — a larger search field and the articles grouped by software / category.
- **Category pages** — description, child-category cards (for HyperWorks) and the article list.
- **Article page** — the approved Concept C2 reading view: breadcrumb, sections (現象 · 原因分析 · 解決方法 ·
  試過但無效 · 備註 · 參考來源), "On this page" outline, figure gallery after the text, full-size image viewer,
  previous / next article.

## Status

- **Two data sources.** When `js/config.js` holds a Supabase Project URL and **publishable** key, V4 uses that project.
  `?source=local` forces the local sample data. Supabase mode shows Supabase entries only; LocalStorage prototypes stay
  out of that list and are not deleted.
- **Supabase is private to one owner.** Logged out, the page does not load entries or images. Only the account named in
  `supabase/privileges.sql` can read, create, edit, and delete. The site never contains a secret key, service_role key or database password.
- **Static files are public prototype material.** `data/knowledge-base.json`, `assets/`, and `?source=local` are served
  with the static site. Never put private CAE, company, or customer content there. Private content belongs only in the
  authenticated Supabase database and the `kb-images` bucket.
- **新增知識** — with Supabase configured and the owner signed in, it saves to the database. Without Supabase, or with
  `?source=local`, it stays a local prototype: The four-step form (基本資訊 → 內容填寫 → 附圖與其他 → 確認儲存) produces
  an entry in the normal knowledge schema, but "save" only writes to this browser's LocalStorage
  (`js/local-store.js`). In prototype mode nothing is uploaded; entries are marked **本機原型**.

## Run locally

Requires Node.js 18+ (no packages to install).

```bash
npm start
```

Open <http://localhost:8080> (`PORT=3000 npm start` to use another port). The page must be served over
HTTP because it loads `data/knowledge-base.json` with `fetch`; opening `index.html` as a file will not work.
Any static server works, for example `python -m http.server 8080`.

Web fonts (Google Fonts) and the Tabler icon font (jsDelivr) are loaded from their CDNs.

### QA options

The sample article can be shown in different states through the URL:

| URL | Effect |
| --- | --- |
| `/?figs=0` … `?figs=12` | number of figures on the sample article (0, 1, 3, 8, 12; default 8) |
| `/?long=1` | adds extra text to the sample article to exercise long-article layout |
| `/#<entry id>` | opens a specific article |
| `/#cat/<category key>` | opens a category page (for example `#cat/hm`) |

## Architecture

```
index.html            page shell
css/styles.css        styles
js/config.js          Supabase Project URL + publishable key (empty = local data)
js/data-provider.js   picks the data source; the UI only talks to KBData
js/provider-local.js  local sample data (JSON)
js/provider-supabase.js  Supabase provider (owner session for reads and writes, strict request allow-list)
js/auth-ui.js         login button + dialog
js/core.js            state, software-category helpers, text / markdown helpers
js/figures.js         figure model, article page, figure gallery, lightbox
js/local-store.js     PROTOTYPE: browser-local storage for 新增知識
js/ui.js              header, category sidebar, landing / category / search pages
js/add-knowledge.js   PROTOTYPE: the 新增知識 form
js/main.js            start-up
data/                 knowledge-base.json (+ qa-long-article.json for ?long=1)
supabase/             schema.sql and seed.sql for a new V4 project
assets/brand/         Lenovo logo + hero background photo
assets/icons/         HyperMesh and LS-DYNA software icons (original files, unchanged)
assets/figures/       the sample article's illustrative (mock) figures, SVG
scripts/serve.mjs     zero-dependency static dev server
```

The UI reads data only through `KBData` in `js/data-provider.js`:

```
UI  →  KBData.load() / prepareImages() / imageUrl()  →  Supabase (if configured)  |  data/knowledge-base.json
```

### Data shape

`data/knowledge-base.json`:

- `categories[]` — `key`, `label`, `parent_key`, `is_active`, `sort_order`, `description`
  (software → sub-software tree)
- `entries[]` — `id`, `category` (a leaf category key), `title`, `tags[]`, `symptom`, `root_cause`, `solution`,
  `failed_attempts[]`, `notes`, `reference_source`, `created_at`, `updated_at`, and either
  - `figures[]` — `order`, `section` (`symptom` · `root_cause` · `solution` · `fails` · `note` · `ref`),
    `step` (`0`, a step number, or `"v"` for the verification group), `title`, `caption`, `src`, `mock`,
    `defaultVisible`; or
  - `images[]` — `path` (and optional `caption`) for stored pictures that have no section mapping yet;
    they are shown under the problem section.

Solution steps are written as a numbered list (`1.`, `2.`, …); figures with `step: n` attach to step *n*.

## Supabase

1. Create a **new** Supabase project for V4. (The V2 production and V3 development projects are blocked in
   `js/provider-supabase.js` so V4 cannot be pointed at them by accident.)
2. In **SQL Editor** run `supabase/schema.sql`, then `supabase/seed.sql` (sample data). Both are safe to re-run.
   `schema.sql` creates the tables and the private `kb-images` bucket. It does not grant access, and re-running it
   does not change privileges.
3. Run `supabase/phase5-content-types.sql` to add the knowledge / troubleshooting columns. Safe to re-run. Reading
   still works before this migration; saving the new fields does not.
4. Run `supabase/privileges.sql` **last**. It is the only source of truth for policies and grants: one owner can
   read, create, edit, and delete; anonymous users and every other account cannot. Safe to re-run.
5. Copy the **Project URL** and the **publishable key** (`sb_publishable_…`, Project Settings → API Keys) into
   `js/config.js`. The publishable key is public by design. **Never** put a secret key, a `service_role` key or the
   database password in this repository — the provider refuses anything that is not a publishable key.
6. **Authentication → Sign In / Providers → Email**: switch **Allow new users to sign up** OFF. The owner user must
   already exist, and its User UID must be the id in `kb_is_owner()` inside `privileges.sql`.
7. Open the site and click **登入**. `document.documentElement.dataset.source` is `supabase` when that connection is used.

Apply the database lock before deploying this frontend. A temporary empty or locked previous frontend is acceptable.

1. Run `supabase/privileges.sql`.
2. Verify anonymous access is denied: with only the publishable key, entries and `kb-images` are not readable.
3. Deploy this frontend.
4. Log in as the owner and verify read, create, edit, delete, and opening or uploading an image.

`supabase/phase2-auth-write.sql`, `phase3-delete-own.sql`, and `phase4-edit-own.sql` are retired and intentionally
empty, so re-running them cannot restore public or per-author access.

`supabase/seed.sql` is generated from the local sample data: `npm run seed:build`.

### How the data maps

- `software_categories` and `entries` have the columns listed under "Data shape".
- `entries.images` is JSON: each item is `{ "path": "<object path in kb-images>" }` (private bucket, shown through
  short-lived signed URLs) or `{ "src": "<static url>" }`, and may add `caption`, `title`, `section`, `step`,
  `order`, `key` so a figure attaches to a section / step exactly like the local sample.

The signed-in owner can add, edit, and delete every entry, including sample rows that have no `user_id`. Images upload
into that user's folder of `kb-images`. A failed save reuses an upload that already succeeded, and deletes new uploads
from that attempt only when the row write returns an HTTP error.

How it is locked down: `supabase/privileges.sql` is the database gate. The browser only sends the requests listed in
`RULES` in `js/provider-supabase.js` (owner reads, image signing, sign-in/refresh/logout, entry writes, and image
upload/delete in the owner's folder). The login session is kept in this browser's localStorage (`cae-kb-v4-auth`).

## Software icons

`assets/icons/hypermesh.png` and `assets/icons/lsdyna.png` are the original icons and must not be redrawn or
recoloured.

## Credits

The landing-page hero background (`assets/brand/hero-bg.jpg`) is a cropped, compressed version of
"Forested mountain valley" by Stijn te Strake (Unsplash), published under CC0 1.0 (public domain) and
available on Wikimedia Commons: <https://commons.wikimedia.org/wiki/File:Forested_mountain_valley_(Unsplash).jpg>.

## Phase 5 — content types (local review)

The new form requires an explicit choice of 技術知識 (`knowledge`) or 問題排除 (`troubleshooting`).
Missing / NULL `content_type` is interpreted as troubleshooting; existing JSON and database rows need no backfill.

- Knowledge fields: required `summary`; optional `technical_explanation`, `procedure`, `key_rules`, `notes`.
- Troubleshooting fields: `symptom`, `root_cause`, `solution`, optional `verification`, `failed_attempts`, `notes`.
- Shared: title, category, tags, reference_source, images and existing author / timestamp metadata.
- Switching type preserves text (inactive fields remain dormant in storage and are not rendered). New images
  use the active type's sections; invalid placements fall back to its first section with a notification.
- Legacy image sections `note`, `fails`, `ref` remain supported; `solution` + `step: "v"` maps to verification.
- Preview and reading share section / step rendering. Empty optional sections are omitted unless they contain images.
- Search covers both content types' body fields. Local prototype articles support add, reload and edit.

`supabase/phase5-content-types.sql` adds six columns and their column-level UPDATE grants. It does not change row
policies. A database needs this migration before saving the new payload; legacy reading also works before migration
through a read-only column fallback. Saving checks column availability before image upload; a failed check retains
the current form, and retry checks again after migration.

Validation:

```bash
npm test
npm run test:browser
```

The browser suite requires Playwright and an installed Chrome (`BROWSER_CHANNEL` can select another channel).
If Playwright is provided by a separate runtime, set `PLAYWRIGHT_MODULE` to its absolute package directory.
`REVIEW_DIR` selects the output directory for screenshots and the 17-case JSON report (default `.local-review/`).
The suite starts a loopback-only server, uses local data, and intercepts **all Supabase requests** in the database
scenarios. It never sends database writes to any Supabase project. Do not commit generated review output.
