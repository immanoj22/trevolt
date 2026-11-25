/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { FaPlus, FaMinus, FaCheck, } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import isEmpty from "is-empty";
import Swal from 'sweetalert2';
import { FaPen } from "react-icons/fa";
import { IoCheckmarkSharp } from "react-icons/io5";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";
import { PrimaryInput } from "../../../components/Input/InputFields";
/** Context */
import SocketContext from "../../../context/socketContext";
import { useGlobalContext } from "../../../context/GlobalProvider";

/** CODE START */

/** Actions */
import { futureCancelOrder, futureStopOrders, futureUpdateOrders } from "../../../actions/futureActions";
import { showToastMessage } from "../../../lib/toast";

/** REDUX */
import { FutureCancelOrders } from "../../../redux/futureAction";
import { momentFormat } from "../../../lib/dateTimeHelper";
import { UpdateTab } from "../../../actions/userAction";
import { formatValue } from "../../../lib/Common";
import { formatDisplayPair } from "../../../lib/pairDisplay";

const tradeEnum = {
    futures: 'future',
    options: 'option'
}

const StopOrders = () => {

    const orderTypeEnum = {
        "stop_limit": "Stop Limit",
        "stop_market": "Stop Market",
        "take_profit_limit": "Take Profit Limit",
        "take_profit": "Take Profit Market",
        'bracket_tp_market': "Bracket - TP",
        'bracket_sl_market': "Bracket - SL",
        'bracket_tp_limit': "Bracket - TP",
        'bracket_sl_limit': "Bracket - SL",
    }

    const ConditionalLimitTypes = ["stop_limit", "take_profit_limit", 'bracket_tp_limit', 'bracket_sl_limit']
    const marketTypes = ['market', 'stop_market', 'take_profit', 'bracket_tp_market', 'bracket_sl_market']
    const dispatch = useDispatch()
    const socketContext = useContext(SocketContext);
    const { theme } = useGlobalContext()

    const location = useLocation()


    const pathname = location.pathname;
    const TradMode = tradeEnum[`${pathname?.split('/')[1]}`];

    const { userdetails } = useSelector((state) => state.user);
    const { futureTradePair, futureCancelOrdersList, futureCancelType, futurePairData } = useSelector((state) => state.future);
    const { optionTradePair } = useSelector((state) => state.option);
    const [selectOrder, setSelectOrder] = useState({});
    const [stopOrders, setStopOrders] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all')
    const [tableRowEdit, setTableRowEdit] = useState({
        quantity: false,
        limitPrice: false,
        stopPrice: false
    })
    const [tradeMode, setTradeMode] = useState('all');

    const FutureId = useRef('all');


    const confirmBtnColor = "#2563EB"; // Same for dark and light
    const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";

    const cancelOrder = async (orderId) => {
        try {

            Swal.fire({
                title: "Are you sure you want to cancel this order ?",
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
                const { status, message } = await futureCancelOrder(orderId, userdetails.secretKey);
                showToastMessage(message, status ? "success" : "error");
            });
        } catch (err) {
            console.log(err, "CancelOrder___err");
        }
    };


    const fetchStopOrder = async (orderHistory, reqData, pairId, tradeMode) => {
        try {
            if (!isEmpty(FutureId.current)) {
                let { record, status, count, currentPage, nextPage } = await futureStopOrders(pairId, reqData, userdetails.secretKey, tradeMode);
                if (status) {
                    setStopOrders([...orderHistory, ...record]);
                    setCount(count);
                    // setcurrentPage(currentPage);
                    setnextPage(nextPage);
                } else {
                    setStopOrders([]);
                }
            }
        } catch (err) {
            console.log(err, "fetchStopOrder__err");
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
            fetchStopOrder(stopOrders, reqData, FutureId.current, tradeMode);
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const updateOrders = async () => {
        try {
            let payload = {}
            payload['orderId'] = selectOrder._id
            let pairData = futurePairData?.find((val) => (val?._id?.toString() == selectOrder?.pairId?.toString()))
            if (selectOrder.trailPrice) {
                payload['isTrailingOrder'] = selectOrder.isTrailingOrder
                payload['trailPrice'] = selectOrder.trailPrice
                payload['trailTypePrice'] = pairData?.marketPrice
            } else {
                payload['quantity'] = selectOrder.quantity
                payload['price'] = marketTypes.includes(selectOrder.orderType) ? "" : selectOrder.price
                payload['stopPrice'] = selectOrder.stopPrice
            }

            let { status, message } = await futureUpdateOrders(payload, userdetails.secretKey);
            showToastMessage(message, status ? "success" : "error");
            if (status) setTableRowEdit(prev => ({ ...prev, quantity: false, limitPrice: false, stopPrice: false }))

        } catch (err) {
            console.log(err, "fetchOpenOrder__err");
            showToastMessage("Something went wrong", "error");
        }
    };

    const onChangeHandler = (event) => {
        try {

            const { name, value } = event.target
            let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

            if (['price', 'quantity', 'stopPrice', 'trailPrice'].includes(name) && !numbers.test(value) && value !== "") {
                return false
            }
            setSelectOrder({ ...selectOrder, ...{ [name]: value } })

        } catch (e) {
            console.log("onChangeHandler_err", e);
        }
    }

    const manageCancelOrder = (data) => {
        try {
            // Header checkbox unchecked (orders: [], cancelType: '') — clear the
            // selection outright instead of falling into the branch below, which
            // recomputes cancelType from the stale (still-full) list and forces it
            // back to 'all', making the checkbox appear to need a second click.
            if (isEmpty(data.orders) && isEmpty(data.cancelType)) {
                dispatch(FutureCancelOrders({ cancelOrdersList: [], cancelType: '' }))
                return
            }
            const isExist = futureCancelOrdersList.some((el) => el === data.orders);
            const updateOrder = isExist ? futureCancelOrdersList.filter((el) => el !== data.orders) : isEmpty(data.orders) ? futureCancelOrdersList : [...futureCancelOrdersList, data.orders]
            dispatch(FutureCancelOrders({
                cancelOrdersList: isEmpty(data.orders) ? [] : updateOrder,
                cancelType: updateOrder.length === stopOrders.length ? 'all' : data.cancelType
            }))
        } catch (e) {
            console.log("manageCancelOrder_err", e);
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
                setStopOrders(filterData)
                if (count > filterData.length) {
                    setnextPage(true)
                } else {
                    setnextPage(false)
                }

            } else {
                setStopOrders([])
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
                fetchStopOrder([],
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
        socketContext.socket.on("Futurestoporder", (result) => {
            ApplyFilters(tradeMode, FutureId.current, result.data)
            // setStopOrders(result.data);
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
                        fetchStopOrder([], { page: 1, limit: pagination.limit }, 'all', 'all')
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
                        fetchStopOrder([], { page: 1, limit: pagination.limit }, pairId, TradMode)
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
                        fetchStopOrder([], { page: 1, limit: pagination.limit }, 'all', 'option')
                        updateCurrentTab('all', 'option', 'options')
                    }}>
                    Options
                </button>
                <button
                    data-click-effect="none"
                    className={`${styles.headerTabsButton} ${selectedTab == 'futures' ? styles.active : ""}`}
                    onClick={() => {
                        setTradeMode('future')
                        setSelectedTab('futures');
                        FutureId.current = 'all';
                        setPagination({ page: 1, limit: pagination.limit })
                        fetchStopOrder([], { page: 1, limit: pagination.limit }, 'all', 'future')
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
                                                {stopOrders.length > 0 && <label className="custom-checkInput__label">
                                                    <input
                                                        type="checkbox"
                                                        checked={futureCancelType === 'all' ? true : false}
                                                        onChange={(e) => {
                                                            manageCancelOrder({
                                                                orders: [],
                                                                cancelType: e.target.checked ? 'all' : ''
                                                            })
                                                        }}
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label>}
                                            </div> <span>Symbol</span>
                                        </div>
                                    </th>
                                    <th className="text-end ">Size</th>
                                    <th className="text-end ">Notional</th>
                                    <th className="text-end">Trigger Price</th>
                                    <th className="text-end ">Triggering Price</th>
                                    <th className="text-end ">Order Type</th>
                                    <th className="text-end">Type</th>
                                    <th className="text-end">Limit Price</th>
                                    <th className="text-end">Reduce Only</th>
                                    <th className="text-end">Status</th>
                                    <th className="text-end">Date/Time</th>
                                    <th className="text-center table-col__sticky-end table-width__120" >Action</th>
                                </tr>
                            </thead>
                            <tbody>

                                {stopOrders.length > 0 ?
                                    stopOrders.map((record, i) => {
                                        let futureTradePair = futurePairData?.find((val) => (val?._id.toString() == record?.pairId.toString()))
                                        let pairData = record?.pairData
                                        return (
                                            <tr key={record?._id ?? i}>
                                                <td className="text-start  table-col__sticky-start ">

                                                    <div className="table-flexStart ">
                                                        <div className="custom-checkInput__container">
                                                            <label className="custom-checkInput__label">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={futureCancelType !== 'all' ?
                                                                        futureCancelOrdersList.some((el) => el === record._id) : true
                                                                    }
                                                                    onChange={(e) => {
                                                                        manageCancelOrder({
                                                                            orders: record._id,
                                                                            cancelType: ''
                                                                        })
                                                                    }}
                                                                />
                                                                <span className="custom-checkInput__checkmark"></span>
                                                            </label>
                                                        </div> <span>{formatDisplayPair(record?.pairName)}</span>
                                                    </div>
                                                </td>
                                                <td className="text-end ">

                                                    {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                    <div className={`table-value__profit`}>

                                                        {tableRowEdit.quantity && selectOrder._id === record?._id ?
                                                            <div className="flexEnd">
                                                                <PrimaryInput
                                                                    type="text"
                                                                    id="quantity"
                                                                    name={"quantity"}
                                                                    value={selectOrder?.quantity}
                                                                    onChange={onChangeHandler}
                                                                    error={null}
                                                                    className={'tableInputXs'} />

                                                                <Button
                                                                    isLoading={false}
                                                                    loadingText=""
                                                                    btnText=""
                                                                    onClick={() => updateOrders()}
                                                                    className="successOuterlineButtonXs"
                                                                    selectedValue={null}
                                                                    reactIconElement={<IoCheckmarkSharp />}
                                                                />
                                                                <Button
                                                                    isLoading={false}
                                                                    loadingText=""
                                                                    btnText=""
                                                                    onClick={() => setTableRowEdit(prev => ({ ...prev, quantity: false }))}
                                                                    className="dangerOuterlineButtonXs"
                                                                    selectedValue={null}
                                                                    reactIconElement={<IoClose />}
                                                                />
                                                            </div> :
                                                            <div className="flexEnd">
                                                                <p >
                                                                    {formatValue(parseFloat(record.quantity), (pairData?.baseDecimal))} {record?.baseCurrency}
                                                                </p>
                                                                <button aria-label="penIcon" className="borderLessButton" onClick={() => { setSelectOrder(record); setTableRowEdit(prev => ({ ...prev, quantity: true })) }}><FaPen /></button>
                                                            </div>}
                                                    </div>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{formatValue(parseFloat(parseFloat(record?.quantity) * parseFloat(record?.price)), (pairData?.quoteDecimal))}</p>
                                                </td>
                                                <td className="text-end ">
                                                    {/* <p>{record?.stopPrice}</p> */}
                                                    {tableRowEdit.stopPrice && selectOrder._id === record?._id ?
                                                        <div className="flexEnd">
                                                            {record?.isTrailingOrder ?
                                                                <PrimaryInput
                                                                    type="text"
                                                                    id="trailPrice"
                                                                    name={"trailPrice"}
                                                                    value={selectOrder?.trailPrice}
                                                                    onChange={onChangeHandler}
                                                                    error={null}
                                                                    className={'tableInputXs'} /> :
                                                                <PrimaryInput
                                                                    type="text"
                                                                    id="stopPrice"
                                                                    name={"stopPrice"}
                                                                    value={selectOrder?.stopPrice}
                                                                    onChange={onChangeHandler}
                                                                    error={null}
                                                                    className={'tableInputXs'} />
                                                            }
                                                            <Button
                                                                isLoading={false}
                                                                loadingText=""
                                                                btnText=""
                                                                onClick={() => updateOrders()}
                                                                className="successOuterlineButtonXs"
                                                                selectedValue={null}
                                                                reactIconElement={<IoCheckmarkSharp />}
                                                            />
                                                            <Button
                                                                isLoading={false}
                                                                loadingText=""
                                                                btnText=""
                                                                onClick={() => setTableRowEdit(prev => ({ ...prev, stopPrice: false }))}
                                                                className="dangerOuterlineButtonXs"
                                                                selectedValue={null}
                                                                reactIconElement={<IoClose />}
                                                            />
                                                        </div> :
                                                        <div className="flexEnd">
                                                            <p >
                                                                {formatValue(parseFloat(record.stopPrice), (pairData?.quoteDecimal))} {record?.isTrailingOrder ? `(${record?.trailPrice})` : ""}
                                                            </p>
                                                            <button aria-label="penIcon" className="borderLessButton" onClick={() => { setSelectOrder(record); setTableRowEdit(prev => ({ ...prev, stopPrice: true })) }}><FaPen /></button>
                                                        </div>}
                                                </td>
                                                <td className="text-end ">
                                                    <div className="table-flexEnd">
                                                        {formatValue(parseFloat(futureTradePair?.marketPrice), (pairData?.quoteDecimal))}
                                                    </div>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{record?.buyorsell?.toUpperCase()}</p>
                                                </td>
                                                <td className="text-end ">
                                                    {orderTypeEnum[record?.orderType]}
                                                </td>

                                                {
                                                    (ConditionalLimitTypes.includes(record?.orderType)) ?
                                                        <td className="text-end ">
                                                            {/* {record?.price} */}
                                                            {tableRowEdit.limitPrice && selectOrder._id === record?._id ?
                                                                <div className="flexEnd">
                                                                    <PrimaryInput
                                                                        type="text"
                                                                        id="price"
                                                                        name={"price"}
                                                                        value={selectOrder?.price}
                                                                        onChange={onChangeHandler}
                                                                        error={null}
                                                                        className={'tableInputXs'} />

                                                                    <Button
                                                                        isLoading={false}
                                                                        loadingText=""
                                                                        btnText=""
                                                                        onClick={() => updateOrders()}
                                                                        className="successOuterlineButtonXs"
                                                                        selectedValue={null}
                                                                        reactIconElement={<IoCheckmarkSharp />}
                                                                    />
                                                                    <Button
                                                                        isLoading={false}
                                                                        loadingText=""
                                                                        btnText=""
                                                                        onClick={() => setTableRowEdit(prev => ({ ...prev, limitPrice: false }))}
                                                                        className="dangerOuterlineButtonXs"
                                                                        selectedValue={null}
                                                                        reactIconElement={<IoClose />}
                                                                    />
                                                                </div> :
                                                                <div className="flexEnd">
                                                                    <p >
                                                                        {formatValue(parseFloat(record.price), (pairData?.quoteDecimal))}
                                                                    </p>
                                                                    <button aria-label="penIcon" className="borderLessButton" onClick={() => { setSelectOrder(record); setTableRowEdit(prev => ({ ...prev, limitPrice: true })) }}><FaPen /></button>
                                                                </div>}
                                                        </td> : <td className="text-end "> - </td>
                                                }

                                                <td className="text-end ">

                                                    {record?.reduce_only ? <FaCheck color="green" size={18} /> : <IoIosClose color="red" size={25} />}
                                                </td>
                                                <td className="text-end ">
                                                    <p> {record?.status}</p>
                                                </td>
                                                <td className="text-end table-flexEnd">

                                                    <p>{momentFormat(record?.orderDate)}</p>

                                                </td>

                                                <td className="table-col__sticky-end table-width__120">
                                                    <div className={`table-flexCenter`}>

                                                        <Button
                                                            isLoading={false}
                                                            loadingText=""
                                                            btnText=""
                                                            onClick={() => { cancelOrder(record?._id) }}
                                                            className="dangerOuterlineButtonXs"
                                                            selectedValue={null}
                                                            reactIconElement={<IoClose />}
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

                    {!stopOrders.length ? <div className={styles.noDataContainer}>
                        <NoData content={"No Stop Orders"} />
                    </div> : <></>}



                </div>

                {stopOrders?.length > 0 && count != stopOrders?.length && nextPage ?
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

export default StopOrders