class Datafeed {
    constructor(url) {
      this.url = url;
    }
  
    // 1️⃣ Called when chart loads
    onReady(callback) {
      setTimeout(() => {
        callback({
          supported_resolutions: ["1", "5", "15", "60", "1D"],
        });
      }, 0);
    }
  
    // 2️⃣ Resolve symbol (VERY IMPORTANT)
    resolveSymbol(symbolName, onResolve, onError) {
  
      const symbolInfo = {
        name: symbolName,
        ticker: symbolName,
        type: "forex",
        session: "24x7",
        timezone: "UTC",
        minmov: 1,
        pricescale: 100,
        has_intraday: true,
        supported_resolutions: ["1", "5", "15", "60", "1D"],
        volume_precision: 2,
        data_status: "streaming",
      };
  
      setTimeout(() => {
        onResolve(symbolInfo);
      }, 0);
    }
  
    // 3️⃣ Get historical candles
    async getBars(symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) {
      const { from, to } = periodParams;
  
  
      try {
        // 🔥 Replace this with your API
        const res = await fetch(
          `${this.url}/history?symbol=${symbolInfo.name}&resolution=${resolution}&from=${from}&to=${to}`
        );
  
        const data = await res.json();
  
        if (!data || data.length === 0) {
          onHistoryCallback([], { noData: true });
          return;
        }
  
        const bars = data.map(item => ({
          time: item.time * 1000, // must be ms
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }));
  
        onHistoryCallback(bars, { noData: false });
  
      } catch (err) {
        onErrorCallback(err);
      }
    }
  
    // 4️⃣ Live updates (optional for now)
    subscribeBars(symbolInfo, resolution, onRealtimeCallback) {
    }
  
    unsubscribeBars() {
    }
  }
  
  export default Datafeed;