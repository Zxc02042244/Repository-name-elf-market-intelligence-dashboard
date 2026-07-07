export const translations = {
  en: {
    app: {
      title: "Market Intelligence Dashboard",
      subtitle: "Reusable market model foundation with Elf Continent as the first source adapter.",
      versionEyebrow: "V2-2 Market Coverage"
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
      transactions: "Transactions",
      totalVolume: "Total Volume",
      activeSellers: "Active Sellers",
      activeBuyers: "Active Buyers",
      modelSnapshot: "Model Snapshot",
      source: "Source",
      pending: "Pending",
      latestTransaction: "Latest Transaction",
      signalModules: "Signal Modules"
    },
    coverage: {
      assetCoverage: "Asset Coverage",
      categoryFilters: "Category Filters",
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
      topSellersSnapshot: "Top Sellers Snapshot",
      topBuyersSnapshot: "Top Buyers Snapshot",
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
      records: "{count} records",
      recordsVisible: "{visible} of {total} records",
      quantity: "Quantity",
      total: "Total",
      unit: "Unit",
      seller: "Seller",
      buyer: "Buyer",
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
      noMarketSignals: "No market signal modules are enabled in this phase."
    },
    signals: {
      marketSignals: "Market Signals",
      enabled: "enabled"
    }
  },
  "zh-Hant": {
    app: {
      title: "市場情報儀表板",
      subtitle: "以 Elf Continent 作為第一個來源 adapter 的可重用市場模型基礎。",
      versionEyebrow: "V2-2 市場覆蓋"
    },
    action: {
      refreshLiveData: "更新即時資料",
      refreshing: "更新中...",
      search: "搜尋",
      clearSearch: "清除搜尋",
      clearSelection: "清除選取",
      viewAssetSnapshot: "查看資產快照",
      viewActorSnapshot: "查看參與者快照"
    },
    status: {
      loadingLiveMarketTransactions: "正在載入即時市場交易...",
      requestingCoverageItems: "正在請求 {count} 個覆蓋項目。",
      requestingMarketCoverageSeedItems: "正在請求市場覆蓋種子項目。",
      updatedFromLiveAdapter: "已由 Elf live adapter 更新。",
      partialDataLoaded: "已載入部分資料。部分項目失敗。",
      tokenRefreshFailed: "Token 更新失敗。",
      liveDataUnavailable: "即時資料目前不可用。",
      tokenRefreshFailedLiveUnavailable: "Token 更新失敗。即時資料目前不可用。",
      itemRequestFailed: "項目請求失敗。",
      itemRequestFailedLiveUnavailable: "項目請求失敗。即時資料目前不可用。",
      noTransactionsReturned: "沒有回傳交易。",
      unexpectedApiResponseFormat: "API 回應格式非預期。",
      waitingForData: "等待資料",
      updatedAt: "已更新 {time}",
      itemsLoaded: "已載入 {loaded}/{requested} 個項目。",
      itemsLoadedWithFailures: "已載入 {loaded}/{requested} 個項目，{failed} 個失敗。",
      unableToBuildMarketModel: "無法建立市場模型。",
      marketModelUpdated: "市場模型已更新。"
    },
    dashboard: {
      transactions: "交易數",
      totalVolume: "總成交量",
      activeSellers: "活躍賣家",
      activeBuyers: "活躍買家",
      modelSnapshot: "模型快照",
      source: "來源",
      pending: "等待中",
      latestTransaction: "最新交易",
      signalModules: "訊號模組"
    },
    coverage: {
      assetCoverage: "資產覆蓋",
      categoryFilters: "分類篩選",
      assets: "資產",
      categories: "分類",
      all: "全部",
      assetClass: {
        resourcesMaterials: "資源 / 材料",
        blueprintsProgression: "藍圖 / 進度",
        cosmeticsCollectibles: "外觀 / 收藏",
        unclassifiedOther: "未分類 / 其他"
      }
    },
    analytics: {
      marketActivitySummary: "市場活動摘要",
      topTradedAssetsSnapshot: "熱門交易資產快照",
      topSellersSnapshot: "熱門賣家快照",
      topBuyersSnapshot: "熱門買家快照",
      assetClassBreakdown: "資產類別分佈",
      categoryBreakdown: "分類分佈",
      loadedTransactionsNote: "基於目前已載入的即時交易。不是歷史趨勢資料。",
      currentLoadedDatasetVolumeNote: "目前已載入資料集依總成交量排名，最多顯示 5 個資產。",
      currentLoadedDatasetSoldNote: "目前已載入資料集依總賣出價值排名，最多顯示 5 位參與者。",
      currentLoadedDatasetBoughtNote: "目前已載入資料集依總買入價值排名，最多顯示 5 位參與者。",
      sortedByCurrentLoadedVolume: "依目前已載入成交量排序。",
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
      shown: "已顯示"
    },
    search: {
      currentLoadedSnapshot: "搜尋目前已載入快照",
      assetsOrActorsInLoadedSnapshot: "搜尋已載入快照中的資產或參與者",
      notHistoricalGlobal: "不是歷史全域搜尋"
    },
    snapshot: {
      searchTitle: "快照搜尋",
      scopeNote: "搜尋與詳細頁只使用目前已載入的 MarketModel 快照。不是歷史全域搜尋。",
      resultScopeNote: "搜尋結果使用目前已載入的市場快照。分類篩選可能限制可見結果。",
      historicalGlobalRequiresDatabase: "歷史全域搜尋需要未來的歷史資料庫讀取支援。",
      resultType: "快照結果類型",
      assetSearchResults: "資產搜尋結果",
      actorSearchResults: "參與者搜尋結果",
      assetsMode: "資產",
      actorsMode: "參與者",
      selected: "已選取",
      showingResults: "顯示 {shown} / {total} 個符合的 {kind}。",
      resultsCapped: "結果清單上限為 {count}。",
      selectedUnavailableTitle: "選取的 {kind} 目前不可用",
      selectedUnavailableBody: "選取的 {kind} 不在目前分類篩選或已載入快照中。"
    },
    asset: {
      snapshotStats: "快照資產統計",
      identityTaxonomy: "資產身分 / 分類",
      identityAndTaxonomy: "資產身分與分類",
      assetClass: "資產類別",
      category: "分類",
      group: "群組",
      loadedTrades: "已載入交易",
      loadedVolume: "已載入成交量",
      loadedQuantity: "已載入數量",
      snapshotAvgUnit: "快照平均單價",
      latestLoadedUnit: "最新載入單價",
      latestLoadedTrade: "最新載入交易",
      loadedSellers: "已載入賣家",
      loadedBuyers: "已載入買家",
      recentLoadedTransactions: "近期已載入交易",
      snapshotNote: "本區只使用目前已載入的市場資料。真正的 7D/30D 歷史需要已暫停的歷史資料庫階段。"
    },
    actor: {
      snapshotStats: "快照參與者統計",
      identity: "參與者身分",
      actor: "參與者",
      loadedSoldCount: "已載入賣出次數",
      loadedBoughtCount: "已載入買入次數",
      loadedSoldVolume: "已載入賣出量",
      loadedBoughtVolume: "已載入買入量",
      loadedParticipationValue: "已載入參與價值",
      loadedMainAssets: "已載入主要資產",
      loadedCounterparties: "已載入交易對手",
      latestLoadedActivity: "最新載入活動",
      recentLoadedActorTransactions: "近期已載入參與者交易",
      participationStats: "已載入參與者市場活動統計",
      snapshotNote: "本區只使用目前已載入的市場資料。真正的 7D/30D 參與者歷史需要已暫停的歷史資料庫階段。"
    },
    transactions: {
      recentTransactions: "近期交易",
      records: "{count} 筆紀錄",
      recordsVisible: "{visible} / {total} 筆紀錄",
      quantity: "數量",
      total: "總額",
      unit: "單價",
      seller: "賣家",
      buyer: "買家",
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
      noMatchingSnapshotResults: "目前已載入快照中沒有符合的 {plural}。",
      noQuerySnapshotResults: "目前已載入快照中沒有符合「{query}」的 {plural}。",
      assetStatsPending: "模型建立後會顯示快照資產統計。",
      actorStatsPending: "模型建立後會顯示參與者統計。",
      noMarketSignals: "此階段尚未啟用市場訊號模組。"
    },
    signals: {
      marketSignals: "市場訊號",
      enabled: "已啟用"
    }
  },
  ja: {
    search: {
      currentLoadedSnapshot: "現在読み込まれているスナップショットを検索",
      assetsOrActorsInLoadedSnapshot: "読み込み済みスナップショット内の資産または参加者を検索",
      notHistoricalGlobal: "履歴全体検索ではありません"
    },
    action: {
      clearSearch: "検索をクリア",
      clearSelection: "選択をクリア"
    },
    asset: {
      snapshotStats: "スナップショット資産統計",
      loadedTrades: "読み込み済み取引",
      loadedVolume: "読み込み済み出来高",
      loadedQuantity: "読み込み済み数量",
      snapshotAvgUnit: "スナップショット平均単価",
      latestLoadedUnit: "最新読み込み単価",
      latestLoadedTrade: "最新読み込み取引",
      recentLoadedTransactions: "最近の読み込み済み取引"
    },
    actor: {
      snapshotStats: "スナップショット参加者統計",
      loadedSoldCount: "読み込み済み販売数",
      loadedBoughtCount: "読み込み済み購入数",
      loadedSoldVolume: "読み込み済み販売量",
      loadedBoughtVolume: "読み込み済み購入量",
      loadedParticipationValue: "読み込み済み参加価値",
      loadedMainAssets: "読み込み済み主要資産",
      loadedCounterparties: "読み込み済み取引相手",
      latestLoadedActivity: "最新読み込み活動",
      recentLoadedActorTransactions: "最近の読み込み済み参加者取引"
    },
    status: {
      tokenRefreshFailed: "トークン更新に失敗しました。",
      liveDataUnavailable: "ライブデータは利用できません。",
      partialDataLoaded: "一部のデータを読み込みました。一部の項目は失敗しました。",
      unexpectedApiResponseFormat: "API レスポンス形式が予期しない形式です。",
      noTransactionsReturned: "取引は返されませんでした。"
    }
  },
  ko: {
    search: {
      currentLoadedSnapshot: "현재 로드된 스냅샷 검색",
      assetsOrActorsInLoadedSnapshot: "로드된 스냅샷의 자산 또는 참여자 검색",
      notHistoricalGlobal: "과거 전체 검색이 아닙니다"
    },
    action: {
      clearSearch: "검색 지우기",
      clearSelection: "선택 해제"
    },
    asset: {
      snapshotStats: "스냅샷 자산 통계",
      loadedTrades: "로드된 거래",
      loadedVolume: "로드된 거래량",
      loadedQuantity: "로드된 수량",
      snapshotAvgUnit: "스냅샷 평균 단가",
      latestLoadedUnit: "최신 로드 단가",
      latestLoadedTrade: "최신 로드 거래",
      recentLoadedTransactions: "최근 로드된 거래"
    },
    actor: {
      snapshotStats: "스냅샷 참여자 통계",
      loadedSoldCount: "로드된 판매 수",
      loadedBoughtCount: "로드된 구매 수",
      loadedSoldVolume: "로드된 판매량",
      loadedBoughtVolume: "로드된 구매량",
      loadedParticipationValue: "로드된 참여 가치",
      loadedMainAssets: "로드된 주요 자산",
      loadedCounterparties: "로드된 거래 상대",
      latestLoadedActivity: "최신 로드 활동",
      recentLoadedActorTransactions: "최근 로드된 참여자 거래"
    },
    status: {
      tokenRefreshFailed: "토큰 갱신에 실패했습니다.",
      liveDataUnavailable: "라이브 데이터를 사용할 수 없습니다.",
      partialDataLoaded: "일부 데이터를 로드했습니다. 일부 항목은 실패했습니다.",
      unexpectedApiResponseFormat: "예상하지 못한 API 응답 형식입니다.",
      noTransactionsReturned: "반환된 거래가 없습니다."
    }
  },
  vi: {
    search: {
      currentLoadedSnapshot: "Tìm trong ảnh chụp đã tải hiện tại",
      assetsOrActorsInLoadedSnapshot: "Tìm tài sản hoặc người tham gia trong ảnh chụp đã tải",
      notHistoricalGlobal: "Không phải tìm kiếm lịch sử toàn cục"
    },
    action: {
      clearSearch: "Xóa tìm kiếm",
      clearSelection: "Xóa lựa chọn"
    },
    asset: {
      snapshotStats: "Thống kê tài sản theo ảnh chụp",
      loadedTrades: "Giao dịch đã tải",
      loadedVolume: "Khối lượng đã tải",
      loadedQuantity: "Số lượng đã tải",
      snapshotAvgUnit: "Đơn giá trung bình ảnh chụp",
      latestLoadedUnit: "Đơn giá đã tải mới nhất",
      latestLoadedTrade: "Giao dịch đã tải mới nhất",
      recentLoadedTransactions: "Giao dịch đã tải gần đây"
    },
    actor: {
      snapshotStats: "Thống kê người tham gia theo ảnh chụp",
      loadedSoldCount: "Số lần bán đã tải",
      loadedBoughtCount: "Số lần mua đã tải",
      loadedSoldVolume: "Khối lượng bán đã tải",
      loadedBoughtVolume: "Khối lượng mua đã tải",
      loadedParticipationValue: "Giá trị tham gia đã tải",
      loadedMainAssets: "Tài sản chính đã tải",
      loadedCounterparties: "Đối tác đã tải",
      latestLoadedActivity: "Hoạt động đã tải mới nhất",
      recentLoadedActorTransactions: "Giao dịch người tham gia đã tải gần đây"
    },
    status: {
      tokenRefreshFailed: "Làm mới token thất bại.",
      liveDataUnavailable: "Dữ liệu trực tiếp không khả dụng.",
      partialDataLoaded: "Đã tải một phần dữ liệu. Một số mục thất bại.",
      unexpectedApiResponseFormat: "Định dạng phản hồi API không mong đợi.",
      noTransactionsReturned: "Không có giao dịch được trả về."
    }
  }
};
