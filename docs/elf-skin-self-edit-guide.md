# ELF Skin Gallery Self-Edit Guide

這份文件是給之後自己修改「ELF 皮膚願望館」時看的快速說明。重點是先分清楚：哪些檔案控制畫面、哪些檔案控制資料、哪些設定牽涉安全。

## 1. 目前網站在做什麼

皮膚願望館目前有三個主要頁籤：

- `Wishes / 願望清單`：顯示玩家願望排行。每個瀏覽器本地最多選 3 個願望，社群總數由 Supabase 匿名統計。
- `Supply / 供給量排行`：顯示官方皮膚供給量排行，目前是 Top 10。
- `Skins / 官方皮膚`：顯示官方皮膚清單或空狀態。

另有兩個輔助資料：

- `Community visitors / 來訪數`：以瀏覽器本地 visitor id 計算，一個瀏覽器通常只算一次。
- `Today added / 今日新增`：由每日供給快照比較出來，不是玩家開頁面即時寫入。

## 2. 最常改的檔案

### `src/features/skins/views/skin-landing-view.js`

皮膚首頁的主要 HTML 結構都在這裡。

常見用途：

- 改頁籤內容。
- 改願望清單、供給排行、今日新增排行的顯示方式。
- 改 TOP 1 角色展示卡。
- 改排名顯示幾名。
- 決定沒有資料時要顯示空狀態還是空格。

排行與願望上限集中在 `src/config/product-config.js`：

- `wishlistLimit = 3`：本地願望最多 3 個。
- `rankingLimit = 10`：排行顯示 Top 10。
- `supplyLeaders`：供給量排行資料。
- `wishlistLeaders`：願望排行資料。
- `todayAddedLeaders`：今日新增排行資料。
- `getChampionFrameClass()`：決定 TOP 1 展示卡使用哪種角色框。

### `src/styles.css`

大部分視覺設計與手機/桌機排版都在這裡。

常見用途：

- 改首頁 Hero 高度、寬度、間距。
- 改桌機版左右欄、三欄排行布局。
- 改手機版 390px / 430px 顯示。
- 改 TOP 1 卡框、排名列、願望按鈕、今日新增橫式排行。

重要區塊：

- `.app-shell-home`：皮膚首頁最大寬度。
- `.elf-home-hero`：首頁頂部標題區。
- `.elf-home-tabs`：願望 / 供給 / 官方皮膚頁籤。
- `.elf-tab-panel-supply`：供給排行頁布局。
- `.elf-tab-panel-wishlist`：願望排行頁布局。
- `.elf-champion-card`：TOP 1 大展示卡。
- `.elf-rank-list` / `.elf-rank-row`：直式排行列。
- `.elf-delta-panel` / `.elf-delta-card`：今日新增排行。
- `@media (min-width: 1120px)`：桌機版布局。
- `@media (max-width: 620px)`、`@media (max-width: 430px)`：手機版布局。

### `src/i18n/translations.js`

所有多語系顯示文字都在這裡。

目前支援：

- `en`
- `zh-Hant`
- `ja`
- `ko`
- `vi`

常見用途：

- 改標題。
- 改按鈕文字。
- 改免責聲明。
- 改資料來源說明。
- 改空狀態文字。

注意：

- 這個檔案很大，改的時候盡量只改小範圍。
- 修改後要跑 `node --check src/i18n/translations.js`。
- 不要整份重寫，避免編碼或翻譯鍵遺失。

### `src/app/main.js`

網站狀態與事件綁定在這裡。

常見用途：

- 切換 `#home` 和市場分析頁。
- 切換語言。
- 點頁籤後更新畫面。
- 載入皮膚 API、Supabase 願望資料、供給快照。

如果只是改畫面外觀，通常不要先動這個檔案。

## 3. 皮膚資料來源

### `src/sources/elf/elf-skins.js`

官方皮膚 API 與備援皮膚清單在這裡。

重要內容：

- `src/config/public-runtime-config.js` 的 `skinApiUrl`：目前使用的 CiDi ELF 皮膚 API。
- `loadElfSkinCatalog()`：讀取官方皮膚資料。
- `fallbackElfSkins`：官方 API 失敗時的備援皮膚。
- `normalizeElfSkin()`：把官方 API 格式轉成網站內部格式。
- `sortSkinsByQuantity()`：依供給量排序。

每個 skin 主要資料：

- `id`：網站內部用的皮膚 ID。
- `name`：皮膚名稱。
- `image`：皮膚圖片網址。
- `quantity`：官方供給量。`null` 代表未知，不等於官方確認無上限。
- `tone`：卡片色系分類，用於視覺風格。

## 4. 願望資料

### `src/features/skins/state/skin-wishlist.js`

本地願望選擇邏輯在這裡。

重要內容：

- 每個瀏覽器最多 3 個願望。
- 願望存在 `localStorage`。
- 使用者可新增或取消願望。
- 本地資料不等於全站統計，只有同步到 Supabase 後才會成為社群總數的一部分。

### `src/features/skins/state/skin-community-stats.js`

社群願望統計與匿名訪客 ID 在這裡。

重要內容：

- 建立或讀取本地 `visitor_id`。
- 把本地選擇的 skin id 送到 Supabase。
- 讀取全站願望排行與來訪數。
- 不收集玩家帳號、錢包、email 或個人資料。

## 5. 供給快照與今日新增

### `src/features/skins/state/skin-supply-stats.js`

供給量快照讀取與同步邏輯在這裡。

重要內容：

- `loadSkinSupplySnapshots()`：讀取 Supabase 已計算好的供給趨勢。
- `todayAdded`：今日供給量 - 前一次快照供給量。
- 寫入快照由 `scripts/sync-skin-supply-snapshot.mjs` 與 GitHub Actions 負責，不在瀏覽器端執行。

注意：

- 今日新增需要至少兩個不同時間點的快照才有意義。
- 如果一款皮膚供給量是 `null` 或無效，應避免當作確定數字。
- 目前設計方向是用排程寫快照，不靠玩家開頁面時寫入。

### `.github/workflows/sync-skin-supply-snapshot.yml`

GitHub Actions 的定時供給快照同步設定。

常見用途：

- 改多久同步一次。
- 手動觸發快照。
- 檢查快照同步是否失敗。

如果改成每小時同步，資料量仍然很小，但要注意官方 API 呼叫頻率與 GitHub Actions 配額。

## 6. Supabase 資料表與函式

### `supabase/schema.sql`

Supabase SQL 結構在這裡。

皮膚願望相關：

- `skin_gallery_visitors`：匿名訪客。
- `skin_gallery_allowed_skins`：允許被投願望的皮膚 ID 清單。
- `skin_gallery_wishes`：匿名訪客選了哪些皮膚。
- `get_skin_gallery_stats()`：讀取全站願望排行與來訪數。
- `sync_skin_gallery_state(uuid, uuid, text[])`：以瀏覽器識別碼與私密 token 同步願望；資料庫只保存 token 的 SHA-256 雜湊。
- `delete_skin_gallery_state(uuid, uuid)`：驗證 token 後刪除該瀏覽器的訪客與願望資料。

供給快照相關：

- `skin_supply_snapshots`：每日皮膚供給快照。
- `get_skin_supply_stats()`：讀取最新供給量與今日新增。
- `sync_skin_supply_snapshot(jsonb)`：寫入一次供給快照。

安全設計：

- 前端使用 RPC，不直接開表給匿名使用者任意改。
- `anon` / publishable key 只能呼叫被授權的函式。
- `service_role` 或 secret key 絕對不能放進前端、GitHub Pages 或公開 repo。

### `supabase/README.md`

Supabase 設定說明在這裡。

常見用途：

- 第一次建立資料庫時照著做。
- 查看需要放哪些 public config。
- 查看 GitHub Actions secret 要怎麼設定。

## 7. 卡框與圖片素材

### `assets/skin-frames/`

排行榜角色卡框素材放這裡。目前所有角色共用
`unified-forest-card-frame-v1.png`，統一使用 `1041 x 1511` 畫布。

正式規格請參考：

- `docs/card-frame-layout-spec.md`
- `src/styles/unified-card-frame.css`

要更換全站卡框時：

1. 準備一張 `1041 x 1511` 的完整卡框，排名牌、展示區與名字牌整合在同一張圖。
2. 保留現有檔名 `unified-forest-card-frame-v1.png`，即可讓所有角色同步更換。
3. 在 `src/styles/unified-card-frame.css` 調整排名、角色圖與名字的共用座標。
4. 同時檢查桌機卡與手機輪播卡，不為單一角色建立專屬 class。

建議卡框圖：

- 直式角色卡適合手機。
- 橫式展示卡適合桌機。
- 中央要留空，避免角色圖片與文字被背景吃掉。

## 8. 常見修改位置

### 改排行顯示 Top 5 / Top 10

改這些地方：

- `src/config/product-config.js` 的 `rankingLimit`
- `src/i18n/translations.js` 的排行標題文字
- `src/styles.css` 的排行列高度與間距

### 改最多可選幾個願望

搜尋並同步修改：

- `src/config/product-config.js` 的 `wishlistLimit`
- `src/i18n/translations.js` 相關顯示文字

### 改首頁上方資訊

主要看：

- `src/features/skins/views/skin-landing-view.js`
- `src/styles/app-chrome.css`
- `src/i18n/translations.js`

### 改桌機版布局

主要看：

- `src/styles/desktop-layout.css`
- `src/styles/unified-card-frame.css`
- `src/styles/site-background.css`

### 改手機版布局

主要看：

- `src/styles/mobile-layout.css`
- `src/styles/mobile-ranking-card.css`
- `src/styles/mobile-content-grid.css`
- `src/styles/site-background.css`

手機檢查寬度：

- 390px
- 430px

第一個手機畫面底部最好能看到第一名排行內容，不要讓 Hero 太高。

## 9. 修改後檢查

每次改 JS 後至少跑：

```powershell
node --check src\features\skins\views\skin-landing-view.js
node --check src\i18n\translations.js
node --check src\app\main.js
node --check src\features\skins\state\skin-supply-stats.js
```

本機預覽：

```powershell
$env:PORT='4174'
node scripts\serve-static.mjs .
```

打開：

```txt
http://127.0.0.1:4174/#home
```

人工檢查：

- 手機 390px 是否沒有左右捲動。
- 手機第一屏是否能看到排行。
- 桌機左右空白是否合理。
- TOP 1 卡框是否沒有壓縮變形。
- 願望、供給、官方皮膚三個頁籤是否只顯示自己的內容。
- 中英日韓越是否沒有出現未翻譯 key。

## 10. 安全注意事項

- Publishable key 可以公開，但只能執行願望同步、願望刪除與唯讀統計 RPC。
- 供給快照寫入必須使用 GitHub Actions 內的 `ELF_SUPABASE_SECRET_KEY`，不可再使用 Publishable key。
- Secret key / service_role key 不可公開。
- 不要把官方登入 token、私人 API token、玩家帳號資料放進 repo。
- 不要讓瀏覽器端直接寫入任意資料表。
- 不要用玩家每次開頁面就大量同步官方 API。
- 官方資料未知時，用「尚未公布 / 無資料」表示，不要自行推測稀有度、上限或分類。

## 11. 修改前的簡短流程

1. 先確認要改的是畫面、文字、資料、還是資料庫。
2. 畫面先看 `src/features/skins/views/skin-landing-view.js` 和 `src/styles/` 對應的功能模組。
3. 文字先看 `src/i18n/translations.js`。
4. 願望統計先看 `src/features/skins/state/skin-wishlist.js`、`src/features/skins/state/skin-community-stats.js`、`supabase/schema.sql`。
5. 今日新增先看 `src/features/skins/state/skin-supply-stats.js`、`scripts/sync-skin-supply-snapshot.mjs`、`.github/workflows/sync-skin-supply-snapshot.yml`、`supabase/schema.sql`。
6. 修改後跑 syntax check。
7. 本機預覽手機與桌機。
8. 確認沒問題再 commit / push。
