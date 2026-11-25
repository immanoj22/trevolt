/**
 * TradingViewChart.jsx
 *
 * Reusable TradingView Charting Library widget component.
 *
 * Features:
 *   - Dynamic symbol switching (no widget rebuild — uses setSymbol)
 *   - Dark / Light theme switching (no widget rebuild — uses changeTheme)
 *   - Chart state persistence (save to backend, restore on mount)
 *   - Full Broker API integration (orders, positions, TP/SL, cancel, close)
 *     • Order lines with drag-to-modify and cancel button
 *     • Position line with entry price, PnL, and close button
 *     • TP/SL: drag-to-create when none exists, drag-to-modify when present
 *     • Optimistic UI + rollback on failure
 *     • 200ms debounce on order modify, 300ms on TP/SL modify
 *     • Real-time sync via Socket.IO (FuturesopenOrder, FuturesPosition)
 *   - Custom datafeed with real-time Socket.IO kline updates
 *   - Full lifecycle management (mount → update → destroy, no memory leaks)
 *   - Toolbar background injection to match app theme
 *   - Tab visibility resize fix
 *
 *   Broker API (full order/position/TP-SL drag) is only wired when
 *   tradeType === 'future' (see isBrokerCapable) — the backend only supports
 *   modify/cancel/bracket/position endpoints for Futures today. Passing
 *   tradeType='option' (or anything else) disables broker_factory entirely
 *   and skips the useBrokerAdapter REST/socket lifecycle, so no futures
 *   order/position data is ever fetched or rendered on a non-Futures chart.
 *
 *   For contexts without broker support (e.g. Options), use the lightweight
 *   `enableOrderLinePicker` prop instead: it draws one draggable line via the
 *   core charting-library drawing API (no backend/broker dependency) and
 *   reports the chosen price through `onOrderLinePriceChange`, so the caller
 *   can feed it into its own existing (already-validated) order form.
 *
 * Props:
 *   symbol         {string}  - e.g. 'BTCUSDT'
 *   interval       {string}  - e.g. '1' (1-minute)
 *   containerId    {string}  - unique DOM id for the chart container
 *   theme          {string}  - 'dark' | 'light'
 *   autosize       {boolean}
 *   fullscreen     {boolean}
 *   chartExpanded  {boolean} - triggers resize when panel expands/collapses
 *   datafeedUrl    {string}  - base API URL, e.g. 'http://localhost:5000/api/v1'
 *   chartsStorageUrl         {string}
 *   chartsStorageApiVersion  {string}
 *   clientId       {string}
 *   userId         {string}
 *   tradeType      {string}  - 'future' enables full broker order/position/TP-SL;
 *                              anything else (e.g. 'option') disables it
 *   enableOrderLinePicker  {boolean} - draw a draggable order-price line (broker-independent)
 *   orderLineSide          {string}  - 'buy' | 'sell', affects line color/label only
 *   onOrderLinePriceChange {function} - (price:number) => void, fired on drag + once on create
 *   onSymbolChange {function} - (tickerRoot:string) => void. Fired whenever the symbol
 *                    shown on the chart changes for a reason the *app* didn't
 *                    already know about — i.e. the user used the chart's own
 *                    native symbol search, or (in a multi-chart / split
 *                    layout) switched the active pane to one already showing
 *                    a different pair. Lets the caller re-sync the rest of
 *                    the page (order book, trade panel, URL, etc.) to match
 *                    whatever pair is actually selected on the chart.
 */

import React, {
    useEffect, useRef, useCallback, useContext, useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import isEmpty from 'is-empty';

import { useGlobalContext } from '../../../context/GlobalProvider';
import SocketContext from '../../../context/socketContext';
import { createDatafeed } from '../datafeed/CustomDatafeed';
import { saveChartSettings, getChartSettings } from '../../../actions/subAccountAction';
import { useBrokerAdapter } from '../broker/useBrokerAdapter';
import { BrokerAdapter } from '../broker/BrokerAdapter';
import { futureClosePosition } from '../../../actions/futureActions';
import { showToastMessage } from '../../../lib/toast';
import CloseOrderByChart from '../modal/CloseOrderByChart';
import { formatDisplayPair } from '../../../lib/pairDisplay';

// ─── Theme tokens ────────────────────────────────────────────────────────────

const THEMES = {
    dark: {
        background: '#0E1524',
        gridColor: '#1B2740',
        crosshairColor: '#6F7C95',
        separatorColor: '#243049',
        textColor: '#8794AD',
        lineColor: 'rgba(242,242,242,0)',
        axisBackground: '#0E1524',
        toolbarBg: '#0A101C',
    },
    light: {
        background: '#FFFFFF',
        gridColor: '#E0E3EB',
        crosshairColor: '#9C9C9C',
        separatorColor: '#E0E3EB',
        textColor: '#131722',
        lineColor: 'rgba(0,0,0,0)',
        axisBackground: '#FFFFFF',
        toolbarBg: '#FFFFFF',
    },
};

const SAVE_DEBOUNCE_MS = 1500;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeTVTheme(value) {
    const v = String(value || '').toLowerCase();
    return v === 'dark' || v === 'black' ? 'Dark' : 'Light';
}

function themeKey(value) {
    return normalizeTVTheme(value) === 'Dark' ? 'dark' : 'light';
}

/**
 * Removes duplicate studies (same name) on the active chart, keeping only
 * the first of each. Two studies of the same kind on the same pane read
 * the same live data, so their last-value tags show the identical figure
 * twice, stacked — e.g. "Volume" appearing twice. This is a self-healing
 * cleanup: it also fixes accounts whose *saved* chart layout already had
 * a duplicate baked in from a previous session (before the duplication
 * was prevented at the source), not just newly-created duplicates.
 * No-op if there's nothing to remove.
 */
function dedupeStudies(chartApi) {
    if (!chartApi || typeof chartApi.getAllStudies !== 'function') return;
    try {
        const studies = chartApi.getAllStudies() || [];
        const seenNames = new Set();
        studies.forEach((study) => {
            if (seenNames.has(study.name)) {
                try { chartApi.removeEntity(study.id); } catch { void 0; }
            } else {
                seenNames.add(study.name);
            }
        });
    } catch { void 0; }
}

/**
 * Forces the widget to relayout at the container's *actual current* pixel
 * size. `widget.resize()` called with no arguments turns out to be a
 * silent no-op — the Charting Library's `resize(width, height)` needs
 * explicit numbers to do anything; without them there's nothing for it to
 * relayout to, so the internal iframe just keeps whatever size it last
 * had. That's why the gap between the chart and the edge of its container
 * survived every earlier fix that only called `.resize()` bare — those
 * calls were firing at the right times, they just weren't telling the
 * widget what size to become.
 */
function forceResizeWidget(widget, containerId) {
    if (!widget) return;
    const el = document.getElementById(containerId);
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    try { widget.resize(width, height); } catch { void 0; }
}

/**
 * Fires forceResizeWidget across a short burst of delays instead of once.
 *
 * Every existing call site (onChartReady, panel expand/collapse, tab
 * refocus) only ever fired the re-measure a single time, at one specific
 * moment. `forceResizeWidget` itself always re-reads the container's
 * *current* live size, so that part was never wrong — but if the grid
 * hadn't fully settled into its final pixel width at that exact moment
 * (e.g. right on first page load, before webfonts/icons finish swapping in
 * and shifting layout by a few pixels; or right as a CSS panel-expand
 * transition is still animating), nothing ever re-checked afterward,
 * because nothing else changed size again to trigger the ResizeObserver.
 * The chart's iframe would then stay locked at that one-time-too-early
 * measurement — the stale gap this file's other comments describe.
 *
 * Re-measuring a few more times over the next ~1.6s (cheap no-ops once the
 * size has already stopped changing) closes that window without changing
 * any of the actual trigger logic or timing intent at each call site.
 */
function scheduleResizeSettle(widget, containerId) {
    if (!widget) return;
    [0, 60, 150, 300, 600, 1000, 1600].forEach((ms) => {
        setTimeout(() => forceResizeWidget(widget, containerId), ms);
    });
}

/**
 * `charting_library.js` is loaded via a plain, render-blocking <script> tag
 * in index.html <head> — it's a large (multi-MB) file, so on a slow
 * connection or cold cache it can genuinely still be mid-download/parse by
 * the time this component's mount effect fires. `new window.TradingView.widget(...)`
 * was being called with no check that `window.TradingView` even exists yet;
 * on a slow load that throws synchronously inside a React effect with
 * nothing catching it, which is exactly the "chart sometimes doesn't load"
 * symptom — an uncaught error there can take out the whole page's render,
 * not just the chart, and only on the runs where the library happened to
 * still be loading (hence "sometimes").
 */
function isTradingViewLibraryReady() {
    return typeof window !== 'undefined'
        && typeof window.TradingView !== 'undefined'
        && typeof window.TradingView.widget === 'function';
}

/**
 * Polls until the library is available, then calls onReady() — or logs and
 * gives up after timeoutMs so a genuinely broken/missing script (wrong
 * path, blocked request, etc.) fails loudly in the console instead of
 * polling forever. Returns a cancel function for effect cleanup.
 */
function waitForTradingViewLibrary(onReady, { intervalMs = 100, timeoutMs = 15000 } = {}) {
    if (isTradingViewLibraryReady()) {
        onReady();
        return () => { };
    }
    let elapsed = 0;
    let cancelled = false;
    const id = setInterval(() => {
        if (cancelled) return;
        elapsed += intervalMs;
        if (isTradingViewLibraryReady()) {
            clearInterval(id);
            onReady();
        } else if (elapsed >= timeoutMs) {
            clearInterval(id);
        }
    }, intervalMs);
    return () => {
        cancelled = true;
        clearInterval(id);
    };
}

/**
 * WebKit (Safari desktop AND iOS Safari/WKWebView) resolves CSS Grid/Flex
 * layouts and viewport-relative units (100vh, height:100% chains, the
 * `Resizable`/`DraggableResizablePanel` grid cell this chart sits in) on a
 * different timing than Blink (Chrome/Android WebView) — it can still have
 * the container at 0×0 on the exact tick this component's mount effect
 * fires, even though the very same effect reliably sees a fully-laid-out,
 * non-zero container on Chrome. `isTradingViewLibraryReady()` above only
 * confirms the *script* has loaded; it says nothing about whether the DOM
 * node the widget is about to be constructed into has an actual size yet.
 *
 * This matters because `new TradingView.widget()` does its *initial*
 * layout/bootstrap synchronously against whatever size the container
 * reports at that instant. If that's 0×0, later calls to `.resize(w, h)`
 * (see forceResizeWidget/scheduleResizeSettle) correctly resize the
 * outer iframe box, but on this vendored Advanced Charts build the
 * internal chart engine that was bootstrapped against a 0×0 canvas does
 * not always re-run its own first paint — the iframe becomes the right
 * size, but nothing is ever drawn inside it. That reproduces exactly as
 * "blank chart, right where it should be, only on Safari/iOS" while
 * Chrome (which had already finished layout by this point) never hits it.
 */
function isContainerReady(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return false;
    const { width, height } = el.getBoundingClientRect();
    return width > 0 && height > 0;
}

/**
 * Same polling shape as waitForTradingViewLibrary(), but for container
 * size instead of script readiness. Both gates are required before
 * constructing the widget — see the call site in initWidget().
 */
function waitForContainerSize(containerId, onReady, { intervalMs = 50, timeoutMs = 5000 } = {}) {
    if (isContainerReady(containerId)) {
        onReady();
        return () => { };
    }
    let elapsed = 0;
    let cancelled = false;
    const id = setInterval(() => {
        if (cancelled) return;
        elapsed += intervalMs;
        if (isContainerReady(containerId)) {
            clearInterval(id);
            onReady();
        } else if (elapsed >= timeoutMs) {
            // Give up waiting and construct anyway — scheduleResizeSettle()
            // will still fire post-construction and can recover a widget
            // that ends up merely mis-sized (not truly blank). This timeout
            // only protects against polling forever if the container is
            // never going to appear (e.g. an already-unmounted route).
            clearInterval(id);
            onReady();
        }
    }, intervalMs);
    return () => {
        cancelled = true;
        clearInterval(id);
    };
}

function applyThemeToLayout(savedLayout, themeValue) {
    const layout = typeof savedLayout === 'string'
        ? JSON.parse(savedLayout)
        : structuredClone(savedLayout);
    const t = THEMES[themeKey(themeValue)] ?? THEMES.dark;
    (layout.charts || []).forEach((chart) => {
        const pane = chart.chartProperties.paneProperties;
        const scales = chart.chartProperties.scalesProperties;
        pane.background = t.background;
        pane.backgroundType = 'solid';
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

/**
 * Inject a <style> tag into the TradingView iframe to match toolbar background.
 * Uses a MutationObserver to re-apply after TradingView's own DOM mutations.
 */
function injectToolbarBg(containerId, color) {
    const iframe = document.querySelector(`#${containerId} iframe`);
    if (!iframe?.contentDocument?.head) return;

    const doc = iframe.contentDocument;
    const styleId = '__gx_toolbar_bg__';

    const css = `
        /* TradingView header / top toolbar */
        html, body,
        div[class*="chart-toolbar"],
        div[class*="chart-controls-bar"],
        div[class*="toolbar-"],
        div[class*="layout_area-top"],
        div[class*="chart-toolbar"] div[class*="inline-"],
        div[class*="chart-controls-bar"] div[class*="inline-"],
        div[class*="toolbar-"] div[class*="inline-"],
        div[class*="layout_area-top"] div[class*="inline-"],
        div[class*="chart-toolbar"] div[class*="dateRangeWrapper-"],
        div[class*="chart-controls-bar"] div[class*="dateRangeWrapper-"],
        div[class*="toolbar-"] div[class*="dateRangeWrapper-"],
        div[class*="layout_area-top"] div[class*="dateRangeWrapper-"],
        div[class*="chart-toolbar"] div[class*="seriesControlWrapper-"],
        div[class*="chart-controls-bar"] div[class*="seriesControlWrapper-"],
        div[class*="toolbar-"] div[class*="seriesControlWrapper-"],
        div[class*="layout_area-top"] div[class*="seriesControlWrapper-"],
        div[class*="chart-toolbar"] div[class*="collapsed-"],
        div[class*="chart-controls-bar"] div[class*="collapsed-"],
        div[class*="toolbar-"] div[class*="collapsed-"],
        div[class*="layout_area-top"] div[class*="collapsed-"],
        /* TradingView left / drawing toolbar */
        div[class*="drawingToolbar-"],
        div[class*="layout_area-left"],
        /* NOTE: "wrap-", "scrollWrap-", "content-", "inner-", "group-",
           "fill-", "lastGroup-" are generic CSS-module fragments TradingView
           reuses across many unrelated floating UI pieces — most notably
           the native Buy/Sell quick-order tooltip drawn over the chart
           canvas. Matched on their own (as they previously were here) they
           painted that tooltip's background to match the toolbar too,
           leaving its own (unrelated, fixed) text color sitting on top of
           the wrong background — invisible in light theme even though it
           happened to still read fine in dark theme by coincidence. Scoping
           them as descendants of the drawing-toolbar containers keeps the
           left toolbar itself styled exactly as before, without touching
           anything that merely shares one of these generic class fragments
           elsewhere in the chart. */
        div[class*="drawingToolbar-"] div[class*="wrap-"],
        div[class*="layout_area-left"] div[class*="wrap-"],
        div[class*="drawingToolbar-"] div[class*="scrollWrap-"],
        div[class*="layout_area-left"] div[class*="scrollWrap-"],
        div[class*="drawingToolbar-"] div[class*="noScrollBar-"],
        div[class*="layout_area-left"] div[class*="noScrollBar-"],
        div[class*="drawingToolbar-"] div[class*="content-"],
        div[class*="layout_area-left"] div[class*="content-"],
        div[class*="drawingToolbar-"] div[class*="inner-"],
        div[class*="layout_area-left"] div[class*="inner-"],
        div[class*="drawingToolbar-"] div[class*="group-"],
        div[class*="layout_area-left"] div[class*="group-"],
        div[class*="drawingToolbar-"] div[class*="fill-"],
        div[class*="layout_area-left"] div[class*="fill-"],
        div[class*="drawingToolbar-"] div[class*="lastGroup-"],
        div[class*="layout_area-left"] div[class*="lastGroup-"],
        /* TradingView bottom / time toolbar */
        div[class*="time-axis"],
        div[class*="timeAxisWidget"],
        div[class*="timeScale"],
        div[class*="bottom-widgetbar"],
        div[class*="bottomBar"],
        div[class*="layout__area--bottom"],
        div[class*="statusLine"],
        div[class*="status-line"],
        /* TradingView bottom-right chart controls (Log / Auto / %, etc.) */
        div[class*="layout__area--bottom"] *,
        div[class*="bottom-widgetbar"] *,
        div[class*="bottomBar"] *,
        div[class*="statusLine"] *,
        div[class*="status-line"] * {
            background-color: ${color} !important;
            background: ${color} !important;
        }

        div[class*="drawingToolbar-"],
        div[class*="layout_area-left"],
        div[class*="layout_area-top"] {
            border-color: transparent !important;
            box-shadow: none !important;
        }
    `;

    let styleEl = doc.getElementById(styleId);
    if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = styleId;
        doc.head.appendChild(styleEl);
    }
    styleEl.textContent = css;

    /*
     * TradingView can write inline backgrounds after changeTheme() when
     * toolbars are opened/closed. Re-apply only to toolbar-like elements;
     * do not touch the chart pane/canvas itself.
     */
    const toolbarClassPattern = /chart-toolbar|chart-controls|toolbar-|drawingToolbar-|dateRangeWrapper-|seriesControlWrapper-|collapsed-|layout_area-(top|left)|layout__area--(top|left|bottom)|time-axis|timeAxisWidget|timeScale|bottom-widgetbar|bottomBar|statusLine|status-line/;

    // Generic CSS-module fragments TradingView reuses across many
    // unrelated floating UI pieces (not just the toolbars) — most notably
    // the native Buy/Sell quick-order tooltip drawn over the chart canvas.
    // Matched on their own, these previously painted that tooltip's
    // background to match the toolbar too, leaving its own fixed text
    // color sitting on the wrong background (invisible in light theme).
    // They're only safe to paint when the element is actually nested
    // inside one of the real toolbar containers above.
    const genericToolbarFragmentPattern = /wrap-|scrollWrap-|noScrollBar-|content-|inner-|group-|fill-|lastGroup-|inline-/;

    const toolbarContainerSelector = 'div[class*="chart-toolbar"], div[class*="chart-controls-bar"], div[class*="toolbar-"], div[class*="drawingToolbar-"], div[class*="layout_area-top"], div[class*="layout_area-left"], div[class*="layout__area--top"], div[class*="layout__area--left"], div[class*="layout__area--bottom"], div[class*="time-axis"], div[class*="timeAxisWidget"], div[class*="timeScale"], div[class*="bottom-widgetbar"], div[class*="bottomBar"], div[class*="statusLine"], div[class*="status-line"]';

    const applyInlineToolbarBackgrounds = () => {
        if (!doc.body) return;

        doc.querySelectorAll('[class]').forEach((el) => {
            const className = typeof el.className === 'string'
                ? el.className
                : el.className?.baseVal || '';

            const isContainer = toolbarClassPattern.test(className);
            const isGenericFragment = genericToolbarFragmentPattern.test(className);

            if (!isContainer && !isGenericFragment) return;
            // A generic fragment on its own could be any unrelated floating
            // element (e.g. the quick-order tooltip) — only paint it here
            // if it's actually inside a real toolbar container.
            if (!isContainer && !el.closest(toolbarContainerSelector)) return;

            el.style.setProperty('background-color', color, 'important');
            el.style.setProperty('background', color, 'important');
        });

        // The Log / Auto / % controls live inside TradingView's bottom layout
        // area and some versions apply their own inline background directly
        // to the child buttons. Cover those descendants explicitly so a
        // previously-white bottom-right control cannot survive a theme switch.
        doc.querySelectorAll('[class*="layout__area--bottom"] *').forEach((el) => {
            el.style.setProperty('background-color', color, 'important');
            el.style.setProperty('background', color, 'important');
        });

        // TradingView's price-scale mode controls (%, Log, Auto) are rendered
        // in a small floating/status container at the bottom-right of the
        // chart. Their class names are version-dependent, so do not rely on
        // one internal CSS class. Instead, identify the actual control by its
        // accessible label/text and style only that small control cluster.
        const controlTextPattern = /(^|\s)(%|log|auto|auto\s*scale|log\s*scale|percentage)(\s|$)/i;
        const controlLabelPattern = /auto\s*scale|log\s*scale|percentage|\blog\b|%/i;

        const styleScaleControl = (el) => {
            if (!el || el === doc.body || el === doc.documentElement) return;

            el.style.setProperty('background-color', color, 'important');
            el.style.setProperty('background', color, 'important');
            el.style.setProperty('color', color === THEMES.dark.toolbarBg ? '#d1d4dc' : '#131722', 'important');

            el.querySelectorAll('*').forEach((child) => {
                child.style.setProperty('background-color', color, 'important');
                child.style.setProperty('background', color, 'important');
                child.style.setProperty('color', color === THEMES.dark.toolbarBg ? '#d1d4dc' : '#131722', 'important');
            });
        };

        // Prefer stable accessibility/data attributes when available.
        doc.querySelectorAll('[aria-label], [title], [data-tooltip], [data-name]').forEach((el) => {
            const label = [
                el.getAttribute('aria-label'),
                el.getAttribute('title'),
                el.getAttribute('data-tooltip'),
                el.getAttribute('data-name'),
            ].filter(Boolean).join(' ');

            if (!controlLabelPattern.test(label)) return;

            styleScaleControl(el);
            const parent = el.parentElement;
            if (parent) styleScaleControl(parent);
        });

        // Fallback for TradingView builds where the controls have no stable
        // attributes. Find the compact bottom-right cluster by its visible
        // text and dimensions, rather than changing unrelated chart elements.
        doc.querySelectorAll('div, span, button').forEach((el) => {
            if (!el.children.length && !el.textContent) return;

            const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (!controlTextPattern.test(text) || text.length > 40) return;

            const rect = el.getBoundingClientRect?.();
            if (!rect || rect.width <= 0 || rect.height <= 0 || rect.width > 220 || rect.height > 70) return;

            // These controls sit at the lower edge of the chart. Keep the
            // fallback tightly scoped to that region.
            if (rect.top < doc.documentElement.clientHeight * 0.70) return;

            styleScaleControl(el);
            if (el.parentElement) styleScaleControl(el.parentElement);
        });
    };

    applyInlineToolbarBackgrounds();

    // Disconnect the previous observer before creating a new one.
    const observerKey = '__gx_toolbar_obs__';
    if (doc[observerKey]) doc[observerKey].disconnect();

    // BUG FIX: applyInlineToolbarBackgrounds() itself sets `style` on the
    // exact toolbar elements this observer watches for `style`/`class`
    // changes on. Without a reentrancy guard, every call to it generates
    // new mutation records that match `toolbarMutation` above, which calls
    // it again, forever — a self-triggering MutationObserver loop that
    // never lets the microtask queue drain. It doesn't necessarily "hang"
    // every browser identically (engines differ in how aggressively they
    // starve rendering/other work behind a runaway microtask queue), but
    // it pins a CPU core indefinitely from the moment the chart becomes
    // ready — on lower-powered/thermally-throttled hardware (most phones,
    // most Macs' base clock under Safari's own overhead) that reliably
    // reads as "the chart never finishes loading", even though a fast
    // desktop Chrome profile can often outrun it long enough to look fine.
    // Guarding re-entrancy here removes the loop without changing anything
    // about what gets styled or when it re-applies for a *real* external
    // mutation (TradingView's own theme/DOM changes).
    let isApplying = false;

    const observer = new MutationObserver((mutations) => {
        if (isApplying) return;

        const toolbarMutation = mutations.some((mutation) => {
            const target = mutation.target;
            const className = typeof target?.className === 'string'
                ? target.className
                : target?.className?.baseVal || '';

            return mutation.type === 'childList'
                || (mutation.type === 'attributes'
                    && (mutation.attributeName === 'style'
                        || mutation.attributeName === 'class')
                    && toolbarClassPattern.test(className));
        });

        if (toolbarMutation) {
            isApplying = true;
            try {
                styleEl.textContent = css;
                applyInlineToolbarBackgrounds();
            } finally {
                // Let the mutation records our own writes just generated
                // flush out of the queue before re-arming, instead of
                // re-arming synchronously mid-callback.
                queueMicrotask(() => { isApplying = false; });
            }
        }
    });

    observer.observe(doc.body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'class'],
    });

    doc[observerKey] = observer;
}

// ─── Component ───────────────────────────────────────────────────────────────

const TradingViewChart = (props) => {
    const {
        symbol,
        interval = '1',
        containerId = 'tv_chart_container',
        autosize = true,
        fullscreen = false,
        chartExpanded,
        datafeedUrl,
        chartsStorageUrl,
        chartsStorageApiVersion = '1.1',
        clientId = 'greenex',
        userId,
        tradeType,
        // ── Lightweight order-price picker ──────────────────────────────────
        // Independent of the Broker API (works with zero backend order/position
        // endpoints). Draws one draggable horizontal line the user can position
        // on the chart; the resulting price is reported via onOrderLinePriceChange
        // so the caller can feed it into its own (already-validated) order form.
        // Intended for contexts like Options where broker_factory is disabled.
        enableOrderLinePicker = false,
        orderLineSide = 'buy', // 'buy' | 'sell' — only affects line color/label
        onOrderLinePriceChange,
        onSymbolChange,
    } = props;

    // ── Refs ──────────────────────────────────────────────────────────────────
    const tvWidgetRef = useRef(null);
    const datafeedRef = useRef(null);
    const isReadyRef = useRef(false);
    // Cancel function for a pending waitForTradingViewLibrary() poll, if
    // initWidget was called before the charting_library script finished
    // loading — cleared on unmount so a slow-loading library doesn't keep
    // a stray timer alive/try to init a widget after this component is gone.
    const libraryWaitCancelRef = useRef(null);
    // Cancel function for a pending waitForContainerSize() poll — same
    // reasoning as libraryWaitCancelRef, cleared on unmount so a container
    // that never becomes visible (route change away, panel closed) doesn't
    // leave a stray timer trying to init a widget after this component is gone.
    const containerWaitCancelRef = useRef(null);
    const orderLineRef = useRef(null);
    const saveTimerRef = useRef(null);
    const accountIdRef = useRef(null);
    const secretKeyRef = useRef(null);
    const pairIdRef = useRef(null);
    const leverageRef = useRef(null);
    const currentSymbolRef = useRef(symbol);  // kept in sync below for broker adapter
    const onSymbolChangeRef = useRef(onSymbolChange);
    // Tracks the per-chart onSymbolChanged() subscription for whichever pane
    // is currently active, so it can be torn down cleanly when the active
    // pane changes (multi-chart / split layout) or the widget is destroyed.
    const activeChartSymbolSubRef = useRef(null); // { chartApi, handler } | null
    // Reference to the widget-level 'activeChartChanged' handler, kept so it
    // can be unsubscribed on destroy with the exact same function reference.
    const activeChartChangedHandlerRef = useRef(null);
    // Read up here, rather than with the other router/store reads below,
    // because oneClickTradeRef's initial value depends on it.
    const location = useLocation();
    const isMobileWebView = new URLSearchParams(location.search).get('webview') === '1'
    // "1-Click Trade" toggle — on web this still starts enabled (buttons
    // visible, no confirmation dialog) on every fresh load, exactly as before.
    // A manual disable only lasts for the current session; it's never
    // remembered across a reload.
    //
    // Starts DISABLED in the mobile WebView: the app already has its own
    // native Buy/Sell bar directly below the chart, and on a touchscreen the
    // chart's own quick-order buttons sit in the pan/scroll zone, where a
    // mis-tap would place a real order with no confirmation step. Starting it
    // off both hides those buttons (setBuySellButtonsVisible reads this ref —
    // see BrokerAdapter's constructor) and makes placeOrder() fall back to
    // TradingView's own confirmation dialog. Order lines, position lines and
    // TP/SL drag are unaffected: none of those paths read this ref.
    const oneClickTradeRef = useRef(!isMobileWebView);
    // Whether restoreChart() has successfully loaded the saved layout yet
    // for this widget instance — see the auth-ready retry effect below.
    const hasRestoredRef = useRef(false);

    // ── Store ──────────────────────────────────────────────────────────────────
    const { theme } = useGlobalContext();
    const { userdetails, leverage } = useSelector(s => s.user);
    const { futureTradePair } = useSelector(s => s.future);
    const socketContext = useContext(SocketContext);
    const queryTheme = new URLSearchParams(location.search).get('theme');

    useEffect(() => { accountIdRef.current = userdetails?.accountId; }, [userdetails?.accountId]);
    useEffect(() => { secretKeyRef.current = userdetails?.secretKey; }, [userdetails?.secretKey]);
    useEffect(() => { currentSymbolRef.current = symbol; }, [symbol]);
    useEffect(() => { onSymbolChangeRef.current = onSymbolChange; }, [onSymbolChange]);
    // Real order placement (broker.placeOrder) needs the current pair's Mongo
    // _id and the account's current leverage — same values the existing
    // TradeActionCard order form already sends with every order.
    useEffect(() => { pairIdRef.current = futureTradePair?._id; }, [futureTradePair?._id]);
    useEffect(() => { leverageRef.current = leverage; }, [leverage]);

    // ── Close-position modal state ─────────────────────────────────────────────
    const [closeModal, setCloseModal] = useState({ show: false, data: {} });
    const [closeLoading, setCloseLoading] = useState(false);

    // ── Toast helper ──────────────────────────────────────────────────────────
    const onToast = useCallback((msg, type = 'success') => {
        showToastMessage(msg, type);
    }, []);

    // ── Close position: modal open callback (from broker adapter) ──────────────
    const onClosePosition = useCallback((data) => {
        setCloseModal({ show: true, data });
    }, []);

    // ── Close position: REST call after user confirms in modal ─────────────────
    const handleClosePositionConfirm = async (record) => {
        try {
            setCloseLoading(true);
            const res = await futureClosePosition({
                pairId: record.pairId,
                positionSide: record.positionSide,
                quantity: record.quantity,
                orderType: 'market',
                price: record.price,
                typeTIF: record.typeTIF || '',
            }, userdetails?.secretKey);
            setCloseLoading(false);
            if (res.status) {
                !isEmpty(res.message) && showToastMessage(res.message, 'success');
                // Call onConfirmed to run optimistic position removal on chart
                record.onConfirmed?.();
                // Close the modal
                setCloseModal({ show: false, data: {} });
            } else {
                !isEmpty(res.message) && showToastMessage(res.message, 'error');
            }
        } catch (err) {
            setCloseLoading(false);
            console.warn('[Chart] closePosition error:', err);
            showToastMessage('Failed to close position', 'error');
        }
    };

    // ── Broker adapter (orders, positions, TP/SL, WebSocket sync) ─────────────
    // Broker order/position/bracket management is only implemented on the
    // backend for Futures. Guard by tradeType so other chart contexts (e.g.
    // Options, tradeType='option') never fetch or subscribe to futures
    // order/position data, and never get the broker_factory wired in below.
    const isBrokerCapable = tradeType === 'future';
    const { brokerFactory, adapterRef } = useBrokerAdapter({
        symbol,
        socket: socketContext?.socket,
        secretKeyRef,
        accountIdRef,
        currentSymbolRef,
        pairIdRef,
        leverageRef,
        onClosePosition,
        onToast,
        datafeedRef,
        chartRef: tvWidgetRef,
        oneClickTradeRef,
        enabled: isBrokerCapable,
    });

    // ── Resolve effective theme ────────────────────────────────────────────────
    const effectiveTheme = !isEmpty(queryTheme)
        ? queryTheme
        : (localStorage.getItem('trevolt-theme') || theme || 'dark');

    // Keep BrokerAdapter's symbolInfo/formatter caches warm for whatever
    // symbol is currently loaded. See BrokerAdapter.prewarmSymbolInfo() for
    // why: TradingView's native quick-order context menu (the "+" button on
    // the price scale) awaits several of our broker methods before it can
    // render, and this makes sure none of them are ever a cold cache miss
    // by the time the user actually clicks it.
    useEffect(() => {
        if (!symbol) return;
        adapterRef.current?.prewarmSymbolInfo?.(symbol);
    }, [symbol, adapterRef]);

    // ── Chart persistence ──────────────────────────────────────────────────

    const persistChart = useCallback(() => {
        if (!tvWidgetRef.current || !accountIdRef.current || !secretKeyRef.current) return;
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            try {
                tvWidgetRef.current.save(async (state) => {
                    try {
                        await saveChartSettings(
                            { accountId: accountIdRef.current, chartSettings: state },
                            secretKeyRef.current,
                        );
                    } catch (e) {  }
                });
            } catch (e) {  }
        }, SAVE_DEBOUNCE_MS);
    }, []);

    // Same as persistChart(), but saves right away instead of waiting out
    // SAVE_DEBOUNCE_MS. Meant for rare, deliberate, one-shot actions (like
    // deleting a drawing) where there's no burst of rapid-fire events to
    // debounce against — unlike dragging a line, which fires dozens of
    // times a second and genuinely needs the debounce. Leaving a delete
    // sitting in a debounce window is exactly what let a deleted drawing
    // reappear after a quick refresh.
    const persistChartImmediate = useCallback(() => {
        if (!tvWidgetRef.current || !accountIdRef.current || !secretKeyRef.current) return;
        clearTimeout(saveTimerRef.current);
        try {
            tvWidgetRef.current.save(async (state) => {
                try {
                    await saveChartSettings(
                        { accountId: accountIdRef.current, chartSettings: state },
                        secretKeyRef.current,
                    );
                } catch (e) {  }
            });
        } catch (e) {  }
    }, []);

    const isRestoringRef = useRef(false);

    const restoreChart = useCallback(async (sym, tv, themeOnly = false) => {
        if (!tvWidgetRef.current || !isReadyRef.current) return;
        // Theme changes only use TradingView's live widget API and must not
        // depend on account authentication/chart persistence.
        // Guard against restoreChart ever running twice at once (e.g. the
        // onChartReady call and the auth-retry effect both becoming
        // eligible around the same moment). Without this, two overlapping
        // `.load()` calls could each leave their own copy of a study
        // (typically Volume) attached to the pane, showing its last-value
        // label twice with the exact same figure.
        if (isRestoringRef.current) return;
        isRestoringRef.current = true;
        try {
            const tvTheme = normalizeTVTheme(tv);
            const t = THEMES[themeKey(tv)];

            if (themeOnly) {
                await tvWidgetRef.current.changeTheme(tvTheme);
                tvWidgetRef.current.applyOverrides({
                    'paneProperties.background': t.background,
                    'paneProperties.backgroundType': 'solid',
                    'paneProperties.vertGridProperties.color': t.gridColor,
                    'paneProperties.horzGridProperties.color': t.gridColor,
                    'paneProperties.crossHairProperties.color': t.crosshairColor,
                    'scalesProperties.textColor': t.textColor,
                    'scalesProperties.backgroundColor': t.axisBackground,
                    'paneProperties.legendProperties.showLegend': false,
                });

                // TradingView's native theme changes the chart canvas, scales,
                // menus and most controls. This additional pass covers the
                // drawing/side toolbar and bottom toolbar surfaces that can
                // retain their previous inline background.
                setTimeout(() => injectToolbarBg(containerId, t.toolbarBg), 0);
                setTimeout(() => injectToolbarBg(containerId, t.toolbarBg), 150);
                setTimeout(() => injectToolbarBg(containerId, t.toolbarBg), 500);
                return;
            }

            // Saved-layout restore still requires authenticated chart storage.
            if (!accountIdRef.current || !secretKeyRef.current) return;

            const { status, result } = await getChartSettings(accountIdRef.current, secretKeyRef.current);
            if (!status || !result || !tvWidgetRef.current || !isReadyRef.current) return;

            // The widget's own default template (created at construction,
            // before any saved layout is applied) auto-attaches its own
            // Volume study to the pane. If that default study's async setup
            // finishes after `.load()` below has already applied the saved
            // layout (which carries its own Volume study), both end up
            // attached side by side — same live data, so their last-value
            // tags show the identical figure twice, stacked. Clearing
            // whatever the chart currently has right before loading the
            // saved layout guarantees a clean slate for `.load()` to
            // restore onto, so nothing from the default template can
            // survive alongside it.
            try { tvWidgetRef.current.activeChart().removeAllStudies(); } catch { void 0; }

            const patched = applyThemeToLayout(result, tv);
            tvWidgetRef.current.load(patched);
            hasRestoredRef.current = true;

            if (sym && !isEmpty(sym)) {
                try { tvWidgetRef.current.activeChart().setSymbol(sym); } catch { void 0; }
            }

            setTimeout(() => injectToolbarBg(containerId, t.toolbarBg), 300);
            setTimeout(() => dedupeStudies(tvWidgetRef.current?.activeChart?.()), 350);

            // After loading a saved layout the chart re-renders all panes.
            // Re-push broker lines so orders/positions reappear over the restored drawings.
            setTimeout(() => adapterRef.current?.refresh(), 400);
        } catch (e) {  }
        finally { isRestoringRef.current = false; }
    }, [containerId, adapterRef]);

    // ── Widget init ────────────────────────────────────────────────────────

    const initWidget = useCallback((sym, tv) => {
        if (tvWidgetRef.current) return; // already initialised

        // See waitForTradingViewLibrary() above — charting_library.js is a
        // large render-blocking <script> in index.html and can genuinely
        // still be loading when this fires (slow connection, cold cache).
        // Wait for it instead of letting `new window.TradingView.widget()`
        // below throw on a still-undefined `window.TradingView`.
        if (!isTradingViewLibraryReady()) {
            if (libraryWaitCancelRef.current) libraryWaitCancelRef.current();
            libraryWaitCancelRef.current = waitForTradingViewLibrary(() => {
                libraryWaitCancelRef.current = null;
                initWidget(sym, tv);
            });
            return;
        }

        // See isContainerReady()/waitForContainerSize() above — required in
        // addition to the library check above it. This is the gate that
        // specifically targets the Safari/iOS "chart never draws anything"
        // symptom: WebKit can still report a 0×0 container here on the
        // first mount pass even once the library script itself is fully
        // loaded and parsed.
        if (!isContainerReady(containerId)) {
            if (containerWaitCancelRef.current) containerWaitCancelRef.current();
            containerWaitCancelRef.current = waitForContainerSize(containerId, () => {
                containerWaitCancelRef.current = null;
                initWidget(sym, tv);
            });
            return;
        }

        // Defensive guard against overlapping widget instances targeting the
        // same containerId — e.g. React StrictMode's deliberate double
        // mount/cleanup/mount-again in dev, or this component mounting for
        // the first time right as the page transitions out of the Coming
        // Soon state. `destroyWidget()` already nulls `tvWidgetRef` and
        // calls the previous widget's own `.remove()`, but that teardown
        // can finish asynchronously — if a new widget is constructed into
        // the same container before the old one has actually detached its
        // iframe, TradingView can end up with two overlapping instances and
        // render nothing usable. Clearing the container's DOM directly,
        // synchronously, right before construction guarantees a clean slate
        // regardless of how the previous widget's own async cleanup is
        // progressing.
        const existingContainer = document.getElementById(containerId);
        if (existingContainer) existingContainer.replaceChildren();

        const tvTheme = normalizeTVTheme(tv);
        const t = THEMES[themeKey(tv)];

        // Create the custom datafeed once and reuse it
        if (!datafeedRef.current) {
            datafeedRef.current = createDatafeed({
                apiBase: datafeedUrl,
                socket: socketContext?.socket,
                tradeType: tradeType,
            });
        }

        const widgetOptions = {
            symbol: sym,
            datafeed: datafeedRef.current,
            interval,
            container: containerId,
            library_path: '/charting_library/',
            locale: _getLocaleFromURL() || 'en',

            // Blanks out just the "Ask"/"Bid" words on the bid/ask spread
            // lines' axis price tag (scalesProperties.showBidAskLabels),
            // leaving only the colored price number — that number isn't
            // part of this translated string (it's formatted/positioned
            // separately), so it's unaffected. This is the officially
            // documented way to override any UI string in the library
            // without touching the vendored bundle files directly.
            custom_translate_function: (originalText) => {
                if (originalText === 'Ask' || originalText === 'Bid') return '';
                return null; // fall back to the default translation for everything else
            },

            // Storage (save/load layouts from TradingView's own cloud storage)
            charts_storage_url: chartsStorageUrl,
            charts_storage_api_version: chartsStorageApiVersion,
            client_id: clientId,
            user_id: userId || accountIdRef.current || 'anonymous',

            fullscreen,
            autosize,
            theme: tvTheme,

            toolbar_bg: t.toolbarBg,
            loading_screen: { backgroundColor: t.background },
            debug: false,
            // debug_broker: "broker-only",
            ...(isMobileWebView && {
                // Disable features that spawn Web Workers
                iframe_loading_compatibility_mode: true,
                custom_css_url: '',
                load_last_chart: false,
            }),
            // ── Broker API ─────────────────────────────────────────────────
            // broker_factory wires order/position lines, TP/SL drag, cancel, close.
            // Only present for broker-capable (Futures) contexts — see isBrokerCapable above.
            ...(isBrokerCapable && {
                broker_factory: brokerFactory,
                broker_config: { configFlags: BrokerAdapter.configFlags, tradedGroupConfig: { supportAdaptiveLayout: false }, durations: null },
                // Color the order line green for buy / red for sell (matching
                // the app's own buy/sell accent colors) instead of TradingView's
                // default blue. This is a pure display override — it doesn't
                // touch drag/modify/cancel behavior in BrokerAdapter.js at all.
                trading_customization: {
                    brokerOrder: {
                        'buy.normal.lineColor': '#2EBD85',
                        'buy.normal.borderColor': '#2EBD85',
                        'buy.normal.borderBackgroundColor': '#2EBD85',
                        'buy.normal.text.backgroundColor': '#2EBD85',
                        'buy.normal.text.textColor': '#FFFFFF',
                        'buy.normal.qty.backgroundColor': '#2EBD85',
                        'buy.normal.qty.textColor': '#FFFFFF',
                        'buy.normal.close.backgroundColor': '#2EBD85',
                        'buy.normal.close.iconColor': '#FFFFFF',
                        'sell.normal.lineColor': '#F6465D',
                        'sell.normal.borderColor': '#F6465D',
                        'sell.normal.borderBackgroundColor': '#F6465D',
                        'sell.normal.text.backgroundColor': '#F6465D',
                        'sell.normal.text.textColor': '#FFFFFF',
                        'sell.normal.qty.backgroundColor': '#F6465D',
                        'sell.normal.qty.textColor': '#FFFFFF',
                        'sell.normal.close.backgroundColor': '#F6465D',
                        'sell.normal.close.iconColor': '#FFFFFF',
                    },
                },
            }),

            // disabled_features: [
            //     'remove_library_container_border',
            //     'header_undo_redo',
            //     // 'header_saveload',
            //     'border_around_the_chart',
            //     'items_favoriting',
            //     'trading_account_manager',
            //     'right_toolbar',
            //     'display_market_status',
            //     'legend_inplace_edit',
            //     'header_screenshot',
            //     'symbol_search_hot_key',
            //     'trading_notifications',
            //     'header_symbol_search',

            //     'use_localstorage_for_settings',
            //     'popup_hints'
            // ],

            // enabled_features: [
            //     'hide_last_na_study_output',
            //     'dont_show_boolean_study_arguments',
            //     'side_toolbar_in_fullscreen_mode',
            //     'volume_force_overlay',
            //     'chart_template_storage',
            //     'create_volume_indicator_by_default',
            //     'use_localstorage_for_settings',
            //     'header_screenshot',
            //     'hide_object_tree_and_price_scale_exchange_label',
            //     'auto_enable_symbol_labels',
            //     'header_in_fullscreen_mode',
            //     'adaptive_logo',
            //     'horz_touch_drag_scroll',
            //     'iframe_loading_compatibility_mode',
            //     'show_zoom_and_move_buttons_on_touch',
            //     'symbol_info',
            //     'show_object_tree',
            //     'saveload_separate_drawings_storage',
            //     'seconds_resolution',
            //     'header_compare'
            // ]
            disabled_features: [
                'use_localstorage_for_settings', // we persist to backend
                'popup_hints',
                // Object Tree panel/button (right toolbar) — defaults to `true`
                // in the charting library, which is why it was opening
                // automatically on load. Disabling entirely per request.
                'show_object_tree',
                // The right toolbar COLUMN itself (Watchlist / Details /
                // Alerts / Object Tree icon strip). Confirmed via the
                // vendored charting_library.js: resizing is pure CSS
                // (iframe width/height:100% of its container — there is no
                // JS resize() method on this widget build at all, so a
                // persistent, fixed-looking blank strip along one edge of
                // the chart is not a container-resize bug, it's reserved
                // in-chart UI space). This toolbar column reserves its full
                // width even while empty/collapsed (only `show_object_tree`
                // was disabled above, which just stops ITS panel from
                // auto-opening — the column hosting it was still there).
                // Disabling the column itself removes that reserved strip.
                'right_toolbar',
                // Account Manager (bottom orders/positions panel + broker icon) is
                // intentionally disabled. Verified against the charting_library
                // source: 'trading_account_manager' only gates that bottom panel's
                // widget-area allocation — it does NOT gate order_panel, dom_widget,
                // trading_position, or trading_brackets (drag-to-modify order lines,
                // TP/SL drag, cancel, close-position all keep working via those
                // separate features below).
                'trading_account_manager',
                // Mobile WebView now gets the same header toolbar, indicators
                // (fx) button, left drawing toolbar, and save/load button as
                // desktop web — only the blob-URL/extra-worker features stay
                // off since those are unsupported inside the RN WebView, not
                // a visual/feature choice.
                ...(isMobileWebView ? [
                    'header_screenshot',           // uses blob URL for image export
                    'chart_download_image',        // same
                    'saveload_separate_drawings_storage', // extra worker
                ] : []),
                // NOTE: `buy_sell_buttons` is deliberately NEVER added here.
                // The native Buy/Sell quick-order buttons' visibility is now
                // toggled live at runtime via BrokerAdapter.setBuySellButtonsVisible()
                // (host.sellBuyButtonsVisibility().setValue(...)), which is
                // the officially supported live-toggle API — see that method
                // for the TradingView docs reference. Putting this featureset
                // in disabled_features here would permanently break that: per
                // the bundled charting_library runtime,
                // host.sellBuyButtonsVisibility() returns `null` for the
                // lifetime of the widget once this featureset is disabled at
                // construction, so there'd be no way to turn the buttons back
                // on again without a full widget rebuild.
            ],
            enabled_features: [
                ...(isMobileWebView ? ['iframe_loading_compatibility_mode'] : []),
                'study_templates',
                'header_layouttoggle',
                'header_saveload',
                'header_settings',
                'header_fullscreen_button',
                'move_logo_to_main_pane',
                ...(isBrokerCapable ? [
                    'dom_widget',
                    // Required for broker position lines + TP/SL drag → editPositionBrackets
                    'order_panel',
                    'trading_position',
                    'trading_brackets',
                ] : []),
            ],

            overrides: {
                'paneProperties.background': t.background,
                'paneProperties.backgroundType': 'solid',
                'paneProperties.vertGridProperties.color': t.gridColor,
                'paneProperties.horzGridProperties.color': t.gridColor,
                'paneProperties.crossHairProperties.color': t.crosshairColor,
                'symbolWatermarkProperties.transparency': 90,
                'scalesProperties.textColor': t.textColor,
                'scalesProperties.backgroundColor': t.axisBackground,
                'paneProperties.legendProperties.showLegend': false,
                'tradingProperties.showPositions': true,
                'tradingProperties.showOrders': true,
                'tradingProperties.showBracketOrders': true,
                // Native "last price" line — was explicitly turned OFF here
                // (`false`), which is why it never showed: the axis still
                // displays the current price value/tag (that part comes from
                // the bid/ask lines' own labels below, plus TradingView's
                // built-in price scale label), but nothing drew the actual
                // horizontal reference line across the chart at that price —
                // the dashed/solid line most trading platforms show at the
                // last traded price. TradingView's own default for this is
                // `true`; restoring that.
                //
                // `showPriceLine` alone turned out to still render nothing
                // visible on this self-hosted library build — the line's
                // actual thickness (priceLineWidth) wasn't being set
                // anywhere and was apparently defaulting to 0 (i.e. drawn
                // with zero width, so present but invisible). Explicitly
                // giving it a real width is what actually makes the line
                // appear; TradingView colors it automatically to match the
                // current up/down series color, so no color override is
                // needed here.
                'mainSeriesProperties.showPriceLine': true,
                'mainSeriesProperties.priceLineWidth': 2,
                // ── Spread (bid/ask) lines on the chart ─────────────────────
                // TradingView docs: "mainSeriesProperties.bidAsk.visible" —
                // default is `false`, which is why this was never showing.
                // Draws two horizontal price lines (bid + ask) directly on
                // the main series, using the same real-time ask/bid values
                // already wired up via the datafeed's Quotes API (see
                // CustomDatafeed.js getQuotes/subscribeQuotes) — same data
                // source as the Buy/Sell buttons, per TradingView's own
                // "Buy/Sell buttons and Lines" docs page, no extra plumbing
                // needed.
                'mainSeriesProperties.bidAsk.visible': true,
                'mainSeriesProperties.bidAsk.lineWidth': 1,
                // Match the app's existing buy/sell accent colors (same
                // green/red already used for broker order lines above).
                'mainSeriesProperties.bidAsk.bidLineColor': '#2EBD85',
                'mainSeriesProperties.bidAsk.askLineColor': '#F6465D',
                // Colored bid/ask price tag on the axis. Re-enabled — without
                // it the bidAsk line draws with NO price tag at all (just a
                // bare line, confirmed against actual rendering), it does
                // not carry its own axis label the way order/position lines
                // do. If hovering directly over the line ever shows a
                // fleeting "Ask"/"Bid" text tooltip, that's a separate,
                // native hover-only behavior — not this persistent axis tag.
                'scalesProperties.showBidAskLabels': true,
            },
        };

        // Belt-and-braces on top of the isTradingViewLibraryReady() guard
        // above: construction can still fail for other reasons (a
        // malformed container, a library-internal error on an unexpected
        // symbol, etc.). Catching here means that failure degrades to "no
        // chart" instead of an uncaught exception taking out this whole
        // component tree.
        let widget;
        try {
            widget = new window.TradingView.widget(widgetOptions);
        } catch (e) {
            return;
        }
        tvWidgetRef.current = widget;

        widget.onChartReady(async () => {
            isReadyRef.current = true;
            // widget.setDebugMode(true);

            // ─── Catch up on a symbol change that arrived mid-construction ──
            // Root cause of "chart shows the old pair even though the rest of
            // the page correctly switched": the "Symbol change" effect below
            // only acts when `tvWidgetRef.current && isReadyRef.current` are
            // BOTH true. Between initWidget() starting (tvWidgetRef.current
            // set synchronously) and this onChartReady callback firing
            // (isReadyRef.current flips true), that condition is false — so
            // if the app auto-redirects to a different pair in that window
            // (e.g. the pair this chart started loading, like ETHUSDT, gets
            // deactivated and the page redirects to BNBUSDT almost
            // immediately), the pending setSymbol call had nowhere to land
            // and was silently dropped forever: nothing ever retried it once
            // the widget did become ready, so the chart stayed on the
            // original symbol while the rest of the page (order book, ticker,
            // buy panel — all driven independently off Redux) correctly
            // showed the new pair. `currentSymbolRef` is kept in sync with
            // the `symbol` prop unconditionally (see the effect near the
            // top), so by the time we get here it already holds whatever the
            // most current desired symbol actually is, ready-state or not.
            const desiredSymbol = currentSymbolRef.current;
            if (desiredSymbol && String(desiredSymbol).toUpperCase() !== String(sym).toUpperCase()) {
                try {
                    widget.activeChart().setSymbol(desiredSymbol, interval);
                    // Same verify-and-self-heal as the "Symbol change" effect
                    // below — don't just trust this call went through.
                    setTimeout(() => {
                        if (String(currentSymbolRef.current || '').toUpperCase() !== String(desiredSymbol).toUpperCase()) return;
                        if (!tvWidgetRef.current) return;
                        try {
                            const nowShown = String(tvWidgetRef.current.activeChart().symbol() || '').toUpperCase();
                            if (nowShown !== String(desiredSymbol).toUpperCase()) {
                                destroyWidget();
                                initWidget(desiredSymbol, effectiveTheme);
                            }
                        } catch (verifyErr) {
                            console.warn('[Chart] Catch-up setSymbol verification failed, forcing full rebuild:', verifyErr);
                            destroyWidget();
                            initWidget(desiredSymbol, effectiveTheme);
                        }
                    }, 1500);
                } catch (e) {
                    console.warn('[Chart] Catch-up setSymbol threw, forcing full rebuild:', e);
                    destroyWidget();
                    initWidget(desiredSymbol, effectiveTheme);
                }
            }

            // Force one explicit re-measure now that the widget is
            // actually ready. `autosize` measures the container at
            // construction time, but construction can finish (and this
            // callback fire) before the surrounding CSS grid/flex layout
            // has settled into its final size — leaving the widget's
            // internal iframe permanently a bit narrower than its
            // container, i.e. a blank strip on the right that nothing
            // ever corrects afterwards if the container's size doesn't
            // change again. Re-measuring here, the moment we know the
            // widget can safely handle it, closes that gap.
            scheduleResizeSettle(widget, containerId);
            // Restores drawings/indicators/layout saved from a previous
            // session (see persistChart, wired below via onAutoSaveNeeded —
            // saving was always running; this load call was the missing
            // half, which is why a page refresh used to clear everything
            // even though it had been saved correctly the whole time).
            //
            // Passing currentSymbolRef.current here (not the stale `sym`
            // this widget was constructed with) matters: when a saved
            // layout exists, restoreChart() below does its own final
            // `setSymbol(sym)` call — using the original `sym` there would
            // silently undo the catch-up setSymbol() just above it whenever
            // both fire in the same onChartReady pass.
            await restoreChart(currentSymbolRef.current || sym, tv);

            // Inject iframe CSS after chart is ready
            const iframe = document.querySelector(`#${containerId} iframe`);
            if (iframe?.contentDocument) {
                injectToolbarBg(containerId, t.toolbarBg);

                // Cosmetic-only: the Symbol Search dialog's input is
                // pre-filled with the widget's raw internal symbol (e.g.
                // "BNBUSDT") when it opens — that raw string is also what
                // resolveSymbol()/setSymbol() need internally, so it can't
                // be changed at the source without breaking chart data
                // resolution (see git history). Rewriting just the
                // rendered text of the input, once, at the moment it gains
                // focus (dialog open) is display-only: it never touches
                // setSymbol, resolveSymbol, or any value read by the rest
                // of this file, and typing/searching afterwards is
                // unaffected either way (the backend already matches
                // "BNBUSD" as a prefix of "BNBUSDT").
                const doc = iframe.contentDocument;
                if (!doc.__symbolSearchDisplayPatch) {
                    doc.__symbolSearchDisplayPatch = true;
                    doc.addEventListener('focusin', (e) => {
                        try {
                            const el = e.target;
                            if (el?.tagName !== 'INPUT' || el.getAttribute('data-qa-id') !== 'symbol-search-input') return;
                            const formatted = formatDisplayPair(el.value);
                            if (formatted && formatted !== el.value) {
                                el.value = formatted;
                                el.setSelectionRange?.(0, formatted.length);
                            }
                        } catch { void 0; }
                    }, true);
                }
            }

            widget.subscribe('onAutoSaveNeeded', persistChart);

            // Explicit save trigger for drawing deletion. onAutoSaveNeeded
            // is supposed to cover every chart mutation including removing
            // a drawing, but in practice a delete followed shortly by a
            // page refresh can outrun it — leaving the deleted drawing
            // still sitting in the last-saved state, which is exactly what
            // then reappears on reload. `drawing_event` is a more precise,
            // documented event that fires with an explicit event type
            // (including "remove"), so hook it directly as a second,
            // reliable trigger — it just calls the same debounced
            // persistChart(), so this can't cause duplicate/conflicting saves.
            widget.subscribe('drawing_event', (_sourceId, drawingEventType) => {
                if (drawingEventType === 'remove') {
                    persistChartImmediate();
                } else if (drawingEventType === 'create') {
                    persistChart();
                }
            });

            // Re-apply the bid/ask spread-line overrides via applyOverrides()
            // instead of relying solely on the construction-time `overrides`
            // option above. Per TradingView's docs, `applyOverrides()` is the
            // supported way to change chart properties at runtime. NOTE: this
            // call alone is still not sufficient — confirmed against the
            // bundled charting_library runtime, the actual bid/ask line
            // drawing is backed by an internal "bidask" custom source that's
            // only created lazily on the *first* realtimeUpdate() call (see
            // BrokerAdapter.pushRealtimeQuote, which re-applies these same
            // overrides again once that source actually exists). This first
            // call, made before any quote has arrived, mainly covers the
            // case where quotes were already flowing before this ran (e.g.
            // a fast reconnect).
            try {
                widget.applyOverrides({
                    'mainSeriesProperties.bidAsk.visible': true,
                    'mainSeriesProperties.bidAsk.lineWidth': 1,
                    'mainSeriesProperties.bidAsk.bidLineColor': '#2EBD85',
                    'mainSeriesProperties.bidAsk.askLineColor': '#F6465D',
                    'scalesProperties.showBidAskLabels': true,
                    // Same belt-and-braces re-application as the bidAsk lines
                    // above — the construction-time `overrides` option alone
                    // wasn't enough to make the last-price line actually
                    // render on this build, so it's re-asserted here too
                    // once the chart is fully ready.
                    'mainSeriesProperties.showPriceLine': true,
                    'mainSeriesProperties.priceLineWidth': 2,
                });
            } catch (e) {
                console.warn('[Chart] bidAsk applyOverrides failed:', e);
            }

            // ── Chart pair selection → drives the rest of the page ───────────
            // TradingView's own header symbol search (and, in a multi-chart /
            // split layout, each individual pane) lets the user change the
            // symbol directly on the chart. By default that only updates the
            // chart itself — nothing tells the rest of the app (order book,
            // buy/sell panel, URL, etc.) that the selected pair changed.
            //
            // Per TradingView's docs, `activeChart()` always refers to
            // whichever pane currently has focus, but the library does NOT
            // automatically move event subscriptions across panes when the
            // user switches between charts in a multi-chart layout — the
            // docs explicitly say to unsubscribe/resubscribe yourself using
            // the `activeChartChanged` event. That's exactly what this does:
            //   1. Subscribe to onSymbolChanged() on whichever chart is active.
            //   2. Whenever the active pane itself changes (activeChartChanged),
            //      re-point that subscription at the newly active chart, and
            //      check whether it's already showing a different symbol than
            //      the app currently has selected (switching focus to a pane
            //      that already has a different pair loaded doesn't fire
            //      onSymbolChanged, since the symbol on that pane didn't just
            //      change — it needs the same one-time check).
            const syncActiveChartSymbol = () => {
                try {
                    // Tear down the previous pane's subscription first —
                    // required, see note above.
                    if (activeChartSymbolSubRef.current) {
                        const { chartApi: prevChart, handler: prevHandler } = activeChartSymbolSubRef.current;
                        try { prevChart.onSymbolChanged().unsubscribe(null, prevHandler); } catch { void 0; }
                        activeChartSymbolSubRef.current = null;
                    }

                    const chartApi = widget.activeChart();

                    const handleSymbol = (rawTicker) => {
                        const newTicker = String(rawTicker || '').toUpperCase();
                        if (!newTicker) return;
                        // Skip the echo from our own programmatic setSymbol()
                        // call (see the `[symbol]` effect below) — only bubble
                        // up changes that genuinely originated on the chart.
                        if (newTicker === String(currentSymbolRef.current || '').toUpperCase()) return;

                        // BUG FIX: this used to unconditionally do
                        // `currentSymbolRef.current = newTicker` right here,
                        // treating ANY symbol the chart reports as the new
                        // "correct" one. That's true for a genuine user
                        // search, but TradingView can also report a symbol
                        // change here for reasons that have nothing to do
                        // with the user — most notably, restoreChart()'s
                        // `.load(savedLayout)` call applies a previous
                        // session's saved layout ASYNCHRONOUSLY; if that
                        // layout was saved while viewing a *different* pair
                        // (e.g. ETHUSDT, before it was deactivated), its
                        // internal completion can fire this same event with
                        // that old symbol well after the page has already
                        // correctly loaded and settled on the current one
                        // (e.g. BNBUSDT) — "suddenly", with no user action.
                        // Blindly trusting it here corrupted the one ref
                        // this file treats as the source of truth for "what
                        // symbol should be showing", which is exactly why
                        // nothing ever caught or corrected it afterward.
                        //
                        // Now: forward it to the app (which validates against
                        // the real active-pairs list) and let the APP be the
                        // one to update currentSymbolRef — via the `symbol`
                        // prop-driven effect near the top of this file — only
                        // once it actually accepts the change (navigates the
                        // URL / updates Redux). If the app rejects it (not a
                        // real, active pair), `currentSymbolRef.current`
                        // simply never changes, and the verification check
                        // below catches the resulting mismatch and forces the
                        // chart itself back to the correct symbol shortly
                        // after — instead of quietly drifting and staying
                        // wrong indefinitely.
                        const rejectedTicker = newTicker;
                        const expectedSymbol = currentSymbolRef.current;
                        onSymbolChangeRef.current?.(rejectedTicker);
                        setTimeout(() => {
                            // The app accepted it in the meantime (legitimate
                            // user-driven switch) — currentSymbolRef.current
                            // now matches what the chart already shows, so
                            // there's nothing to correct.
                            if (String(currentSymbolRef.current || '').toUpperCase() !== String(expectedSymbol).toUpperCase()) return;
                            if (!tvWidgetRef.current) return;
                            try {
                                const active = tvWidgetRef.current.activeChart();
                                const shown = String(active.symbol() || '').toUpperCase();
                                if (shown === String(rejectedTicker).toUpperCase() && shown !== String(expectedSymbol).toUpperCase()) {
                                    active.setSymbol(expectedSymbol, interval);
                                }
                            } catch (e) {
                                console.warn('[Chart] Failed to revert unexpected symbol drift:', e);
                            }
                        }, 1500);
                    };

                    const handler = (symbolInfo) => handleSymbol(symbolInfo?.ticker || symbolInfo?.name);
                    chartApi.onSymbolChanged().subscribe(null, handler);
                    activeChartSymbolSubRef.current = { chartApi, handler };

                    // Cover the "switched to a pane that already shows a
                    // different pair" case, since onSymbolChanged only fires
                    // on an actual change and won't fire here.
                    handleSymbol(chartApi.symbol());
                } catch (e) {
                    console.warn('[Chart] active-chart symbol sync failed:', e);
                }
            };

            syncActiveChartSymbol();
            widget.subscribe('activeChartChanged', syncActiveChartSymbol);
            activeChartChangedHandlerRef.current = syncActiveChartSymbol;

            // ── Chart click → order-form price autofill ──────────────────
            // Broadcasts the exact price under the cursor whenever the user
            // clicks anywhere on the chart's price pane. TradingChart.jsx/
            // TradeActionCard.jsx are siblings (not parent/child) of this
            // component, so — same as the existing 'chartResize' window
            // event elsewhere in this codebase — a window CustomEvent is the
            // clean way to reach the order-entry form without threading a
            // new prop all the way through FuturesTrading.jsx.
            try {
                const chartApi = widget.activeChart();
                let lastCrosshair = null; // { price, at }
                chartApi.crossHairMoved().subscribe(null, (params) => {
                    if (Number.isFinite(params?.price)) {
                        lastCrosshair = { price: params.price, at: Date.now() };
                    }
                });

                const iframeDoc = document.querySelector(`#${containerId} iframe`)?.contentDocument;
                if (iframeDoc) {
                    iframeDoc.addEventListener('click', () => {
                        // crossHairMoved only fires while the cursor is over
                        // the actual chart pane (not toolbar buttons, the
                        // account panel, our own "1-Click Trade" button,
                        // etc.) — requiring a very recent crosshair reading
                        // is a lightweight, reliable way to tell "this click
                        // landed on the price pane" without needing to find
                        // and hard-code that pane's internal DOM selector.
                        if (lastCrosshair && Date.now() - lastCrosshair.at < 300) {
                            window.dispatchEvent(new CustomEvent('chartPriceClick', {
                                detail: { price: lastCrosshair.price, symbol },
                            }));
                        }
                    });
                }
            } catch { void 0; }

            // ── "1-Click Trade" toggle ───────────────────────────────────
            // Adds a toggle to TradingView's own toolbar (documented
            // createButton() API) gating whether placeOrder() shows
            // TradingView's built-in order-confirmation dialog first (see
            // BrokerAdapter.placeOrder), AND whether the native Buy/Sell
            // quick-order buttons are shown on the chart at all. Defaults to
            // ON (buttons visible, no dialog) — matches the app's existing
            // behavior exactly, so nothing changes unless the user
            // explicitly interacts with the new control.
            if (isBrokerCapable) {
                widget.headerReady().then(() => {
                    const button = widget.createButton();
                    button.style.cursor = 'pointer';
                    button.style.display = 'flex';
                    button.style.alignItems = 'center';
                    button.style.gap = '6px';
                    button.style.padding = '0 8px';

                    const doc = button.ownerDocument; // the iframe's own document

                    // Standalone tooltip, appended at the very top of the
                    // iframe's body — NOT nested inside the button/toolbar.
                    // The toolbar strip clips/overlaps anything positioned
                    // relative to it (that's exactly why the previous nested
                    // version rendered invisible/behind the chart); a
                    // fixed-position element appended to <body> and
                    // positioned via getBoundingClientRect() escapes that
                    // entirely, the same way a tooltip "portal" would in React.
                    const tooltip = doc.createElement('div');
                    tooltip.textContent = 'Place trades with one click using Buy/Sell buttons on chart, without confirmation pop-ups or order window.';
                    Object.assign(tooltip.style, {
                        display: 'none',
                        position: 'fixed',
                        width: '220px',
                        background: '#1e1e2d',
                        color: '#d1d4dc',
                        fontSize: '11px',
                        lineHeight: '1.4',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        zIndex: '999999',
                        textAlign: 'left',
                        pointerEvents: 'none',
                    });
                    doc.body.appendChild(tooltip);

                    const infoIcon = doc.createElement('span');
                    infoIcon.textContent = '?';
                    Object.assign(infoIcon.style, {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: `1px solid ${t.textColor}`,
                        color: t.textColor,
                        fontSize: '10px',
                        lineHeight: '1',
                        opacity: '0.7',
                        cursor: 'help',
                    });
                    infoIcon.addEventListener('mouseenter', () => {
                        // Measure the tooltip's real size first (it's `display:none`
                        // otherwise, so offsetHeight/getBoundingClientRect would
                        // read 0) — reveal it invisibly, measure, position, then
                        // make it visible, so there's no flash in the wrong spot.
                        tooltip.style.visibility = 'hidden';
                        tooltip.style.display = 'block';
                        tooltip.style.transform = 'none';

                        const margin = 8;
                        const r = infoIcon.getBoundingClientRect();
                        const tRect = tooltip.getBoundingClientRect();
                        const viewportW = doc.defaultView?.innerWidth ?? 9999;
                        const viewportH = doc.defaultView?.innerHeight ?? 9999;

                        // This button lives in the chart's TOP toolbar, right at
                        // the iframe's own y≈0 — there is usually no room above
                        // it. Opening the tooltip upward unconditionally pushes
                        // it above the iframe's viewport, where it gets clipped
                        // by the iframe's own boundary (a cross-frame boundary —
                        // no z-index can fix that, since content inside an
                        // iframe can never render outside its own rectangle on
                        // the page). Pick whichever side actually has enough
                        // space, defaulting to below.
                        const spaceAbove = r.top - margin;
                        const spaceBelow = viewportH - r.bottom - margin;
                        const openUpward = spaceAbove >= tRect.height && spaceAbove > spaceBelow;

                        const top = openUpward
                            ? Math.max(margin, r.top - margin - tRect.height)
                            : Math.min(r.bottom + margin, viewportH - tRect.height - margin);

                        const left = Math.max(
                            margin,
                            Math.min(r.left, viewportW - tRect.width - margin),
                        );

                        tooltip.style.top = `${top}px`;
                        tooltip.style.left = `${left}px`;
                        tooltip.style.visibility = 'visible';
                    });
                    infoIcon.addEventListener('mouseleave', () => {
                        tooltip.style.display = 'none';
                    });

                    const label = doc.createElement('span');
                    label.textContent = '1-Click Trade';
                    Object.assign(label.style, { fontSize: '12px', color: t.textColor, whiteSpace: 'nowrap' });

                    const track = doc.createElement('span');
                    Object.assign(track.style, {
                        width: '32px', height: '18px', borderRadius: '9px', position: 'relative', transition: 'background .15s ease',
                    });
                    const knob = doc.createElement('span');
                    Object.assign(knob.style, {
                        position: 'absolute', top: '2px', width: '14px', height: '14px',
                        borderRadius: '50%', background: '#fff', transition: 'left .15s ease',
                    });
                    track.appendChild(knob);

                    button.innerHTML = '';
                    button.appendChild(label);
                    button.appendChild(infoIcon);
                    button.appendChild(track);

                    const renderToggle = () => {
                        const enabled = oneClickTradeRef.current !== false;
                        track.style.background = enabled ? '#0ECB81' : '#5b5f6a';
                        knob.style.left = enabled ? '16px' : '2px';
                    };
                    renderToggle();

                    button.addEventListener('click', (e) => {
                        if (e.target === infoIcon) return; // hovering/clicking the "?" shouldn't toggle
                        const next = !(oneClickTradeRef.current !== false);
                        oneClickTradeRef.current = next;
                        renderToggle();

                        // Show/hide the native Buy/Sell quick-order buttons
                        // live, with no widget rebuild — see
                        // BrokerAdapter.setBuySellButtonsVisible for the
                        // underlying host.sellBuyButtonsVisibility() API and
                        // TradingView docs reference.
                        const applied = adapterRef.current?.setBuySellButtonsVisible?.(next);
                        if (!applied) {
                            // Fallback for contexts where the live watched-value
                            // API isn't available (e.g. broker adapter not yet
                            // constructed, or an older library build) — a
                            // rebuild is still 100% reliable, just with the
                            // chart-flash trade-off this method exists to avoid.
                            destroyWidget();
                            initWidget(symbol, effectiveTheme);
                        }
                    });
                }).catch(() => { void 0; });
            }

            // Refresh broker order/position lines once chart data has rendered.
            // onDataLoaded fires after the initial getBars completes — at this point
            // order lines are safe to render without overlapping the loading spinner.
            try {
                widget.activeChart().onDataLoaded().subscribe(null, () => {
                    adapterRef.current?.refresh();
                }, true); // true = fire once
            } catch {
                // Fallback for builds where onDataLoaded is unavailable
                setTimeout(() => adapterRef.current?.refresh(), 1500);
            }

            // ── Order-price picker (broker-independent) ─────────────────────
            // A single draggable line the user positions to pick an order price.
            // Does not require broker_factory / backend order endpoints — safe
            // to use for contexts (e.g. Options) where the full broker layer
            // above is intentionally disabled.
            if (enableOrderLinePicker) {
                try {
                    const chartApi = widget.activeChart();
                    const color = orderLineSide === 'sell' ? '#F6465D' : '#0ECB81';
                    const line = chartApi.createOrderLine()
                        .setText(orderLineSide === 'sell' ? 'SELL' : 'BUY')
                        .setLineColor(color)
                        .setBodyBorderColor(color)
                        .setBodyTextColor('#ffffff')
                        .setQuantityBackgroundColor(color)
                        .setLineLength(60)
                        .onMove(function onOrderLineMove() {
                            onOrderLinePriceChange?.(this.getPrice());
                        });
                    orderLineRef.current = line;
                    // Report the initial (auto-centered) price right away.
                    onOrderLinePriceChange?.(line.getPrice());
                } catch (e) {
                    console.warn('[Chart] order line picker setup failed:', e);
                }
            }
        });
    }, [
        containerId, interval, chartsStorageUrl, chartsStorageApiVersion,
        clientId, userId, fullscreen, autosize, datafeedUrl,
        brokerFactory, adapterRef, restoreChart, persistChart, persistChartImmediate, socketContext,
        isBrokerCapable, tradeType, enableOrderLinePicker, orderLineSide,
        onOrderLinePriceChange,
    ]);

    // ── Destroy ────────────────────────────────────────────────────────────

    const destroyWidget = useCallback(() => {
        isReadyRef.current = false;
        orderLineRef.current = null;
        clearTimeout(saveTimerRef.current);

        // Cancel a pending waitForTradingViewLibrary() poll, if any, so it
        // can't fire initWidget() after this component has torn down.
        if (libraryWaitCancelRef.current) {
            libraryWaitCancelRef.current();
            libraryWaitCancelRef.current = null;
        }

        // Same cancellation for a pending waitForContainerSize() poll — see
        // isContainerReady()/waitForContainerSize() above.
        if (containerWaitCancelRef.current) {
            containerWaitCancelRef.current();
            containerWaitCancelRef.current = null;
        }

        if (datafeedRef.current?.destroy) {
            datafeedRef.current.destroy();
            datafeedRef.current = null;
        }

        if (tvWidgetRef.current) {
            try {
                // Clean up iframe observer
                const iframe = document.querySelector(`#${containerId} iframe`);
                const obs = iframe?.contentDocument?.['__gx_toolbar_obs__'];
                if (obs) obs.disconnect();

                // Clean up the active-chart symbol sync subscriptions
                if (activeChartSymbolSubRef.current) {
                    const { chartApi, handler } = activeChartSymbolSubRef.current;
                    try { chartApi.onSymbolChanged().unsubscribe(null, handler); } catch { void 0; }
                    activeChartSymbolSubRef.current = null;
                }
                if (activeChartChangedHandlerRef.current) {
                    try { tvWidgetRef.current.unsubscribe('activeChartChanged', activeChartChangedHandlerRef.current); } catch { void 0; }
                    activeChartChangedHandlerRef.current = null;
                }

                tvWidgetRef.current.remove();
            } catch { void 0; }
            tvWidgetRef.current = null;
        }

        // Belt-and-braces: `widget.remove()` above can finish its own DOM
        // teardown asynchronously. Clearing the container synchronously
        // here too means a fast remount (StrictMode's dev double-invoke, or
        // this component mounting right as the page leaves the Coming Soon
        // state) can never end up constructing a new widget into a
        // container that still has the previous one's iframe sitting in it.
        const container = document.getElementById(containerId);
        if (container) container.replaceChildren();
    }, [containerId]);

    // ── Effects ────────────────────────────────────────────────────────────

    // Mount
    useEffect(() => {
        if (!isEmpty(symbol)) {
            initWidget(symbol, effectiveTheme);
        }
        return destroyWidget;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Symbol change — prefer setSymbol (no widget rebuild needed)
    useEffect(() => {
        if (!symbol) return;

        if (tvWidgetRef.current && isReadyRef.current) {
            const targetSymbol = symbol;
            try {
                const active = tvWidgetRef.current.activeChart();
                const shown = String(active.symbol() || '').toUpperCase();
                if (shown === String(targetSymbol).toUpperCase()) {
                    // The active chart already shows this symbol — most
                    // likely because this prop update is the app catching up
                    // to a pair change that originated on the chart itself
                    // (native symbol search, or switching the active pane).
                    // Re-issuing setSymbol here would just reload the same
                    // chart for no reason.
                    currentSymbolRef.current = targetSymbol;
                    return;
                }
                active.setSymbol(targetSymbol, interval);

                // Verify-and-self-heal: in practice `setSymbol()` can
                // occasionally silently not take effect — the chart stays
                // on the previous pair while the rest of the page (order
                // book, ticker, buy panel — all driven independently off
                // Redux) correctly shows the new one, with nothing in the
                // console to say why. Rather than trust a single call,
                // re-check shortly after; if the active chart still isn't
                // showing the target symbol, force a full destroy+rebuild
                // of the widget instead — guaranteed correct regardless of
                // why the first attempt didn't stick.
                setTimeout(() => {
                    // A newer symbol change may have superseded this one in
                    // the meantime (currentSymbolRef is kept in sync with
                    // the `symbol` prop by a separate effect) — if so, let
                    // that change's own verification handle it instead.
                    if (String(currentSymbolRef.current || '').toUpperCase() !== String(targetSymbol).toUpperCase()) return;
                    if (!tvWidgetRef.current) return;
                    try {
                        const nowShown = String(tvWidgetRef.current.activeChart().symbol() || '').toUpperCase();
                        if (nowShown !== String(targetSymbol).toUpperCase()) {
                            destroyWidget();
                            initWidget(targetSymbol, effectiveTheme);
                        }
                    } catch (verifyErr) {
                        console.warn('[Chart] setSymbol verification failed, forcing full rebuild:', verifyErr);
                        destroyWidget();
                        initWidget(targetSymbol, effectiveTheme);
                    }
                }, 1500);
            } catch (e) {
                console.warn('[Chart] setSymbol threw, forcing full rebuild:', e);
                destroyWidget();
                initWidget(targetSymbol, effectiveTheme);
            }
        } else if (!tvWidgetRef.current) {
            initWidget(symbol, effectiveTheme);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    // Theme change — update the existing TradingView widget in-place.
    // Do not rebuild the widget: rebuilding can reset broker state, drawings,
    // studies and the current chart layout.
    useEffect(() => {
        if (!tvWidgetRef.current || !isReadyRef.current) return;

        const tv = effectiveTheme;
        restoreChart(currentSymbolRef.current, tv, true);
    }, [effectiveTheme, restoreChart]);

    // Panel expand / collapse → resize
    useEffect(() => {
        if (!tvWidgetRef.current) return;
        const t = setTimeout(() => {
            scheduleResizeSettle(tvWidgetRef.current, containerId);
        }, 300);
        return () => clearTimeout(t);
    }, [chartExpanded, containerId]);

    // Container size change → resize (fixes the black/blank gap that could
    // appear to the right of the chart, with the neighbouring panel's
    // content bleeding through over it).
    //
    // Root cause: `autosize: true` (set on the widget below) only reacts
    // to the *window*'s resize event out of the box. It does NOT notice
    // the chart's own container growing/shrinking for reasons that never
    // fire a window resize event — e.g. this page's CSS Grid switching
    // templates (opening/closing the Order Book / Recent Trades panels
    // re-flows the `tradingChart` grid column width) or the draggable
    // resize handle on this panel. When that happens the widget's
    // internal iframe keeps whatever pixel width it last measured, while
    // the outer container div (`#containerId`) has already resized to the
    // new width — leaving a stale gap between the iframe's real edge and
    // the container's edge, through which the next panel over (higher
    // z-index) shows.
    //
    // Fix: watch the container itself with a ResizeObserver and force the
    // widget to re-measure (`widget.resize()`) any time its box actually
    // changes, regardless of what caused it. This is the officially
    // documented pattern for autosize + programmatically/CSS-driven
    // container resizes (Advanced Charts docs — Widget Constructor,
    // "autosize").
    useEffect(() => {
        const el = document.getElementById(containerId);
        if (!el || typeof ResizeObserver === 'undefined') return undefined;

        let raf = null;
        const ro = new ResizeObserver(() => {
            // Coalesce bursts of resize entries (grid re-layout, drag,
            // window resize) into a single resize() call per frame.
            if (raf) cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                if (!tvWidgetRef.current || !isReadyRef.current) return;
                forceResizeWidget(tvWidgetRef.current, containerId);
            });
        });
        ro.observe(el);

        return () => {
            if (raf) cancelAnimationFrame(raf);
            ro.disconnect();
        };
    }, [containerId]);

    // Tab visibility → resize on re-focus
    useEffect(() => {
        const h = () => {
            if (document.visibilityState === 'visible') {
                setTimeout(() => forceResizeWidget(tvWidgetRef.current, containerId), 100);
            }
        };
        document.addEventListener('visibilitychange', h);
        return () => document.removeEventListener('visibilitychange', h);
    }, []);

    // Full page load / webfonts ready → resize settle-burst. Covers layout
    // shifts (webfont swap, icon fonts, images) that finish loading after
    // onChartReady's own settle-burst has already run out, which is the
    // other common source of a stale one-time-too-narrow measurement on a
    // fresh page load.
    useEffect(() => {
        const settle = () => scheduleResizeSettle(tvWidgetRef.current, containerId);
        if (document.readyState === 'complete') settle();
        else window.addEventListener('load', settle, { once: true });
        document.fonts?.ready?.then(settle).catch(() => void 0);
        return () => window.removeEventListener('load', settle);
    }, [containerId]);

    // Account switch → restore chart settings for the new account
    useEffect(() => {
        if (!tvWidgetRef.current || !userdetails?.accountId) return;
        const tv = !isEmpty(queryTheme) ? queryTheme : theme;
        // setTimeout(() => restoreChart(symbol, tv), 150);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userdetails?.accountId]);

    // Retry restoring the saved layout once auth (accountId/secretKey)
    // becomes available, for the case where the chart widget finishes
    // initializing (onChartReady fires) BEFORE that data has loaded — the
    // widget's own startup doesn't wait on it at all, so right after a hard
    // page refresh it's common for the chart to be ready first and auth to
    // arrive a moment later. restoreChart()'s own guard silently no-ops if
    // called too early, and nothing used to retry it — this does, exactly
    // once (hasRestoredRef), the first moment both are true.
    useEffect(() => {
        if (hasRestoredRef.current) return;
        if (!userdetails?.accountId || !userdetails?.secretKey) return;
        if (!tvWidgetRef.current || !isReadyRef.current) return;
        restoreChart(currentSymbolRef.current, effectiveTheme);
    }, [userdetails?.accountId, userdetails?.secretKey, effectiveTheme, restoreChart]);

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <>
            {/* Close-position confirmation modal — triggered by broker adapter */}
            <CloseOrderByChart
                show={closeModal.show}
                handleClose={() => setCloseModal({ show: false, data: {} })}
                record={closeModal.data}
                onConfirm={handleClosePositionConfirm}
                isLoading={closeLoading}
            />
            <div id={containerId} style={{ width: '100%', height: '100%' }} />
        </>
    );
};

export default React.memo(TradingViewChart);

// ─── Internal ─────────────────────────────────────────────────────────────────

function _getLocaleFromURL() {
    const m = /[?&]lang=([^&#]*)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
}