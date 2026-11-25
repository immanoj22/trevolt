/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import isEmpty from "is-empty";

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";

/** Context */
import SocketContext from "../../../context/socketContext";

/** CODE START */

/** Actions */
import { futureClosedOrderHistory } from "../../../actions/futureActions";
import { MdShare } from "react-icons/md";
import GrossPLModel from "../modal/grossPLModel";
import usePriceConversion from "../../../hooks/usePriceConversion";
import { momentFormat } from "../../../lib/dateTimeHelper";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { UpdateTab } from "../../../actions/userAction";
import { formatValue } from "../../../lib/Common";
import { formatDisplayPair } from "../../../lib/pairDisplay";
import { useLocation } from "react-router-dom";


const tradeEnum = {
    futures: 'future',
    options: 'option'
}

const directionEnum = {
    'long': 'Long',
    'short': 'Short',
}
const CloseOrderHistory = () => {

    const socketContext = useContext(SocketContext);
    // const { convertValue } = usePriceConversion("USDT", 'INR')
    const { convertValue, convertSecValue } = useGlobalContext()

    const location = useLocation()


    const pathname = location.pathname;
    const TradMode = tradeEnum[`${pathname?.split('/')[1]}`];

    const { userdetails } = useSelector((state) => state.user);
    const { futureTradePair, futurePairData } = useSelector((state) => state.future);
    const { optionTradePair } = useSelector((state) => state.option);
    const FutureId = useRef('all');


    const [orderHistory, setorderHistory] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);
    const [selectedTab, setSelectedTab] = useState('currentContract')
    const [showGrossModal, setShowGrossModal] = useState(false)
    const [pnlCard, setPnlCard] = useState({})
    const [tradeMode, setTradeMode] = useState('all');

    const fetchCloseOrderHistory = async (orderHistory, reqData, pairId, tradeMode) => {
        try {
            if (!isEmpty(FutureId.current)) {
                let { record, status, count, nextPage } = await futureClosedOrderHistory(pairId, reqData, userdetails.secretKey, tradeMode);
                // console.log(record, "fetchOrderHistory_getOpenOrders");
                if (status) {
                    setorderHistory([...orderHistory, ...record]);
                    setCount(count);
                    setnextPage(nextPage);
                } else {
                    setorderHistory([]);
                }
            }
        } catch (err) {
            console.log(err, "fetchCloseOrderHistory__err");
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
            fetchCloseOrderHistory(
                orderHistory,
                reqData,
                FutureId.current,
                tradeMode
            );
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const getPorfitCalculation = (entryPrice, closePrice, quantity, positionSide) => {
        try {
            // console.log("getPorfitCalculation_trade_pos", { entryPrice, closePrice, quantity, positionSide })
            let profit = 0
            let percentage = 0
            if (positionSide == 'short') {
                profit = (parseFloat(entryPrice) - parseFloat(closePrice)) * quantity
                percentage = (parseFloat(entryPrice) - parseFloat(closePrice)) / entryPrice
            } else {
                profit = (parseFloat(closePrice) - parseFloat(entryPrice)) * quantity
                percentage = (parseFloat(closePrice) - parseFloat(entryPrice)) / entryPrice
            }
            return { profit: profit, percentage: percentage }
        } catch (err) {
            console.log("getPorfitCalculation_err", err)
            return { profit: 0, percentage: 0 }
        }
    }

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

    useEffect(() => {
        if (!isEmpty(futureTradePair) && FutureId.current != futureTradePair._id && FutureId.current !== 'all') {
            FutureId.current = futureTradePair._id;
        }
    }, [futureTradePair]);

    useEffect(() => {
        if (userdetails) {
            setSelectedTab(userdetails?.filterType)
            FutureId.current = userdetails?.pairId
            setTradeMode(userdetails?.tradeMode)
            if (!isEmpty(userdetails?.pairId)) {
                fetchCloseOrderHistory([],
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
    }, [selectedTab])


    useEffect(() => {
        socketContext.socket.on("FutureClosedPositionHistory", (result) => {
            ApplyFilters(tradeMode, FutureId.current, result.data)
            // setorderHistory(result.data);
            // setCount(result.count);
            // setnextPage(result.nextPage);
        });
    }, [socketContext]);



    return (
        <div>
            <GrossPLModel
                show={showGrossModal}
                record={pnlCard}
                handleClose={() => setShowGrossModal(false)}
            />

            <div className={styles.headerTabs}>
                <button
                    aria-label="all"
                    data-click-effect="none"
                    className={`${styles.headerTabsButton} ${selectedTab == 'all' ? styles.active : ""}`}
                    onClick={() => {
                        setTradeMode('all')
                        FutureId.current = 'all';
                        setSelectedTab('all')
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchCloseOrderHistory([], { page: 1, limit: pagination.limit }, 'all', 'all')
                        updateCurrentTab('all', 'all', 'all')
                    }}>
                    All
                </button>
                <button
                    aria-label="currentContract"
                    data-click-effect="none"
                    className={`${styles.headerTabsButton} ${selectedTab == 'currentContract' ? styles.active : ""}`}
                    onClick={() => {
                        const pairId = TradMode == 'option' ? optionTradePair?._id : futureTradePair._id;
                        setTradeMode(TradMode)
                        FutureId.current = pairId;
                        setSelectedTab('currentContract')
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchCloseOrderHistory([], { page: 1, limit: pagination.limit }, pairId, TradMode)
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
                        fetchCloseOrderHistory([], { page: 1, limit: pagination.limit }, 'all', 'option')
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
                        fetchCloseOrderHistory([], { page: 1, limit: pagination.limit }, 'all', 'future')
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
                                    <th className="text-end ">Date/Time</th>
                                    {/* <th className="text-end ">Pair</th> */}
                                    <th className="text-end">Direction</th>
                                    <th className="text-end ">Entry Price</th>
                                    <th className="text-end">Closed Price</th>
                                    <th className="text-end">Close Quantity</th>
                                    <th className="text-end">Gross P/L</th>
                                    {/* <th className="text-end">Close fee</th> */}
                                    <th className="text-end">Balance</th>
                                    <th className="text-center table-col__sticky-end table-width__120" >Action</th>
                                </tr>
                            </thead>
                            <tbody>

                                {orderHistory.length > 0 ?
                                    orderHistory.map((record, index) => {
                                        let futureTradePair = futurePairData?.find((val) => (val?._id.toString() == record?.pairId.toString()))
                                        const pairData = record?.pairData
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
                                                    <p>
                                                        {momentFormat(record?.createdAt)}
                                                    </p>
                                                </td>
                                                {/* <td className="text-end ">
                                                    <p> {formatDisplayPair(record?.pairName)} </p>
                                                </td> */}
                                                <td className="text-end ">
                                                    <p className={`${record?.closing_direction === "long" ? "value-profit" : "value-lose"}`}>{directionEnum[record?.closing_direction]}</p>
                                                    {/* <p>{record?.closing_direction}</p> */}
                                                </td>
                                                <td className="text-end ">
                                                    <p>{isNaN(record?.entryPrice)
                                                        ? 0
                                                        : formatValue(parseFloat(record?.entryPrice), (
                                                            pairData?.quoteDecimal
                                                        ))}{" "}
                                                        {pairData?.quoteCurrency} </p>
                                                </td>
                                                <td className="text-end ">
                                                    <p> {isNaN(record?.closePrice)
                                                        ? 0
                                                        : formatValue(parseFloat(record?.closePrice), (
                                                            pairData?.quoteDecimal
                                                        ))}{" "}
                                                        {pairData?.quoteCurrency}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p> {isNaN(record?.quantity)
                                                        ? 0
                                                        : formatValue(parseFloat(record?.quantity),
                                                            (pairData?.baseDecimal)
                                                        )}{" "}
                                                        {pairData?.baseCurrency}</p>
                                                </td>
                                                <td className='text-end' >
                                                    <p className={`${record?.grossPandL > 0 ? "value-profit" : "value-lose"}`}>
                                                        {convertValue(record?.grossPandL ?? 0, pairData?.quoteDecimal)}
                                                        {/* {isNaN(record?.grossPandL)
                                                        ? 0
                                                        : parseFloat(record?.grossPandL)?.toFixed(pairData?.quoteDecimal)
                                                    } */}
                                                        {" "}
                                                        {/* {pairData?.quoteCurrency} */}
                                                    </p>
                                                    {/* {} */}
                                                    <p className={`${record?.grossPandL > 0 ? "value-profit" : "value-lose"}`}>
                                                        {/* <span className='inrTag'>₹</span> */}
                                                        <span>
                                                            {/* {isNaN(record?.grossPandL)
                                                        ? 0
                                                        : convertValue(parseFloat(record?.grossPandL), pairData?.quoteDecimal)
                                                    }{" "} */}
                                                            {convertSecValue(record?.grossPandL ?? 0, pairData?.quoteDecimal)}
                                                        </span>
                                                    </p>

                                                </td>
                                                {/* <td className="text-end ">
                                                <p>{isNaN(record?.closeFee)
                                                    ? 0
                                                    : `${parseFloat(record?.closeFee)?.toFixed(
                                                        2
                                                    )}`}{" "}
                                                    {pairData?.quoteCurrency} </p>
                                            </td> */}
                                                <td className="text-end ">
                                                    <p>
                                                        {/* {isNaN(record?.afterBalance)
                                                        ? 0
                                                        : convertValue(parseFloat(record?.afterBalance))?.toFixed(
                                                            pairData?.quoteDecimal
                                                        )} */}
                                                        {convertValue(record?.afterBalance ?? 0, pairData?.quoteDecimal)}
                                                        {" "}
                                                        {/* {pairData?.profitCurrency} */}
                                                    </p>
                                                    <p>
                                                        <span>
                                                            {convertSecValue(record?.afterBalance ?? 0, pairData?.quoteDecimal)}
                                                        </span>
                                                    </p>
                                                </td>
                                                <td className="">
                                                    <div className="d-flex justify-content-center">
                                                        <Button
                                                            isLoading={false}
                                                            loadingText=""
                                                            btnText=''
                                                            onClick={() => {
                                                                let { percentage } = getPorfitCalculation(record.entryPrice, record.closePrice, record.quantity, record.closing_direction)
                                                                setPnlCard({
                                                                    ...record,
                                                                    pnl: record.grossPandL,
                                                                    close_price: record.closePrice,
                                                                    positionSide: record.closing_direction,
                                                                    pnl_percen: percentage
                                                                })
                                                                setShowGrossModal(true)
                                                            }}
                                                            className="badgeBtnXs"
                                                            selectedValue={null}
                                                            reactIconElement={<MdShare />}
                                                        />
                                                    </div>
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

export default CloseOrderHistory