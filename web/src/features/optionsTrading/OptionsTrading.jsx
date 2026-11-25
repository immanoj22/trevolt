/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react'
import Select from 'react-select'
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from 'is-empty';

/** LOCAL FILES IMPORT */

import Header from '../../layout/Header/Header'
import styles from './styles/tradePageLayout.module.css'
import useBreakpoint from '../../hooks/useBreakpoint'
// import OrderBook from './components/OrderBook'
import OrderBook from './components/OrderBook'
import RecentTrades from './components/RecentTrades'

import TradeActionPanel from './components/TradeActionPanel'

// import TradeTabs from './components/TradeTabs'
import TradeTabs from '../futuresTrading/components/TradeTabs'
import MarketSummary from './components/MarketSummary'
import TableAndChart from './components/TableAndChart'
import Loader from '../../components/Loader/Loader'
import StrategyBuilder from './components/StrategyBuilder'
import { StrategyBuilderProvider } from './context/StrategyBuilderContext'


/** REDUX */
/** REDUX */
import { FutureTicker, FutureTradePair } from "../../redux/futureAction";
import { OptionTradePair, OptionTicker, OptionContractDetail, Options, UnderlyingData, MakerFee, TakerFee, PremiumCap, UnderlyingDetails } from "../../redux/optionAction";
import { getOptionDetails, getAllUnderlyingAssetDetails } from '../../actions/OptionTradeAction';
import { UserLeverage } from '../../redux/action';
import { findBetweenArray } from './constants';
import ComingSoon from '../../components/ComingSoon/ComingSoon';
import PageLoader from '../../components/Loader/PageLoader';
import featureFlags from '../../config/featureFlags';
import {
    buildUnderlyingDataSnapshot,
    getFirstAvailableUnderlyingAsset,
    hasResolvedUnderlyingList,
    resetOptionContractReduxState,
    shouldKeepContentVisibleWhileContractLoads,
    shouldSkipInitialOptionHydration,
} from './utils/optionsTradingState';
/** CODE START */

const OptionsTrading = () => {
    const width = useBreakpoint();

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { underlyingSymbol: rawUnderlyingSymbol, tikerRoot: rawTikerRoot } = useParams();
    // Route params come through as real strings, so a URL like
    // /options/BNB/undefined (produced somewhere upstream by
    // navigate(`/options/${symbol}/${pair}`) when `pair` was JS `undefined`)
    // gives tikerRoot the literal 4-letter word "undefined" — which is a
    // non-empty string, so every isEmpty(tikerRoot) check below was treating
    // it as "a real ticker was given" instead of "nothing was given", and
    // the page could never recover/self-heal once that happened.
    const underlyingSymbol = (rawUnderlyingSymbol === "undefined" || rawUnderlyingSymbol === "null") ? undefined : rawUnderlyingSymbol;
    const tikerRoot = (rawTikerRoot === "undefined" || rawTikerRoot === "null") ? undefined : rawTikerRoot;

    const { userdetails } = useSelector((state) => state.user);
    const { feeSettingsList } = useSelector(
        (state) => state.fee
    );
    const {
        underlyingDetails,
        optionTradePair,
        optionsData,
        optionContractData,
        optionTicker
    } = useSelector((state) => state.option);
    // const { futureTicker, futureTradePair, futurePairData } = useSelector((state) => state.future);

    const [currentTab, setCurrentTab] = useState('graph')
    const [selectedView, setSelectedView] = useState('table')
    const [isStrategyBuilderEnable, setIsStrategyBuilderEnable] = useState(false)








    const handleStrategyBuilderChange = () => {
        setIsStrategyBuilderEnable(!isStrategyBuilderEnable)
    }

    const tradeViewOptions = [
        { label: 'Table', key: "table" },
        { label: "Chart", key: "chart" }
    ]

    const [pageHide, setPageHide] = useState(false);
    const [comingSoon, setComingSoon] = useState(false);
    const [isPageLoader, setisPageLoader] = useState(true);
    const hasUnderlyingList = hasResolvedUnderlyingList(underlyingDetails);
    // Guards the fallback refetch below so it only fires once per symbol,
    // instead of looping if the symbol genuinely doesn't exist.
    const attemptedRefreshFor = useRef(null);
    const lastContractRefreshSignature = useRef('');
    const invalidUnderlyingAssetRef = useRef(null);

    const clearStaleOptionSession = () => {
        resetOptionContractReduxState(dispatch);
    };

    const isTickerForCurrentUnderlying = (currentUnderlying, tickerValue) => {
        if (isEmpty(currentUnderlying) || isEmpty(tickerValue)) return true;
        const tickerUnderlying = tickerValue?.split('-')?.[0];
        return !isEmpty(tickerUnderlying) && tickerUnderlying.toUpperCase() === currentUnderlying.toUpperCase();
    };

    const markInvalidUnderlyingAsset = (symbol) => {
        if (!symbol || invalidUnderlyingAssetRef.current === symbol) return;
        invalidUnderlyingAssetRef.current = symbol;
        setisPageLoader(false);
        setComingSoon(true);
        clearStaleOptionSession();
    };

    const fetchContractDetails = async (underlyingAsset, expiryDateStr) => {
        const { data } = await getOptionDetails({
            underlyingAsset: underlyingAsset,
            expiryDateStr: expiryDateStr
        }, dispatch);
        return data;
    }

    const setInitialDetails = async () => {
        const validUnderlying = getFirstAvailableUnderlyingAsset(underlyingDetails) || underlyingDetails?.[0];
        const symbol = validUnderlying?.symbol;
        const options = validUnderlying?.options || [];

        if (!symbol || options.length === 0) {
            setisPageLoader(false);
            setComingSoon(true);
            clearStaleOptionSession();
            return false;
        }

        const expiryDateStr = options?.[0]?._id;
        const contractData = await fetchContractDetails(symbol, expiryDateStr)
        if (isEmpty(contractData)) {
            setisPageLoader(false)
            setComingSoon(true)
            clearStaleOptionSession();
            return false;
        }
        const tickerIndex = findBetweenArray(contractData?.[0]?.strikePrice, validUnderlying?.marketPrice)
        const safeIndex = Number.isInteger(tickerIndex) ? tickerIndex : 0
        const pair = contractData?.[0]?.callpair?.[safeIndex]?.tickerRoot || contractData?.[0]?.callpair?.[0]?.tickerRoot
        localStorage.setItem("optionspair", pair)
        if (isEmpty(pair)) {
            navigate(`/options/${symbol}`, { replace: true });
            setisPageLoader(false)
            setComingSoon(true)
            clearStaleOptionSession();
            return false;
        }
        navigate(`/options/${symbol}/${pair}`, { replace: true });
        setisPageLoader(false)
        setComingSoon(false)
        dispatch(Options({ optionsData: options }));
        dispatch(UnderlyingData({
            underlyingData: buildUnderlyingDataSnapshot(validUnderlying)
        }))
        return true;
    }

    const settikerRootPairDetais = async () => {
        if (isEmpty(tikerRoot)) return;

        if (!isTickerForCurrentUnderlying(underlyingSymbol, tikerRoot)) {
            setComingSoon(false);
            return;
        }

        if (shouldKeepContentVisibleWhileContractLoads(tikerRoot, optionContractData)) {
            setisPageLoader(false)
            setComingSoon(false)
            return;
        }

        // ─── Guard against a switch-tab race ────────────────────────────
        // Switching either the underlying asset (BTC -> BNB) or the expiry
        // date tab (31Aug26 -> 19Aug26) follows the same pattern: the new
        // contract data is fetched and dispatched into `optionContractData`
        // *before* the URL/`tikerRoot` is updated to point at that new
        // pair. This effect also re-runs on every `optionContractData`
        // change, so it can fire in that in-between moment: new contract
        // data + still-old `tikerRoot` (old asset, or same asset but old
        // expiry). Searching the new contracts for the old ticker finds
        // nothing, which used to be read as "this pair doesn't exist" and
        // briefly flashed the Coming Soon page. Compare both the asset and
        // expiry segments of a sample ticker from the fetched data against
        // the current route — if either doesn't match yet, the data is
        // stale relative to the route, so skip this pass instead of acting
        // on it; the effect will run again correctly once the route
        // catches up.
        const contractSampleTicker = optionContractData?.callpair?.[0]?.tickerRoot || optionContractData?.putpair?.[0]?.tickerRoot;
        if (contractSampleTicker) {
            const sampleAssetExpiryKey = contractSampleTicker.split('-').slice(0, 2).join('-').toUpperCase();
            const currentAssetExpiryKey = tikerRoot.split('-').slice(0, 2).join('-').toUpperCase();
            if (sampleAssetExpiryKey !== currentAssetExpiryKey) {
                return;
            }
        }

        const [, , , type] = tikerRoot.split('-')
        // console.log(optionContractData, "settikerRootPairDetais")
        let pairDetail = type == "C" ? optionContractData?.callpair?.find((el) => el?.tickerRoot === tikerRoot) : optionContractData?.putpair?.find((el) => el?.tickerRoot === tikerRoot)
        // If the selected pair was deactivated or is not present in the refreshed
        // contract set, do not leave the previous pair in Redux. The existing
        // Coming Soon page will take over until an active contract is available.
        if (isEmpty(pairDetail)) {
            dispatch(OptionTradePair({ tradePair: {} }));
            dispatch(OptionTicker({ tikerData: {} }));
            setComingSoon(true);
            return false;
        }
        dispatch(OptionTradePair({ tradePair: pairDetail }));
        dispatch(OptionTicker({ tikerData: pairDetail }));
        setComingSoon(false);
        return true;
    }


    useEffect(() => {
        if (!hasUnderlyingList) {
            if (isPageLoader !== true) setisPageLoader(true);
            if (comingSoon !== false) setComingSoon(false);
            return;
        }

        if (shouldSkipInitialOptionHydration(underlyingDetails)) {
            if (isPageLoader !== false) setisPageLoader(false);
            if (comingSoon !== true) setComingSoon(true);
            return;
        }

        if (isEmpty(underlyingSymbol) && underlyingDetails) {
            invalidUnderlyingAssetRef.current = null;
            setInitialDetails();
        }

        if (!isEmpty(underlyingSymbol) && underlyingDetails) {
            const underlyingData = underlyingDetails?.find((val) => (val?.symbol == underlyingSymbol))
            if (!underlyingData) {
                markInvalidUnderlyingAsset(underlyingSymbol);
                return;
            }

            if ((underlyingData?.options || []).length === 0) {
                invalidUnderlyingAssetRef.current = underlyingSymbol;
                if (isPageLoader !== false) setisPageLoader(false)
                if (comingSoon !== true) setComingSoon(true)
                lastContractRefreshSignature.current = ''
                if (!isEmpty(optionContractData)) {
                    clearStaleOptionSession();
                }
                dispatch(UnderlyingData({ underlyingData: buildUnderlyingDataSnapshot(underlyingData) }))
                return;
            }

            invalidUnderlyingAssetRef.current = null;
            dispatch(UnderlyingData({
                underlyingData: buildUnderlyingDataSnapshot(underlyingData)
            }))
        }

        if (!isEmpty(underlyingSymbol) && underlyingDetails) {
            const underlyingData = underlyingDetails?.find((val) => (val?.symbol == underlyingSymbol))
            const freshOptions = underlyingData?.options || []
            const currentExpiryDateStr = !isEmpty(tikerRoot) ? tikerRoot.split('-')?.[1] : undefined
            const currentExpiry = currentExpiryDateStr
                ? freshOptions.find((option) => option?._id === currentExpiryDateStr)
                : null

            if (!isEmpty(tikerRoot) && !isTickerForCurrentUnderlying(underlyingSymbol, tikerRoot)) {
                if (isPageLoader !== false) setisPageLoader(false)
                if (comingSoon !== false) setComingSoon(false)
                return;
            }

            if (freshOptions.length === 0 || (!isEmpty(tikerRoot) && !currentExpiry)) {
                invalidUnderlyingAssetRef.current = underlyingSymbol;
                if (isPageLoader !== false) setisPageLoader(false)
                if (comingSoon !== true) setComingSoon(true)
                lastContractRefreshSignature.current = ''
                if (currentOptionSignatureChanged(optionsData, freshOptions)) {
                    dispatch(Options({ optionsData: freshOptions }))
                }
                if (!isEmpty(optionContractData)) {
                    dispatch(OptionContractDetail({ optionContractData: [] }))
                }
                if (!isEmpty(optionTradePair)) {
                    dispatch(OptionTradePair({ tradePair: {} }))
                }
                if (!isEmpty(optionTicker)) {
                    dispatch(OptionTicker({ tikerData: {} }))
                }
                dispatch(UnderlyingData({ underlyingData: buildUnderlyingDataSnapshot(underlyingData) }))
                return;
            }

            if (isPageLoader !== false) setisPageLoader(false)
            if (comingSoon !== false) setComingSoon(false)

            const currentOptionSignature = (optionsData || [])
                .map((option) => `${option?._id}:${option?.contractCount ?? ''}:${option?.status ?? ''}`)
                .join('|')
            const freshOptionSignature = freshOptions
                .map((option) => `${option?._id}:${option?.contractCount ?? ''}:${option?.status ?? ''}`)
                .join('|')

            const contractSetChanged = currentOptionSignature !== freshOptionSignature

            if (contractSetChanged) {
                dispatch(Options({ optionsData: freshOptions }))
            }

            if (!isEmpty(tikerRoot) && currentExpiry && contractSetChanged &&
                lastContractRefreshSignature.current !== freshOptionSignature) {
                lastContractRefreshSignature.current = freshOptionSignature
                fetchContractDetails(underlyingSymbol, currentExpiryDateStr)
            } else if (!isEmpty(tikerRoot) && currentExpiry && isEmpty(optionContractData) &&
                lastContractRefreshSignature.current !== freshOptionSignature) {
                lastContractRefreshSignature.current = freshOptionSignature
                fetchContractDetails(underlyingSymbol, currentExpiryDateStr)
            }
        }
    }, [underlyingSymbol, underlyingDetails])

    const currentOptionSignatureChanged = (currentOptions, nextOptions) => {
        const currentOptionSignature = (currentOptions || [])
            .map((option) => `${option?._id}:${option?.contractCount ?? ''}:${option?.status ?? ''}`)
            .join('|')
        const nextOptionSignature = (nextOptions || [])
            .map((option) => `${option?._id}:${option?.contractCount ?? ''}:${option?.status ?? ''}`)
            .join('|')

        return currentOptionSignature !== nextOptionSignature
    }

    useEffect(() => {
        if (!hasUnderlyingList) return;
        settikerRootPairDetais();
    }, [tikerRoot, optionContractData, hasUnderlyingList])

    // ─── Symbol given, but no valid ticker yet ──────────────────────────────
    // setInitialDetails() (above) only runs for a totally blank `/options`
    // landing. This covers the other case: the URL already names a real
    // underlying (e.g. /options/BNB) but has no ticker, or had the literal
    // "undefined" that's now sanitized away above — most commonly right
    // after an admin adds a brand-new underlying/contract. Picks the same
    // default (nearest-expiry, ATM strike) and corrects the URL in place.
    useEffect(() => {
        if (isEmpty(underlyingSymbol) || !isEmpty(tikerRoot) || isEmpty(underlyingDetails)) return;
        const underlyingData = underlyingDetails?.find((val) => (val?.symbol == underlyingSymbol));
        if (!underlyingData) return;
        const options = underlyingData?.options;
        const expiryDateStr = options?.[0]?._id;
        if (isEmpty(expiryDateStr)) return;
        (async () => {
            const contractData = await fetchContractDetails(underlyingSymbol, expiryDateStr);
            const tickerIndex = findBetweenArray(contractData?.[0]?.strikePrice, underlyingData?.marketPrice);
            const safeIndex = Number.isInteger(tickerIndex) ? tickerIndex : 0;
            const pair = contractData?.[0]?.callpair?.[safeIndex]?.tickerRoot || contractData?.[0]?.callpair?.[0]?.tickerRoot;
            if (!isEmpty(pair)) {
                navigate(`/options/${underlyingSymbol}/${pair}`, { replace: true });
            }
        })();
    }, [underlyingSymbol, tikerRoot, underlyingDetails])

    // ─── Fallback: symbol not found in the already-loaded underlying list ──
    // Normally HelperRoutes keeps `underlyingDetails` live via the
    // OPTION_UNDERLYING_LIST_UPDATED socket event. This is a safety net for
    // the gap where a user deep-links straight into a brand-new pair before
    // that event/socket connection has caught up — instead of silently
    // rendering undefined/NaN, refetch the list once for this symbol.
    useEffect(() => {
        if (isEmpty(underlyingSymbol) || isEmpty(underlyingDetails)) return;
        const underlyingData = underlyingDetails?.find((val) => (val?.symbol == underlyingSymbol))
        if (!underlyingData && attemptedRefreshFor.current !== underlyingSymbol) {
            attemptedRefreshFor.current = underlyingSymbol;
            (async () => {
                const resp = await getAllUnderlyingAssetDetails();
                if (resp?.data?.length > 0) {
                    dispatch(UnderlyingDetails({ underlyingDetails: resp.data }));
                }
            })();
        }
    }, [underlyingSymbol, underlyingDetails])

    useEffect(() => {

        if (!isEmpty(userdetails) && !isEmpty(optionTradePair)) {
            let leverage = userdetails?.pairSettings?.find((val) => (val?.pairId?.toString() == optionTradePair?._id?.toString()))?.leverage
            // console.log(leverage, "SetNewLeverage")
            // Whole numbers only — a leverage value saved before this
            // restriction existed could still be a decimal (e.g. 2.5x);
            // round it here so every consumer of this Redux value gets a
            // whole number.
            dispatch(UserLeverage({ leverage: isNaN(leverage) ? 1 : Math.round(leverage) }));
        }
    }, [userdetails, optionTradePair])


    useEffect(() => {
        if (tikerRoot && feeSettingsList) {
            let makerFee = feeSettingsList?.find((val) => {
                return (val.pairName == tikerRoot &&
                    val.tradeMode == 'option' &&
                    val.status == 'active' &&
                    val.feeType == 'maker'
                )
            })
            let takerFee = feeSettingsList?.find((val) => {
                return (val.pairName == tikerRoot &&
                    val.tradeMode == 'option' &&
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
                        val.tradeMode == 'option' &&
                        val.status == 'active' &&
                        val.feeType == 'maker'
                    )
                })
            }
            if (isEmpty(takerFee)) {
                takerFee = feeSettingsList?.find((val) => {
                    return (val.pairName == 'all' &&
                        val.tradeMode == 'option' &&
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
            dispatch(MakerFee({ makerFee: makerFee?.notionalPercentage }));
            dispatch(TakerFee({ takerFee: takerFee?.notionalPercentage }));
            dispatch(PremiumCap({ takerFee: takerFee?.premiumPercentage }));

        }
    }, [tikerRoot, feeSettingsList, userdetails])

    return (
        <>
            {/* When showOptionsTradingComingSoon is on, Coming Soon must show
                immediately — same as Futures, which reaches Coming Soon
                quickly because it has no pair data to wait on. Options, by
                contrast, only flips isPageLoader to false once the
                underlying/contract data-loading effects above resolve, which
                depends on data that may never arrive while this flag is on
                (e.g. no socket update in this environment), so isPageLoader
                was getting stuck true and PageLoader spun forever instead of
                handing off to the ComingSoon below it. Bypassing the loader
                only when the flag itself is forcing Coming Soon fixes that
                without touching the real pair-availability loader/comingSoon
                state used when the flag is off. */}
            {(isPageLoader && !featureFlags.showOptionsTradingComingSoon) ?
                <PageLoader /> :
                <>
                    < StrategyBuilderProvider >

                        {
                            pageHide ?
                                <div className={styles.pageError
                                } >
                                </div > :
                                <>
                                    {/* Temporary: Options Trading is only partially built —
                                        forced into Coming Soon for client review via
                                        featureFlags.showOptionsTradingComingSoon, OR'd with
                                        the existing pair-availability check. Flip that flag
                                        off once the feature is ready; the original pair-based
                                        Coming Soon behavior underneath is untouched. */}
                                    <ComingSoon active={featureFlags.showOptionsTradingComingSoon || comingSoon} title="Coming Soon...">
                                        <div>
                                            <Header />
                                            <section className="custom-section">
                                                <div className={styles.layout}>
                                                    <div className={styles.container}>

                                                        {width >= 1200 ?

                                                            /* desktop view - start */

                                                            <div className={styles.desktop}>
                                                                <div className={`${styles.gridContainer} ${isStrategyBuilderEnable ? styles.strategyGrid : ""}`}>
                                                                    <div className={styles.chartAndTable}>
                                                                        <TableAndChart
                                                                            isStrategyBuilderEnable={isStrategyBuilderEnable}
                                                                            handleStrategyBuilderChange={handleStrategyBuilderChange}
                                                                            selectedView={selectedView}
                                                                            setSelectedView={setSelectedView} />
                                                                    </div>
                                                                    {isStrategyBuilderEnable ?
                                                                        <div className={styles.strategyBuilder}>
                                                                            <StrategyBuilder />
                                                                        </div>
                                                                        :
                                                                        <>
                                                                            <div className={styles.marketSummary}>
                                                                                <MarketSummary />
                                                                            </div>

                                                                            <div className={styles.orderBook}>
                                                                                <OrderBook />
                                                                            </div>
                                                                            <div className={styles.recentTrades}>
                                                                                <RecentTrades />
                                                                            </div>

                                                                            <div className={styles.tradeActionPanel}>
                                                                                <TradeActionPanel />
                                                                            </div>
                                                                        </>
                                                                    }



                                                                    <div className={styles.tradeTabs}>
                                                                        <TradeTabs />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            /* desktop view - end */

                                                            :

                                                            width >= 992 ?

                                                                <div className={styles.desktop}>
                                                                    <div className={`${styles.gridContainer} ${isStrategyBuilderEnable ? styles.strategyGrid : ""}`}>
                                                                        <div className={styles.chartAndTable}>
                                                                            <TableAndChart
                                                                                isStrategyBuilderEnable={isStrategyBuilderEnable}
                                                                                handleStrategyBuilderChange={handleStrategyBuilderChange}
                                                                                selectedView={selectedView}
                                                                                setSelectedView={setSelectedView} />
                                                                        </div>
                                                                        {isStrategyBuilderEnable ?
                                                                            <div className={styles.strategyBuilder}>
                                                                                <StrategyBuilder />
                                                                            </div>
                                                                            :
                                                                            <>
                                                                                <div className={styles.marketSummary}>
                                                                                    <MarketSummary />
                                                                                </div>

                                                                                <div className={styles.orderBook}>
                                                                                    <OrderBook />
                                                                                </div>
                                                                                <div className={styles.recentTrades}>
                                                                                    <RecentTrades />
                                                                                </div>

                                                                                <div className={styles.tradeActionPanel}>
                                                                                    <TradeActionPanel />
                                                                                </div>
                                                                            </>
                                                                        }



                                                                        <div className={styles.tradeTabs}>
                                                                            <TradeTabs />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                :

                                                                /** mobile view - start */

                                                                <div className={styles.mobile}>
                                                                    <div className={`${styles.gridContainer}`}>
                                                                        <div className={styles.marketTicker}>
                                                                            <MarketSummary />
                                                                        </div>

                                                                        <div className={styles.gridTabsContainer}>
                                                                            <div className={styles.gridTabsHeader}>
                                                                                {/* <button
                                                    className={`${selectedView == 'table' ? styles.active : ""}`}
                                                    onClick={() => setSelectedView('table')}>
                                                    Table
                                                </button>
                                                <button
                                                    className={`${selectedView == 'graph' ? styles.active : ""}`}
                                                    onClick={() => setSelectedView('graph')}>
                                                    Chart
                                                </button> */}

                                                                                <div className={`${styles.reactSelectWrapper} ${selectedView == 'chart' || selectedView == 'table' ? styles.active : ""}`}>
                                                                                    <Select
                                                                                        // menuIsOpen
                                                                                        isSearchable={false}
                                                                                        placeholder="Select"
                                                                                        classNamePrefix="react-select__fifth"
                                                                                        options={tradeViewOptions}
                                                                                        onChange={(e) => { setSelectedView(e.key) }}
                                                                                        value={
                                                                                            tradeViewOptions.find(
                                                                                                (val) => val.key == selectedView
                                                                                            )

                                                                                        }
                                                                                    />
                                                                                </div>
                                                                                {isStrategyBuilderEnable && <button
                                                                                    className={`${selectedView == 'strategyBuilder' ? styles.active : ""}`}
                                                                                    onClick={() => setSelectedView('strategyBuilder')}>
                                                                                    Stra. Builder
                                                                                </button>}


                                                                                <button
                                                                                    aria-label='orderBook'
                                                                                    className={`${selectedView == 'orderBook' ? styles.active : ""}`}
                                                                                    onClick={() => setSelectedView('orderBook')}>
                                                                                    Ord. Book
                                                                                </button>
                                                                                <button
                                                                                    aria-label='trades'
                                                                                    className={`${selectedView == 'trade' ? styles.active : ""}`}
                                                                                    onClick={() => setSelectedView('trade')}>
                                                                                    Trades
                                                                                </button>
                                                                                <button
                                                                                    aria-label='trade'
                                                                                    className={`${selectedView == 'tradeActionPanel' ? styles.active : ""}`}
                                                                                    onClick={() => setSelectedView('tradeActionPanel')}>
                                                                                    Trade Act
                                                                                </button>
                                                                            </div>

                                                                            <div className={styles.gridTabsBody}>
                                                                                {selectedView == 'chart' || selectedView == 'table' ?
                                                                                    <TableAndChart
                                                                                        isStrategyBuilderEnable={isStrategyBuilderEnable}
                                                                                        handleStrategyBuilderChange={handleStrategyBuilderChange}
                                                                                        selectedView={selectedView}
                                                                                        setSelectedView={setSelectedView} /> :
                                                                                    selectedView == 'strategyBuilder' ? <StrategyBuilder /> :
                                                                                        selectedView == 'orderBook' ? <OrderBook /> :
                                                                                            selectedView == 'trade' ? <RecentTrades /> :
                                                                                                selectedView == 'tradeActionPanel' ? <TradeActionPanel /> : <></>
                                                                                }
                                                                            </div>

                                                                            {/* <div className={styles.mobBuySellContainer}>
                                                <button
                                                    className={`${styles.buyButton}`}
                                                    onClick={() => handleShowBuy()}>
                                                    Buy
                                                </button>
                                                <button
                                                    className={`${styles.sellButton}`}
                                                    onClick={() => handleShowSell()}>
                                                    Sell
                                                </button>
                                            </div> */}

                                                                        </div>
                                                                        <div className={styles.tradeTabs}>
                                                                            <TradeTabs />
                                                                        </div>
                                                                    </div>

                                                                    {/* <Offcanvas
                                        show={showOrderFormModal}
                                        onHide={handleCloseOrderFormModal}
                                        placement="bottom"
                                        className={styles.orderFormModal}
                                    >
                                        <Offcanvas.Body className={styles.orderFormModalBody}>
                                            <TradeActionPanel
                                                handleClose={handleCloseOrderFormModal}
                                                selectedOrderForm={selectedOrderForm}
                                            />
                                        </Offcanvas.Body>
                                    </Offcanvas> */}
                                                                </div>

                                                            // <></>

                                                            /** mobile view - end */

                                                        }



                                                    </div>
                                                </div>
                                            </section>
                                        </div>
                                    </ComingSoon>
                                </>
                        }
                    </ StrategyBuilderProvider>
                </>
            }
        </>
    )
}

export default OptionsTrading