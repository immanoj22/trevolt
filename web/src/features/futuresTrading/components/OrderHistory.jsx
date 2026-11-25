/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import isEmpty from "is-empty";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";
import { FaPlus, FaMinus, FaCheck } from "react-icons/fa6";

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";

/** Context */
import SocketContext from "../../../context/socketContext";

/** CODE START */

/** Actions */
import { futureOrderHistory } from "../../../actions/futureActions";
import usePriceConversion from "../../../hooks/usePriceConversion";
import { momentFormat } from "../../../lib/dateTimeHelper";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { UpdateTab } from "../../../actions/userAction";
import { capitalizeFirst, formatValue } from "../../../lib/Common";
import { formatDisplayPair } from "../../../lib/pairDisplay";



const tradeEnum = {
    futures: 'future',
    options: 'option'
}

const orderTypeEnum = {
    'bracket_tp_market': "Bracket - TP",
    'bracket_sl_market': "Bracket - SL",
    'bracket_tp_limit': "Bracket - TP",
    'bracket_sl_limit': "Bracket - SL",
    "stop_limit": "Stop Limit",
    "stop_market": "Stop Market",
    "take_profit_limit": "Take Profit Limit",
    "take_profit": "Take Profit Market",
    "limit": 'Limit',
    "market": 'Market',
}
const sideEnum = {
    "buy": "Buy",
    "sell": "Sell",
}
const OrderHistory = () => {

    const socketContext = useContext(SocketContext);
    // const { convertValue } = usePriceConversion("USDT", 'INR')
    const { convertValue, convertSecValue } = useGlobalContext()
    const location = useLocation()
    const pathname = location.pathname;
    const TradMode = tradeEnum[`${pathname?.split('/')[1]}`];

    const { userdetails } = useSelector((state) => state.user);
    const { futureTradePair } = useSelector((state) => state.future);
    const { optionTradePair } = useSelector((state) => state.option);
    const FutureId = useRef('all');


    const [orderHistory, setorderHistory] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all')
    const [tradeMode, setTradeMode] = useState('all');


    const truncateString = (str, startChars = 5, endChars = 6) => {
        if (str?.length <= startChars + endChars) return str;
        return `${str?.slice(0, startChars)}...${str?.slice(-endChars)}`;
    }

    const fetchOrderHistory = async (orderHistory, reqData, pairId, tradeMode) => {
        try {
            if (!isEmpty(FutureId.current)) {
                let { record, status, count, currentPage, nextPage } = await futureOrderHistory(pairId, reqData, userdetails.secretKey, tradeMode);
                // console.log(count, currentPage, nextPage, "fetchOrderHistory_getOpenOrders", reqData, orderHistory.length);
                if (status) {
                    setorderHistory([...orderHistory, ...record]);
                    setCount(count);
                    setnextPage(nextPage);
                } else {
                    setorderHistory([]);
                }
            }
        } catch (err) {
            console.log(err, "fetchorderHistory__err");
        }
    };

    const loadMore = async () => {
        try {
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            let reqData = {
                page: Page,
                limit: pagination.limit,
            };
            fetchOrderHistory(orderHistory, reqData, FutureId.current, tradeMode);
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const ApplyFilters = (tradeMode = 'all', pairId = 'all', data) => {
        try {
            if (!isEmpty(data) && data?.length > 0) {
                let filterData = [...data]
                if (!isEmpty(tradeMode) && tradeMode != 'all') {
                    filterData = filterData.filter((val) => {
                        return val.tradeMode == tradeMode
                    })
                }
                if (!isEmpty(pairId) && pairId != 'all') {
                    filterData = filterData.filter((val) => {
                        return val.pairId == pairId
                    })
                }
                let count = filterData.length
                const start_index = 0;
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(start_index, end_index);
                setorderHistory(filterData)
                if (count > filterData.length) {
                    setnextPage(true)
                } else {
                    setnextPage(false)
                }

            } else {
                setorderHistory([])
                setCount(0);
                setnextPage(false)
            }
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    useEffect(() => {
        if (TradMode == 'future') {
            if (!isEmpty(futureTradePair) && FutureId.current != futureTradePair._id && FutureId.current !== 'all') {
                FutureId.current = futureTradePair._id;
            }
        }
    }, [futureTradePair]);

    useEffect(() => {
        if (TradMode == 'option') {
            if (!isEmpty(optionTradePair) && FutureId.current != optionTradePair._id && FutureId.current !== 'all') {
                FutureId.current = optionTradePair._id;
            }
        }
    }, [optionTradePair]);

    const updateCurrentTab = async (pairId, tradeMode, selectedTab) => {
        try {
            const payload = {
                pairId: pairId,
                tradeMode: tradeMode,
                filterType: selectedTab
            }
            const result = await UpdateTab(payload, userdetails?.secretKey)
        } catch (error) {
            console.log("updateCurrentTab_err", error)
        }
    }

    // useEffect(() => {
    //     updateCurrentTab(FutureId.current, tradeMode)
    // }, [selectedTab])

    useEffect(() => {
        if (userdetails) {
            setSelectedTab(userdetails?.filterType)
            FutureId.current = userdetails?.pairId
            setTradeMode(userdetails?.tradeMode)
            if (!isEmpty(userdetails?.pairId)) {
                fetchOrderHistory([],
                    {
                        page: 1,
                        limit: pagination.limit,
                    },
                    userdetails?.pairId,
                    userdetails?.tradeMode
                );
            }
        }
    }, [userdetails])

    useEffect(() => {
        socketContext.socket.on("FuturesorderHistory", (result) => {
            ApplyFilters(tradeMode, FutureId.current, result.data)
            // setorderHistory(result.data);
            // setCount(result.count);
            // setnextPage(result.nextPage);
        });
    }, [socketContext]);


    return (
        <div>


            <div className={styles.headerTabs}>
                <button
                    data-click-effect="none"
                    aria-label="all"
                    className={`${styles.headerTabsButton} ${selectedTab == 'all' ? styles.active : ""}`}
                    onClick={() => {
                        setTradeMode('all')
                        FutureId.current = 'all';
                        setSelectedTab('all')
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchOrderHistory([], { page: 1, limit: pagination.limit }, 'all', 'all')
                        updateCurrentTab('all', 'all', 'all')
                    }}>
                    All
                </button>
                <button
                    data-click-effect="none"
                    aria-label="currentContract"
                    className={`${styles.headerTabsButton} ${selectedTab == 'currentContract' ? styles.active : ""}`}
                    onClick={() => {
                        const pairId = TradMode == 'option' ? optionTradePair?._id : futureTradePair._id;
                        setTradeMode(TradMode)
                        FutureId.current = pairId;
                        setSelectedTab('currentContract')
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchOrderHistory([], { page: 1, limit: pagination.limit }, pairId, TradMode)
                        updateCurrentTab(pairId, TradMode, 'currentContract')
                    }}>
                    Current Contract
                </button>
                <button
                    data-click-effect="none"
                    className={`${styles.headerTabsButton} ${selectedTab == 'options' ? styles.active : ""}`}
                    onClick={() => {
                        setTradeMode('option')
                        setSelectedTab('options')
                        FutureId.current = 'all';
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchOrderHistory([], { page: 1, limit: pagination.limit }, 'all', 'option')
                        updateCurrentTab('all', 'option', 'options')
                    }}>
                    Options
                </button>
                <button
                    data-click-effect="none"
                    className={`${styles.headerTabsButton} ${selectedTab == 'futures' ? styles.active : ""}`}
                    onClick={() => {
                        setTradeMode('future')
                        setSelectedTab('futures')
                        FutureId.current = 'all';
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchOrderHistory([], { page: 1, limit: pagination.limit }, 'all', 'future')
                        updateCurrentTab('all', 'future', 'futures')
                    }}>
                    Futures
                </button>
            </div>

            <div>
                <div className={styles.tableSection}>
                    <div className="sticky-table ">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th className="text-start table-col__sticky-start ">
                                        <div className="table-flexStart ">
                                            <div className="custom-checkInput__container">
                                                {/* <label className="custom-checkInput__label">
                                                    <input
                                                        type="checkbox"
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label> */}
                                            </div> <span>Symbol</span>
                                        </div>
                                    </th>
                                    <th className="text-end ">Qty</th>
                                    <th className="text-end ">Side</th>
                                    <th className="text-end">Status</th>
                                    <th className="text-end ">Executed</th>
                                    <th className="text-end">Order Type</th>
                                    <th className="text-end">Price</th>
                                    <th className="text-end">Trigger Price</th>
                                    <th className="text-end">Execution Price</th>
                                    {/* <th className="text-end">Size</th> */}
                                    {/* <th className="text-end">Cashflows</th> */}
                                    {/* <th className="text-end">Realized PnL</th> */}
                                    <th className="text-end">Order ID</th>
                                    <th className="text-end">Liquidation Fee (Inc. GST)</th>
                                    <th className="text-end">Trading Fee (Inc. GST)</th>
                                    <th className="text-end">Reduce-Only</th>
                                    <th className="text-end">Date/Time</th>
                                </tr>
                            </thead>
                            <tbody>

                                {orderHistory.length > 0 ?
                                    orderHistory.map((record, index) => {
                                        let pairData = record?.pairData
                                        return (
                                            <tr key={record?._id ?? index}>
                                                <td className="text-start  table-col__sticky-start ">

                                                    <div className="table-flexStart ">
                                                        <div className="custom-checkInput__container">
                                                            {/* <label className="custom-checkInput__label">
                                                            <input
                                                                type="checkbox"
                                                            />
                                                            <span className="custom-checkInput__checkmark"></span>
                                                        </label> */}
                                                        </div> <span>{formatDisplayPair(record?.pairName)}</span>
                                                    </div>
                                                </td>
                                                <td className="text-end ">

                                                    {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                    <p className={`table-value__profit`}>
                                                        {formatValue(parseFloat(record?.quantity), (pairData?.baseDecimal))} {record?.baseCurrency}
                                                    </p>
                                                </td>
                                                <td className="text-end ">
                                                    <p className={record?.buyorsell === 'buy' ? `table-value__profit` : 'table-value__loss'}>
                                                        {sideEnum[record?.buyorsell]}
                                                    </p>
                                                </td>
                                                <td className="text-end ">
                                                    <p> {capitalizeFirst(record?.status)} </p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{formatValue(parseFloat(record?.filledQuantity), (pairData?.baseDecimal))}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{orderTypeEnum[record?.orderType]} </p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{formatValue(parseFloat(record?.price), (pairData?.quoteDecimal))}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{formatValue(parseFloat(record?.stopPrice), (pairData?.quoteDecimal))}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{record?.exePrice ? formatValue(parseFloat(record?.exePrice), (pairData?.quoteDecimal)) : "-"}</p>

                                                </td>
                                                {/* <td className="text-end ">
                                                116281.5
                                            </td> */}
                                                {/* <td className="text-end ">
                                                <p className={`table-value__loss`}>54668.5</p>
                                                <p className="table-value__loss">-52.99%</p>
                                            </td> */}
                                                {/* <td className="text-end ">
                                                <p>{record?.pandl ? record?.pandl : "-"} </p>
                                            </td> */}
                                                <td className="text-end ">
                                                    <p>{record?._id ? truncateString(record?._id) : "-"} </p>
                                                </td>
                                                <td className="text-end ">
                                                    {!isEmpty(record?.liquidateFee) ?
                                                        <>
                                                            <p>{convertValue(record?.liquidateFee ?? 0, pairData?.feePrec)}
                                                            </p>
                                                            <p >
                                                                {/* <span className='inrTag'>₹</span> */}
                                                                <span>{convertSecValue(record?.liquidateFee ?? 0, pairData?.feePrec)}</span>
                                                            </p>
                                                        </>
                                                        : "--"}
                                                </td>
                                                <td className="text-end ">
                                                    <p>
                                                        {/* {convertValue(record?.fee ?? 0, pairData?.feePrec)} */}
                                                        {convertValue(record?.fee ?? 0, pairData?.feePrec)}
                                                    </p>
                                                    <p >
                                                        {/* <span className='inrTag'>₹</span> */}
                                                        <span>{convertSecValue(record?.fee ?? 0, pairData?.feePrec)}</span>
                                                    </p>
                                                </td>
                                                <td className="text-end ">
                                                    {record?.reduce_only ? <FaCheck color="green" size={18} /> : <IoIosClose color="red" size={25} />}
                                                </td>
                                                <td className="text-end table-flexEnd">
                                                    <p>{momentFormat(record?.orderDate)} </p>
                                                </td>
                                            </tr>
                                        )
                                    })
                                    :
                                    <></>
                                }
                            </tbody>
                        </table>
                    </div>

                    {!orderHistory.length ? <div className={styles.noDataContainer}>
                        <NoData content={"No Order History"} />
                    </div> : <></>}



                </div>

                {orderHistory?.length > 0 && count != orderHistory?.length && nextPage ?
                    <div className={styles.loadMoreContainer}>
                        <Button
                            isLoading={false}
                            loadingText="Loading..."
                            btnText="Load More"
                            onClick={loadMore}
                            className="cardBtnRectangleXs"
                            selectedValue={null}
                        />
                    </div> : <></>}

            </div>
        </div>
    )
}

export default OrderHistory