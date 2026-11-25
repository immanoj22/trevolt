import React, { useEffect, useRef, useCallback, useState, useContext } from "react";
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import isEmpty from "is-empty";
import { saveChartSettings, getChartSettings } from "../../../actions/subAccountAction";
import '../styles/index.css';
import CloseOrderByChart from "../modal/CloseOrderByChart";
import SocketContext from "../../../context/socketContext";
import { futureCancelOrder, futureClosePosition, futureOpenOrders, futureUpdateBracketOrders, futureUpdateOrders } from "../../../actions/futureActions";
import { showToastMessage } from "../../../lib/toast";
import { formatDisplayPair } from "../../../lib/pairDisplay";

const SAVE_DEBOUNCE_MS = 1500;

const THEMES = {
  dark: {
    background: "#1d1d1d",
    gridColor: "#2A2E39",
    crosshairColor: "#9C9C9C",
    separatorColor: "#2E2E2E",
    textColor: "#999999",
    lineColor: "rgba(242, 242, 242, 0)",
    axisBackground: "#ffffff",
    toolbarBg: "#171717",
  },
  light: {
    background: "#FFFFFF",
    gridColor: "#E0E3EB",
    crosshairColor: "#9C9C9C",
    separatorColor: "#E0E3EB",
    textColor: "#131722",
    lineColor: "rgba(0, 0, 0, 0)",
    axisBackground: "#ffffff",
    toolbarBg: "#ffffff",
  },
};

function normalizeTradingViewTheme(value) {
  const lower = String(value || "").toLowerCase();
  if (lower === "dark" || lower === "black") return "Dark";
  if (lower === "light" || lower === "white") return "Light";
  if (value === "Dark" || value === "Light") return value;
  if (value === "White") return "Light";
  return "Light";
}

function getThemeKey(themeValue) {
  return normalizeTradingViewTheme(themeValue) === "Dark" ? "dark" : "light";
}

function applyCurrentTheme(savedLayout, themeValue = "dark") {
  const layout =
    typeof savedLayout === "string"
      ? JSON.parse(savedLayout)
      : structuredClone(savedLayout);
  const t = THEMES[getThemeKey(themeValue)] ?? THEMES.dark;
  layout.charts.forEach((chart) => {
    const pane = chart.chartProperties.paneProperties;
    const scales = chart.chartProperties.scalesProperties;
    pane.background = t.background;
    pane.backgroundType = "solid";
    pane.vertGridProperties.color = t.gridColor;
    pane.horzGridProperties.color = t.gridColor;
    pane.crossHairProperties.color = t.crosshairColor;
    pane.separatorColor = t.separatorColor;
    scales.textColor = t.textColor;
    scales.lineColor = t.lineColor;
    scales.backgroundColor = t.axisBackground;
  });
  return layout;
}

function injectToolbarBg(containerId, toolbarBgColor) {
  const iframe = document.querySelector(`#${containerId} iframe`);
  if (!iframe?.contentDocument) return;

  const STYLE_ID = "__tv_toolbar_bg_override__";
  const existing = iframe.contentDocument.getElementById(STYLE_ID);
  if (existing) existing.remove();

  const styleEl = iframe.contentDocument.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    html, body, .js-rootresizer__contents, .layout-with-border-radius,
    div[class*="layout_area-top"], div[class*="layout_area-left"],
    div[class*="drawingToolbar-"], div[class*="wrap-Z4M3tWHb"],
    div[class*="scrollWrap-Z4M3tWHb"], div[class*="noScrollBar-Z4M3tWHb"],
    div[class*="content-Z4M3tWHb"], div[class*="inner-BfVZxb4b"],
    div[class*="group-BfVZxb4b"], div[class*="fill-BfVZxb4b"],
    div[class*="lastGroup-BfVZxb4b"], div[class*="chart-toolbar"],
    div[class*="chart-controls-bar"], div[class*="toolbar-BXXUwft2"],
    div[class*="dateRangeWrapper-BXXUwft2"], div[class*="seriesControlWrapper-BXXUwft2"],
    div[class*="collapsed-BXXUwft2"], div[class*="inline-BXXUwft2"],
    div[class*="time-axis"], div[class*="timeScale"], div[class*="timeAxisWidget"],
    div[class*="bottom-widgetbar"], div[class*="bottomBar"], div[class*="statusLine"] {
      background-color: ${toolbarBgColor} !important;
      background:       ${toolbarBgColor} !important;
    }
    div[class*="drawingToolbar-"], div[class*="wrap-Z4M3tWHb"],
    div[class*="content-Z4M3tWHb"], div[class*="layout_area-left"],
    div[class*="layout_area-top"] {
      border: none !important; box-shadow: none !important;
    }
  `;
  iframe.contentDocument.head.appendChild(styleEl);

  const HOST_STYLE_ID = "__tv_host_toolbar_bg__";
  let hostStyle = document.getElementById(HOST_STYLE_ID);
  if (hostStyle) hostStyle.remove();
  hostStyle = document.createElement("style");
  hostStyle.id = HOST_STYLE_ID;
  hostStyle.textContent = `
    div[class*="chart-toolbar"], div[class*="chart-controls-bar"],
    div[class*="toolbar-BXXUwft2"], div[class*="inline-BXXUwft2"],
    div[class*="drawingToolbar-"], div[class*="wrap-Z4M3tWHb"],
    div[class*="content-Z4M3tWHb"], div[class*="time-axis"],
    div[class*="timeAxisWidget"], div[class*="bottom-widgetbar"], div[class*="bottomBar"] {
      background-color: ${toolbarBgColor} !important;
      background:       ${toolbarBgColor} !important;
    }
  `;
  document.head.appendChild(hostStyle);

  const TOOLBAR_RE = /drawingToolbar-|wrap-Z4M3tWHb|scrollWrap-Z4M3tWHb|noScrollBar-Z4M3tWHb|content-Z4M3tWHb|inner-BfVZxb4b|group-BfVZxb4b|fill-BfVZxb4b|lastGroup-BfVZxb4b|inline-BXXUwft2|toolbar-BXXUwft2|dateRange|seriesControl|collapsed-BXXUwft2|chart-toolbar|chart-controls|timeAxis|time-axis|bottomBar|bottom-widgetbar|statusLine/;

  const nukeInlineStyles = () => {
    const doc = iframe.contentDocument;
    if (!doc?.body) return;
    doc.documentElement.style.setProperty('background-color', toolbarBgColor, 'important');
    doc.body.style.setProperty('background-color', toolbarBgColor, 'important');
    doc.querySelectorAll('[style*="background"]').forEach((el) => {
      if (el.className && TOOLBAR_RE.test(typeof el.className === 'string' ? el.className : el.className.baseVal)) {
        el.style.setProperty('background-color', toolbarBgColor, 'important');
        el.style.setProperty('background', toolbarBgColor, 'important');
      }
    });
    const leftSelectors = [
      '[class*="drawingToolbar-"]', '[class*="wrap-Z4M3tWHb"]',
      '[class*="scrollWrap-Z4M3tWHb"]', '[class*="noScrollBar-Z4M3tWHb"]',
      '[class*="content-Z4M3tWHb"]', '[class*="inner-BfVZxb4b"]',
      '[class*="group-BfVZxb4b"]', '[class*="fill-BfVZxb4b"]',
      '[class*="lastGroup-BfVZxb4b"]'
    ].join(',');
    doc.querySelectorAll(leftSelectors).forEach((el) => {
      el.style.setProperty('background-color', toolbarBgColor, 'important');
      el.style.setProperty('background', toolbarBgColor, 'important');
      el.style.removeProperty('border');
      el.style.removeProperty('box-shadow');
    });
  };

  nukeInlineStyles();
  setTimeout(nukeInlineStyles, 200);
  setTimeout(nukeInlineStyles, 600);
  setTimeout(nukeInlineStyles, 1500);

  const observerKey = "__tv_toolbar_observer__";
  if (iframe.contentDocument[observerKey]) iframe.contentDocument[observerKey].disconnect();
  const iframeObserver = new MutationObserver((mutations) => {
    const relevant = mutations.some(m =>
      m.attributeName === 'style' && m.target.className &&
      TOOLBAR_RE.test(typeof m.target.className === 'string' ? m.target.className : m.target.className.baseVal)
    );
    if (relevant) nukeInlineStyles();
  });
  iframeObserver.observe(iframe.contentDocument.body, { subtree: true, attributes: true, attributeFilter: ["style", "class"] });
  iframe.contentDocument[observerKey] = iframeObserver;

  const hostObserverKey = "__tv_host_toolbar_observer__";
  if (window[hostObserverKey]) window[hostObserverKey].disconnect();
  const hostObserver = new MutationObserver(() => nukeInlineStyles());
  hostObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["style", "class"], childList: true });
  window[hostObserverKey] = hostObserver;
}

const normSym = (s) => (s || "").replace(/^MARK:/i, "").toUpperCase();
const safeNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

class FutureBrokerAPI {

  static configFlags = {
    supportPositions: true,
    supportPositionBrackets: true,
    supportClosePosition: true,
    supportPartialClosePosition: false,
    supportOrderBrackets: false,
    supportStopLoss: true,
    supportMarketOrders: true,
    supportLimitOrders: true,
    supportPLUpdate: true,
    supportExecutions: false,
    // supportOrdersHistory: false,
    showNotificationsLog: false,
    supportModifyOrderPrice: true,
    supportEditAmount: false,
    supportReversePosition: false,
    supportDemoLiveSwitcher: false,

    supportModifyBracketOrders: false,
    showQuantityInsteadOfLots: true,
  };

  constructor(host, refs) {
    this._host = host;
    this._refs = refs;
    this._cbs = {};
    this._symbolInfoCache = {};
  }

  setCallbacks(cbs) {
    this._cbs = cbs;
  }

  connectionStatus() {
    return 1;
  }

  async chartContextMenuActions(context, options) {
    return this._host.defaultContextMenuActions(context, options);
  }

  async isTradable(symbol) { return { tradable: true }; }

  async accountsMetainfo() {
    return [{ id: this._refs.accountIdRef.current || "default", name: "Futures Account" }];
  }

  currentAccount() {
    return this._refs.accountIdRef.current || "default";
  }

  accountManagerInfo() {
    return {
      accountTitle: "Futures",
      summary: [],
      orderColumns: [],
      positionColumns: [],
      pages: [],
    };
  }

  async orders() {
    const data = (this._refs.openOrdersRef.current || []).map(rec => {
      const price = safeNumber(rec.price);
      return {
        id: String(rec._id),
        symbol: normSym(rec.pairName || rec.symbol || ""),

        type: 1,
        side: rec.buyorsell === "buy" ? 1 : -1,

        qty: safeNumber(rec.quantity),
        filledQty: 0,

        price: price,
        avgPrice: price,
        limitPrice: price,

        stopPrice: null,

        profit: 0,
        commission: 0,

        status: 6,
        currency: "USD",

        isEditable: true,
        isCancelable: true,

        isWorking: true,
      };
    });


    return data;
  }

  async ordersHistory() { return []; }

  // async positions() {
  //   const all = this._refs.positionDetailsRef.current || [];
  //   const curSym = normSym(this._refs.tikerRootRef.current || "");
  //   const wallet = this._refs.walletRef.current || {};
  //   const pl = parseFloat(wallet.unRealizedPnL ?? 0);

  //   return all
  //     .filter(p => p.positionFilled > 0 && normSym(p.pairName) === curSym)
  //     .map(p => {
  //       const pos = {
  //         id: String(p.pairId),
  //         symbol: normSym(p.pairName),
  //         qty: parseFloat(p.positionFilled),
  //         side: p.positionSide === "long" ? 1 : -1,
  //         avgPrice: safeNumber(p.entryPrice),
  //         pl: safeNumber(pl),
  //         currency: "USD",
  //         longQty: p.positionSide === "long" ? parseFloat(p.positionFilled) : 0,
  //         shortQty: p.positionSide === "short" ? parseFloat(p.positionFilled) : 0,
  //       };
  //       const tp = parseFloat(p.takeProfit);
  //       const sl = parseFloat(p.stopLoss);
  //       if (!isNaN(tp) && tp > 0) pos.takeProfit = tp;
  //       if (!isNaN(sl) && sl > 0) pos.stopLoss = sl;
  //       return pos;
  //     });
  // }

  async positions() {
    const all = this._refs.positionDetailsRef.current || [];
    const curSym = normSym(this._refs.tikerRootRef.current || "");
    const wallet = this._refs.walletRef.current || {};
    const pl = safeNumber(wallet.unRealizedPnL);

    const data = all
      .filter(p => p.positionFilled > 0 && normSym(p.pairName) === curSym)
      .map(p => ({
        id: String(p.pairId),
        symbol: normSym(p.pairName),
        qty: safeNumber(p.positionFilled),
        side: p.positionSide === "long" ? 1 : -1,
        avgPrice: safeNumber(p.entryPrice),
        price: safeNumber(p.entryPrice),
        profit: pl,
        currency: "USD",
      }));


    return data;
  }

  async executions() { return []; }


  // async symbolInfo(symbol) {
  //   if (this._symbolInfoCache[symbol]) return this._symbolInfoCache[symbol];

  //   return new Promise((resolve) => {
  //     const datafeed = this._refs.datafeedRef?.current;

  //     if (datafeed?.resolveSymbol) {
  //       datafeed.resolveSymbol(
  //         symbol,
  //         (info) => {
  //           const result = this._buildSymbolInfo(symbol, info);
  //           console.log("symbolInfo___", result)
  //           this._symbolInfoCache[symbol] = result;
  //           resolve(result);
  //         },
  //         (err) => {
  //           console.log("[BrokerAPI] resolveSymbol error:", err);
  //           resolve(this._hardcodedFallback(symbol));
  //         },
  //         "futures"
  //       );
  //     } else {
  //       resolve(this._hardcodedFallback(symbol));
  //     }
  //   });
  // }

  async formatter(symbol) {
    const info = await this.symbolInfo(symbol);

    const pricescale = info?.pricescale || 100;
    const minmov = info?.minmov || 1;
    const minTick = minmov / pricescale;

    // Return a PriceFormatter-compatible object
    return {
      format: (price, signPositive) => {
        if (price === null || price === undefined || isNaN(price)) return "n/a";
        const decimals = Math.round(Math.log10(pricescale));
        const formatted = price.toFixed(decimals);
        return signPositive && price > 0 ? "+" + formatted : formatted;
      },
      parse: (str) => parseFloat(str),
      formatChange: (change) => {
        if (isNaN(change)) return "n/a";
        const decimals = Math.round(Math.log10(pricescale));
        return (change >= 0 ? "+" : "") + change.toFixed(decimals);
      },
    };
  }


  async quantityFormatter(symbol) {
    return {
      format: (qty) => {
        if (qty === null || qty === undefined || isNaN(qty)) return "0";
        return parseFloat(qty).toFixed(3);
      },
      parse: (str) => parseFloat(str),
    };
  }

  async symbolInfo(symbol) {
    // If already resolved and cached, return it
    if (this._symbolInfoCache[symbol] && !(this._symbolInfoCache[symbol] instanceof Promise)) {
      return this._symbolInfoCache[symbol];
    }

    // If already in-flight, await that same promise (prevents duplicate resolves)
    if (this._symbolInfoCache[symbol] instanceof Promise) {
      return this._symbolInfoCache[symbol];
    }

    const datafeed = this._refs.datafeedRef?.current;

    const promise = new Promise((resolve) => {
      if (datafeed?.resolveSymbol) {
        datafeed.resolveSymbol(
          symbol,
          (info) => {
            const result = { ...info, name: symbol };
            this._symbolInfoCache[symbol] = result; // ✅ replace Promise with resolved value
            resolve(result);
          },
          (err) => {
            const fallback = this._hardcodedFallback(symbol);
            this._symbolInfoCache[symbol] = fallback; // ✅ replace Promise with fallback
            resolve(fallback);
          }
        );
      } else {
        const fallback = this._hardcodedFallback(symbol);
        this._symbolInfoCache[symbol] = fallback;
        resolve(fallback);
      }
    });

    this._symbolInfoCache[symbol] = promise; // temporarily cache the in-flight promise
    return promise;
  }

  _buildSymbolInfo(symbol, info = {}) {
    const pricescale = info.pricescale || 100;
    const minmov = info.minmov || 1;

    return {
      name: symbol,
      ticker: symbol,

      type: "forex",
      session: "24x7",
      timezone: "UTC",

      exchange: "BINANCE",
      listed_exchange: "BINANCE",

      format: "price",

      pricescale,
      minmov,
      minmove2: 0,
      fractional: false,

      has_intraday: true,
      has_seconds: true,
      has_daily: true,
      has_weekly_and_monthly: true,

      supported_resolutions: ["1", "5", "15", "30", "60"],

      volumePrecision: 3,

      currency: "USD",
    };
  }

  // _hardcodedFallback(symbol) {
  //   console.log("_hardcodedFallback", symbol)
  //   const result = this._buildSymbolInfo(symbol, {});
  //   console.log("_hardcodedFallback", result)
  //   this._symbolInfoCache[symbol] = result;
  //   return result;
  // }

  _hardcodedFallback(symbol) {
    const result = {
      name: symbol,
      description: symbol,
      type: "forex",
      session: "24x7",
      exchange: "",
      listed_exchange: "",
      timezone: "Etc/UTC",
      pricescale: 100,
      minmov: 1,
      minTick: 0.01,
      pipValue: 1,
      pipSize: 0.01,
      visible_plots_set: "ohlcv",
      qty: { min: 0.001, max: 1_000_000, step: 0.001, default: 0.01 },
      currency: "USD",
      original_currency_code: "USD",
      unit: "",
      units: null,
      variableMinTick: "",
      domVolumePrecision: 2,
    };
    this._symbolInfoCache[symbol] = result;
    return result;
  }

  // ── Order actions ─────────────────────────────────────────────────────────
  async placeOrder(order) {
    return { orderId: String(Date.now()) };
  }

  async modifyOrder(order) {
    try {

      const newPrice = order.limitPrice ?? order.stopPrice ?? order.price;
      const orderId = order.id;
      const qty = order.qty;

      // ✅ Update backend immediately — no ticket dialog
      const { status, message } = await this._cbs.onUpdateOrder?.(orderId, qty, newPrice) || {};

      if (status) {
        // ✅ Tell TV the order updated successfully at new price
        this._host.orderUpdate({
          id: orderId,
          symbol: order.symbol,
          type: order.type,
          side: order.side,
          qty: qty,
          status: 6,                    // OrderStatus.Working
          limitPrice: newPrice,
          currency: "USD",
          filledQty: 0,
        });
      } else {
        // ✅ On failure, refresh to snap line back to original price
        this._host.ordersFullUpdate();
      }
    } catch (err) {
      console.log("[BrokerAPI] modifyOrder error:", err);
      this._host.ordersFullUpdate(); // snap back on error
    }
  }

  async cancelOrder(orderId) {
    try {
      const result = await this._cbs.onCancelOrder?.(orderId);
      const status = result?.status;
      const message = result?.message;
      showToastMessage(message, status ? "success" : "error");
      if (status) {
        this._host.orderUpdate({ id: orderId, status: 1 });
      }
    } catch (err) {
      console.log("[BrokerAPI] cancelOrder error:", err);
    }
  }

  async closePosition(positionId, amount) {
    const all = this._refs.positionDetailsRef.current || [];
    const item = all.find(p => String(p.pairId) === String(positionId));
    if (!item) return;

    this._cbs.onClosePosition?.({
      pairId: item.pairId,
      positionSide: item.positionSide,
      quantity: amount ?? item.positionFilled,
      price: item.entryPrice,
      typeTIF: "",
      onConfirmed: () => {
        this._host.positionUpdate({
          id: String(item.pairId),
          symbol: normSym(item.pairName),
          qty: 0,
          side: item.positionSide === "long" ? 1 : -1,
          avgPrice: parseFloat(item.entryPrice),
          pl: 0,
        });
      },
    });
  }

  async editPositionBrackets(positionId, brackets) {
    const all = this._refs.positionDetailsRef.current || [];
    const item = all.find(p => String(p.pairId) === String(positionId));
    if (!item) return;

    try {
      if (brackets.takeProfit !== undefined) {

        await this._cbs.onUpdateTpSl?.(item.pairId, "tp", brackets.takeProfit);
      }
      if (brackets.stopLoss !== undefined) {
        await this._cbs.onUpdateTpSl?.(item.pairId, "sl", brackets.stopLoss);
      }

      const idx = this._refs.positionDetailsRef.current.findIndex(
        p => String(p.pairId) === String(positionId)
      );
      if (idx >= 0) {
        if (brackets.takeProfit !== undefined)
          this._refs.positionDetailsRef.current[idx].takeProfit = brackets.takeProfit;
        if (brackets.stopLoss !== undefined)
          this._refs.positionDetailsRef.current[idx].stopLoss = brackets.stopLoss;
      }

      const wallet = this._refs.walletRef.current || {};
      const updated = idx >= 0 ? this._refs.positionDetailsRef.current[idx] : item;

      this._host.positionUpdate({
        id: String(item.pairId),
        symbol: normSym(item.pairName),
        qty: parseFloat(item.positionFilled),
        side: item.positionSide === "long" ? 1 : -1,
        avgPrice: parseFloat(item.entryPrice),
        pl: parseFloat(wallet.unRealizedPnL ?? 0),
        takeProfit:
          brackets.takeProfit ??
          (parseFloat(updated.takeProfit) > 0 ? parseFloat(updated.takeProfit) : undefined),
        stopLoss:
          brackets.stopLoss ??
          (parseFloat(updated.stopLoss) > 0 ? parseFloat(updated.stopLoss) : undefined),
      });
    } catch (err) {
      console.log("[BrokerAPI] editPositionBrackets error:", err);
    }
  }

  refreshPositions() {
    this._host.positionsFullUpdate();
  }

  refreshOrders() {
    this._host.ordersFullUpdate();
  }

  pushPnlUpdate(positionId, pl) {
    this._host.plUpdate(String(positionId), pl);
  }

  pushPositionUpdate(item) { // FIX: was referencing undefined `order` variable
    const wallet = this._refs.walletRef.current || {};
    this._host.positionUpdate({
      id: String(item.pairId),
      symbol: normSym(item.pairName),
      qty: parseFloat(item.positionFilled),
      side: item.positionSide === "long" ? 1 : -1,
      avgPrice: parseFloat(item.entryPrice),
      pl: parseFloat(wallet.unRealizedPnL ?? 0),
      takeProfit: item.takeProfit > 0 ? parseFloat(item.takeProfit) : undefined,
      stopLoss: item.stopLoss > 0 ? parseFloat(item.stopLoss) : undefined,
    });
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────
const TradedPriceChart = (props) => {
  const tikerRoot = props?.symbol;

  const tvWidgetRef = useRef(null);
  const plusRef = useRef(null);
  const saveTimerRef = useRef(null);
  const accountIdRef = useRef(null);
  const secretKeyRef = useRef(null);
  const isChartReadyRef = useRef(false);
  const FutureId = useRef('all');
  const brokerRef = useRef(null);

  const positionDetailsRef = useRef([]);
  const openOrdersRef = useRef([]);
  const tikerRootRef = useRef(tikerRoot);
  const walletRef = useRef(null);

  const socketContext = useContext(SocketContext);

  const [closeData, setCloseData] = useState({});
  const [showCloseOrders, setShowCloseOrders] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useGlobalContext();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const querytheme = queryParams.get("theme");

  const { userdetails, positionDetails, wallet } = useSelector((state) => state.user);
  const accountId = userdetails?.accountId;
  const secretKey = userdetails?.secretKey;

  // ─── Keep refs in sync ────────────────────────────────────────────────────
  useEffect(() => { accountIdRef.current = accountId; }, [accountId]);
  useEffect(() => { secretKeyRef.current = secretKey; }, [secretKey]);
  useEffect(() => { positionDetailsRef.current = positionDetails || []; }, [positionDetails]);
  useEffect(() => { tikerRootRef.current = tikerRoot; }, [tikerRoot]);
  useEffect(() => { walletRef.current = wallet; }, [wallet]);

  // ─── Modal helpers ─────────────────────────────────────────────────────────
  const handleShowCloseOrders = (data) => { setCloseData(data); setShowCloseOrders(true); };
  const handleHideCloseOrders = () => setShowCloseOrders(false);

  // ─── Chart settings ────────────────────────────────────────────────────────


  const persistChartSettings = useCallback(() => {
    if (!tvWidgetRef.current || !accountIdRef.current || !secretKeyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      try {
        tvWidgetRef.current.save(async (chartState) => {
          try {
            await saveChartSettings(
              { accountId: accountIdRef.current, chartSettings: chartState },
              secretKeyRef.current
            );
          } catch (e) {  }
        });
      } catch (e) {  }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // const restoreChartSettings = useCallback(async (currentSymbol, themeValue, themeChange = false) => {
  //   // Guard: widget must exist AND be fully ready
  //   if (!accountIdRef.current || !secretKeyRef.current || !tvWidgetRef.current || !isChartReadyRef.current) return;

  //   try {
  //     const tvTheme = normalizeTradingViewTheme(themeValue);
  //     const themeKey = getThemeKey(themeValue);
  //     const t = THEMES[themeKey];

  //     if (themeChange) {
  //       await tvWidgetRef.current.changeTheme(tvTheme);
  //       tvWidgetRef.current.applyOverrides({ "paneProperties.legendProperties.showLegend": false });
  //       injectToolbarBg(props.containerId, t.toolbarBg);
  //       return;
  //     }

  //     const { status, result } = await getChartSettings(accountIdRef.current, secretKeyRef.current);
  //     if (!status || !result) return;

  //     // Re-check after async gap — widget may have been destroyed during await
  //     if (!tvWidgetRef.current || !isChartReadyRef.current) return;

  //     const patchedResult = applyCurrentTheme(result, themeValue);
  //     tvWidgetRef.current.load(patchedResult);
  //     setTimeout(() => injectToolbarBg(props.containerId, t.toolbarBg), 300);

  //     if (currentSymbol && !isEmpty(currentSymbol)) {
  //       try { tvWidgetRef.current.activeChart().setSymbol(currentSymbol); } catch (e) { }
  //     }
  //   } catch (e) { console.log("[Chart] restoreChartSettings error:", e); }
  // }, [props.containerId]);

  const restoreChartSettings = useCallback(async (currentSymbol, themeValue, themeChange = false) => {
    if (!accountIdRef.current || !secretKeyRef.current || !tvWidgetRef.current || !isChartReadyRef.current) return;

    try {
      const tvTheme = normalizeTradingViewTheme(themeValue);
      const themeKey = getThemeKey(themeValue);
      const t = THEMES[themeKey];

      if (themeChange) {
        await tvWidgetRef.current.changeTheme(tvTheme);
        tvWidgetRef.current.applyOverrides({ "paneProperties.legendProperties.showLegend": false });
        injectToolbarBg(props.containerId, t.toolbarBg);
        return;
      }

      const { status, result } = await getChartSettings(accountIdRef.current, secretKeyRef.current);
      if (!status || !result) return;

      if (!tvWidgetRef.current || !isChartReadyRef.current) return;

      const patchedResult = applyCurrentTheme(result, themeValue);
      tvWidgetRef.current.load(patchedResult);
      setTimeout(() => injectToolbarBg(props.containerId, t.toolbarBg), 300);

      if (currentSymbol && !isEmpty(currentSymbol)) {
        try { tvWidgetRef.current.activeChart().setSymbol(currentSymbol); } catch (e) { }
      }

      // ✅ After load(), re-subscribe onDataLoaded to refresh broker lines
      setTimeout(() => {
        try {
          tvWidgetRef.current?.activeChart().onDataLoaded().subscribe(null, () => {
            brokerRef.current?.refreshPositions();
            brokerRef.current?.refreshOrders();
          }, true);
        } catch (e) {
          brokerRef.current?.refreshPositions();
          brokerRef.current?.refreshOrders();
        }
      }, 200);

    } catch (e) {  }
  }, [props.containerId]);


  const getLanguageFromURL = () => {
    const regex = new RegExp('[\\?&]lang=([^&#]*)');
    const results = regex.exec(window.location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  // ─── Close position ────────────────────────────────────────────────────────
  const closingPositionOrder = async (record) => {
    try {
      setIsLoading(true);
      const data = {
        pairId: record?.pairId,
        positionSide: record?.positionSide,
        quantity: record?.quantity,
        orderType: "market",
        price: record?.price,
        typeTIF: record?.typeTIF,
      };
      const closeRes = await futureClosePosition(data, userdetails.secretKey);
      setIsLoading(false);
      if (closeRes.status) {
        !isEmpty(closeRes.message) && showToastMessage(closeRes.message, 'success');
        record?.onConfirmed?.();
        return { status: true };
      } else {
        !isEmpty(closeRes.message) && showToastMessage(closeRes.message, 'error');
        return { status: false };
      }
    } catch (err) {
      setIsLoading(false);
      console.log(err, "closingPositionOrder err");
    }
  };

  // ─── Fetch open orders ─────────────────────────────────────────────────────
  const fetchOpenOrder = async (openOrder, reqData) => {
    try {
      const { record, status } = await futureOpenOrders(
        FutureId.current, reqData, secretKeyRef.current, userdetails?.tradeMode
      );
      if (status) {
        openOrdersRef.current = record || [];
        brokerRef.current?.refreshOrders();
      }
    } catch (err) {
      console.log(err, "fetchOpenOrder err");
    }
  };

  // ─── Chart init ────────────────────────────────────────────────────────────
  const initChart = (themeValue, pair) => {


    if (tvWidgetRef.current) return;

    const tvTheme = normalizeTradingViewTheme(themeValue);
    const themeKey = getThemeKey(themeValue);
    const t = THEMES[themeKey];

    const datafeedInstance = new window.Datafeeds.UDFCompatibleDatafeed(props.datafeedUrl);
    const datafeedRef = { current: datafeedInstance };

    datafeedInstance.formatter = async (symbol) => {

      return {
        format: (price) => {
          return Number(price).toFixed(2);
        }
      };
    };

    datafeedInstance.quantityFormatter = async (symbol) => {
      return {
        format: (qty) => {
          return Number(qty).toFixed(3);
        }
      };
    };

    // Display-only USDT->USD mapping for the chart's title/legend text. The
    // datafeed keeps resolving/fetching bars against the real Binance-style
    // symbol ("BNBUSDT") passed in `symbol` below — untouched, since that's
    // what actually drives history/quote requests to props.datafeedUrl. Only
    // the human-readable fields TradingView renders in the chart header
    // (name/description/full_name) are rewritten after resolveSymbol
    // returns, so the underlying `ticker`/`symbol` used for data queries is
    // never altered.
    const udfDatafeed = new window.Datafeeds.UDFCompatibleDatafeed(props.datafeedUrl);
    const originalResolveSymbol = udfDatafeed.resolveSymbol.bind(udfDatafeed);
    udfDatafeed.resolveSymbol = (symbolName, onSymbolResolvedCallback, onResolveErrorCallback, extension) => {
      originalResolveSymbol(
        symbolName,
        (symbolInfo) => {
          const displaySymbol = {
            ...symbolInfo,
            name: formatDisplayPair(symbolInfo?.name),
            description: formatDisplayPair(symbolInfo?.description),
            full_name: formatDisplayPair(symbolInfo?.full_name),
            short_name: formatDisplayPair(symbolInfo?.short_name),
          };
          onSymbolResolvedCallback(displaySymbol);
        },
        onResolveErrorCallback,
        extension
      );
    };

    const widgetOptions = {
      symbol: pair,
      datafeed: udfDatafeed,
      // datafeed: datafeedInstance,
      interval: props.interval,
      container: props.containerId,
      library_path: props.libraryPath,
      locale: getLanguageFromURL() || "en",

      broker_factory: (host) => {


        const broker = new FutureBrokerAPI(host, {
          positionDetailsRef,
          openOrdersRef,
          walletRef,
          accountIdRef,
          secretKeyRef,
          tikerRootRef,
          datafeedUrlRef: { current: props.datafeedUrl },
          // datafeedRef: { current: tvWidgetRef.current?._options?.datafeed ?? null },
          datafeedRef,
        });


        broker.setCallbacks({
          onClosePosition: (data) => handleShowCloseOrders(data),

          onUpdateTpSl: async (pairId, type, price) => {
            const all = positionDetailsRef.current || [];
            const item = all.find(p => String(p.pairId) === String(pairId));
            if (!item) return;

            const payload = {
              bracketOrders: [
                type === "tp" ? price : (item.takeProfit > 0 ? item.takeProfit : 0),
                type === "sl" ? price : (item.stopLoss > 0 ? item.stopLoss : 0),
              ],
              pairId: item.pairId,
              entryPrice: item.entryPrice,
              positionSide: item.positionSide,
              positionFilled: item.positionFilled,
            };

            const { status, message } = await futureUpdateBracketOrders(payload, secretKeyRef.current);
            showToastMessage(message, status ? "success" : "error");
          },

          onUpdateOrder: async (orderId, qty, price) => {

            const { status, message } = await futureUpdateOrders(
              { orderId, quantity: qty, price },
              secretKeyRef.current
            );
            showToastMessage(message, status ? "success" : "error");
          },

          onCancelOrder: (orderId) => futureCancelOrder(orderId, secretKeyRef.current),
        });


        brokerRef.current = broker;
        return broker;
      },

      broker_config: {
        configFlags: FutureBrokerAPI.configFlags,
        durations: null,
      },

      disabled_features: [
        "object_tree",
        "show_object_tree",
        "header_object_tree",
        "use_localstorage_for_settings",
        // "trading_account_manager",
      ],

      enabled_features: [
        "study_templates",
        "header_layouttoggle",
        "header_saveload",
        "header_settings",
        "header_fullscreen_button",
        "saveload_separate_drawings_storage",

        "dom_widget",
        "support_multicharts",
        "trading_position",
        "trading_brackets",
      ],

      charts_storage_url: props.chartsStorageUrl,
      charts_storage_api_version: props.chartsStorageApiVersion,
      client_id: props.clientId,
      user_id: props.userId,
      fullscreen: props.fullscreen,
      autosize: props.autosize,
      theme: tvTheme,
      toolbar_bg: t.toolbarBg,
      loading_screen: { backgroundColor: t.background },

      overrides: {
        "paneProperties.background": t.background,
        "paneProperties.backgroundType": "solid",
        "paneProperties.vertGridProperties.color": t.gridColor,
        "paneProperties.horzGridProperties.color": t.gridColor,
        "symbolWatermarkProperties.transparency": 90,
        "scalesProperties.textColor": t.textColor,
      },
    };

    tvWidgetRef.current = new window.TradingView.widget(widgetOptions);

    tvWidgetRef.current.onChartReady(async () => {
      isChartReadyRef.current = true;

      await restoreChartSettings(pair, themeValue);

      const iframe = document.querySelector(`#${props.containerId} iframe`);
      if (iframe?.contentDocument) {
        const link = iframe.contentDocument.createElement("link");
        link.rel = "stylesheet";
        link.href = "/charting_library/custom-overrides.css";
        iframe.contentDocument.head.appendChild(link);
        injectToolbarBg(props.containerId, t.toolbarBg);

        const iframeDoc = iframe.contentWindow.document;
        const onMouseMove = () => {
          if (plusRef.current) plusRef.current._rect = iframe.getBoundingClientRect();
        };
        iframeDoc.addEventListener("mousemove", onMouseMove);
        iframeDoc._cleanup = () => iframeDoc.removeEventListener("mousemove", onMouseMove);
      }

      tvWidgetRef.current.subscribe("onAutoSaveNeeded", () => persistChartSettings());

      try {
        tvWidgetRef.current.activeChart().onDataLoaded().subscribe(null, () => {
          brokerRef.current?.refreshPositions();
          brokerRef.current?.refreshOrders();
        }, true); // true = fire once
      } catch (e) {
        // fallback if onDataLoaded not available
        setTimeout(() => {
          brokerRef.current?.refreshPositions();
          brokerRef.current?.refreshOrders();
        }, 1500);
      }

      setTimeout(() => brokerRef.current?.refreshPositions(), 3000);

      fetchOpenOrder([], { page: 1, limit: 10 });
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isChartReadyRef.current || !brokerRef.current) return;
    positionDetailsRef.current = positionDetails || [];
    tikerRootRef.current = tikerRoot;
    brokerRef.current.refreshPositions();
  }, [positionDetails, tikerRoot]);

  useEffect(() => {
    walletRef.current = wallet;
    if (!isChartReadyRef.current || !brokerRef.current) return;
    const pl = parseFloat(wallet?.unRealizedPnL ?? 0);
    const pos = positionDetailsRef.current || [];
    pos.forEach(item => brokerRef.current.pushPnlUpdate(item.pairId, pl));
  }, [wallet]);

  // Mount
  useEffect(() => {
    if (!isEmpty(tikerRoot)) {
      const resolvedTheme = localStorage.getItem("trevolt-theme") || theme || "dark";
      const themeValue = !isEmpty(querytheme) ? querytheme : resolvedTheme;
      initChart(themeValue, tikerRoot);
    }
    return () => {
      isChartReadyRef.current = false; // mark not-ready FIRST
      brokerRef.current = null;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (tvWidgetRef.current) {
        try {
          const iframe = document.querySelector(`#${props.containerId} iframe`);
          if (iframe?.contentWindow?.document?._cleanup) iframe.contentWindow.document._cleanup();
          tvWidgetRef.current.remove();
        } catch (e) { }
        tvWidgetRef.current = null; // null AFTER remove
      }
      if (plusRef.current?.remove) { plusRef.current.remove(); plusRef.current = null; }
    };
  }, []);

  // Symbol prop change — only init if not already running
  useEffect(() => {
    if (!isEmpty(tikerRoot) && !tvWidgetRef.current) {
      const resolvedTheme = localStorage.getItem("trevolt-theme") || theme || "dark";
      const themeValue = !isEmpty(querytheme) ? querytheme : resolvedTheme;
      initChart(themeValue, tikerRoot);
    }
  }, [tikerRoot]);

  // Symbol change — update active chart
  useEffect(() => {
    // ✅ Clear broker symbolInfo cache on symbol change
    if (brokerRef.current) {
      brokerRef.current._symbolInfoCache = {};
    }

    if (tvWidgetRef.current && isChartReadyRef.current && !isEmpty(tikerRoot)) {
      try {
        tvWidgetRef.current.activeChart().setSymbol(tikerRoot, props.interval);
        setTimeout(() => brokerRef.current?.refreshPositions(), 500);
      } catch (e) {  }
    }
  }, [tikerRoot]);

  // Tab visibility
  useEffect(() => {
    const h = () => {
      if (document.visibilityState === 'visible' && tvWidgetRef.current) {
        setTimeout(() => { try { tvWidgetRef.current.resize(); } catch (e) { } }, 100);
      }
    };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, []);

  // Theme toggle
  useEffect(() => {
    if (!tvWidgetRef.current || !isChartReadyRef.current || isEmpty(tikerRoot)) return;
    const themeValue = !isEmpty(querytheme) ? querytheme : theme;
    restoreChartSettings(tikerRoot, themeValue, true);
  }, [theme, querytheme]);

  // Panel expand/collapse
  useEffect(() => {
    if (tvWidgetRef.current) {
      setTimeout(() => { try { tvWidgetRef.current.resize(); } catch (e) { } }, 300);
    }
  }, [props.chartExpanded]);

  // Account switch
  useEffect(() => {
    if (!tvWidgetRef.current || !accountId) return;
    const themeValue = !isEmpty(querytheme) ? querytheme : theme;
    setTimeout(() => restoreChartSettings(tikerRoot, themeValue), 150);
  }, [accountId]);

  // Socket: open orders
  useEffect(() => {
    const handler = (result) => {
      openOrdersRef.current = result.data || [];
      brokerRef.current?.refreshOrders();
    };
    socketContext.socket.on("FuturesopenOrder", handler);
    return () => socketContext.socket.off("FuturesopenOrder", handler);
  }, [socketContext?.socket]);

  // Socket: position updates
  useEffect(() => {
    const handler = (result) => {
      const item = result?.data;
      if (!item || !brokerRef.current) return;
      const idx = positionDetailsRef.current.findIndex(
        p => String(p.pairId) === String(item.pairId)
      );
      if (idx >= 0) positionDetailsRef.current[idx] = item;
      else if (item.positionFilled > 0) positionDetailsRef.current.push(item);
      brokerRef.current.pushPositionUpdate(item);
    };
    socketContext.socket.on("FuturesPosition", handler);
    return () => socketContext.socket.off("FuturesPosition", handler);
  }, [socketContext?.socket]);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <CloseOrderByChart
        show={showCloseOrders}
        handleClose={handleHideCloseOrders}
        record={closeData}
        onConfirm={closingPositionOrder}
        isLoading={isLoading}
      />
      <div id={props.containerId} className="TVChartContainer" />
    </>
  );
};

export default React.memo(TradedPriceChart);