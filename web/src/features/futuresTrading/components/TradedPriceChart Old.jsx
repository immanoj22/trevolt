import React, { useEffect, useRef, useCallback, useState, useContext } from "react";
import { useGlobalContext } from '../../../context/GlobalProvider';
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "is-empty";
import { saveChartSettings, getChartSettings } from "../../../actions/subAccountAction";
import '../styles/index.css';
import { FutureTicker, FutureTradePair } from "../../../redux/futureAction";
import CloseOrderByChart from "../modal/CloseOrderByChart";
import SocketContext from "../../../context/socketContext";
import { futureCancelOrder, futureClosePosition, futureOpenOrders, futureUpdateOrders } from "../../../actions/futureActions";
import Swal from 'sweetalert2';
import { showToastMessage } from "../../../lib/toast";

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

// ─── Theme helpers ────────────────────────────────────────────────────────────

function normalizeTradingViewTheme(value) {
  const lower = String(value || "").toLowerCase();
  if (lower === "dark" || lower === "black") return "Dark";
  if (lower === "light" || lower === "white") return "Light";
  if (value === "Dark" || value === "Light") return value;
  if (value === "White") return "Light";
  return "Light";
}

function getThemeKey(themeValue) {
  const tv = normalizeTradingViewTheme(themeValue);
  return tv === "Dark" ? "dark" : "light";
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
    const leftSelectors = ['[class*="drawingToolbar-"]', '[class*="wrap-Z4M3tWHb"]', '[class*="scrollWrap-Z4M3tWHb"]', '[class*="noScrollBar-Z4M3tWHb"]', '[class*="content-Z4M3tWHb"]', '[class*="inner-BfVZxb4b"]', '[class*="group-BfVZxb4b"]', '[class*="fill-BfVZxb4b"]', '[class*="lastGroup-BfVZxb4b"]'].join(',');
    doc.querySelectorAll(leftSelectors).forEach((el) => {
      el.style.setProperty('background-color', toolbarBgColor, 'important');
      el.style.setProperty('background', toolbarBgColor, 'important');
      el.style.removeProperty('border');
      el.style.removeProperty('box-shadow');
    });
    document.querySelectorAll('[style*="background"]').forEach((el) => {
      if (el.className && TOOLBAR_RE.test(typeof el.className === 'string' ? el.className : el.className.baseVal)) {
        el.style.setProperty('background-color', toolbarBgColor, 'important');
        el.style.setProperty('background', toolbarBgColor, 'important');
      }
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

// ─── Component ────────────────────────────────────────────────────────────────
const TradedPriceChart = (props) => {
  const tikerRoot = props?.symbol;
  const tvWidgetRef = useRef(null);
  const plusRef = useRef(null);
  const saveTimerRef = useRef(null);
  const accountIdRef = useRef(null);
  const secretKeyRef = useRef(null);
  const positionLineRef = useRef(null);
  const orderLinesRef = useRef({});

  const [createdLines, setCreatedLines] = useState([])

  const [isLoading, setIsLoading] = useState(false);

  const positionsStoreRef = useRef({});

  const socketContext = useContext(SocketContext);

  const isChartReadyRef = useRef(false);
  const FutureId = useRef('all');

  const [closeData, setCloseData] = useState({});
  const [showCloseOrders, setShowCloseOrders] = useState(false)

  const { theme } = useGlobalContext();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const querytheme = queryParams.get("theme");

  const { userdetails, positionDetails, wallet } = useSelector((state) => state.user);
  const accountId = userdetails?.accountId;
  const secretKey = userdetails?.secretKey;

  const handleShowCloseOrders = (data) => {
    setCloseData(data)
    setShowCloseOrders(true)
  }

  const handleHideCloseOrders = () => {
    setShowCloseOrders(false)
  }

  useEffect(() => {
    accountIdRef.current = accountId;
    secretKeyRef.current = secretKey;
  }, [accountId, secretKey]);


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

  const restoreChartSettings = useCallback(async (currentSymbol, themeValue, themeChange = false) => {
    if (!accountIdRef.current || !secretKeyRef.current || !tvWidgetRef.current) return;
    try {
      const tvTheme = normalizeTradingViewTheme(themeValue);
      const themeKey = getThemeKey(themeValue);
      const t = THEMES[themeKey];

      if (themeChange) {
        await tvWidgetRef.current.changeTheme(tvTheme);
        tvWidgetRef.current.applyOverrides({
          "paneProperties.legendProperties.showLegend": false
        });
        injectToolbarBg(props.containerId, t.toolbarBg);
        return;
      }

      const { status, result } = await getChartSettings(accountIdRef.current, secretKeyRef.current);
      if (!status || !result) return;

      const patchedResult = applyCurrentTheme(result, themeValue);
      tvWidgetRef.current.load(patchedResult);
      setTimeout(() => injectToolbarBg(props.containerId, t.toolbarBg), 300);

      if (currentSymbol && !isEmpty(currentSymbol)) {
        try { tvWidgetRef.current.activeChart().setSymbol(currentSymbol); } catch (e) { }
      }
    } catch (e) {  }
  }, [props.containerId]);

  const createPlusIcon = () => { if (plusRef.current) return; plusRef.current = {}; };
  const showPlusIcon = (x, y) => {
    if (!plusRef.current?.style) return;
    plusRef.current.style.left = `${x + 10}px`;
    plusRef.current.style.top = `${y + 10}px`;
  };

  const getLanguageFromURL = () => {
    const regex = new RegExp('[\\?&]lang=([^&#]*)');
    const results = regex.exec(window.location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  const refreshBroker = () => {
    if (!tvWidgetRef.current) return;

    try {
      tvWidgetRef.current.activeChart().executeActionById("trading.refreshPositions");
    } catch (e) {
      console.log("Refresh error", e);
    }
  };

  const syncPositionsToStore = () => {
    if (!positionDetails || !tikerRoot) return;

    const store = {};

    positionDetails.forEach((item) => {
      // ✅ Only map positions for current chart symbol
      if (item.pairName === tikerRoot && item.positionFilled > 0) {
        store[String(item.pairId)] = {
          id: String(item.pairId),

          // ⚠️ MUST match TradingView chart symbol EXACTLY
          symbol: tikerRoot,

          price: item.entryPrice,
          qty: item.positionFilled,

          // ✅ convert your backend side → TV format
          side: item.positionSide === "long" ? "buy" : "sell",

          // ✅ optional (for TP/SL brackets)
          takeProfit: item.takeProfit || 0,
          stopLoss: item.stopLoss || 0,
        };
      }
    });

    positionsStoreRef.current = store;

  };

  const initChart = (themeValue, pair) => {
    if (tvWidgetRef.current) return;

    const tvTheme = normalizeTradingViewTheme(themeValue);
    const themeKey = getThemeKey(themeValue);
    const t = THEMES[themeKey];

    const widgetOptions = {
      symbol: pair,
      datafeed: new window.Datafeeds.UDFCompatibleDatafeed(props.datafeedUrl),
      interval: props.interval,
      container: props.containerId,
      library_path: props.libraryPath,
      locale: getLanguageFromURL() || "en",

      brokerFactory: (host) => buildBroker(host),

      // ✅ FIX 2 & 4: configFlags go inside brokerFactory onReady callback,
      // NOT as a separate broker_config option. No TypeScript syntax.
      // (see buildBroker function — onReady calls callback({ configFlags: { ... } }))

      disabled_features: [
        // "trading_account_manager",
        "object_tree",
        "show_object_tree",
        "header_object_tree",
        "use_localstorage_for_settings",
      ],

      // ✅ FIX 3: trading_position + trading_brackets are both required
      enabled_features: [
        "study_templates",
        "header_layouttoggle",
        "header_saveload",
        "header_settings",
        "header_fullscreen_button",
        "saveload_separate_drawings_storage",
        "trading_position",   // ← required: renders broker position lines
        "trading_brackets",   // ← required: renders TP/SL bracket lines
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

      positionsStoreRef.current = {
        "1": {
          id: "1",
          symbol: pair, // ⚠️ MUST MATCH CHART SYMBOL
          price: 642,
          qty: 10,
          side: "buy",
          takeProfit: 650,   // optional (for TP line)
          stopLoss: 630,     // optional (for SL line)
        }
      };

      await restoreChartSettings(pair, themeValue);

      // 🔥 IMPORTANT ORDER
      syncPositionsToStore();
      refreshBroker();

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

      await restoreChartSettings(pair, themeValue);
      tvWidgetRef.current.subscribe("onAutoSaveNeeded", () => persistChartSettings());

      // ✅ FIX 5: seed real positions from Redux into broker store then refresh
      syncPositionsToStore();
      refreshBroker();

      fetchOpenOrder([], { page: 1, limit: 10 });
    });
  };


  const buildBroker = (_host) => ({
    // ✅ configFlags go HERE inside onReady — not as broker_config in widget options
    onReady(callback) {
      callback({
        configFlags: {
          supportOrderBrackets: true,
          supportPositionBrackets: true,  // ← THIS enables TP/SL on position lines
          supportPositions: true,
          supportClosePosition: true,
          supportPLUpdate: true,
        },
      });
    },

    async positions() {
      return Object.values(positionsStoreRef.current);
    },

    async positionBrackets(positionId) {
      const pos = positionsStoreRef.current[String(positionId)];
      return { takeProfit: pos?.takeProfit || 0, stopLoss: pos?.stopLoss || 0 };
    },

    async modifyPosition(positionId, changes) {
      // Called when user drags TP or SL line
      const pos = positionsStoreRef.current[String(positionId)];
      if (!pos) return;
      const snapshot = { ...pos };
      positionsStoreRef.current[String(positionId)] = { ...pos, ...changes };

      const pairs = [];
      if (changes.takeProfit !== undefined) pairs.push(["tp", changes.takeProfit]);
      if (changes.stopLoss !== undefined) pairs.push(["sl", changes.stopLoss]);

      for (const [type, price] of pairs) {
        // const { status, message } = await futureUpdateTpSl(
        //   { positionId: String(positionId), type, price },
        //   secretKeyRef.current
        // );
        // showToastMessage(message, status ? "success" : "error");
        // if (!status) {
        //   positionsStoreRef.current[String(positionId)] = snapshot;
        //   refreshBroker();
        //   return;
        // }
      }
    },

    async closePosition(positionId) {
      const pos = positionsStoreRef.current[String(positionId)];
      if (pos) handleShowCloseOrders(pos);
    },

    async orders() { return []; },
    async placeOrder(data) {  },
    async modifyOrder(id, data) {  },
    async cancelOrder(id) {  },
  });

  useEffect(() => {
    if (!isChartReadyRef.current) return;

    syncPositionsToStore();
    refreshBroker();
  }, [positionDetails, tikerRoot]);

  const updateOrders = async (order) => {
    try {
      const payload = {
        orderId: order.orderId,
        quantity: order.quantity,
        price: order.price
      }
      let { status, message } = await futureUpdateOrders(payload, secretKeyRef.current);
      showToastMessage(message, status ? "success" : "error");
    } catch (err) {
      console.log(err, "fetchOpenOrder__err");
    }
  };

  /**Order line */
  const createOrderLine = async (order) => {
    // if (isEmpty(tvWidgetRef.current) || !isChartReadyRef.current) return;
    try {
      const chart = tvWidgetRef.current.activeChart();
      const line = await chart.createOrderLine();
      line
        .setQuantity(order.qty)
        .setText(order.text)
        .setLineColor(order.isBuy ? "#48f205" : "#f20505")
        .setPrice(order.price)
        .setTooltip(order.tooltip || "")
        .onMove(function () {
          const payload = {
            orderId: order.id,
            quantity: order.qty,
            price: this.getPrice()
          }
          updateOrders(payload)
        })
        .onModify("Modify", function () {
          // console.log("Order Modified:", order.id);
        })
        .onCancel("Cancel", function () {
          cancelOrder(order.id)
        });
      orderLinesRef.current[order.id] = line;
      return line;
    } catch (err) {
      console.log("OrderLine error:", err);
    }
  };

  const createPositionLine = async (position) => {
    if (!tvWidgetRef.current || !isChartReadyRef.current) return;

    try {
      const chart = tvWidgetRef.current.activeChart();
      const line = await chart.createPositionLine();

      line
        .setText(position.text)
        .setQuantity(position.qty)
        .setLineColor("#0519f2")
        .setPrice(position.price)
        .setTooltip(position.tooltip || "")
        .setProtectTooltip("Protect position")
        .setCloseTooltip("Close position")
        .setExtendLeft(position.extendLeft ?? true)
        .setLineStyle(position.lineStyle ?? 0)
        .setLineLength(position.lineLength ?? 50)
        .onModify(function () {
          // this.setText("Modified");
        })
        .onClose("Close", function (text) {
          // handleShowCloseOrders(position)
          cancelOrderPopup(position)
          // this.setText(text);
        });
      positionLineRef.current = line
      return line;
    } catch (err) {
      console.log("PositionLine error:", err);
    }
  };

  const handleOpenOrders = async (record) => {
    try {

      Object.values(orderLinesRef.current).forEach((line) => {
        try {
          line.remove();
        } catch (err) {
          console.log("remove____", err)
        }
      });

      if (isEmpty(record)) {
        Object.values(orderLinesRef.current).forEach((line) => {
          try {
            line.remove();
          } catch (err) {
            console.log("remove____", err)
          }
        });
      }
      if (!isEmpty(record)) {

        for (let i = 0; i < record.length; i++) {
          const buySell = record[i]?.buyorsell == "buy" ? "Buy" : "Sell"
          const order = {
            qty: record[i]?.quantity,
            text: `${buySell} @ ${record[i]?.price}`,
            id: record[i]?._id,
            price: record[i]?.price,
            isBuy: buySell == "Buy" ? true : false
          }

          createOrderLine(order)
        }
      }

    } catch (error) {
      console.log("handleOpenOrders_eerr", error)
    }
  }

  const removeOrderLineById = (orderId) => {
    const line = orderLinesRef.current[orderId];
    if (!line) return;
    try {
      line.remove();
      delete orderLinesRef.current[orderId];
    } catch (err) {
      console.log("Remove OrderLine error:", err);
    }
  };

  const closingPositionOrder = async (record) => {
    try {
      setIsLoading(true)
      const error = {}
      const data = {
        pairId: record?.pairId,
        positionSide: record?.positionSide,
        quantity: record?.quantity,
        orderType: "market",
        price: record?.price,
        typeTIF: record?.typeTIF
      }
      let closeRes = await futureClosePosition(data, userdetails.secretKey);
      setIsLoading(false)
      if (closeRes.status) {
        !isEmpty(closeRes.message) && showToastMessage(closeRes.message, 'success')
        return {
          status: true
        }
      } else if (!closeRes.status) {
        !isEmpty(closeRes.message) && showToastMessage(closeRes.message, 'error')
        return {
          status: false
        }
      }
    } catch (err) {
      console.log(err, "closingPositionOrder__err");
    }
  };

  const cancelOrderPopup = (order) => {
    const confirmBtnColor = "#138808"; // Same for dark and light
    const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";
    Swal.fire({
      title: "Are you sure want to cancel this order ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      confirmButtonColor: confirmBtnColor,
      cancelButtonColor: cancelBtnColor,
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const cancelBtn = Swal.getCancelButton();

        if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
        if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
      }
    }).then(async ({ isConfirmed }) => {
      if (!isConfirmed) return;
      const { status, message } = await closingPositionOrder(order);
    });
  };

  const cancelOrder = (orderId) => {
    const confirmBtnColor = "#138808";
    const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";
    Swal.fire({
      title: "Are you sure want to cancel this order ?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      confirmButtonColor: confirmBtnColor,
      cancelButtonColor: cancelBtnColor,
      didOpen: () => {
        const confirmBtn = Swal.getConfirmButton();
        const cancelBtn = Swal.getCancelButton();

        if (confirmBtn) confirmBtn.setAttribute("data-click-effect", "none");
        if (cancelBtn) cancelBtn.setAttribute("data-click-effect", "none");
      }
    }).then(async ({ isConfirmed }) => {
      if (!isConfirmed) return;

      const { status, message } = await futureCancelOrder(orderId, secretKeyRef.current);
      if (status) {
        removeOrderLineById(orderId);
      }
      showToastMessage(message, status ? "success" : "error");
    });
  };

  const fetchOpenOrder = async (openOrder, reqData) => {
    try {
      // SECURITY FIX: removed console.log of sensitive client-side data (secretKey/password/OTP)
      let { record, status, count, currentPage, nextPage } = await futureOpenOrders(FutureId.current, reqData, secretKeyRef.current, userdetails?.tradeMode);
      if (status) {
        // console.log(record, "getOpenOrders");
        setTimeout(() => {
          handleOpenOrders(record)
        }, 1000)
      }
    } catch (err) {
      console.log(err, "fetchOpenOrder__err");
    }
  };

  useEffect(() => {
    if (isChartReadyRef.current && !isEmpty(tvWidgetRef.current)) {
      fetchOpenOrder([], {
        page: 1,
        limit: 10,
      });
    }

  }, [isChartReadyRef.current, tvWidgetRef.current]);

  /**Order line  */

  useEffect(() => {
    if (!isEmpty(tikerRoot)) {
      const resolvedTheme = localStorage.getItem("trevolt-theme") || theme || "dark";
      const themeValue = !isEmpty(querytheme) ? querytheme : resolvedTheme;
      initChart(themeValue, tikerRoot);
    }
    return () => {
      isChartReadyRef.current = false;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (tvWidgetRef.current) {
        const iframe = document.querySelector(`#${props.containerId} iframe`);
        if (iframe?.contentWindow?.document?._cleanup) iframe.contentWindow.document._cleanup();
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
      if (plusRef.current?.remove) { plusRef.current.remove(); plusRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!isEmpty(tikerRoot)) {
      const resolvedTheme = localStorage.getItem("trevolt-theme") || theme || "dark";
      const themeValue = !isEmpty(querytheme) ? querytheme : resolvedTheme;
      initChart(themeValue, tikerRoot);
    }
  }, [tikerRoot]);

  useEffect(() => {
    if (tvWidgetRef.current && isChartReadyRef.current && !isEmpty(tikerRoot)) {
      try { tvWidgetRef.current.activeChart().setSymbol(tikerRoot, props.interval); }
      catch (e) {  }
    }
  }, [tikerRoot]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && tvWidgetRef.current) {
        setTimeout(() => { try { tvWidgetRef.current.resize(); } catch (e) { } }, 100);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!tvWidgetRef.current || !isChartReadyRef.current || isEmpty(tikerRoot)) return;
    const themeValue = !isEmpty(querytheme) ? querytheme : theme;
    restoreChartSettings(tikerRoot, themeValue, true);
  }, [theme, querytheme]);

  useEffect(() => {
    if (isEmpty(positionDetails) && !isEmpty(positionLineRef.current)) {
      const line = positionLineRef.current;
      if (line && typeof line.remove === "function") {
        line.remove();
        positionLineRef.current = null;
        setCreatedLines([])
      } else {
      }
      return
    }

    positionDetails.forEach(async (item) => {
      if (
        item.pairName === tikerRoot &&
        item.positionFilled > 0 &&
        !createdLines.includes(item.pairId)
      ) {
        const line = await createPositionLine({
          id: item.pairId,
          qty: item.positionFilled,
          price: item.entryPrice,
          tooltip: "Additional position information",
          text: wallet?.unRealizedPnL.toFixed(4),
          pairId: item?.pairId,
          positionSide: item?.positionSide,
          quantity: item?.positionFilled,
          orderType: "market",
          typeTIF: ""
        });

        if (line) {
          setCreatedLines((prev) => [...prev, item.pairId])
        }
      }
    });
  }, [positionDetails, tikerRoot, wallet]);


  useEffect(() => {
    if (!wallet) return;
    if (positionLineRef.current) {
      positionLineRef.current.setText(`${wallet?.unRealizedPnL.toFixed(4)}`);
    }
  }, [wallet]);
  /**----------------------------------> */

  useEffect(() => {
    if (!tvWidgetRef.current || !accountId) return;
    const themeValue = !isEmpty(querytheme) ? querytheme : theme;
    setTimeout(() => restoreChartSettings(tikerRoot, themeValue), 150);
  }, [accountId]);

  useEffect(() => {
    if (tvWidgetRef.current) {
      setTimeout(() => { try { tvWidgetRef.current.resize(); } catch (e) { } }, 300);
    }
  }, [props.chartExpanded]);

  useEffect(() => {
    // socketContext.socket.on("FuturesopenOrder", (result) => {
    //   console.log("OPEN_ORDERS_FuturesopenOrder_____", result.data);
    //   handleOpenOrders(result.data)
    // });

    const handler = (result) => {
      handleOpenOrders(result.data);
    };

    socketContext.socket.on("FuturesopenOrder", handler);

    return () => {
      socketContext.socket.off("FuturesopenOrder", handler);
    };

  }, [socketContext?.socket]);

  return (
    <>
      <CloseOrderByChart
        show={showCloseOrders}
        handleClose={handleHideCloseOrders}
        record={closeData}
      />
      <div id={props.containerId} className="TVChartContainer" />
    </>
  )
};

export default React.memo(TradedPriceChart);