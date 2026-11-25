/** PACKAGE IMPORT */
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from "is-empty";
import { IoIosCloseCircleOutline } from "react-icons/io";

/** LOCAL FILES IMPORT */
import Header from "../../layout/Header/Header";
import styles from "./styles/tradePageLayout.module.css";
import useBreakpoint from "../../hooks/useBreakpoint";
import TradingChart from "./components/TradingChart";
import OrderBook from "./components/OrderBook";
import RecentTrades from "./components/RecentTrades";
import TradeActionPanel from "./components/TradeActionPanel";
import TradeTabs from "./components/TradeTabs";
import MarketSummary from "./components/MarketSummary";
import SideModel from "../../components/Modal/SideModel";
import DraggableResizablePanel from "./components/DraggableResizablePanel";
import ComingSoon from "../../components/ComingSoon/ComingSoon";
import PageLoader from "../../components/Loader/PageLoader";

/** REDUX */
import { FutureTicker, FutureTradePair, MakerFee, TakerFee, LiquiFee } from "../../redux/futureAction";
import { UserLeverage } from "../../redux/action";
import { MetaTags } from "../../meta/metaTags";
import { UpdateTab } from "../../actions/userAction";

/** CODE START */

// Per-panel minimum size — kept in one place since both the canvas-resize
// rescale effect and the chart/Trade-Action-Panel overlap nudge below need
// the same numbers (and these already match what's passed as minW/minH to
// each panel's own DraggableResizablePanel further down).
// const PANEL_MIN_SIZES = {
//   chart: { minW: 640, minH: 420 },
//   orderBook: { minW: 260, minH: 180 },
//   recentTrades: { minW: 260, minH: 180 },
//   tradeActionPanel: { minW: 300, minH: 360 },
// };
const PANEL_MIN_SIZES = {
  chart: { minW: 640, minH: 420 },
  orderBook: { minW: 260, minH: 300 }, // was 180
  recentTrades: { minW: 260, minH: 150 },
  tradeActionPanel: { minW: 300, minH: 360 },
};

// Keeps a rect on-canvas (used after rescaling on a canvas resize, and
// after nudging a panel out of another panel's way) without ever letting
// it shrink below its own real minimum size.
const clampRectToBounds = (rect, bounds, minW, minH) => {
  const w = Math.max(minW, Math.min(rect.w, bounds.width));
  const h = Math.max(minH, Math.min(rect.h, bounds.height));
  const x = Math.max(0, Math.min(rect.x, bounds.width - w));
  const y = Math.max(0, Math.min(rect.y, bounds.height - h));
  return { x, y, w, h };
};

const FuturesTrading = () => {
  const width = useBreakpoint();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [currentTab, setCurrentTab] = useState("graph");
  const [pageHide, setPageHide] = useState(false);
  const { tikerRoot } = useParams();
  const { userdetails, leverage } = useSelector((state) => state.user);
  const { futureTradePair, futurePairData, futurePairDataLoaded } = useSelector(
    (state) => state.future,
  );
  // Shows a full-page loader until the pair list has resolved at least
  // once, then swaps to the Coming Soon page (instead of the trading UI
  // rendering with no pair data — blank charts, NaN prices, etc.) whenever
  // there simply aren't any futures pairs configured yet. Mirrors the same
  // pattern already used on the Options trading page.
  const [comingSoon, setComingSoon] = useState(false);
  const [isPageLoader, setIsPageLoader] = useState(true);
  const { feeSettingsList } = useSelector(
    (state) => state.fee
  );
  const gridRef = useRef(null);
  const [openOrderBook, setOpenOrderBook] = useState(() => {
    const stored = localStorage.getItem("openOrderBook");
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [openRecentTrade, setOpenRecentTrade] = useState(() => {
    const stored = localStorage.getItem("openRecentTrade");
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Mirrors openOrderBook/openRecentTrade above — same persistence pattern,
  // for the chart panel's own hover-close icon (see TradingChart.jsx).
  // Closing the chart just hides its grid area (leaves it blank) rather
  // than reflowing neighbouring panels into the freed space — unlike
  // Order Book/Recent Trades, nothing is currently defined to occupy the
  // "tradingChart" grid-area, and building that reflow would mean adding
  // new grid-template variants across every breakpoint in this page's
  // already-elaborate resize system. Kept out for now to avoid touching
  // that working logic; restoreLayoutDefaults still brings it straight
  // back.
  const [openChart, setOpenChart] = useState(() => {
    const stored = localStorage.getItem("openChart");
    return stored !== null ? JSON.parse(stored) : true;
  });

  // Same persistence pattern again, for the Trade Action Panel (Buy/Sell)
  // now that it's a freeform panel too instead of being fixed in its own
  // grid column — it can be dragged, resized and closed exactly like
  // Order Book/Recent Trades/the chart.
  const [openTradeActionPanel, setOpenTradeActionPanel] = useState(() => {
    const stored = localStorage.getItem("openTradeActionPanel");
    return stored !== null ? JSON.parse(stored) : true;
  });

  // The bottom history/tabs section (Position/Open Orders/Fills/etc.) —
  // closable (hover for the ✕, same as every other panel) and
  // height-resizable (drag its own top edge), but deliberately NOT part of
  // the free-floating canvas above: it's a full-width docked section, so
  // only its height makes sense to adjust, not its position.
  const [openTradeTabs, setOpenTradeTabs] = useState(() => {
    const stored = localStorage.getItem("openTradeTabs");
    return stored !== null ? JSON.parse(stored) : true;
  });
  const [tradeTabsHeightPx, setTradeTabsHeightPx] = useState(() => {
    const stored = localStorage.getItem("tradeTabsHeightPx");
    return stored !== null ? JSON.parse(stored) : null; // null = natural content-driven height
  });
  const tradeTabsDragRef = useRef(null);
  const tradeTabsRef = useRef(null);
  // Drag-to-reposition offset for the same docked history/tabs section —
  // kept as a simple {x,y} pixel offset (applied via transform) rather
  // than folding it into panelLayout's rect system, since this section
  // isn't a free-floating canvas panel: it stays docked in its own grid
  // row (so page flow/spacing above and below it is untouched) and is
  // only ever nudged away from that natural position by hand.
  const [tradeTabsOffset, setTradeTabsOffset] = useState(() => {
    const stored = localStorage.getItem("tradeTabsOffset");
    return stored !== null ? JSON.parse(stored) : { x: 0, y: 0 };
  });
  const tradeTabsMoveDragRef = useRef(null);

  // ── Freeform layout (desktop) ────────────────────────────────────────
  // Binance-style drag-header-to-move / drag-corner-to-resize for the
  // whole chart + Order Book + Recent Trades + Trade Action Panel
  // cluster — this is now simply how the desktop layout works. The
  // bottom tabs are the only thing that stays fixed in place.
  const freeformCanvasRef = useRef(null);
  const topZRef = useRef(4);
  // Last measured size of freeformCanvasRef — the baseline the
  // canvas-resize effect below rescales panelLayout against whenever that
  // measured size changes (see the effect for why this is needed).
  const canvasSizeRef = useRef(null);
  // Each Order Book/Recent Trades/Trade Action Panel's own true, last
  // user-dragged position — kept separate from panelLayout (which reflects
  // wherever it's currently actually DISPLAYED, possibly nudged out of the
  // chart's way). Overlap-avoidance below always measures against — and
  // returns a panel to — its anchor, not its last displayed rect, so
  // shrinking the chart back down automatically brings a pushed panel back
  // to exactly where the user put it instead of leaving it wherever it
  // happened to get nudged to while the chart was bigger.
  const panelAnchorsRef = useRef({});

  // null until initialized against the canvas's real measured size (see
  // effect below) — can't pick sensible pixel defaults before knowing how
  // big the canvas actually renders at.
  const [panelLayout, setPanelLayout] = useState(() => {
    const stored = localStorage.getItem("futuresCustomLayout");
    return stored !== null ? JSON.parse(stored) : null;
  });

  // Explicit pixel height for the chartCluster canvas — seeded synchronously
  // from the viewport (matching the old 70vh CSS default) since the grid
  // row is now content-driven ('auto') and an absolutely-positioned canvas
  // contributes no height of its own otherwise. Only ever grown (never
  // auto-shrunk) whenever a drag needs more vertical room than the canvas
  // currently has — this is what lets the chart's height keep growing past
  // wherever the history tabs below it used to cap it at (the whole page
  // grows, and scrolls, with it) instead of being clipped at a fixed
  // viewport-relative ceiling.
  const [canvasHeightPx, setCanvasHeightPx] = useState(() => (
    typeof window !== "undefined" ? Math.max(600, Math.round(window.innerHeight * 0.7)) : 600
  ));

  const [zOrder, setZOrder] = useState({ chart: 1, orderBook: 2, recentTrades: 3, tradeActionPanel: 4 });

  useEffect(() => {
    if (panelLayout) localStorage.setItem("futuresCustomLayout", JSON.stringify(panelLayout));
  }, [panelLayout]);

  useEffect(() => {
    localStorage.setItem("openTradeActionPanel", JSON.stringify(openTradeActionPanel));
  }, [openTradeActionPanel]);

  useEffect(() => {
    localStorage.setItem("openTradeTabs", JSON.stringify(openTradeTabs));
  }, [openTradeTabs]);

  useEffect(() => {
    if (tradeTabsHeightPx === null) {
      localStorage.removeItem("tradeTabsHeightPx");
    } else {
      localStorage.setItem("tradeTabsHeightPx", JSON.stringify(tradeTabsHeightPx));
    }
  }, [tradeTabsHeightPx]);

  useEffect(() => {
    localStorage.setItem("tradeTabsOffset", JSON.stringify(tradeTabsOffset));
  }, [tradeTabsOffset]);

  // First render (or right after restoreLayoutDefaults), lay the four
  // panels out based on the canvas's actual current size — a simple
  // chart / stacked order-book+recent-trades / trade-action-panel split,
  // matching the rough proportions in the Binance screenshot. After that,
  // whatever the user drags/resizes to is what persists.
  //
  // Retries across animation frames (bounded) rather than giving up after
  // one failed measurement: right after a hard refresh the canvas can
  // still measure 0×0 on the very first tick (page not fully painted
  // yet), and since this effect only re-runs when `panelLayout` itself
  // changes, a single failed attempt would otherwise leave every panel
  // invisible until something unrelated happened to change that state —
  // which is what made it look like only resizing the window could bring
  // them back.
  useEffect(() => {
    if (panelLayout) return;
    let frame = null;
    let attempts = 0;
    const tryComputeLayout = () => {
      const el = freeformCanvasRef.current;
      const rect = el?.getBoundingClientRect();
      const cw = rect?.width ?? 0;
      const ch = rect?.height ?? 0;
      if (cw <= 0 || ch <= 0) {
        attempts += 1;
        if (attempts < 30) frame = requestAnimationFrame(tryComputeLayout);
        return;
      }
      // const gap = 8;
      // const taW = Math.max(300, Math.min(360, Math.round(cw * 0.22)));
      // const remainingCw = cw - taW - gap;
      // const sideW = Math.max(280, Math.round(remainingCw * 0.28));
      // const chartW = Math.max(640, remainingCw - sideW - gap);
      // const halfH = Math.round((ch - gap) / 2);
      // const layout = {
      //   chart: { x: 0, y: 0, w: chartW, h: ch },
      //   orderBook: { x: chartW + gap, y: 0, w: sideW, h: halfH },
      //   recentTrades: { x: chartW + gap, y: halfH + gap, w: sideW, h: ch - halfH - gap },
      //   tradeActionPanel: { x: chartW + gap + sideW + gap, y: 0, w: taW, h: ch },
      // };
      const gap = 8;
      const taW = Math.max(300, Math.min(360, Math.round(cw * 0.22)));
      const remainingCw = cw - taW - gap;
      const sideW = Math.max(280, Math.round(remainingCw * 0.28));
      const chartW = Math.max(640, remainingCw - sideW - gap);
      const recentTradesH = 150;
      const orderBookH = ch - gap - recentTradesH; // takes all remaining height
      const layout = {
        chart: { x: 0, y: 0, w: chartW, h: ch },
        orderBook: { x: chartW + gap, y: 0, w: sideW, h: orderBookH },
        recentTrades: { x: chartW + gap, y: orderBookH + gap, w: sideW, h: recentTradesH },
        tradeActionPanel: { x: chartW + gap + sideW + gap, y: 0, w: taW, h: ch },
      };
      setPanelLayout(layout);
    };
    frame = requestAnimationFrame(tryComputeLayout);
    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [panelLayout]);

  // Backfills any panel missing from an already-set panelLayout (most
  // commonly one restored from localStorage that was saved by an older
  // version of this page, before a given panel — e.g. the Trade Action
  // Panel — existed in the saved schema at all). Without this, that
  // panel would just silently never appear again on any future load,
  // since the "compute from scratch" effect above only ever runs while
  // panelLayout is null, and a layout loaded from storage is never null.
  useEffect(() => {
    if (!panelLayout) return;
    const ids = ["chart", "orderBook", "recentTrades", "tradeActionPanel"];
    const missing = ids.filter((id) => !panelLayout[id]);
    if (missing.length === 0) return;
    const bounds = getFreeformCanvasBounds();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    setPanelLayout((prev) => {
      if (!prev) return prev;
      const stillMissing = ids.filter((id) => !prev[id]);
      if (stillMissing.length === 0) return prev;
      const patched = { ...prev };
      // Trade Action Panel is the one realistic case in practice (chart/
      // orderBook/recentTrades have existed in the schema since this
      // feature's first version) — give it a sensible default slot on
      // the right-hand edge rather than overlapping anything existing.
      if (stillMissing.includes("tradeActionPanel")) {
        const taW = Math.max(300, Math.min(360, Math.round(bounds.width * 0.22)));
        patched.tradeActionPanel = {
          x: Math.max(0, bounds.width - taW),
          y: 0,
          w: taW,
          h: bounds.height,
        };
      }
      return patched;
    });
  }, [panelLayout]);

  // ── Keep panels in sync when the CANVAS itself resizes ────────────────
  // Everything above only updates panelLayout in response to a panel being
  // dragged/resized by hand. It never reacted to the freeform canvas
  // changing size for any other reason — a browser window resize, the
  // user zooming, a sidebar elsewhere on the page collapsing, etc. — as
  // long as the breakpoint stayed >=1200px so this same freeform view kept
  // rendering. Since each panel's rect is stored in absolute pixels, that
  // left every panel sitting exactly where it used to be measured in a
  // canvas that had since shrunk (or grown) underneath it: panels could
  // drift outside the new bounds and get clipped by chartCluster's
  // `overflow: hidden` (looking exactly like a panel had been "hidden" or
  // "removed"), or end up overlapping each other once there wasn't room
  // for the old layout anymore.
  //
  // This observes the canvas directly (not just `width` from
  // useBreakpoint, which only reports the window's own width and wouldn't
  // catch the canvas resizing for any other reason) and, whenever its
  // measured size actually changes, rescales every panel's rect by the
  // same ratio the canvas changed by — preserving each panel's relative
  // position/size (and whichever custom arrangement the user dragged
  // things into) instead of resetting to the auto-computed default layout.
  // Each panel is then reclamped to its own real min size so a shrink
  // can't squeeze it below what it was ever allowed to go by hand.
  useEffect(() => {
    const el = freeformCanvasRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nw = entry.contentRect.width;
      const nh = entry.contentRect.height;
      if (nw <= 0 || nh <= 0) return;

      const prevSize = canvasSizeRef.current;
      canvasSizeRef.current = { w: nw, h: nh };

      // First observation (including right after this observer re-attaches
      // to a freshly (re)mounted canvas element) — nothing to rescale
      // against yet, just record the baseline.
      if (!prevSize) return;
      // Ignore no-op notifications so this doesn't fight with the
      // drag/resize handlers above over floating-point-sized changes.
      if (Math.abs(prevSize.w - nw) < 1 && Math.abs(prevSize.h - nh) < 1) return;

      const scaleX = nw / prevSize.w;
      const scaleY = nh / prevSize.h;

      const scaledAnchors = {};
      Object.keys(panelAnchorsRef.current).forEach((id) => {
        const a = panelAnchorsRef.current[id];
        if (!a) return;
        scaledAnchors[id] = { x: a.x * scaleX, y: a.y * scaleY, w: a.w * scaleX, h: a.h * scaleY };
      });
      panelAnchorsRef.current = scaledAnchors;

      setPanelLayout((prev) => {
        if (!prev) return prev;
        const bounds = { width: nw, height: nh };
        const next = {};
        Object.keys(prev).forEach((id) => {
          const r = prev[id];
          if (!r) return;
          const { minW, minH } = PANEL_MIN_SIZES[id] || { minW: 260, minH: 180 };
          next[id] = clampRectToBounds(
            { x: r.x * scaleX, y: r.y * scaleY, w: r.w * scaleX, h: r.h * scaleY },
            bounds,
            minW,
            minH,
          );
        });
        return next;
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
    // Re-attaches whenever this freeform view itself mounts/unmounts (the
    // canvas element is only rendered at all once width >= 1200 — see
    // render below) rather than on every `width` tick, so a round trip
    // below 1200px and back gets a fresh observer on the new DOM node
    // instead of silently keeping a disconnected one from before.
  }, [width >= 1200]);

  const getFreeformCanvasBounds = () => freeformCanvasRef.current?.getBoundingClientRect();

  const bringPanelToFront = (id) => {
    topZRef.current += 1;
    setZOrder((prev) => ({ ...prev, [id]: topZRef.current }));
  };

  // ── Overlap-only relocation ────────────────────────────────────────────
  // Resizing the chart (or moving/resizing the Trade Action Panel) used to
  // always recompute Order Book/Recent Trades to exactly fill whatever
  // space was left over — which meant they visibly resized on every single
  // chart drag even when they were nowhere near the chart's new edge. The
  // chart (and the Trade Action Panel) must always be free to grow to
  // whatever size the user actually drags to — it's never capped here.
  // Every other panel is only ever relocated (never resized, unless truly
  // nothing else fits) when the change would now actually overlap it, and
  // every panel stays visible somewhere on the canvas — nothing is ever
  // silently hidden by an overlap; only an explicit close (the ✕ icon)
  // removes a panel from view.
  const CHART_GAP = 8;

  const rectsOverlap = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  const overlapsAny = (rect, blockers) => blockers.some((b) => rectsOverlap(rect, b));

  // Finds a spot for a panel (starting from its own anchor) that's clear
  // of every rect in `blockers` — the mover plus any other panel already
  // relocated this same pass, so relocating one panel out of the mover's
  // way can never leave it newly overlapping a THIRD panel instead (which
  // is what let a pushed Order Book land on top of the Trade Action
  // Panel). Candidates are built from the anchor's own x/y plus each
  // blocker's near/far edges — i.e. "snap just past this blocker, on
  // whichever side is closest to home" — tried first at the panel's own
  // full anchor size, then progressively smaller, only reaching its real
  // minimum as an actual last resort. The chart/Trade Action Panel's own
  // rect is never touched by this — only ever called on the OTHER panels.
  const placeClearOf = (anchor, blockers, bounds, minW, minH) => {
    const gap = CHART_GAP;

    const tryAtSize = (w, h) => {
      const xs = [anchor.x, ...blockers.flatMap((b) => [b.x + b.w + gap, b.x - w - gap])];
      const ys = [anchor.y, ...blockers.flatMap((b) => [b.y + b.h + gap, b.y - h - gap])];
      const candidates = [];
      ys.forEach((y) => {
        xs.forEach((x) => {
          const rect = clampRectToBounds({ x, y, w, h }, bounds, w, h);
          // Only accept it if clamping didn't have to shrink it below the
          // size actually being tried — otherwise this candidate belongs
          // to a smaller size step, tried further down instead.
          if (rect.w === w && rect.h === h && !overlapsAny(rect, blockers)) {
            candidates.push(rect);
          }
        });
      });
      if (!candidates.length) return null;
      // Closest to the anchor wins — least disruptive to wherever the
      // user actually left this panel.
      candidates.sort((a, b) => (
        (Math.abs(a.x - anchor.x) + Math.abs(a.y - anchor.y))
        - (Math.abs(b.x - anchor.x) + Math.abs(b.y - anchor.y))
      ));
      return candidates[0];
    };

    return (
      tryAtSize(anchor.w, anchor.h)
      || tryAtSize(Math.max(minW, Math.round((anchor.w + minW) / 2)), Math.max(minH, Math.round((anchor.h + minH) / 2)))
      || tryAtSize(minW, minH)
      // Canvas genuinely doesn't have room for every panel even at
      // minimum size (an extremely small/narrow window) — fall back to
      // its clamped anchor rather than leaving it fully off-canvas; this
      // is the only case where it may still visually overlap something.
      || clampRectToBounds(anchor, bounds, minW, minH)
    );
  };

  const updatePanelRect = (id, nextRect, mode) => {
    // Order Book/Recent Trades being dragged directly stays a plain,
    // independent move/resize, same as always — this is also what records
    // it as their new anchor (see panelAnchorsRef above): the position the
    // chart's/Trade Action Panel's own resize/move will measure overlap
    // against, and return this panel to, from now on.
    if (id === "orderBook" || id === "recentTrades") {
      panelAnchorsRef.current[id] = nextRect;
      setPanelLayout((prev) => (prev ? { ...prev, [id]: nextRect } : prev));
      return;
    }

    // Chart or Trade Action Panel resizing/moving: its own rect is simply
    // whatever it was dragged to — always, never capped. Order Book/Recent
    // Trades — and, when the chart itself is what's moving, the Trade
    // Action Panel too — are recomputed fresh from their own ANCHOR
    // against this new rect every time, rather than incrementally shifted
    // from wherever they last ended up. That's what lets shrinking the
    // chart back down return them to exactly where the user left them,
    // instead of leaving them stranded wherever they got relocated to
    // while it was bigger. The chart itself is never a target here — only
    // its own drag ever changes its rect.
    const bounds = getFreeformCanvasBounds();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
      setPanelLayout((prev) => (prev ? { ...prev, [id]: nextRect } : prev));
      return;
    }

    setPanelLayout((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [id]: nextRect };
      if (id === "tradeActionPanel") panelAnchorsRef.current.tradeActionPanel = nextRect;

      // Pegged against the canvas's current bottom edge — grow the canvas
      // itself so the next drag tick has more room to keep following the
      // cursor down, instead of the chart (or Trade Action Panel) simply
      // getting stuck at whatever height the page happened to already be.
      if (nextRect.y + nextRect.h >= bounds.height - 2) {
        setCanvasHeightPx((h) => Math.min(6000, h + 200));
      }

      // Every panel relocated so far this pass joins the mover in
      // `blockers`, so resolving one overlap can't create a new one
      // against a panel already placed.
      const blockers = [nextRect];
      const affectedIds = id === "chart"
        ? ["orderBook", "recentTrades", "tradeActionPanel"]
        : ["orderBook", "recentTrades"]; // moving/resizing the Trade Action Panel never touches the chart
      affectedIds.forEach((otherId) => {
        if (otherId === "tradeActionPanel" && !openTradeActionPanel) return;
        const anchor = panelAnchorsRef.current[otherId] ?? prev[otherId];
        if (!anchor) return;
        const { minW, minH } = PANEL_MIN_SIZES[otherId];
        if (!overlapsAny(anchor, blockers)) {
          // Already clear of everything relocated so far — leave it
          // exactly at its anchor, don't disturb it just because the
          // mover changed.
          next[otherId] = anchor;
        } else {
          const placed = placeClearOf(anchor, blockers, bounds, minW, minH);
          next[otherId] = placed;
          blockers.push(placed);
        }
      });
      return next;
    });
  };

  // Reserves enough width for whichever of Order Book/Recent Trades (one
  // shared column) and the Trade Action Panel (its own separate column)
  // are currently open, so the chart can still be dragged very wide —
  // "maximized" — without ever being able to fully consume the room they
  // need. Read live via getMaxSize on the chart's own DraggableResizablePanel
  // below, so it always reflects whichever panels happen to be open right
  // now.
  const getChartMaxSize = () => {
    const bounds = getFreeformCanvasBounds();
    if (!bounds) return undefined;
    let reservedW = 0;
    if (openOrderBook || openRecentTrade) {
      reservedW += Math.max(
        openOrderBook ? PANEL_MIN_SIZES.orderBook.minW : 0,
        openRecentTrade ? PANEL_MIN_SIZES.recentTrades.minW : 0,
      ) + CHART_GAP;
    }
    if (openTradeActionPanel) reservedW += PANEL_MIN_SIZES.tradeActionPanel.minW + CHART_GAP;
    return { maxW: Math.max(PANEL_MIN_SIZES.chart.minW, bounds.width - reservedW) };
  };

  const resetCustomLayout = () => {
    setPanelLayout(null);
    canvasSizeRef.current = null;
    panelAnchorsRef.current = {};
    setCanvasHeightPx(Math.max(600, Math.round(window.innerHeight * 0.7)));
    localStorage.removeItem("futuresCustomLayout");
  };

  const updateCurrentTab = async (pairId, tradeMode, selectedTab) => {
    try {
      const payload = {
        pairId: pairId,
        tradeMode: tradeMode,
        filterType: selectedTab,
      };
      const result = await UpdateTab(payload, userdetails?.secretKey);
    } catch (error) {
      console.log("updateCurrentTab_err", error);
    }
  };

  const setPairData = () => {
    if (isEmpty(futurePairData)) return;

    let currency = tikerRoot || localStorage.getItem("futurespair");
    let pairDetail = futurePairData.find((el) => el.tickerRoot === currency);

    if (!pairDetail) {
      currency = futurePairData[0].tickerRoot;
      pairDetail = futurePairData[0];
      localStorage.setItem("futurespair", currency);
    }

    if (
      !futureTradePair ||
      futureTradePair.tickerRoot !== pairDetail.tickerRoot
    ) {
      dispatch(FutureTradePair({ tradePair: pairDetail }));
    }

    if (
      !tikerRoot ||
      !futurePairData.some((el) => el.tickerRoot === tikerRoot)
    ) {
      navigate(`/futures/${currency}`, { replace: true });
    }
  };

  useEffect(() => {
    localStorage.setItem("openOrderBook", JSON.stringify(openOrderBook));
  }, [openOrderBook]);

  useEffect(() => {
    localStorage.setItem("openRecentTrade", JSON.stringify(openRecentTrade));
  }, [openRecentTrade]);
  useEffect(() => {
    localStorage.setItem("openChart", JSON.stringify(openChart));
  }, [openChart]);
  useEffect(() => {
    const handler = () => {
      setOpenOrderBook(true);
      setOpenRecentTrade(true);
      setOpenChart(true);
      setOpenTradeActionPanel(true);
      setOpenTradeTabs(true);
      setTradeTabsHeightPx(null);
      setTradeTabsOffset({ x: 0, y: 0 });
      resetCustomLayout();
    };
    window.addEventListener("restoreLayoutDefaults", handler);
    return () => window.removeEventListener("restoreLayoutDefaults", handler);
  }, []);
  useEffect(() => {
    if (!isEmpty(userdetails) && !isEmpty(futureTradePair)) {
      let leverage = userdetails?.pairSettings?.find(
        (val) => val?.pairId?.toString() == futureTradePair?._id?.toString(),
      )?.leverage;
      // Whole numbers only — a leverage value saved before this
      // restriction existed could still be a decimal (e.g. 2.5x); round it
      // here so every consumer of this Redux value gets a whole number.
      dispatch(UserLeverage({ leverage: isNaN(leverage) ? 1 : Math.round(leverage) }));
    }
  }, [futureTradePair, userdetails]);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    // Beyond just "does a pair exist for this URL segment at all", this
    // also re-validates that the pair currently being displayed is still
    // in the (active-only) futurePairData list. Previously this only
    // looked at whether `futureTradePair.tickerRoot` differed from the URL
    // — once they matched (the normal, already-settled state), toggling
    // that exact pair to inactive in the admin panel updated
    // futurePairData but never re-ran setPairData(), since
    // futureTradePair.tickerRoot still equalled the unchanged URL's
    // tikerRoot. The page was left showing a now-inactive pair's frozen
    // last-known data indefinitely, only correcting itself on a manual
    // refresh. Explicitly checking pair activity here means deactivating
    // the pair the user is currently viewing (while other pairs remain
    // active) now redirects live to another active pair, the same way it
    // already redirects to Coming Soon when none are left.
    const isCurrentPairStillActive =
      !isEmpty(tikerRoot) &&
      !isEmpty(futurePairData) &&
      futurePairData.some((el) => el.tickerRoot === tikerRoot);
    if (
      isEmpty(futureTradePair) ||
      futureTradePair.tickerRoot != tikerRoot ||
      !isCurrentPairStillActive
    ) {
      setPairData();
    }
  }, [tikerRoot, futurePairData]);

  useEffect(() => {
    if (!futurePairDataLoaded) {
      if (!isPageLoader) setIsPageLoader(true);
      return;
    }
    if (isEmpty(futurePairData)) {
      if (isPageLoader) setIsPageLoader(false);
      if (!comingSoon) setComingSoon(true);
      return;
    }
    if (isPageLoader) setIsPageLoader(false);
    if (comingSoon) setComingSoon(false);
  }, [futurePairDataLoaded, futurePairData]);

  useEffect(() => {
    if (!futureTradePair || !futurePairData?.length) return;
    const updatedPair = futurePairData.find(
      (el) => el.tickerRoot === futureTradePair.tickerRoot,
    );
    if (!updatedPair) return;
    dispatch(FutureTicker({ tikerData: updatedPair }));
  }, [futurePairData, futureTradePair?.tickerRoot]);

  useMemo(() => {
    if (
      userdetails?.filterType == "currentContract" &&
      userdetails?.pairId?.toString() != futureTradePair?._id?.toString()
    ) {
      updateCurrentTab(
        futureTradePair?._id,
        futureTradePair?.tradeMode,
        "currentContract",
      );
    }
  }, [userdetails, futureTradePair]);

  // chart resize
  useEffect(() => {
    const handler = (e) => {
      const grid = gridRef.current;
      if (!grid) return;
      const { width: w, height: h } = e.detail;
      const r3 = 150;
      const newR2 = Math.max(100, h - r3);
      const remaining = grid.offsetWidth - w;

      const clearAll = () =>
        grid.classList.remove(
          styles.gridResized640,
          styles.gridResized320,
          styles.gridResizedMin,
          styles.gridContainerResized,
          styles.gridResizedwithoutSpace,
        );

      if (width >= 1200) {
        // Natural (un-resized) height for the shared tradingChart+orderBook
        // row, matching tradePageLayout.module.css's own per-breakpoint
        // grid-template exactly: 320px at 1200-1399px, 420px at
        // 1400-1799px, 595px at >=1800px. This is NOT the same as the flat
        // 320px fallback baked into the gridResized640/320/Min classes
        // below (var(--chart-r2, 320px)) — that fallback only happens to
        // match the true default at the narrowest of these three
        // breakpoints. On anything wider, once the user resized even once,
        // shrinking back down kept reapplying one of those classes with
        // its smaller 320px fallback instead of the correct, larger
        // natural size — leaving the chart/Order Book area permanently
        // shrunk versus its true default even after "minimizing".
        const naturalR2 = width >= 1800 ? 595 : width >= 1400 ? 420 : 320;

        if (h <= naturalR2 + 20) {
          // Back at (or below) the natural default — fully reset instead
          // of forcing a "resized" class with a mismatched fallback, same
          // fix pattern as the width >= 768 branch below.
          clearAll();
          grid.style.gridTemplate = "";
          grid.style.removeProperty("--chart-r2");
          grid.style.removeProperty("--chart-r3");
          // Tells the Resizable component (TradingChart.jsx) to also let
          // go of its own internally-tracked dragged width/height — the
          // grid resetting alone isn't enough, since Resizable keeps its
          // own pixel size independent of the grid cell it sits in.
          window.dispatchEvent(new CustomEvent('chartResizeReset'));
          return;
        }

        clearAll();
        grid.style.gridTemplate = "";
        grid.style.setProperty("--chart-r2", `${newR2}px`);
        grid.style.setProperty("--chart-r3", `${r3}px`);
        if (remaining >= 640) grid.classList.add(styles.gridResized640);
        if (remaining >= 320) {
          if (!openOrderBook && !openRecentTrade) {
            grid.classList.add(styles.gridResizedwithoutSpace);
            // Set r2 to total dragged height (r3 is absorbed into the single row)
            grid.style.setProperty("--chart-r2", `${Math.max(100, h)}px`);
            grid.style.setProperty("--chart-r3", "0px");
          } else {
            grid.classList.add(styles.gridResized320);
          }
        } else grid.classList.add(styles.gridResizedMin);
      } else if (width >= 768) {
        clearAll();
        grid.style.gridTemplate = "";
        const defaultHeight = width >= 992 ? 600 : 450;
        if (h <= defaultHeight + 20) {
          grid.style.setProperty("--chart-height", "");
          // Was previously left at its last-expanded value here, so the
          // row below the chart (Order Book / trade action panel) stayed
          // reserved at that old, larger height even after the chart
          // itself shrank back down — exactly the leftover empty-space
          // symptom after minimizing.
          grid.style.setProperty("--action-height", "");
          // See the >=1200 branch above — Resizable needs its own reset too.
          window.dispatchEvent(new CustomEvent('chartResizeReset'));
          return;
        }
        grid.style.setProperty("--chart-height", `${h}px`);
        grid.style.setProperty("--action-height", `${Math.min(h, 510)}px`);
        grid.classList.add(styles.gridContainerResized);
      }
    };

    if (gridRef.current) {
      gridRef.current.classList.remove(
        styles.gridResized640,
        styles.gridResized320,
        styles.gridResizedMin,
        styles.gridContainerResized,
      );
      gridRef.current.style.gridTemplate = "";
    }

    window.addEventListener("chartResize", handler);
    return () => window.removeEventListener("chartResize", handler);
  }, [width, openOrderBook, openRecentTrade]);

  /** */
  useEffect(() => {
    if (tikerRoot && feeSettingsList) {
      let makerFee = feeSettingsList?.find((val) => {
        return (val.pairName == tikerRoot &&
          val.tradeMode == 'future' &&
          val.status == 'active' &&
          val.feeType == 'maker'
        )
      })
      let takerFee = feeSettingsList?.find((val) => {
        return (val.pairName == tikerRoot &&
          val.tradeMode == 'future' &&
          val.status == 'active' &&
          val.feeType == 'taker'
        )
      })
      // let liquiFee = feeSettingsList?.find((val) => {
      //   return (val.pairName == tikerRoot &&
      //     val.tradeMode == 'future' &&
      //     val.status == 'active' &&
      //     val.feeType == 'liquidation' &&
      //     val.marginMode.includes(userdetails?.marginMode)
      //   )
      // })
      if (isEmpty(makerFee)) {
        makerFee = feeSettingsList?.find((val) => {
          return (val.pairName == 'all' &&
            val.tradeMode == 'future' &&
            val.status == 'active' &&
            val.feeType == 'maker'
          )
        })
      }
      if (isEmpty(takerFee)) {
        takerFee = feeSettingsList?.find((val) => {
          return (val.pairName == 'all' &&
            val.tradeMode == 'future' &&
            val.status == 'active' &&
            val.feeType == 'taker'
          )
        })
      }
      // if (isEmpty(liquiFee)) {
      //   liquiFee = feeSettingsList?.find((val) => {
      //     return (val.pairName == 'all' &&
      //       val.tradeMode == 'future' &&
      //       val.status == 'active' &&
      //       val.feeType == 'liquidation_fee' &&
      //       val.marginMode.includes(userdetails?.marginMode)
      //     )
      //   })
      //   const percent = liquiFee?.leverageRule?.find((val) => (leverage >= val?.min && leverage <= val?.max))?.percent
      //   dispatch(LiquiFee({ liquiFee: percent }));
      // } else {
      //   dispatch(LiquiFee({ liquiFee: liquiFee?.feePercentage }));
      // }
      // console.log(makerFee, takerFee, "feeSettingsList")
      dispatch(MakerFee({ makerFee: makerFee?.feePercentage }));
      dispatch(TakerFee({ takerFee: takerFee?.feePercentage }));

    }
  }, [tikerRoot, feeSettingsList, userdetails])

  /** Common blocks reused for all breakpoints */
  const marketSummaryBlock = (
    <div className={styles.marketSummary}>
      <MarketSummary />
    </div>
  );

  const tradeTabsBlock = (
    <div className={styles.tradeTabs}>
      <TradeTabs />
    </div>
  );

  // Drag-to-resize-height for the docked history/tabs section (desktop
  // only) — same pointer-capture + cancel/blur safety-net robustness as
  // DraggableResizablePanel's own drag handling (see that file for why
  // each of these matters), just for a single vertical axis instead of a
  // free-floating rect.
  const startTradeTabsResize = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const startHeight = tradeTabsHeightPx
      ?? tradeTabsRef.current?.getBoundingClientRect().height
      ?? 420;
    tradeTabsDragRef.current = { startY: e.clientY, startHeight, pointerId: e.pointerId, target: e.currentTarget };
    document.body.style.cursor = "ns-resize";
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (err) {
      // Some pointer types/older browsers don't support capture.
    }
    const onMove = (ev) => {
      const drag = tradeTabsDragRef.current;
      if (!drag) return;
      // Dragging the TOP edge up increases height (and vice versa) —
      // opposite sign from a bottom-right corner handle.
      const dy = drag.startY - ev.clientY;
      setTradeTabsHeightPx(Math.max(200, Math.min(1400, drag.startHeight + dy)));
    };
    const onEnd = () => {
      tradeTabsDragRef.current = null;
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      window.removeEventListener("blur", onEnd);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd, { once: true });
    window.addEventListener("pointercancel", onEnd, { once: true });
    window.addEventListener("blur", onEnd, { once: true });
    e.preventDefault();
  };

  // Drag-to-reposition for the same section — delegated at the whole
  // section level (same approach as DraggableResizablePanel's own
  // pointerdown delegation) rather than wired directly onto TradeTabs'
  // header, since that header lives inside a separate child component.
  // Only starts a move when the pointerdown actually landed inside the
  // header (marked with data-panel-drag-handle, same attribute/selector
  // every other panel's header already uses for its own drag-to-move) and
  // NOT on one of that header's own interactive controls (a tab button,
  // the search toggle, etc. — those still need to keep working as plain
  // clicks) or on the resize strip / close button (each already has its
  // own separate pointerdown handler and sits outside the header anyway).
  const TRADE_TABS_INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, [role="button"]';
  const startTradeTabsMove = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest(TRADE_TABS_INTERACTIVE_SELECTOR)) return;
    if (!e.target.closest('[data-panel-drag-handle]')) return;
    const startOffset = { ...tradeTabsOffset };
    tradeTabsMoveDragRef.current = { startX: e.clientX, startY: e.clientY, startOffset, pointerId: e.pointerId };
    document.body.style.cursor = "grabbing";
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (err) {
      // Some pointer types/older browsers don't support capture.
    }
    const onMove = (ev) => {
      const drag = tradeTabsMoveDragRef.current;
      if (!drag) return;
      const dx = ev.clientX - drag.startX;
      const dy = ev.clientY - drag.startY;
      setTradeTabsOffset({ x: drag.startOffset.x + dx, y: drag.startOffset.y + dy });
    };
    const onEnd = () => {
      tradeTabsMoveDragRef.current = null;
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
      window.removeEventListener("blur", onEnd);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd, { once: true });
    window.addEventListener("pointercancel", onEnd, { once: true });
    window.addEventListener("blur", onEnd, { once: true });
    e.preventDefault();
  };

  const desktopTradeTabsBlock = openTradeTabs && (
    <div
      className={styles.tradeTabs}
      ref={tradeTabsRef}
      onPointerDown={startTradeTabsMove}
      style={{
        ...(tradeTabsHeightPx ? { height: `${tradeTabsHeightPx}px` } : null),
        transform: (tradeTabsOffset.x || tradeTabsOffset.y)
          ? `translate(${tradeTabsOffset.x}px, ${tradeTabsOffset.y}px)`
          : undefined,
        zIndex: (tradeTabsOffset.x || tradeTabsOffset.y) ? 6 : undefined,
      }}
    >
      <div className={styles.tradeTabsResizeHandle} onPointerDown={startTradeTabsResize} />
      <button
        type="button"
        aria-label="Close history"
        className={styles.tradeTabsCloseBtn}
        onClick={() => setOpenTradeTabs(false)}
      >
        <IoIosCloseCircleOutline />
      </button>
      <TradeTabs />
    </div>
  );

  return (
    <>
      {isPageLoader ? (
        <PageLoader />
      ) : pageHide ? (
        <div className={styles.pageError} />
      ) : (
        <ComingSoon active={comingSoon} title="Coming Soon...">
          <div>
            <Header customClass="futureTradingHeading" />
            <MetaTags />
          <section className="custom-section">
            <div className={styles.layout}>
              <div className={`${styles.container} py-0`}>
                {width >= 1200 && (
                  /** Desktop View — chart / Order Book / Recent Trades /
                   * Trade Action Panel are all free-floating in one shared
                   * canvas (drag header to move, drag corner to resize,
                   * click ✕ to close), matching Binance. Only the bottom
                   * tabs stay fixed. */
                  <div className={styles.desktop}>
                    <div className={styles.gridContainerCustomize}>
                      {marketSummaryBlock}
                      <div className={styles.chartCluster} ref={freeformCanvasRef} style={{ height: `${canvasHeightPx}px` }}>
                        {panelLayout && (
                          <>
                            {openChart && (
                              <DraggableResizablePanel
                                rect={panelLayout.chart}
                                onChange={(r, mode) => updatePanelRect("chart", r, mode)}
                                onFocus={() => bringPanelToFront("chart")}
                                zIndex={zOrder.chart}
                                getBounds={getFreeformCanvasBounds}
                                getMaxSize={getChartMaxSize}
                                minW={640}
                                minH={420}
                              >
                                <TradingChart embedded onClose={() => setOpenChart(false)} />
                              </DraggableResizablePanel>
                            )}
                            {openOrderBook && (
                              <DraggableResizablePanel
                                rect={panelLayout.orderBook}
                                onChange={(r, mode) => updatePanelRect("orderBook", r, mode)}
                                onFocus={() => bringPanelToFront("orderBook")}
                                zIndex={zOrder.orderBook}
                                getBounds={getFreeformCanvasBounds}
                              >
                                <OrderBook onClose={() => setOpenOrderBook(false)} />
                              </DraggableResizablePanel>
                            )}
                            {openRecentTrade && (
                              <DraggableResizablePanel
                                rect={panelLayout.recentTrades}
                                onChange={(r, mode) => updatePanelRect("recentTrades", r, mode)}
                                onFocus={() => bringPanelToFront("recentTrades")}
                                zIndex={zOrder.recentTrades}
                                getBounds={getFreeformCanvasBounds}
                              >
                                <RecentTrades onClose={() => setOpenRecentTrade(false)} />
                              </DraggableResizablePanel>
                            )}
                            {openTradeActionPanel && panelLayout.tradeActionPanel && (
                              <DraggableResizablePanel
                                rect={panelLayout.tradeActionPanel}
                                onChange={(r, mode) => updatePanelRect("tradeActionPanel", r, mode)}
                                onFocus={() => bringPanelToFront("tradeActionPanel")}
                                zIndex={zOrder.tradeActionPanel}
                                getBounds={getFreeformCanvasBounds}
                                minW={300}
                                minH={360}
                              >
                                <TradeActionPanel onClose={() => setOpenTradeActionPanel(false)} />
                              </DraggableResizablePanel>
                            )}
                          </>
                        )}
                      </div>
                      {desktopTradeTabsBlock}
                    </div>
                  </div>
                )}

                {width >= 768 && width < 1200 && (
                  /** Tablet View */
                  <div className={styles.desktop}>
                    <div
                      className={styles.gridContainer}
                      ref={(el) => {
                        gridRef.current = el;
                      }}
                    >
                      {marketSummaryBlock}
                      {openChart && (
                        <div className={styles.tradingChart}>
                          <TradingChart onClose={() => setOpenChart(false)} />
                        </div>
                      )}
                      {/* <div className={styles.orderBook}>
                        <OrderBook />
                      </div> */}
                      {openOrderBook && (
                        <div className={styles.orderBook}>
                          <OrderBook onClose={() => setOpenOrderBook(false)} />
                        </div>
                      )}
                      <div className={styles.tradeActionPanel}>
                        <TradeActionPanel />
                      </div>
                      {tradeTabsBlock}
                    </div>
                  </div>
                )}

                {width < 768 && (
                  /** Mobile View */
                  <div className={styles.mobile}>
                    <div className={styles.gridContainer}>
                      <div className={styles.marketSummary}>
                        <MarketSummary />
                      </div>

                      <div className={styles.gridTabsContainer}>
                        <div className={styles.gridTabsHeader}>
                          {[
                            "graph",
                            "orderBook",
                            "trade",
                            "tradeActionPanel",
                          ].map((tab) => (
                            <button
                              aria-label={tab}
                              key={tab}
                              className={
                                currentTab === tab ? styles.active : ""
                              }
                              onClick={() => setCurrentTab(tab)}
                            >
                              {tab === "graph"
                                ? "Chart"
                                : tab === "orderBook"
                                  ? "Order Book"
                                  : tab === "trade"
                                    ? "Trades"
                                    : "Trade Action"}
                            </button>
                          ))}
                        </div>

                        <div
                          className={styles.gridTabsBody}
                          style={{ position: "relative" }}
                        >
                          <div
                            style={{
                              position:
                                currentTab === "graph"
                                  ? "relative"
                                  : "absolute",
                              visibility:
                                currentTab === "graph" ? "visible" : "hidden",
                              width: "100%",
                              height: "100%",
                              top: 0,
                              left: 0,
                              pointerEvents:
                                currentTab === "graph" ? "auto" : "none",
                            }}
                          >
                            <TradingChart />
                          </div>
                          {currentTab === "orderBook" && <OrderBook />}
                          {currentTab === "trade" && <RecentTrades />}
                          {currentTab === "tradeActionPanel" && (
                            <TradeActionPanel />
                          )}
                        </div>
                      </div>

                      {tradeTabsBlock}
                    </div>
                  </div>
                )}

                <SideModel />
              </div>
            </div>
          </section>
          </div>
        </ComingSoon>
      )}
    </>
  );
};

export default FuturesTrading;