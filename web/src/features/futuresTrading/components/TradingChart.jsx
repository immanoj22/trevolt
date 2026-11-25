/** PACKAGE IMPORT */
import React, { useState, useCallback, useEffect } from 'react'
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from "is-empty";
import { IoIosCloseCircleOutline } from "react-icons/io";

/** LOCAL FILES IMPORT */
import styles from "../styles/tradingChart.module.css"
import TradingViewChart from './TradingViewChart';

/** REDUX */
import { FutureTicker, FutureTradePair } from '../../../redux/futureAction';

/** CONFIG */
import config from '../../../config/env';

/** CODE START */
import { Resizable } from "re-resizable";
import useBreakpoint from '../../../hooks/useBreakpoint';

const TradingChart = ({ onClose, embedded = false, ...props }) => {
    const width = useBreakpoint();
    const { tikerRoot } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { futurePairData, futureTicker, futureTradePair } = useSelector((state) => state.future);
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

    // `Resizable` (re-resizable) as a CONTROLLED component, driven entirely
    // by this state — not `defaultSize` (uncontrolled, where the library
    // tracks its own internal pixel width/height once a drag starts,
    // independently of anything else). With two independent systems each
    // trying to own the same visual size (this app's CSS grid row sizing,
    // AND re-resizable's own internal drag state), they could drift out of
    // sync — leaving a blank gap after "minimizing" and making the drag
    // handle itself feel unresponsive (re-resizable fighting to reconcile
    // its own last-known size against a grid cell that had already changed
    // size out from under it). Being the single source of truth for both
    // reading (what size to render) and writing (drag updates it, reset
    // sets it back to 100%) removes that possibility entirely.
    //
    // None of this applies when `embedded` — the chart is then sized
    // entirely by its parent DraggableResizablePanel (drag header to move,
    // drag its own corner handle to resize), so this component just fills
    // 100% of whatever box it's given.
    const [chartSize, setChartSize] = useState({ width: '100%', height: '100%' });

    // FuturesTrading.jsx's chart-resize handler dispatches this once it
    // determines the dragged height is back at (or below) the natural
    // default and resets the outer CSS grid's row sizing — this resets
    // Resizable's controlled size to match, in the same step.
    useEffect(() => {
        if (embedded) return;
        const handleReset = () => {
            setChartSize({ width: '100%', height: '100%' });
        };
        window.addEventListener('chartResizeReset', handleReset);
        return () => window.removeEventListener('chartResizeReset', handleReset);
    }, [embedded]);

    // Fires when the pair selected *on the chart itself* changes — native
    // symbol search on the chart header, or (in a multi-chart/split layout)
    // switching the active pane to one already showing a different pair.
    // Re-syncs the rest of the page (order book, buy/sell panel, URL, etc.)
    // to match, the same way selecting a pair from the header dropdown does.
    const handleChartSymbolChange = useCallback((newTickerRoot) => {
        if (isEmpty(newTickerRoot) || isEmpty(futurePairData)) return;
        const upper = String(newTickerRoot).toUpperCase();
        if (tikerRoot && upper === String(tikerRoot).toUpperCase()) return;

        const pairDetail = futurePairData.find(
            (el) => String(el.tickerRoot).toUpperCase() === upper,
        );
        // Unknown/unsupported pair (e.g. a symbol from the datafeed's search
        // that isn't one of this app's tradable futures pairs) — leave the
        // rest of the page alone; only the chart itself will show it.
        if (!pairDetail) return;

        dispatch(FutureTradePair({ tradePair: pairDetail }));
        dispatch(FutureTicker({ tikerData: pairDetail }));
        navigate(`/futures/${pairDetail.tickerRoot}`, { replace: true });
    }, [tikerRoot, futurePairData, dispatch, navigate]);

    const tradeChartData = [
        {
            id: 1,
            title: "Traded Price",
            content: <TradingViewChart
                symbol={tikerRoot}
                interval='5'
                containerId='tv_chart_container'
                datafeedUrl={`${config.API_URL}/future`}
                libraryPath='/charting_library/'
                chartsStorageUrl=''
                chartsStorageApiVersion='1.1'
                clientId='tradingview.com'
                userId='public_user_id'
                fullscreen={false}
                autosize={true}
                studiesOverrides=""
                theme='Dark'
                pair={tikerRoot}
                tradeType={'future'}
                onSymbolChange={handleChartSymbolChange}
            />
        },
        // {
        //     id: 1,
        //     title: "Traded Price",
        //     content: <TradedPriceChart
        //         symbol={tikerRoot}
        //         interval='5'
        //         containerId='tv_chart_container'
        //         datafeedUrl={config.API_URL + "/future/chart"}
        //         libraryPath='/charting_library/'
        //         chartsStorageUrl=''
        //         chartsStorageApiVersion='1.1'
        //         clientId='tradingview.com'
        //         userId='public_user_id'
        //         fullscreen={false}
        //         autosize={true}
        //         studiesOverrides=""
        //         theme='Dark'
        //         pair={tikerRoot}
        //     />
        // },
    ];

    const handleChangeChart = (getIndex) => {
        setCurrentOrderIndex(getIndex);
    };

    const chartBody = (
        <div className={styles.body}>
            {tradeChartData[currentOrderIndex]?.content}
        </div>
    );

    if (embedded) {
        // Sized entirely by the parent DraggableResizablePanel (drag the
        // header below to move, drag the corner to resize) — no own
        // Resizable wrapper and no chartResize dispatch (superseded by the
        // panel's own drag/resize). Reuses this component's own existing
        // header (the same tab bar rendered below in non-embedded mode)
        // rather than a second, duplicate title bar — that header doubles
        // as the drag handle via data-panel-drag-handle, and its own close
        // icon (hidden until the section is hovered, same as every other
        // panel) is wired to onClose exactly like the non-embedded case.
        return (
            <div className={styles.container} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {onClose && (
                    <IoIosCloseCircleOutline onClick={onClose} className={styles.containerClosebtn} />
                )}
                <div className={styles.header} data-panel-drag-handle="true">
                    <div className={styles.headerRightActions}>
                        {tradeChartData.map((tabs, index) => (
                            <button
                                data-click-effect="none"
                                aria-label={tabs.title}
                                key={index}
                                onClick={() => handleChangeChart(index)}
                                className={`${styles.headerTabs} ${currentOrderIndex === index ? styles.active : ""}`}
                            >
                                {tabs.title}
                            </button>
                        ))}
                    </div>
                </div>
                {chartBody}
            </div>
        );
    }

    return (
        <Resizable
            size={chartSize}
            minWidth={300}
            minHeight={200}
            handleStyles={{
                bottomRight: {
                    width: 10, height: 10, right: 0, bottom: 0, cursor: 'se-resize',
                    borderRight: '3px solid var(--color-bg10)',
                    borderBottom: '3px solid var(--color-bg10)',
                    borderRadius: '0 0 4px 0'
                },
            }}
            enable={{
                top: false, right: false, bottom: width >= 768, left: false,
                topRight: false, bottomRight: width >= 768, bottomLeft: false, topLeft: false
            }}
            onResize={(e, direction, ref) => {
                // Width is deliberately NEVER taken from the drag — only
                // height. Column widths are meant to stay grid-controlled
                // (pure horizontal resize was already disabled via
                // enable.right/left: false above); the diagonal corner
                // handle was the only way a width change could sneak in as
                // a side effect of a height drag, and that's exactly what
                // left the chart's rendered width out of sync with its
                // grid cell — the blank gap next to the chart after
                // resizing. Since this is now a controlled component,
                // always passing width:'100%' here means re-resizable
                // resyncs back to it immediately on every update,
                // effectively locking the width regardless of what the
                // drag gesture itself computes.
                setChartSize({ width: '100%', height: ref.offsetHeight });
                window.dispatchEvent(new CustomEvent('chartResize', {
                    detail: { width: ref.offsetWidth, height: ref.offsetHeight }
                }));
            }}
            style={{ display: 'flex', flexDirection: 'column' }}
            className={styles.container}
        >
            {onClose && (
                <IoIosCloseCircleOutline onClick={onClose} className={styles.containerClosebtn} />
            )}
            <div className={styles.header}>
                <div className={styles.headerRightActions}>
                    {tradeChartData.map((tabs, index) => (
                        <button
                            data-click-effect="none"
                            aria-label={tabs.title}
                            key={index}
                            onClick={() => handleChangeChart(index)}
                            className={`${styles.headerTabs} ${currentOrderIndex === index ? styles.active : ""}`}
                        >
                            {tabs.title}
                        </button>
                    ))}
                </div>
            </div>
            {chartBody}
        </Resizable>
    );
};

export default TradingChart;