# Two-Step Transfer Confidence 規格草案

狀態：已找回概念並完成紀錄，尚未實作
紀錄日期：2026-07-13

## 目的與命名

Two-Step Transfer Confidence（TTS）用來描述交易資料中呈現雙步轉移特徵的程度。

它觀察的是市場結構，不是判定交易動機、玩家關係或違規行為。介面與報告應使用 Transfer Pattern、Possible Two-Step Transfer 等中性用語。

## 核心結構

同一資產在短時間內出現兩筆可連接的交易：A 將資產轉移給 B，B 隨後將相同或相近數量的資產轉移給 C。B 在這個結構中是中繼持有者，概念表示為 A → B → C。

## 可使用的證據邊界

可合理使用的交易資料：

- 賣方、買方
- 成交價格、成交時間、成交數量
- 資產識別資訊

不可推論或宣稱已知：

- IP、裝置或真實身份
- 錢包實際所有權
- 玩家關係或交易動機

## 指標組成

1. Time Gap：兩筆交易的時間間隔。
2. Price Difference：兩筆交易的單位價格差異。
3. Quantity Match：兩筆交易數量的一致程度。
4. Middle Holder Lifetime：B 持有資產的時間。
5. Repeated Pattern：同一中繼者是否反覆出現在相似結構中。

## 找回的原始權重提案

| 組成 | 權重 |
| --- | ---: |
| Time Gap | 30% |
| Quantity Match | 25% |
| Price Difference | 20% |
| Middle Holder Lifetime | 15% |
| Repeated Pattern | 10% |

預定輸出為 0–100 的 Two-Step Transfer Confidence。分數只表示資料呈現此結構特徵的程度。

## 已發現的公式風險

在只有兩筆交易的鏈中，Time Gap 與 Middle Holder Lifetime 通常是同一段時間。若分別計分，可能重複放大時間因素。

尚未核准的替代方向：

| 組成 | 暫定權重 |
| --- | ---: |
| Time / Holding | 45% |
| Quantity Match | 25% |
| Unit-price Similarity | 20% |
| Repeated Intermediary | 10% |

此替代方案只供後續討論，不視為已確認公式。

## 實作前尚待決定

- 最大配對時間窗與時間衰減方式
- 數量一致性的公式、容許誤差及拆分／合併規則
- 單位價格差異的計算方式
- 多筆流入與流出時的配對策略
- 採用 FIFO、最近前筆或批次追蹤
- A、B、C 是否必須是三個不同參與者
- 重複模式的觀察期間與最小樣本數
- 候選交易鏈的去重方式
- 低、中、高信心區間門檻

## 安全語言規範

建議使用 Transfer Pattern、Possible Two-Step Transfer、Two-Step Transfer Confidence、呈現雙步轉移特徵、值得進一步觀察。

不得直接使用作弊、洗交易、多開、違規、已確認操縱等字眼。除非未來有獨立且足以支持該結論的證據，否則不得由 TTS 分數延伸成指控。

## 未來模組邊界

若市場資料來源恢復，建議建立獨立指標模組：

    src/features/market/modules/indicators/two-step-transfer/
      candidate-builder.js
      tts-model.js
      tts-policy.js
      tts-view.js

- candidate-builder：建立並去重 A → B → C 候選鏈。
- tts-model：計算各項特徵及信心分數。
- tts-policy：管理門檻、時間窗、權重與安全用語。
- tts-view：只呈現結果與證據，不自行推導分數。

模組應透過市場 feature 的資料介面取得標準化交易，不直接依賴特定 API。

## 未來驗證重點

- 同一組輸入必須產生穩定且可重現的分數。
- 不完整資料不得被補成零或虛構值。
- 多筆候選交易不得重複計數。
- 拆分與合併交易需有明確測試案例。
- 介面只能呈現 Possible 或 Confidence，不得顯示 Confirmed。
- 無 API 或資料不足時應回傳 planned 或 empty，不顯示假分數。

## 目前結論

本文件只保存已找回的 TTS 概念、語言原則、原始權重與待決問題。目前網站不會計算、顯示或啟用 TTS；待市場 API 可用且配對政策確認後，再進入實作。
