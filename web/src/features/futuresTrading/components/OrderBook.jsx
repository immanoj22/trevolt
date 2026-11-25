/** PACKAGE IMPORT */

import React, { useEffect, useState, useContext, useRef } from "react";
import { LuLayoutList, LuLayoutPanelLeft, LuLayoutTemplate } from "react-icons/lu";
import { NavLink, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import isEmpty from "is-empty";
import { IoIosCloseCircleOutline } from "react-icons/io";

/** LOCAL FILES IMPORT */

import styles from "../styles/orderBook.module.css"
import NoData from "../../../components/NoData/NoData";
import { formatDisplayPair } from "../../../lib/pairDisplay";
/** Context */
import SocketContext from "../../../context/socketContext";

/** Actions */
import { futureOrderBook, futureSingleOrderBook } from "../../../actions/futureActions";
import { formatValue } from "../../../lib/Common";
import Loader from "../../../components/Loader/Loader";
import Button from "../../../components/Button/Button";

/** CODE START */
var globalSellCount = 0;
var globalBuyCount = 0;
const OrderBook = ({ onClose }) => {

    const listRef = useRef(null);
    const buyListRef = useRef(null);
    const observedDiv = useRef(null);
    const { tikerRoot } = useParams()
    const socketContext = useContext(SocketContext);


    // const { userdetails } = useSelector((state) => state.user);
    const { futurePairData, futureTicker, futureTradePair } = useSelector((state) => state.future);
    // const { assetdetail } = useSelector((state) => state.wallet);

    const [layout, setLayout] = useState('all')
    const [sellhover, setSellhover] = useState()
    const [buyhover, setBuyhover] = useState()
    const [averagevalue, setAveragevalue] = useState([])
    const [orderBook, setOrderBook] = useState({
        sellOrder: [],
        buyOrder: []
    });

    const [orderBookHeight, setOrderBookHeight] = useState()

    const [totalBuyCount, setTotalBuyCount] = useState(0);
    const [totalSellCount, setTotalSellCount] = useState(0);
    const [sellHasMore, setSellHasMore] = useState(true);
    const [buyHasMore, setBuyHasMore] = useState(true);
    const scrollableRef = useRef(null);
    const [buyPage, setBuyPage] = useState(1);
    const [sellPage, setSellPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [buyLoading, setBuyLoading] = useState(true);
    const [sellLoading, setSellLoading] = useState(true);
    const [buyLoadBtn, setBuyLoadBtn] = useState(false);
    const [sellLoadBtn, setSellLoadBtn] = useState(false);
    // const [buyLimit, setBuyLimit] = useState(40)
    // const [sellLimit, setSellLimit] = useState(40)
    const [limit, setLimit] = useState(40)

    // console.log('sellLoadBtn', buyLoadBtn, sellLoadBtn)

    const FutureId = useRef('');

    const fetchOrderBook = async (pageData) => {
        try {
            setBuyLoading(pageData?.buyLoading);
            setSellLoading(pageData?.sellLoading);
            // console.log("pageData__det", pageData, !isEmpty(FutureId.current))
            if (!isEmpty(FutureId.current)) {
                let { result, status } = await futureOrderBook(FutureId.current, pageData);
                if (status) {
                    // console.log(result, pageData, '11 fetchOrderBook_Result_Data')
                    let buyTotal = 0
                    let sellTotal = 0
                    let buyOrder = result.buyOrder.filter((val) => {
                        buyTotal = parseFloat(val.total) + parseFloat(buyTotal);
                        val.totalAmount = buyTotal;
                        return val
                    })
                    let sellOrder = result.sellOrder.filter((val) => {
                        sellTotal = parseFloat(val.total) + parseFloat(sellTotal);
                        val.totalAmount = sellTotal;
                        return val
                    });

                    setOrderBook({
                        'buyOrder': [...buyOrder],
                        'sellOrder': [...sellOrder]
                    })

                    globalBuyCount = result?.buyOrderCount;
                    globalSellCount = result?.sellOrderCount;
                    setTotalBuyCount(result?.buyOrderCount);
                    setTotalSellCount(result?.sellOrderCount);
                    setTimeout(() => {
                        setBuyLoading(false);
                        setSellLoading(false);
                        if ((pageData?.buyPage * pageData?.limit) < globalBuyCount && parseInt(globalBuyCount) >= 8 && parseInt(globalBuyCount) != 0) {
                            setBuyLoadBtn(true)
                        } else {
                            setBuyLoadBtn(false)
                        }
                        if ((pageData?.sellPage * pageData?.limit) < globalSellCount && parseInt(globalSellCount) >= 8 && parseInt(globalSellCount) != 0) {
                            setSellLoadBtn(true);
                        } else {
                            setSellLoadBtn(false);
                        }
                    }, 1000)

                } else {
                    globalSellCount = 0;
                    globalBuyCount = 0;
                    setOrderBook({
                        sellOrder: [],
                        buyOrder: []
                    });
                    setBuyLoading(false);
                    setSellLoading(false);
                    // console.log("22 buyloadbtn tru")
                    setBuyLoadBtn(true);
                    setSellLoadBtn(true);
                }
            }
        } catch (err) {
            setBuyLoading(false);
            setSellLoading(false);
            setBuyLoadBtn(true);
            setSellLoadBtn(true);
        }
    };

    const fetchSingelOrderBook = async (reqData, type) => {
        try {
            let orderBookData = orderBook[`${type}Order`];
            if (!isEmpty(FutureId.current)) {
                const { result, status } = await futureSingleOrderBook(FutureId.current, type, reqData);
                if (status) {
                    let totalVolume = 0
                    let order = result.order.filter((val) => {
                        totalVolume = parseFloat(val.total) + parseFloat(totalVolume);
                        val.totalAmount = totalVolume;
                        return val
                    })

                    setOrderBook((prev) => {
                        // page 1 = a fresh view (layout switch, initial load) —
                        // replace outright. page > 1 = genuine "load more"
                        // pagination — append onto what's already there, same
                        // as before. Deciding by the explicit page number
                        // (rather than relying on a prior setOrderBook clear)
                        // avoids any React state-batching timing issues.
                        const baseOrder = reqData.page === 1 ? [] : orderBookData;
                        return {
                            ...prev,
                            [`${type}Order`]: [...baseOrder, ...order]
                        }
                    })
                    if (type == 'sell') {
                        globalSellCount = result?.count;
                        setTotalSellCount(result?.count);
                        setSellPage(reqData.page);
                        setTimeout(() => {
                            setSellLoading(false);
                            if ((reqData?.page * reqData?.limit) < globalSellCount && parseInt(globalSellCount) >= 8 && parseInt(globalSellCount) != 0) {
                                setSellLoadBtn(true);
                            } else {
                                setSellLoadBtn(false);
                            }
                        }, 1000)
                    } else if (type == 'buy') {
                        globalBuyCount = result?.count;
                        setTotalBuyCount(result?.count);
                        setBuyPage(reqData.page);
                        setTimeout(() => {
                            setBuyLoading(false);
                            if ((reqData?.page * reqData?.limit) < globalBuyCount && parseInt(globalBuyCount) >= 8 && parseInt(globalBuyCount) != 0) {
                                setBuyLoadBtn(true);
                            } else {
                                setBuyLoadBtn(false);
                            }
                        }, 1000)
                    }
                } else {
                    setOrderBook((prev) => {
                        const baseOrder = reqData.page === 1 ? [] : orderBookData;
                        return {
                            ...prev,
                            [`${type}Order`]: [...baseOrder, ...[]],
                        }
                    })
                    if (type == 'sell') {
                        globalSellCount = 0;
                        setSellLoading(false);
                        setSellLoadBtn(true);
                    } else if (type == 'buy') {
                        globalBuyCount = 0;
                        setBuyLoading(false);
                        setBuyLoadBtn(true);
                    }
                }
            }
        } catch (err) {
            console.log(err, "fetchSingelOrderBook___err")
            if (type == 'buy') {
                setBuyLoading(false);
                setBuyLoadBtn(true);
            } else if (type == 'sell') {
                setSellLoading(false);
                setSellLoadBtn(true);
            }
        }
    }


    // console.log(orderBook, 'outside 11 fetchOrderBook_Result_Data pageData')


    const layoutfn = (e) => {
        setLayout(e);
        localStorage.setItem('orderlayout', e)
        if (e != 'all') {
            // A layout switch is a fresh view of that side, not a "load more"
            // continuation — always fetch page 1 explicitly. fetchSingelOrderBook
            // itself now replaces (rather than appends) whenever page is 1,
            // so this no longer stacks a duplicate copy on top of what's
            // already showing.
            if (e === 'sell') {
                setSellPage(1);
            } else if (e === 'buy') {
                setBuyPage(1);
            }
            fetchSingelOrderBook({
                page: 1,
                limit
            }, e);
        } else {

        }

    }
    const handleMouseEnter = (data, i, id) => {
        if (id == "sell") {
            setBuyhover()
            const selldatas = orderBook?.sellOrder.slice(i, orderBook.sellOrder.length)
            setSellhover(i);
            const pricevalue = selldatas.reduce((accumulator, currentItem) => accumulator + currentItem._id, 0) / (orderBook.sellOrder.length - i);
            const amountvalue = selldatas.reduce((accumulator, currentItem) => accumulator + currentItem.quantity, 0);
            const totalvalue = selldatas.reduce((accumulator, currentItem) => accumulator + currentItem.totalAmount, 0);
            const Ordervalue = [pricevalue, amountvalue, totalvalue];
            setAveragevalue(Ordervalue)
        }
        else {
            setSellhover()
            const buydatas = orderBook?.buyOrder.slice(0, i + 1)
            setBuyhover(i + 1);
            const pricevalue = buydatas.reduce((accumulator, currentItem) => accumulator + currentItem._id, 0) / (i + 1);
            const amountvalue = buydatas.reduce((accumulator, currentItem) => accumulator + currentItem.quantity, 0);
            const totalvalue = buydatas.reduce((accumulator, currentItem) => accumulator + currentItem.totalAmount, 0);
            const Ordervalue = [pricevalue, amountvalue, totalvalue];
            setAveragevalue(Ordervalue)
        }


    };

    // console.log("orderBookorderBook", orderBook)

    // useEffect(() => {
    //     if (listRef.current) {
    //         listRef.current.scrollTop = listRef.current.scrollHeight;
    //     }
    // }, [orderBook?.sellOrder]);

    // const handleListRef = () => {
    //     listRef.current = null
    // }

    useEffect(() => {
        if (!observedDiv.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            if (observedDiv.current.offsetHeight) {
                setOrderBookHeight(observedDiv.current.offsetHeight);
            }
        });
        resizeObserver.observe(observedDiv.current);
        return function cleanup() {
            resizeObserver.disconnect();
        };
    }, [observedDiv.current]);

    useEffect(() => {
        const savedLayout = localStorage.getItem('orderlayout');
        if (savedLayout) {
            setLayout(savedLayout);
        }
    }, []);


    useEffect(() => {
        if (!isEmpty(futureTradePair) && FutureId.current != futureTradePair._id) {
            FutureId.current = futureTradePair._id
        }
    }, [futureTradePair])

    useEffect(() => {
        fetchOrderBook({
            limit: limit,
            buyLoading: true,
            sellLoading: true
        });
    }, [FutureId.current]);


    useEffect(() => {
        const handleFuturesOrderBook = (result) => {
            result = JSON.parse(result)
            let tikerRoot = localStorage.getItem('futurespair');
            // console.log("FuturesorderBook_tikerRoot", tikerRoot, result.tickerRoot);
            if (result.tickerRoot == tikerRoot) {
                // console.log("FuturesorderBook_1tikerRoot", tikerRoot, result);

                setOrderBook((pervRecord) => {
                    let buyOrder = isEmpty(result?.buyOrder) ? [] : result?.buyOrder
                    let sellOrder = isEmpty(result?.sellOrder) ? [] : result?.sellOrder
                    return {
                        buyOrder: buyOrder,
                        sellOrder: sellOrder
                    }
                });
            }
        };
        socketContext.socket.on("FuturesorderBook", handleFuturesOrderBook);
        return () => {
            socketContext.socket.off("FuturesorderBook", handleFuturesOrderBook);
        };
    }, [socketContext]);

    // console.log('orderBookHeight', buyLoading, sellLoading, globalBuyCount, globalSellCount)

    const LoadMore = async (filter) => {
        try {
            if (filter == "buy") {
                fetchSingelOrderBook({
                    page: buyPage + 1,
                    limit: limit,
                }, filter);
                setBuyLoadBtn(true);
                setSellLoadBtn(false);

            } else if (filter == "sell") {
                fetchSingelOrderBook({
                    page: sellPage + 1,
                    limit: limit,
                }, filter);
                // console.log("44 buyloadbtn tru")
                setBuyLoadBtn(false);
                setSellLoadBtn(true);
            }
            layoutfn(filter)
        } catch (e) {
            console.log("LoadMore__Err", e)
        }
    }


    // console.log("global", globalBuyCount, globalSellCount)
    return (
        <div className={`${styles.container} ${styles.orderBookContainer}`} ref={observedDiv}>
            <div className="position-relative">
                {onClose && <IoIosCloseCircleOutline onClick={onClose} className={styles.containerClosebtn} />}
            </div>

            <div className={styles.header} data-panel-drag-handle="true">
                <p>Order Book</p>
                <div className={styles.layoutChoose}>
                    <button data-click-effect="none" aria-label="allMenu" className={layout === "all" ? styles.active : ""} onClick={() => layoutfn("all")} >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 25 25" fill="none">
                            <rect x="1.21484" y="1.05078" width="10.2317" height="10.2317" fill="#F6465D" />
                            <rect x="1.21484" y="12.8623" width="10.2317" height="10.2317" fill="#2EBD85" />
                            <rect x="13.0215" y="1.05078" width="11.1393" height="5.81943" fill="#848E9C" />
                            <rect x="13.0215" y="9.16309" width="11.1393" height="5.81943" fill="#848E9C" />
                            <rect x="13.0215" y="17.2744" width="11.1393" height="5.81943" fill="#848E9C" />
                        </svg>
                    </button>

                    <button data-click-effect="none" aria-label="lossMenu" className={layout === "sell" ? styles.active : ""} onClick={() => layoutfn("sell")} >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 25 25" fill="none">
                            <rect x="0.863281" y="1.05176" width="10.2317" height="22.043" fill="#F6465D" />
                            <rect x="12.6699" y="1.05176" width="11.1393" height="5.81943" fill="#848E9C" />
                            <rect x="12.6699" y="9.16406" width="11.1393" height="5.81943" fill="#848E9C" />
                            <rect x="12.6699" y="17.2754" width="11.1393" height="5.81943" fill="#848E9C" />
                        </svg>
                    </button>

                    <button data-click-effect="none" aria-label="profitMenu" className={layout === "buy" ? styles.active : ""} onClick={() => layoutfn("buy")} >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 25 25" fill="none">ß
                            <rect x="0.935547" y="1.05078" width="10.2317" height="22.043" fill="#2EBD85" />
                            <rect x="12.7422" y="1.05078" width="11.1393" height="5.81943" fill="#848E9C" />
                            <rect x="12.7422" y="9.16309" width="11.1393" height="5.81943" fill="#848E9C" />
                            <rect x="12.7422" y="17.2744" width="11.1393" height="5.81943" fill="#848E9C" />
                        </svg>
                    </button>

                </div>
            </div>

            <div className={styles.body}>
                <div className={`${(layout == "sell" || layout == "buy") && ""} `}>
                    <div className={`${styles.bodyHeader} row mx-auto`}>
                        <div className="col-3 px-0">
                            <p className={`${styles.bodyHeaderTitle} `}>Price ({formatDisplayPair(futureTradePair.quoteCurrency)})</p>
                        </div>
                        <div className="col-5 px-0">
                            <p className={`${styles.bodyHeaderTitle}  text-end`}>Amount ({futureTradePair.baseCurrency})</p>
                        </div>
                        <div className="col-4 px-0">
                            <p className={`${styles.bodyHeaderTitle} text-end`}>Total ({formatDisplayPair(futureTradePair.quoteCurrency)})</p>
                        </div>
                    </div>
                    <div className={styles.bodyContainer} style={{ height: `${orderBookHeight - 91}px` }}>
                        {/* <div className={styles.bodyContainer} > */}
                        {(layout == "all" || layout == "sell") &&
                            <div
                                className={styles.sellContainer}
                                style={{ height: `${layout == 'all' ? ((orderBookHeight - 91) / 2) - 18 : layout == 'sell' ? orderBookHeight - 91 : ""}px` }}
                                ref={listRef}
                            // onMouseOver={handleListRef}
                            >

                                {sellLoading ? <Loader /> : orderBook?.sellOrder?.length > 0
                                    ? orderBook?.sellOrder?.map((val, i) => {
                                        var lastindex = orderBook?.sellOrder.length;
                                        var toam = orderBook?.sellOrder[lastindex - 1].totalAmount;
                                        var precentage = (val.totalAmount / toam) * 100;

                                        const tooltipContent = () => (`
                                            <div class="openBoxTooltip" onClick={}>
                                                <p>Avg.Price: ~123801982390</p>
                                                <p>Sum USD: ~123801982390</p>
                                                <p>Sum EUR: ~123801982390</p>
                                            </div>
                                            `);

                                        return (
                                            <div
                                                key={`${val._id}-${i}`}
                                                id="sell"
                                                className={`${styles.sellContainerList} ${sellhover >= i ? styles.mouseHover : ""}`}
                                                onMouseEnter={() => handleMouseEnter(val, i, "sell")}
                                                onMouseLeave={() => setSellhover()}
                                                data-tooltip={tooltipContent()}
                                                data-tooltip-html
                                                data-tooltip-position="right">
                                                <div
                                                    className={styles.sellProgress}
                                                    style={{ width: `${precentage}%` }}
                                                >
                                                </div>
                                                <div className={`${styles.pairsRow} row mx-auto`}>
                                                    <div className="col-3 px-0">
                                                        <p className={`${styles.pairText} ${styles.low} text-start`} >{val?._id}</p>
                                                    </div>
                                                    <div className="col-5 px-0">
                                                        <p className={`${styles.pairText} text-end`}>
                                                            {isNaN(val?.quantity)
                                                                ? 0
                                                                : formatValue(val?.quantity, futureTradePair?.baseDecimal)}
                                                        </p>
                                                    </div>{" "}
                                                    <div className="col-4 px-2">
                                                        <p className={`${styles.pairText} text-end`}>
                                                            {isNaN(val?.total)
                                                                ? 0
                                                                : formatValue(val?.total, futureTradePair?.quoteDecimal)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                    :

                                    <NoData content="No Data" />}
                                {/* {buyLoading && <Loader />} */}
                                {sellLoadBtn &&
                                    <div className="d-flex justify-content-center py-2">
                                        <Button
                                            btnText={"Load More"}
                                            className="cardLoseBtnXs"
                                            onClick={() => {
                                                // layoutfn("sell")
                                                LoadMore("sell")
                                            }}
                                        />
                                    </div>
                                }
                            </div>
                        }

                        {layout == "all" &&
                            <div className={`${styles.orderBookTicker} row mx-auto`}>
                                <div className="col-4 px-0">
                                    <p className={`${styles.orderBookTickerTextXs} `}>Last Price</p>

                                    {/* dynamic class - styles.high, styles.low */}

                                    <p className={`${styles.orderBookTickerTextXL} ${futureTicker?.change < 0 ? styles.low : styles.high}`}>
                                        {isNaN(futureTicker.last)
                                            ? 0
                                            : futureTicker?.last?.toFixed(futureTicker?.quoteDecimal)}
                                    </p>
                                </div>
                                <div className="col-4 px-0 text-end">
                                    <p className={`${styles.orderBookTickerTextXs} `}>Change</p>
                                    <p className={`${styles.orderBokTickerTextUnderline} ${futureTicker?.change < 0 ? styles.low : styles.high}`}>
                                        {isNaN(futureTicker?.change)
                                            ? 0
                                            : futureTicker?.change?.toFixed(2)}
                                    </p>
                                </div>
                                {/* <div className="col-4 px-0 text-end" >
                                    <p className={`${styles.orderBookTickerTextXs}`}>Market Price</p>
                                    <p className={`${styles.orderBokTickerTextUnderline}`}>198.0324</p>
                                </div> */}
                            </div>
                        }
                        {(layout == "all" || layout == "buy") &&
                            <div className={`${styles.buyContainer}`}
                                ref={buyListRef}
                                style={{ height: `${layout == 'all' ? ((orderBookHeight - 91) / 2) - 18 : layout == 'buy' ? orderBookHeight - 91 : ""}px` }}>
                                {buyLoading ? <Loader /> : orderBook?.buyOrder?.length > 0
                                    ? orderBook?.buyOrder?.map((val, i) => {
                                        var lastindex = orderBook?.buyOrder.length;
                                        var toam = orderBook?.buyOrder[lastindex - 1].totalAmount;
                                        var precentage = (val.totalAmount / toam) * 100;
                                        const tooltipContent = () => (`
                                            <div class="openBoxTooltip">
                                                <p>Avg.Price: ~123801982390</p>
                                                <p>Sum USD: ~123801982390</p>
                                                <p>Sum EUR: ~123801982390</p>
                                            </div>`);
                                        return (
                                            <div
                                                key={`${val._id}-${i}`}
                                                id="buy"
                                                className={`${styles.buyContainerList} ${i < buyhover ? styles.mouseHover : ""}`}
                                                onMouseEnter={() => handleMouseEnter(val, i, "buy")}
                                                onMouseLeave={() => setBuyhover()}
                                                data-tooltip={tooltipContent()}
                                                data-tooltip-html
                                                data-tooltip-position="left"
                                                style={{ cursor: "pointer" }}>
                                                <div
                                                    className={styles.buyProgress}
                                                    style={{ width: `${precentage}%` }}></div>
                                                <div className={`${styles.pairsRow} row mx-auto`} >
                                                    <div className="col-3 px-0">
                                                        <p className={`${styles.pairText} ${styles.high}`}>{val?._id}</p>
                                                    </div>
                                                    <div className="col-5 px-0">
                                                        <p className={`${styles.pairText} text-end`}>
                                                            {isNaN(val?.quantity)
                                                                ? 0
                                                                : formatValue(val?.quantity ?? 0, futureTicker?.baseDecimal)}
                                                        </p>
                                                    </div>{" "}
                                                    <div className="col-4 px-2">
                                                        <p className={`${styles.pairText} text-end`}>
                                                            {isNaN(val.total)
                                                                ? 0
                                                                : formatValue(val.total, futureTicker?.quoteDecimal)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                        );
                                    })
                                    : <NoData content="No Data" />}

                                {buyLoadBtn &&
                                    <div className="d-flex justify-content-center py-2">
                                        <Button btnText={"Load More"} className="cardSuccessBtnXs"
                                            onClick={() => {
                                                // layoutfn("buy")
                                                LoadMore("buy")
                                            }} />
                                    </div>
                                }
                            </div>

                        }
                        {/* <Tooltip
                            anchorSelect=".orderbookprices"
                            place="right"
                            className="orderbooktooltip"
                            clickable
                        >
                            <div>
                                <div className="d-flex align-items-center justify-content-between gap-3">
                                    <p className="label">Avg.Price:</p>
                                    <p className="value">~ 198.74641842105257</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-3">
                                    <p className="label">Sum USD:</p>
                                    <p className="value">7666.256800000003</p>
                                </div>
                                <div className="d-flex align-items-center justify-content-between gap-3">
                                    <p className="label">Sum EUR:</p>
                                    <p className="value">78895106.61870122</p>
                                </div>
                            </div>

                        </Tooltip> */}
                    </div>

                </div>
            </div>
        </div >
    );
};

export default OrderBook;