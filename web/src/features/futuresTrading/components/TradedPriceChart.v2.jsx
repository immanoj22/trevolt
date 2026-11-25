/**
 * TradedPriceChart.v2.jsx
 *
 * Refactored TradingView chart component using the clean Broker Adapter layer.
 *
 * What changed from v1 (TradedPriceChart.jsx):
 *   - FutureBrokerAPI class removed — replaced by BrokerAdapter + useBrokerAdapter
 *   - State management moved to BrokerStateManager (Map-based, O(1) lookups)
 *   - WebSocket sync centralised in useBrokerAdapter (no duplicate socket listeners)
 *   - Widget lifecycle simplified (single initChart guard, clean destroy)
 *   - TP/SL creation & validation logic in BrokerAdapter.editPositionBrackets
 *   - Optimistic UI + rollback in BrokerAdapter (not scattered in callbacks)
 *   - Debounced modify/bracket API calls in BrokerAdapter (200ms / 300ms)
 *   - No raw — replaced with structured logging
 *
 * Props: (same as v1 TradedPriceChart)
 *   symbol, containerId, datafeedUrl, interval, libraryPath,
 *   chartsStorageUrl, chartsStorageApiVersion, clientId, userId,
 *   fullscreen, autosize, chartExpanded
 */

import React, {
    useEffect, useRef, useCallback, useContext, useState,
} from 'react';
import { useSelector }  from 'react-redux';
import { useLocation }  from 'react-router-dom';
import isEmpty          from 'is-empty';

import { useGlobalContext }       from '../../../context/GlobalProvider';
import SocketContext              from '../../../context/socketContext';
import { useBrokerAdapter }      from '../broker/useBrokerAdapter';
import { BrokerAdapter }         from '../broker/BrokerAdapter';
import { saveChartSettings, getChartSettings } from '../../../actions/subAccountAction';
import { showToastMessage }      from '../../../lib/toast';
import CloseOrderByChart         from '../modal/CloseOrderByChart';
import { futureClosePosition }   from '../../../actions/futureActions';

// ─── Theme tokens ────────────────────────────────────────────────────────────

const THEMES = {
    dark: {
        background: '#1d1d1d', gridColor: '#2A2E39', crosshairColor: '#9C9C9C',
        separatorColor: '#2E2E2E', textColor: '#999999',
        lineColor: 'rgba(242,242,242,0)', axisBackground: '#1d1d1d', toolbarBg: '#171717',
    },
    light: {
        background: '#FFFFFF', gridColor: '#E0E3EB', crosshairColor: '#9C9C9C',
        separatorColor: '#E0E3EB', textColor: '#131722',
        lineColor: 'rgba(0,0,0,0)', axisBackground: '#FFFFFF', toolbarBg: '#FFFFFF',
    },
};

const SAVE_DEBOUNCE_MS = 1500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTVTheme(v) {
    const l = String(v || '').toLowerCase();
    return l === 'dark' || l === 'black' ? 'Dark' : 'Light';
}

function themeKey(v) { return normalizeTVTheme(v) === 'Dark' ? 'dark' : 'light'; }

function applyThemeToLayout(saved, themeValue) {
    const layout = typeof saved === 'string' ? JSON.parse(saved) : structuredClone(saved);
    const t = THEMES[themeKey(themeValue)] ?? THEMES.dark;
    (layout.charts || []).forEach((chart) => {
        const pane   = chart.chartProperties.paneProperties;
        const scales = chart.chartProperties.scalesProperties;
        pane.background                     = t.background;
        pane.backgroundType                 = 'solid';
        pane.vertGridProperties.color       = t.gridColor;
        pane.horzGridProperties.color       = t.gridColor;
        pane.crossHairProperties.color      = t.crosshairColor;
        pane.separatorColor                 = t.separatorColor;
        scales.textColor                    = t.textColor;
        scales.lineColor                    = t.lineColor;
        scales.backgroundColor              = t.axisBackground;
    });
    return layout;
}

function injectToolbarBg(containerId, color) {
    const iframe = document.querySelector(`#${containerId} iframe`);
    if (!iframe?.contentDocument?.head) return;
    const styleId = '__gx_toolbar_bg__';
    let el = iframe.contentDocument.getElementById(styleId);
    if (!el) {
        el = iframe.contentDocument.createElement('style');
        el.id = styleId;
        iframe.contentDocument.head.appendChild(el);
    }
    el.textContent = `
        html, body,
        div[class*="chart-toolbar"], div[class*="toolbar-"],
        div[class*="drawingToolbar-"], div[class*="wrap-"],
        div[class*="layout_area-top"], div[class*="layout_area-left"],
        div[class*="time-axis"], div[class*="timeAxisWidget"],
        div[class*="bottom-widgetbar"], div[class*="bottomBar"] {
            background-color: ${color} !important;
            background:       ${color} !important;
        }
    `;
    const obsKey = '__gx_toolbar_obs__';
    if (iframe.contentDocument[obsKey]) iframe.contentDocument[obsKey].disconnect();
    const obs = new MutationObserver(() => { el.textContent = el.textContent; });
    obs.observe(iframe.contentDocument.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class'] });
    iframe.contentDocument[obsKey] = obs;
}

// ─── Component ────────────────────────────────────────────────────────────────

const TradedPriceChartV2 = (props) => {
    const {
        symbol,
        containerId   = 'tv_chart_container',
        datafeedUrl,
        interval      = '1',
        libraryPath   = '/charting_library/',
        chartsStorageUrl,
        chartsStorageApiVersion = '1.1',
        clientId      = 'greenex',
        userId,
        fullscreen    = false,
        autosize      = true,
        chartExpanded,
    } = props;

    // ── Refs ──────────────────────────────────────────────────────────────────
    const tvWidgetRef      = useRef(null);
    const isReadyRef       = useRef(false);
    const saveTimerRef     = useRef(null);
    const accountIdRef     = useRef(null);
    const secretKeyRef     = useRef(null);
    const currentSymbolRef = useRef(symbol);

    // ── State ─────────────────────────────────────────────────────────────────
    const [closeModal, setCloseModal] = useState({ show: false, data: {} });
    const [isLoading, setIsLoading]   = useState(false);

    // ── Context ───────────────────────────────────────────────────────────────
    const { theme }           = useGlobalContext();
    const socketContext       = useContext(SocketContext);
    const location            = useLocation();
    const queryTheme          = new URLSearchParams(location.search).get('theme');
    const { userdetails }     = useSelector(s => s.user);

    useEffect(() => { accountIdRef.current = userdetails?.accountId; }, [userdetails?.accountId]);
    useEffect(() => { secretKeyRef.current = userdetails?.secretKey; }, [userdetails?.secretKey]);
    useEffect(() => { currentSymbolRef.current = symbol; }, [symbol]);

    // ── Effective theme ───────────────────────────────────────────────────────
    const getEffectiveTheme = () =>
        !isEmpty(queryTheme)
            ? queryTheme
            : (localStorage.getItem('trevolt-theme') || theme || 'dark');

    // ── Toast helper ──────────────────────────────────────────────────────────
    const onToast = useCallback((msg, type = 'success') => {
        showToastMessage(msg, type);
    }, []);

    // ── Close position (modal handler) ────────────────────────────────────────
    const onClosePosition = useCallback((data) => {
        setCloseModal({ show: true, data });
    }, []);

    const handleClosePositionConfirm = async (record) => {
        try {
            setIsLoading(true);
            const res = await futureClosePosition({
                pairId:       record.pairId,
                positionSide: record.positionSide,
                quantity:     record.quantity,
                orderType:    'market',
                price:        record.price,
                typeTIF:      record.typeTIF || '',
            }, userdetails.secretKey);
            setIsLoading(false);
            if (res.status) {
                !isEmpty(res.message) && showToastMessage(res.message, 'success');
                record.onConfirmed?.();
            } else {
                !isEmpty(res.message) && showToastMessage(res.message, 'error');
            }
        } catch (err) {
            setIsLoading(false);
        }
    };

    // ── Broker adapter hook ───────────────────────────────────────────────────
    const { brokerFactory, adapterRef } = useBrokerAdapter({
        symbol,
        socket:           socketContext?.socket,
        secretKeyRef,
        accountIdRef,
        currentSymbolRef,
        onClosePosition,
        onToast,
    });

    // ── Chart persistence ──────────────────────────────────────────────────────
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
                    } catch {}
                });
            } catch {}
        }, SAVE_DEBOUNCE_MS);
    }, []);

    const restoreChart = useCallback(async (sym, tv, themeOnly = false) => {
        if (!tvWidgetRef.current || !isReadyRef.current) return;
        if (!accountIdRef.current || !secretKeyRef.current) return;
        try {
            const tvTheme = normalizeTVTheme(tv);
            const t       = THEMES[themeKey(tv)];
            if (themeOnly) {
                await tvWidgetRef.current.changeTheme(tvTheme);
                tvWidgetRef.current.applyOverrides({ 'paneProperties.legendProperties.showLegend': false });
                setTimeout(() => injectToolbarBg(containerId, t.toolbarBg), 200);
                return;
            }
            const { status, result } = await getChartSettings(accountIdRef.current, secretKeyRef.current);
            if (!status || !result || !tvWidgetRef.current || !isReadyRef.current) return;
            const patched = applyThemeToLayout(result, tv);
            tvWidgetRef.current.load(patched);
            if (sym && !isEmpty(sym)) {
                try { tvWidgetRef.current.activeChart().setSymbol(sym); } catch {}
            }
            setTimeout(() => injectToolbarBg(containerId, t.toolbarBg), 300);

            // After load, refresh broker lines for restored charts
            setTimeout(() => adapterRef.current?.refresh(), 400);
        } catch (e) {  }
    }, [containerId, adapterRef]);

    // ── Widget init ────────────────────────────────────────────────────────────
    const initChart = useCallback((sym, tv) => {
        if (tvWidgetRef.current) return;

        const tvTheme = normalizeTVTheme(tv);
        const t       = THEMES[themeKey(tv)];

        const widgetOptions = {
            symbol:        sym,
            datafeed:      new window.Datafeeds.UDFCompatibleDatafeed(datafeedUrl),
            interval,
            container:     containerId,
            library_path:  libraryPath,
            locale:        _getLocale() || 'en',

            charts_storage_url:         chartsStorageUrl,
            charts_storage_api_version: chartsStorageApiVersion,
            client_id:                  clientId,
            user_id:                    userId || accountIdRef.current || 'anonymous',

            fullscreen,
            autosize,
            theme: tvTheme,
            toolbar_bg:     t.toolbarBg,
            loading_screen: { backgroundColor: t.background },

            // ── Broker integration ─────────────────────────────────────────
            broker_factory: brokerFactory,
            broker_config:  { configFlags: BrokerAdapter.configFlags, durations: null },

            disabled_features: [
                'use_localstorage_for_settings',
                'object_tree',
                'show_object_tree',
                'header_object_tree',
            ],
            enabled_features: [
                'study_templates',
                'header_layouttoggle',
                'header_saveload',
                'header_settings',
                'header_fullscreen_button',
                'dom_widget',
                'support_multicharts',
                // TP/SL on chart → BrokerAdapter.editPositionBrackets
                'trading_position',
                'trading_brackets',
            ],

            overrides: {
                'paneProperties.background':               t.background,
                'paneProperties.backgroundType':           'solid',
                'paneProperties.vertGridProperties.color': t.gridColor,
                'paneProperties.horzGridProperties.color': t.gridColor,
                'paneProperties.crossHairProperties.color': t.crosshairColor,
                'symbolWatermarkProperties.transparency':  90,
                'scalesProperties.textColor':              t.textColor,
                'scalesProperties.backgroundColor':        t.axisBackground,
                'paneProperties.legendProperties.showLegend': false,
            },
        };

        tvWidgetRef.current = new window.TradingView.widget(widgetOptions);

        tvWidgetRef.current.onChartReady(async () => {
            isReadyRef.current = true;

            await restoreChart(sym, tv);

            const iframe = document.querySelector(`#${containerId} iframe`);
            if (iframe?.contentDocument) {
                injectToolbarBg(containerId, t.toolbarBg);
            }

            tvWidgetRef.current.subscribe('onAutoSaveNeeded', persistChart);

            // Refresh broker lines after initial data load completes
            tvWidgetRef.current.activeChart().onDataLoaded().subscribe(null, () => {
                adapterRef.current?.refresh();
            }, true);
        });
    }, [
        containerId, interval, libraryPath, chartsStorageUrl, chartsStorageApiVersion,
        clientId, userId, fullscreen, autosize, datafeedUrl,
        brokerFactory, restoreChart, persistChart, adapterRef,
    ]);

    // ── Destroy ───────────────────────────────────────────────────────────────
    const destroyWidget = useCallback(() => {
        isReadyRef.current = false;
        clearTimeout(saveTimerRef.current);
        if (tvWidgetRef.current) {
            try {
                const iframe = document.querySelector(`#${containerId} iframe`);
                iframe?.contentDocument?.['__gx_toolbar_obs__']?.disconnect();
                tvWidgetRef.current.remove();
            } catch {}
            tvWidgetRef.current = null;
        }
    }, [containerId]);

    // ── Effects ───────────────────────────────────────────────────────────────

    // Mount
    useEffect(() => {
        if (!isEmpty(symbol)) initChart(symbol, getEffectiveTheme());
        return destroyWidget;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Symbol change → setSymbol (no widget rebuild)
    useEffect(() => {
        if (!symbol) return;
        if (tvWidgetRef.current && isReadyRef.current) {
            try { tvWidgetRef.current.activeChart().setSymbol(symbol, interval); } catch {}
        } else if (!tvWidgetRef.current) {
            initChart(symbol, getEffectiveTheme());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol]);

    // Theme change → changeTheme (no widget rebuild)
    useEffect(() => {
        if (!tvWidgetRef.current || !isReadyRef.current) return;
        const tv = !isEmpty(queryTheme) ? queryTheme : theme;
        restoreChart(symbol, tv, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme, queryTheme]);

    // Panel expand/collapse → resize
    useEffect(() => {
        if (!tvWidgetRef.current) return;
        const t = setTimeout(() => { try { tvWidgetRef.current?.resize(); } catch {} }, 300);
        return () => clearTimeout(t);
    }, [chartExpanded]);

    // Tab visibility → resize on refocus
    useEffect(() => {
        const h = () => {
            if (document.visibilityState === 'visible')
                setTimeout(() => { try { tvWidgetRef.current?.resize(); } catch {} }, 100);
        };
        document.addEventListener('visibilitychange', h);
        return () => document.removeEventListener('visibilitychange', h);
    }, []);

    // Account switch → restore saved chart
    useEffect(() => {
        if (!tvWidgetRef.current || !userdetails?.accountId) return;
        const tv = !isEmpty(queryTheme) ? queryTheme : theme;
        setTimeout(() => restoreChart(symbol, tv), 150);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userdetails?.accountId]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <CloseOrderByChart
                show={closeModal.show}
                handleClose={() => setCloseModal({ show: false, data: {} })}
                record={closeModal.data}
                onConfirm={handleClosePositionConfirm}
                isLoading={isLoading}
            />
            <div id={containerId} style={{ width: '100%', height: '100%' }} />
        </>
    );
};

export default React.memo(TradedPriceChartV2);

// ─── Internal ──────────────────────────────────────────────────────────────────

function _getLocale() {
    const m = /[?&]lang=([^&#]*)/.exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : null;
}
