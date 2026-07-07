const en = {
  app: {
    title: "Market Intelligence Dashboard",
    subtitle: "Reusable market model foundation with Elf Continent as the first source adapter.",
    versionEyebrow: "V2-2 Market Coverage"
  },
  language: {
    label: "Language",
    nativeName: "English"
  },
  action: {
    refreshLiveData: "Refresh Live Data",
    refreshing: "Refreshing...",
    search: "Search",
    clearSearch: "Clear Search",
    clearSelection: "Clear Selection",
    viewAssetSnapshot: "View Asset Snapshot",
    viewActorSnapshot: "View Actor Snapshot"
  },
  status: {
    loading: "Loading",
    updated: "Updated",
    loadingLiveMarketTransactions: "Loading live market transactions...",
    requestingCoverageItems: "Requesting {count} coverage items.",
    requestingMarketCoverageSeedItems: "Requesting market coverage seed items.",
    updatedFromLiveAdapter: "Updated from Elf live adapter.",
    partialDataLoaded: "Partial data loaded. Some items failed.",
    tokenRefreshFailed: "Token refresh failed.",
    liveDataUnavailable: "Live data is unavailable.",
    tokenRefreshFailedLiveUnavailable: "Token refresh failed. Live data is unavailable.",
    itemRequestFailed: "Item request failed.",
    itemRequestFailedLiveUnavailable: "Item request failed. Live data is unavailable.",
    noTransactionsReturned: "No transactions returned.",
    unexpectedApiResponseFormat: "Unexpected API response format.",
    waitingForData: "Waiting for data",
    updatedAt: "Updated {time}",
    itemsLoaded: "{loaded}/{requested} items loaded.",
    itemsLoadedWithFailures: "{loaded}/{requested} items loaded, {failed} failed.",
    unableToBuildMarketModel: "Unable to build market model.",
    marketModelUpdated: "Market model updated."
  },
  dashboard: {
    marketTotals: "Market totals",
    transactions: "Transactions",
    totalVolume: "Total Volume",
    activeSellers: "Active Sellers",
    activeBuyers: "Active Buyers",
    modelSnapshot: "Model Snapshot",
    source: "Source",
    pending: "Pending",
    latestTransaction: "Latest Transaction",
    noTransactions: "No transactions",
    signalModules: "Signal Modules"
  },
  coverage: {
    assetCategoryFilter: "Asset category filter",
    assetCoverage: "Asset Coverage",
    categoryFilters: "Category Filters",
    topLevelAssetClasses: "Top-level asset classes",
    assetCategories: "Asset categories",
    assets: "assets",
    categories: "categories",
    all: "All",
    assetClass: {
      resourcesMaterials: "Resources / Materials",
      blueprintsProgression: "Blueprints / Progression",
      cosmeticsCollectibles: "Cosmetics / Collectibles",
      unclassifiedOther: "Unclassified / Other"
    }
  },
  analytics: {
    marketActivitySummary: "Market Activity Summary",
    topTradedAssetsSnapshot: "Top Traded Assets Snapshot",
    topLoadedSellers: "Top Loaded Sellers",
    topLoadedBuyers: "Top Loaded Buyers",
    topSellersSnapshot: "Top Sellers Snapshot",
    topBuyersSnapshot: "Top Buyers Snapshot",
    trendingAssets: "Trending Assets",
    assetClassBreakdown: "Asset Class Breakdown",
    categoryBreakdown: "Category Breakdown",
    loadedTransactionsNote: "Based on currently loaded live transactions. Not historical trend data.",
    currentLoadedDatasetVolumeNote: "Current loaded dataset ranking by total volume, capped at 5 assets.",
    currentLoadedDatasetSoldNote: "Current loaded dataset ranking by total sold value, capped at 5 actors.",
    currentLoadedDatasetBoughtNote: "Current loaded dataset ranking by total bought value, capped at 5 actors.",
    sortedByCurrentLoadedVolume: "Sorted by current loaded volume.",
    trades: "Trades",
    volume: "Volume",
    quantity: "Quantity",
    avgUnit: "Avg Unit",
    lastUnit: "Last Unit",
    latest: "Latest",
    sold: "Sold",
    bought: "Bought",
    totalValue: "Total Value",
    mainAssets: "Main Assets",
    lastSeen: "Last Seen",
    shown: "shown"
  },
  search: {
    currentLoadedSnapshot: "Search current loaded snapshot",
    assetsOrActorsInLoadedSnapshot: "Search assets or actors in loaded snapshot",
    notHistoricalGlobal: "Not historical global search"
  },
  sort: {
    label: "Sort",
    relevance: "Relevance",
    value: "Loaded Volume",
    activity: "Loaded Trades",
    latest: "Latest",
    name: "Name"
  },
  snapshot: {
    searchTitle: "Snapshot Search",
    scopeNote: "Search and detail views use the currently loaded MarketModel snapshot only. Not historical global search.",
    resultScopeNote: "Search results use the currently loaded marketplace snapshot. Category filters may limit visible results.",
    historicalGlobalRequiresDatabase: "Historical global search requires future historical database read support.",
    resultType: "Snapshot result type",
    assetSearchResults: "Asset search results",
    actorSearchResults: "Actor search results",
    assetsMode: "Assets",
    actorsMode: "Actors",
    selected: "Selected",
    showingResults: "Showing {shown} of {total} matching {kind}.",
    resultsCapped: "Result list is capped at {count}.",
    selectedUnavailableTitle: "Selected {kind} is not available",
    selectedUnavailableBody: "The selected {kind} is not available in the current category filter or loaded snapshot."
  },
  asset: {
    snapshotStats: "Snapshot Asset Stats",
    identityTaxonomy: "Asset Identity / Taxonomy",
    identityAndTaxonomy: "Asset identity and taxonomy",
    assetClass: "Asset Class",
    category: "Category",
    group: "Group",
    loadedTrades: "Loaded Trades",
    loadedVolume: "Loaded Volume",
    loadedQuantity: "Loaded Quantity",
    snapshotAvgUnit: "Snapshot Avg Unit",
    latestLoadedUnit: "Latest Loaded Unit",
    latestLoadedTrade: "Latest Loaded Trade",
    loadedSellers: "Loaded Sellers",
    loadedBuyers: "Loaded Buyers",
    recentLoadedTransactions: "Recent Loaded Transactions",
    snapshotNote: "This section uses the currently loaded marketplace data only. True 7D/30D history requires the paused historical database phase."
  },
  actor: {
    snapshotStats: "Snapshot Actor Stats",
    identity: "Actor Identity",
    actor: "Actor",
    loadedSoldCount: "Loaded Sold Count",
    loadedBoughtCount: "Loaded Bought Count",
    loadedSoldVolume: "Loaded Sold Volume",
    loadedBoughtVolume: "Loaded Bought Volume",
    loadedParticipationValue: "Loaded Participation Value",
    loadedMainAssets: "Loaded Main Assets",
    loadedCounterparties: "Loaded Counterparties",
    latestLoadedActivity: "Latest Loaded Activity",
    recentLoadedActorTransactions: "Recent Loaded Actor Transactions",
    participationStats: "Loaded actor participation statistics",
    snapshotNote: "This section uses the currently loaded marketplace data only. True 7D/30D actor history requires the paused historical database phase."
  },
  transactions: {
    recentTransactions: "Recent Transactions",
    recentLoadedTransactions: "Recent Loaded Transactions",
    records: "{count} records",
    recordsVisible: "{visible} of {total} records",
    asset: "Asset",
    quantity: "Quantity",
    total: "Total",
    unit: "Unit",
    seller: "Seller",
    buyer: "Buyer",
    time: "Time",
    units: "units"
  },
  empty: {
    noActivity: "No activity yet.",
    noAssetActivity: "No asset activity yet.",
    noSellerActivity: "No seller activity yet.",
    noBuyerActivity: "No buyer activity yet.",
    noAssets: "No assets",
    noRecentTransactions: "No recent transactions.",
    noTransactionsReturned: "No transactions returned.",
    noMatchingSnapshotResults: "No matching {plural} in the current loaded snapshot.",
    noQuerySnapshotResults: "No {plural} match \"{query}\" in the current loaded snapshot.",
    assetStatsPending: "Snapshot asset stats will appear after the model is built.",
    actorStatsPending: "Actor stats will appear after the model is built.",
    noMarketSignals: "No market signal modules are enabled in this phase.",
    noSignals: "No signals."
  },
  signals: {
    marketSignals: "Market Signals",
    signals: "Signals",
    signalModules: "Signal Modules",
    enabled: "enabled",
    placeholderOnly: "Placeholder only",
    futurePhase: "Future phase"
  }
};

const zhHant = deepMerge(en, {
  app: {
    title: "市場情報儀表板",
    subtitle: "以 Elf Continent 作為第一個來源 adapter 的可重用市場模型基礎。",
    versionEyebrow: "V2-2 市場覆蓋"
  },
  language: { label: "語言", nativeName: "繁體中文" },
  action: {
    refreshLiveData: "重新整理即時資料",
    refreshing: "重新整理中...",
    search: "搜尋",
    clearSearch: "清除搜尋",
    clearSelection: "清除選取",
    viewAssetSnapshot: "查看資產快照",
    viewActorSnapshot: "查看參與者快照"
  },
  status: {
    loading: "載入中",
    updated: "已更新",
    loadingLiveMarketTransactions: "正在載入即時市場交易...",
    requestingCoverageItems: "正在請求 {count} 個覆蓋項目。",
    updatedFromLiveAdapter: "已從 Elf 即時 adapter 更新。",
    partialDataLoaded: "已載入部分資料。部分項目失敗。",
    tokenRefreshFailedLiveUnavailable: "Token 重新整理失敗。即時資料無法使用。",
    itemRequestFailedLiveUnavailable: "項目請求失敗。即時資料無法使用。",
    noTransactionsReturned: "沒有回傳交易。",
    unexpectedApiResponseFormat: "API 回應格式不符合預期。",
    waitingForData: "等待資料",
    updatedAt: "已更新 {time}",
    itemsLoaded: "已載入 {loaded}/{requested} 個項目。",
    itemsLoadedWithFailures: "已載入 {loaded}/{requested} 個項目，{failed} 個失敗。"
  },
  dashboard: {
    marketTotals: "市場總覽",
    transactions: "交易",
    totalVolume: "總成交量",
    activeSellers: "活躍賣家",
    activeBuyers: "活躍買家",
    modelSnapshot: "模型快照",
    source: "來源",
    pending: "等待中",
    latestTransaction: "最新交易",
    noTransactions: "沒有交易",
    signalModules: "訊號模組"
  },
  coverage: {
    assetCategoryFilter: "資產分類篩選",
    assetCoverage: "資產覆蓋",
    categoryFilters: "分類篩選",
    topLevelAssetClasses: "頂層資產類別",
    assetCategories: "資產分類",
    assets: "資產",
    categories: "分類",
    all: "全部",
    assetClass: {
      resourcesMaterials: "資源 / 材料",
      blueprintsProgression: "藍圖 / 進度",
      cosmeticsCollectibles: "外觀 / 收藏品",
      unclassifiedOther: "未分類 / 其他"
    }
  },
  analytics: {
    marketActivitySummary: "市場活動摘要",
    topTradedAssetsSnapshot: "熱門交易資產快照",
    topLoadedSellers: "目前載入賣家排行",
    topLoadedBuyers: "目前載入買家排行",
    assetClassBreakdown: "資產類別分布",
    categoryBreakdown: "分類分布",
    loadedTransactionsNote: "根據目前載入的即時交易資料。不是歷史趨勢資料。",
    currentLoadedDatasetVolumeNote: "目前載入資料集中依總成交量排序，最多顯示 5 個資產。",
    currentLoadedDatasetSoldNote: "目前載入資料集中依總賣出價值排序，最多顯示 5 位參與者。",
    currentLoadedDatasetBoughtNote: "目前載入資料集中依總買入價值排序，最多顯示 5 位參與者。",
    sortedByCurrentLoadedVolume: "依目前載入成交量排序。",
    trades: "交易",
    volume: "成交量",
    quantity: "數量",
    avgUnit: "平均單價",
    lastUnit: "最新單價",
    latest: "最新",
    sold: "賣出",
    bought: "買入",
    totalValue: "總價值",
    mainAssets: "主要資產",
    lastSeen: "最後出現",
    shown: "顯示"
  },
  search: {
    currentLoadedSnapshot: "搜尋目前載入快照",
    assetsOrActorsInLoadedSnapshot: "搜尋目前載入快照中的資產或參與者",
    notHistoricalGlobal: "不是歷史全域搜尋"
  },
  sort: {
    label: "排序",
    relevance: "相關性",
    value: "載入成交量",
    activity: "載入交易數",
    latest: "最新",
    name: "名稱"
  },
  snapshot: {
    searchTitle: "快照搜尋",
    scopeNote: "搜尋與詳細頁只使用目前載入的 MarketModel 快照。不是歷史全域搜尋。",
    resultScopeNote: "搜尋結果使用目前載入的市場快照。分類篩選可能限制可見結果。",
    historicalGlobalRequiresDatabase: "歷史全域搜尋需要未來的歷史資料庫讀取支援。",
    resultType: "快照結果類型",
    assetSearchResults: "資產搜尋結果",
    actorSearchResults: "參與者搜尋結果",
    assetsMode: "資產",
    actorsMode: "參與者",
    selected: "已選取",
    showingResults: "顯示 {shown} / {total} 個符合的 {kind}。",
    resultsCapped: "結果清單上限為 {count}。",
    selectedUnavailableTitle: "選取的 {kind} 無法使用",
    selectedUnavailableBody: "選取的 {kind} 不在目前分類篩選或載入快照中。"
  },
  asset: {
    snapshotStats: "資產快照統計",
    identityTaxonomy: "資產識別 / 分類",
    identityAndTaxonomy: "資產識別與分類",
    assetClass: "資產類別",
    category: "分類",
    group: "群組",
    loadedTrades: "載入交易數",
    loadedVolume: "載入成交量",
    loadedQuantity: "載入數量",
    snapshotAvgUnit: "快照平均單價",
    latestLoadedUnit: "最新載入單價",
    latestLoadedTrade: "最新載入交易",
    loadedSellers: "載入賣家",
    loadedBuyers: "載入買家",
    recentLoadedTransactions: "近期載入交易",
    snapshotNote: "本區只使用目前載入的市場資料。真正的 7D/30D 歷史需要已暫停的歷史資料庫階段。"
  },
  actor: {
    snapshotStats: "參與者快照統計",
    identity: "參與者識別",
    actor: "參與者",
    loadedSoldCount: "載入賣出次數",
    loadedBoughtCount: "載入買入次數",
    loadedSoldVolume: "載入賣出量",
    loadedBoughtVolume: "載入買入量",
    loadedParticipationValue: "載入參與價值",
    loadedMainAssets: "載入主要資產",
    loadedCounterparties: "載入交易對手",
    latestLoadedActivity: "最新載入活動",
    recentLoadedActorTransactions: "近期載入參與者交易",
    participationStats: "載入參與者活動統計",
    snapshotNote: "本區只使用目前載入的市場資料。真正的 7D/30D 參與者歷史需要已暫停的歷史資料庫階段。"
  },
  transactions: {
    recentTransactions: "近期交易",
    recentLoadedTransactions: "近期載入交易",
    records: "{count} 筆記錄",
    recordsVisible: "{visible} / {total} 筆記錄",
    asset: "資產",
    quantity: "數量",
    total: "總計",
    unit: "單價",
    seller: "賣家",
    buyer: "買家",
    time: "時間",
    units: "單位"
  },
  empty: {
    noActivity: "尚無活動。",
    noAssetActivity: "尚無資產活動。",
    noSellerActivity: "尚無賣家活動。",
    noBuyerActivity: "尚無買家活動。",
    noAssets: "沒有資產",
    noRecentTransactions: "沒有近期交易。",
    noTransactionsReturned: "沒有回傳交易。",
    noMatchingSnapshotResults: "目前載入快照中沒有符合的 {plural}。",
    noQuerySnapshotResults: "目前載入快照中沒有符合「{query}」的 {plural}。",
    assetStatsPending: "模型建立後會顯示資產快照統計。",
    actorStatsPending: "模型建立後會顯示參與者統計。",
    noMarketSignals: "此階段沒有啟用市場訊號模組。",
    noSignals: "沒有訊號。"
  },
  signals: {
    marketSignals: "市場訊號",
    signals: "訊號",
    signalModules: "訊號模組",
    enabled: "已啟用",
    placeholderOnly: "僅為佔位",
    futurePhase: "未來階段"
  }
});

const ja = deepMerge(en, {
  app: { title: "市場インテリジェンスダッシュボード", subtitle: "Elf Continent を最初のソース adapter とする再利用可能な市場モデル基盤。", versionEyebrow: "V2-2 市場カバレッジ" },
  language: { label: "言語", nativeName: "日本語" },
  action: { refreshLiveData: "ライブデータ更新", refreshing: "更新中...", search: "検索", clearSearch: "検索をクリア", clearSelection: "選択をクリア", viewAssetSnapshot: "資産スナップショットを見る", viewActorSnapshot: "参加者スナップショットを見る" },
  dashboard: { transactions: "取引", totalVolume: "総出来高", activeSellers: "アクティブ売り手", activeBuyers: "アクティブ買い手", modelSnapshot: "モデルスナップショット", source: "ソース", pending: "保留中", latestTransaction: "最新取引", noTransactions: "取引なし", signalModules: "シグナルモジュール" },
  coverage: { assetCoverage: "資産カバレッジ", categoryFilters: "カテゴリフィルター", assets: "資産", categories: "カテゴリ", all: "すべて" },
  analytics: { marketActivitySummary: "市場活動サマリー", topLoadedSellers: "読み込み済み売り手上位", topLoadedBuyers: "読み込み済み買い手上位", trades: "取引", volume: "出来高", quantity: "数量", latest: "最新", shown: "表示" },
  search: { currentLoadedSnapshot: "現在読み込み済みスナップショットを検索", assetsOrActorsInLoadedSnapshot: "読み込み済みスナップショット内の資産または参加者を検索", notHistoricalGlobal: "履歴グローバル検索ではありません" },
  sort: { label: "並び替え", value: "読み込み済み出来高", activity: "読み込み済み取引", latest: "最新", name: "名前" },
  snapshot: { searchTitle: "スナップショット検索", assetsMode: "資産", actorsMode: "参加者", selected: "選択中" },
  asset: { snapshotStats: "資産スナップショット統計", loadedTrades: "読み込み済み取引", loadedVolume: "読み込み済み出来高", loadedQuantity: "読み込み済み数量", latestLoadedTrade: "最新読み込み済み取引" },
  actor: { snapshotStats: "参加者スナップショット統計", loadedSoldCount: "読み込み済み売却数", loadedBoughtCount: "読み込み済み購入数", loadedMainAssets: "読み込み済み主要資産" },
  transactions: { recentTransactions: "最近の取引", asset: "資産", quantity: "数量", total: "合計", unit: "単価", seller: "売り手", buyer: "買い手", time: "時間", units: "単位" },
  signals: { marketSignals: "市場シグナル", enabled: "有効" }
});

const ko = deepMerge(en, {
  app: { title: "시장 인텔리전스 대시보드", subtitle: "Elf Continent를 첫 소스 adapter로 사용하는 재사용 가능한 시장 모델 기반.", versionEyebrow: "V2-2 시장 커버리지" },
  language: { label: "언어", nativeName: "한국어" },
  action: { refreshLiveData: "실시간 데이터 새로고침", refreshing: "새로고침 중...", search: "검색", clearSearch: "검색 지우기", clearSelection: "선택 지우기", viewAssetSnapshot: "자산 스냅샷 보기", viewActorSnapshot: "참여자 스냅샷 보기" },
  dashboard: { transactions: "거래", totalVolume: "총 거래량", activeSellers: "활성 판매자", activeBuyers: "활성 구매자", modelSnapshot: "모델 스냅샷", source: "소스", pending: "대기 중", latestTransaction: "최신 거래", noTransactions: "거래 없음", signalModules: "신호 모듈" },
  coverage: { assetCoverage: "자산 커버리지", categoryFilters: "카테고리 필터", assets: "자산", categories: "카테고리", all: "전체" },
  analytics: { marketActivitySummary: "시장 활동 요약", topLoadedSellers: "로드된 상위 판매자", topLoadedBuyers: "로드된 상위 구매자", trades: "거래", volume: "거래량", quantity: "수량", latest: "최신", shown: "표시" },
  search: { currentLoadedSnapshot: "현재 로드된 스냅샷 검색", assetsOrActorsInLoadedSnapshot: "로드된 스냅샷의 자산 또는 참여자 검색", notHistoricalGlobal: "역사적 전역 검색이 아님" },
  sort: { label: "정렬", value: "로드된 거래량", activity: "로드된 거래", latest: "최신", name: "이름" },
  snapshot: { searchTitle: "스냅샷 검색", assetsMode: "자산", actorsMode: "참여자", selected: "선택됨" },
  asset: { snapshotStats: "자산 스냅샷 통계", loadedTrades: "로드된 거래", loadedVolume: "로드된 거래량", loadedQuantity: "로드된 수량", latestLoadedTrade: "최신 로드 거래" },
  actor: { snapshotStats: "참여자 스냅샷 통계", loadedSoldCount: "로드된 판매 수", loadedBoughtCount: "로드된 구매 수", loadedMainAssets: "로드된 주요 자산" },
  transactions: { recentTransactions: "최근 거래", asset: "자산", quantity: "수량", total: "합계", unit: "단가", seller: "판매자", buyer: "구매자", time: "시간", units: "단위" },
  signals: { marketSignals: "시장 신호", enabled: "활성화됨" }
});

const vi = deepMerge(en, {
  app: { title: "Bảng Điều Khiển Tình Báo Thị Trường", subtitle: "Nền tảng MarketModel tái sử dụng với Elf Continent là adapter nguồn đầu tiên.", versionEyebrow: "V2-2 Phạm Vi Thị Trường" },
  language: { label: "Ngôn ngữ", nativeName: "Tiếng Việt" },
  action: { refreshLiveData: "Làm mới dữ liệu trực tiếp", refreshing: "Đang làm mới...", search: "Tìm kiếm", clearSearch: "Xóa tìm kiếm", clearSelection: "Xóa lựa chọn", viewAssetSnapshot: "Xem ảnh chụp tài sản", viewActorSnapshot: "Xem ảnh chụp người tham gia" },
  dashboard: { transactions: "Giao dịch", totalVolume: "Tổng khối lượng", activeSellers: "Người bán hoạt động", activeBuyers: "Người mua hoạt động", modelSnapshot: "Ảnh chụp mô hình", source: "Nguồn", pending: "Đang chờ", latestTransaction: "Giao dịch mới nhất", noTransactions: "Không có giao dịch", signalModules: "Mô-đun tín hiệu" },
  coverage: { assetCoverage: "Phạm vi tài sản", categoryFilters: "Bộ lọc danh mục", assets: "tài sản", categories: "danh mục", all: "Tất cả" },
  analytics: { marketActivitySummary: "Tóm tắt hoạt động thị trường", topLoadedSellers: "Người bán đã tải hàng đầu", topLoadedBuyers: "Người mua đã tải hàng đầu", trades: "Giao dịch", volume: "Khối lượng", quantity: "Số lượng", latest: "Mới nhất", shown: "hiển thị" },
  search: { currentLoadedSnapshot: "Tìm trong ảnh chụp đã tải", assetsOrActorsInLoadedSnapshot: "Tìm tài sản hoặc người tham gia trong ảnh chụp đã tải", notHistoricalGlobal: "Không phải tìm kiếm lịch sử toàn cục" },
  sort: { label: "Sắp xếp", value: "Khối lượng đã tải", activity: "Giao dịch đã tải", latest: "Mới nhất", name: "Tên" },
  snapshot: { searchTitle: "Tìm kiếm ảnh chụp", assetsMode: "Tài sản", actorsMode: "Người tham gia", selected: "Đã chọn" },
  asset: { snapshotStats: "Thống kê tài sản ảnh chụp", loadedTrades: "Giao dịch đã tải", loadedVolume: "Khối lượng đã tải", loadedQuantity: "Số lượng đã tải", latestLoadedTrade: "Giao dịch đã tải mới nhất" },
  actor: { snapshotStats: "Thống kê người tham gia ảnh chụp", loadedSoldCount: "Số lần bán đã tải", loadedBoughtCount: "Số lần mua đã tải", loadedMainAssets: "Tài sản chính đã tải" },
  transactions: { recentTransactions: "Giao dịch gần đây", asset: "Tài sản", quantity: "Số lượng", total: "Tổng", unit: "Đơn vị", seller: "Người bán", buyer: "Người mua", time: "Thời gian", units: "đơn vị" },
  signals: { marketSignals: "Tín hiệu thị trường", enabled: "đã bật" }
});

export const translations = {
  en,
  "zh-Hant": zhHant,
  ja,
  ko,
  vi
};

function deepMerge(base, overrides) {
  const merged = cloneValue(base);
  mergeInto(merged, overrides);
  return merged;
}

function cloneValue(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, cloneValue(entry)])
  );
}

function mergeInto(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      target[key] = mergeInto({ ...(target[key] ?? {}) }, value);
    } else {
      target[key] = value;
    }
  }

  return target;
}
