# Market Pattern Score 規格草案

狀態：已找回概念並完成紀錄，尚未實作
紀錄日期：2026-07-13

## 目的與定位

Market Pattern Score（MPS）是一個市場結構綜合評分系統。它將多種可觀察的交易模式整合成一個 0–100 的指標，用來描述市場中值得研究的結構特徵。

MPS 不用來判斷玩家是否作弊、違規或具有特定意圖。分數越高，只表示目前資料中同時出現較多或較強的 Market Patterns。

## 名稱提案

原始名稱為 Market Pattern Score（MPS）。

重新設計時可考慮改名為 Market Pattern Index（MPI），因為 Index 更接近「由多個市場結構指標組成的綜合指數」，較不容易被理解為對玩家或交易進行評判。

目前尚未核准改名。進入實作前需決定正式名稱與縮寫，避免 MPS、MPI 同時出現在程式、文件與介面中。

## 核心結構

MPS 不是單一公式，而是多個獨立 Pattern 指標的組合：

    Market Pattern Score / Index
      Counterparty Concentration
      Low-price Transfer
      Two-Step Transfer
      Repeated Quantity Pattern
      Trading Density
      Price Structure

每個子指標都必須先產生自己的分數、證據與說明，再依確認後的聚合政策形成總指數。

## 六個找回的構面

### 1. Counterparty Concentration

衡量交易是否過度集中於少數固定對手。例如某參與者交易很多，但大部分交易都只與同一對手發生。

可能需要的基礎量包括唯一交易對手數、主要交易對手占比、交易量集中度與觀察期間。

### 2. Low-price Transfer

觀察成交價格是否反覆明顯低於可比較的市場價格，尤其是否集中發生於相同參與者或群組之間。

低價必須相對於明確基準計算，不能用固定價格門檻套用所有資產。

### 3. Two-Step Transfer

觀察同一資產是否在短時間內呈現 A → B → C 的中繼結構。

此構面應引用獨立的 Two-Step Transfer Confidence 結果，不在 MPS 聚合層重複實作交易配對與判定邏輯。

### 4. Repeated Quantity Pattern

觀察成交數量是否反覆集中在相同或近似數值，例如多次出現 999 或 5000。

固定數量本身可能有正常原因，因此需要結合樣本量、資產特性、數量分布與觀察期間說明。

### 5. Trading Density

衡量短時間窗內的交易密度，並觀察高密度交易是否集中於相同資產、參與者或交易對。

交易密度需與該市場的正常活動基準比較，不能只以絕對筆數判斷。

### 6. Price Structure

觀察價格分布或價格序列是否呈現高度固定、重複往返或其他非自然集中結構，例如長期維持同價，或在少數價格間規律切換。

此構面描述價格結構，不直接推論形成原因。

## 可解釋性原則

總指數不能只顯示單一數字。每次輸出必須同時提供：

- 各子指標分數
- 各子指標對總指數的貢獻
- 拉高分數的可觀察證據
- 資料範圍、樣本數與更新時間
- 資料不足或品質限制

示意輸出：

    MPS: 68
    Counterparty Concentration: +22
    Two-Step Transfer: +18
    Repeated Quantity: +14
    Trading Density: +9
    Price Structure: +5

上例只說明呈現形式，不代表已確認的權重或公式。

## 聚合原則

- 每個子指標應獨立計算、測試與版本管理。
- 聚合層只接收標準化的子指標結果，不直接分析原始交易。
- 子指標缺少資料時不得自動補零，必須標示 unavailable 或 insufficient data。
- 總指數應揭露實際參與計算的構面，避免缺少資料時仍顯示具有誤導性的完整分數。
- 權重、門檻與基準應集中在政策模組中，不散落於畫面或不同計算檔案。
- 公式版本應跟隨輸出保存，讓不同時期的指數可以追溯。

## 指標重疊風險

六個構面之間可能存在相關性。例如固定交易對在短時間內密集交易，可能同時提高 Counterparty Concentration、Trading Density、Repeated Quantity 與 Two-Step Transfer。

若直接加權相加，可能對同一現象重複計分。正式公式需要檢查相關性、設定上限，或採用能降低重複貢獻的聚合方式。

## 實作前尚待決定

- 正式名稱採用 MPS 或 MPI
- 六個構面的定義、正規化方式與分數範圍
- 各構面的權重及最大貢獻
- 市場、資產、參與者三種分析層級是否分開計算
- 各構面的觀察時間窗
- 正常市場基準如何建立與更新
- 資料不足時總指數是否暫停計算
- 指標相關性與重複計分的處理方式
- 低、中、高觀察程度的顯示門檻
- 公式與基準的版本管理方法
- 是否需要信賴區間或資料品質修正

## 安全語言規範

建議使用：

- Market Pattern
- Market Pattern Score / Index
- 市場結構特徵
- 值得進一步觀察
- 此構面對指數的貢獻
- 資料呈現的模式

不得直接使用：

- 作弊分數
- 違規分數
- 洗交易判定
- 可疑玩家排名
- 已確認操縱

除非未來另有足以支持該結論的獨立證據與審核流程，MPS／MPI 不得被用來對玩家或交易動機下結論。

## 未來模組邊界

建議將綜合指數和各子指標分開：

    src/features/market/modules/indicators/
      market-pattern-index/
        pattern-registry.js
        pattern-aggregator.js
        pattern-policy.js
        pattern-view.js
      counterparty-concentration/
      low-price-transfer/
      two-step-transfer/
      repeated-quantity/
      trading-density/
      price-structure/

- pattern-registry：登記可用子指標、版本與狀態。
- pattern-aggregator：接收子指標結果並形成總指數。
- pattern-policy：管理權重、門檻、缺值與重疊處理政策。
- pattern-view：呈現總指數、構面拆解、證據與資料限制。

所有模組應透過市場 feature 的標準資料介面取得資料，不直接依賴特定 API。

## 未來驗證重點

- 總指數可以完整追溯到每個子指標與證據。
- 相同資料與相同公式版本必須產生相同結果。
- 缺少任一構面不得被悄悄視為零分。
- 單一現象不應在多個高度相關構面中無上限重複加分。
- 畫面必須顯示資料範圍、樣本數、更新時間與公式版本。
- 無 API 或資料不足時只顯示 planned、empty 或 unavailable，不顯示假分數。
- 任何文案不得把高分解釋為違規或玩家意圖。

## 目前結論

本文件只保存已找回的 MPS 概念、六個構面、可解釋性原則、命名提案與待決問題。目前網站不會計算、顯示或啟用 MPS／MPI；待市場資料來源可用、各子指標定義完成且聚合政策確認後，再進入實作。
