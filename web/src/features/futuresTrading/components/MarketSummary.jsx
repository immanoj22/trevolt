/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from 'react'
import { MdArrowBackIos, MdArrowForwardIos, MdOutlineKeyboardArrowUp, MdArrowDropUp, MdArrowDropDown } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { IoIosStar } from "react-icons/io";
import { useSelector } from "react-redux";


/**LOCAL FILES IMPORT */

import styles from "../styles/marketSummary.module.css"
import CoinPairs from './CoinPairs';
import useBreakpoint from '../../../hooks/useBreakpoint';

/**ACTIONS */
import { futureAddFavouritePair } from '../../../actions/futureActions';
import { showToastMessage } from '../../../lib/toast';
import { formatDisplayPair } from '../../../lib/pairDisplay';


/** CODE START */

const MarketSummary = (props) => {

    const { futureTicker } = useSelector((state) => state.future);
    const { userdetails } = useSelector((state) => state.user);
    const width = useBreakpoint()

    // Binance-style tick-to-tick price color: green when the latest price is
    // above the previous one, red when below. An unchanged price keeps
    // whichever color was last shown (same as Binance), rather than
    // resetting — only a real up/down move flips it.
    const prevMarketPriceRef = useRef(null);
    const [priceDirection, setPriceDirection] = useState('low');

    useEffect(() => {
        const current = Number(futureTicker?.marketPrice);
        if (isNaN(current)) return;
        if (prevMarketPriceRef.current !== null) {
            if (current > prevMarketPriceRef.current) setPriceDirection('high');
            else if (current < prevMarketPriceRef.current) setPriceDirection('low');
        }
        prevMarketPriceRef.current = current;
    }, [futureTicker?.marketPrice]);

    // Reset the comparison baseline on pair switch, so the first tick of a
    // newly selected pair doesn't get colored against the previous pair's price.
    useEffect(() => {
        prevMarketPriceRef.current = null;
    }, [futureTicker?.tickerRoot]);


    const tickerLeftRef = useRef(null)
    const tickerContainerRef = useRef(null)
    const scrollRef = useRef(null)
    const tickerRightWrapperDiv = useRef(null)
    const coinPairsContainerRef = useRef(null)
    const tickerActionContainerRef = useRef(null)
    const coinPairsTriggerRef = useRef(null);



    const [tickerContainerWidth, setTickerContainerWidth] = useState(0)
    const [tickerLeftWidth, setTickerLeftWidth] = useState(0)
    const [tickerValueContainerWidth, setTickerValueContainerWidth] = useState(0)
    const [actualScrollContainerWidth, setActutalScrollContainerWidth] = useState(0)
    const [tickerActionContainerWidth, setTickerActionContainerWidth] = useState(0)
    const [enableScrollControl, setEnableScrollControl] = useState(false);
    const [showCoinPairs, setShowCoinPairs] = useState(false)

    const [isEnableFavorite, setIsEnableFavorite] = useState(false)




    const handleCoinPairs = () => {
        // e.stopPropagation();
        setShowCoinPairs(!showCoinPairs)
    }

    const categoryScroll = (scrollOffset) => {
        scrollRef.current.scrollLeft += scrollOffset;
    }

    const addFavourite = async (data) => {
        try {
            const { status, message } = await futureAddFavouritePair({ pairId: data._id, pairName: data.tickerRoot }, userdetails.secretKey);
            showToastMessage(message, status ? 'success' : 'error')
        } catch (e) {
            console.log("addFavourite_err", e);
        }
    }
    useEffect(() => {
        const observer = new ResizeObserver(() => {
            if (tickerContainerRef.current?.offsetWidth) {
                setTickerContainerWidth(tickerContainerRef.current.offsetWidth);
            }
            if (tickerLeftRef.current?.offsetWidth) {
                setTickerLeftWidth(tickerLeftRef.current.offsetWidth);
            }
            if (tickerActionContainerRef.current?.offsetWidth) {
                setTickerActionContainerWidth(tickerActionContainerRef.current.offsetWidth);
            }

        });

        if (tickerContainerRef.current) observer.observe(tickerContainerRef.current);
        if (tickerLeftRef.current) observer.observe(tickerLeftRef.current);
        if (tickerActionContainerRef.current) observer.observe(tickerActionContainerRef.current);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!scrollRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            if (scrollRef.current.scrollWidth) {
                setActutalScrollContainerWidth(scrollRef.current.scrollWidth);
            }
        });
        resizeObserver.observe(scrollRef.current);
        return function cleanup() {
            resizeObserver.disconnect();
        };
    }, [scrollRef.current]);

    // console.log('scrollrefwidth', actualScrollContainerWidth)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                coinPairsContainerRef.current &&
                !coinPairsContainerRef.current.contains(event.target) &&
                !coinPairsTriggerRef.current.contains(event.target)
            ) {
                setShowCoinPairs(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    useEffect(() => {
        if (
            typeof tickerContainerWidth === 'number' &&
            typeof tickerLeftWidth === 'number' &&
            typeof tickerActionContainerWidth === 'number' &&
            typeof actualScrollContainerWidth === 'number'
        ) {

            const availableWidth = tickerContainerWidth - 32 - tickerLeftWidth - 25 - tickerActionContainerWidth;

            /** calculate  availableWidth ==> tickerContainerWidth , padding left and right of tickerListContainer class -> 16 + 16 = 32px , tickerLeftWidth, gap of tickerListContainer class -> 25px , tickerActionContainerWidth */

            const shouldEnable = availableWidth < actualScrollContainerWidth;

            setTickerValueContainerWidth(availableWidth)

            setEnableScrollControl(shouldEnable);
        }

    }, [tickerContainerWidth, tickerLeftWidth, tickerActionContainerWidth, actualScrollContainerWidth]);



    // console.log('allwidthcheck', futureTicker, tickerContainerWidth, tickerLeftWidth, tickerActionContainerWidth)

    return (
        <div
            className={styles.tickerListContainer}
            ref={tickerContainerRef}>
            <div
                className={`${styles.coinPairsContainer} ${showCoinPairs ? styles.active : ""}`}
                ref={coinPairsContainerRef}>
                <CoinPairs
                    handleCoinPairs={handleCoinPairs}
                />
            </div>

            <div className={styles.tickerLeft}
                ref={tickerLeftRef} >

                <span
                    data-click-effect="none"
                    className={`${styles.markFavorite} ${userdetails && userdetails?.futureFav?.some((el) => el.pairName === futureTicker.tickerRoot) ? styles.active : ""}`}
                    onClick={() => { addFavourite(futureTicker) }}
                >
                    <IoIosStar />
                </span>
                <h1 ref={coinPairsTriggerRef}
                    className={`${styles.selectedPair}`} onClick={() => handleCoinPairs()}>
                    {formatDisplayPair(futureTicker?.tickerRoot)}
                    <span className={`${styles.selectedPairButton} ${showCoinPairs ? styles.active : ""}`}>
                        {showCoinPairs ? <MdOutlineKeyboardArrowUp /> : <MdOutlineKeyboardArrowDown />}
                    </span>
                </h1>
                <div className={styles.nowPrice}>
                    <h1 className={`${styles.showPrice} ${styles[priceDirection]}`}>
                        {futureTicker?.marketPrice}
                        {/* Up/down indicator next to the last traded price — same
                            priceDirection ('high'/'low') already computed above for
                            the price's green/red color, just also rendered as an
                            arrow icon here so the movement is visible at a glance,
                            not just via color. Placed as a suffix, after the price
                            text (not before it). Sized/aligned via CSS so it scales
                            with .showPrice on every breakpoint (see
                            marketSummary.module.css), including the existing
                            mobile/tablet media queries — no layout structure changed. */}
                        {priceDirection === 'high'
                            ? <MdArrowDropUp className={styles.priceDirectionIcon} aria-hidden="true" />
                            : <MdArrowDropDown className={styles.priceDirectionIcon} aria-hidden="true" />}
                    </h1>
                    <p className={styles.subPrice}>
                        {futureTicker?.marketPrice}
                    </p>
                </div>
            </div>
            <div className={styles.tickerRight}>
                <div
                    className={styles.tickerValueContainer}
                    style={{ width: `${tickerValueContainerWidth}px` }}>
                    {enableScrollControl ?
                        <button
                            aria-label='arrowBack'
                            className={`${styles.headerScrollButton} ${styles.left}`}
                            onClick={() => categoryScroll(-50)}>
                            <MdArrowBackIos />
                        </button>
                        :
                        <></>
                    }

                    <div
                        className={`${styles.tickerValueWrapper}`}
                        style={{ width: `fit-content` }}
                        ref={scrollRef}>
                        <div className={styles.tickerList}>
                            <p className={styles.tickerItemLabel}>24h Change</p>

                            <p className={`${styles.tickerPriceText} ${futureTicker?.changePrice > 0 ? styles.high : styles.low}`}>
                                {futureTicker?.changePrice} ( {futureTicker?.change}%)
                            </p>
                        </div>
                        <div className={styles.tickerList}>
                            <p className={styles.tickerItemLabel}>24h High</p>
                            <p className={`${styles.tickerPriceText} ${futureTicker?.percent24High > 0 ? styles.high : styles.low}`}>
                                {futureTicker?.high} ( {futureTicker?.percent24High}%)
                            </p>
                        </div>
                        <div className={styles.tickerList}>
                            <p className={styles.tickerItemLabel}>24h Low</p>
                            <p className={`${styles.tickerPriceText} ${futureTicker?.percent24Low > 0 ? styles.high : styles.low}`}>
                                {futureTicker?.low} ( {futureTicker?.percent24Low}%)
                            </p>
                        </div>
                        <div className={styles.tickerList}>
                            <p className={styles.tickerItemLabel}>24h Volume  ({futureTicker?.baseCurrency})</p>
                            <p className={styles.tickerPriceText}>
                                {futureTicker?.volume}
                            </p>
                        </div>
                        <div className={styles.tickerList}>
                            <p className={styles.tickerItemLabel}>24h Volume ({formatDisplayPair(futureTicker?.quoteCurrency)})</p>
                            <p className={styles.tickerPriceText}>
                                {futureTicker?.deal}
                            </p>
                        </div>

                    </div>
                    {enableScrollControl ?
                        <button
                            aria-label='arrowForward'
                            className={`${styles.headerScrollButton} ${styles.right}`}
                            onClick={() => categoryScroll(50)}>
                            <MdArrowForwardIos />
                        </button> : <></>}
                </div>

                {/* <div
                    className={styles.tickerActionContainer}
                    ref={tickerActionContainerRef}>
                    <button className={styles.settings}>
                        <IoSettingsOutline />
                    </button>
                </div> */}
            </div>
        </div >
    )
}
export default MarketSummary