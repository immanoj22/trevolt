/** PACKAGE IMPORT */

import React, { useEffect, useState, useRef, useContext } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { FaPlus, FaMinus, FaCheck } from "react-icons/fa6";
import { IoIosCheckmark, IoIosClose } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import isEmpty from "is-empty";
import Swal from 'sweetalert2';
import { IoCheckmarkSharp } from "react-icons/io5";
import { FaPen } from "react-icons/fa";
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaRegTrashCan } from "react-icons/fa6";

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";
import ProfitLossModal from "../modal/openPansLModel";
import { PrimaryInput } from "../../../components/Input/InputFields";

/** Actions */
import { RemoveBracketOrders, futureCancelOrder, futureOpenOrders, futureUpdateOrders } from "../../../actions/futureActions";

/** Context */
import SocketContext from "../../../context/socketContext";
import { showToastMessage } from "../../../lib/toast";
import { useGlobalContext } from "../../../context/GlobalProvider";

/** REDUX */
import { FutureCancelOrders } from "../../../redux/futureAction";
import { momentFormat } from "../../../lib/dateTimeHelper";
import { UpdateTab } from "../../../actions/userAction";
import { formatValue } from "../../../lib/Common";
import { formatDisplayPair } from "../../../lib/pairDisplay";


/** CODE START */

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
const OpenOrders = () => {
    const dispatch = useDispatch()
    const socketContext = useContext(SocketContext);
    const { theme } = useGlobalContext()
    const location = useLocation()


    const pathname = location.pathname;
    const TradMode = tradeEnum[`${pathname?.split('/')[1]}`];

    const { userdetails, openOrderDetails } = useSelector((state) => state.user);
    const { futureTradePair, futureCancelOrdersList, futureCancelType } = useSelector((state) => state.future);
    const { optionTradePair } = useSelector((state) => state.option);
    const FutureId = useRef('all');


    const [selectOrder, setSelectOrder] = useState({});
    const [openOrder, setOpenOrder] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all')
    const [showProfitLossModal, setShowProfitLossModal] = useState(false)
    const [tableRowEdit, setTableRowEdit] = useState({
        quantity: false,
        limitPrice: false
    })

    const [tradeMode, setTradeMode] = useState('all');

    // console.log('tableRowEdit', selectOrder)


    const handleShowProfitLossModal = (data) => {
        setShowProfitLossModal(true);
        setSelectOrder(data)
    }
    const handleHideProfitLossModal = () => {
        setShowProfitLossModal(false)
        setSelectOrder({})
    }
    const fetchOpenOrder = async (openOrder, reqData, pairId, tradeMode) => {
        try {
            let { record, status, count, currentPage, nextPage } = await futureOpenOrders(pairId, reqData, userdetails.secretKey, tradeMode);
            // console.log(record,count, "fetchOpenOrder_getOpenOrders");
            if (status) {
                // console.log(record, "getOpenOrders");
                setOpenOrder([...openOrder, ...record]);
                setCount(count);
                // setcurrentPage(currentPage);
                setnextPage(nextPage);
            } else {
                setOpenOrder([]);
            }

        } catch (err) {
            console.log(err, "fetchOpenOrder__err");
        }
    };

    const loadMore = async () => {
        try {
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            if (userdetails.marginMode == 'portfolio') {
                ApplyFilters(tradeMode, FutureId.current, openOrderDetails);
            } else {
                // setPage(Page);
                fetchOpenOrder(openOrder,
                    {
                        page: Page,
                        limit: pagination.limit,
                    },
                    FutureId.current,
                    tradeMode
                );
            }

        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const manageCancelOrder = (data) => {
        try {
            // Header checkbox unchecked (orders: "", cancelType: '') — clear the
            // selection outright instead of falling into the branch below, which
            // recomputes cancelType from the stale (still-full) list and forces it
            // back to 'all', making the checkbox appear to need a second click.
            if (isEmpty(data.orders) && isEmpty(data.cancelType)) {
                dispatch(FutureCancelOrders({ cancelOrdersList: [], cancelType: '' }))
                return
            }
            // console.log("manageCancelOrder_data", data, futureCancelOrdersList);
            const openOrderData = openOrder.map((el) => el._id);
            const isExist = data?.cancelType === "all" ? openOrderData : futureCancelOrdersList.some((el) => el === data.orders);
            const updateOrder = data?.cancelType === "all" ? openOrderData : isExist ? futureCancelOrdersList.filter((el) => el !== data.orders) : isEmpty(data.orders) ? futureCancelOrdersList : [...futureCancelOrdersList, data.orders]
            dispatch(FutureCancelOrders({
                cancelOrdersList: updateOrder,
                cancelType: updateOrder.length === openOrder.length ? 'all' : data.cancelType
            }))
        } catch (e) {
            console.log("manageCancelOrder_err", e);
        }
    }

    const cancelOrder = (orderId) => {
        const confirmBtnColor = "#2563EB"; // Same for dark and light
        const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";
        Swal.fire({
            title: "Are you sure want to cancel this order ?",
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
    };

    const updateOrders = async () => {
        try {
            const payload = {
                orderId: selectOrder._id,
                quantity: selectOrder.quantity,
                price: selectOrder.price
            }
            let { status, message } = await futureUpdateOrders(payload, userdetails.secretKey);
            showToastMessage(message, status ? "success" : "error");
            if (status) setTableRowEdit(prev => ({ ...prev, quantity: false, limitPrice: false }))

        } catch (err) {
            console.log(err, "fetchOpenOrder__err");
        }
    };

    const removeBracketOrders = async (orderId) => {
        try {
            const confirmBtnColor = "#2563EB"; // Same for dark and light
            const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";
            Swal.fire({
                title: "Are you sure want to remove bracket orders of this order ?",
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
                const { status, message } = await RemoveBracketOrders(orderId, userdetails.secretKey);
                showToastMessage(message, status ? "success" : "error");
            });
        } catch (err) {
            console.log(err, "removeBracketOrders__err");
        }
    }

    const onChangeHandler = (event) => {
        try {

            const { name, value } = event.target
            let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

            if (['price', 'quantity', 'stopPrice', 'orderType'].includes(name) && !numbers.test(value) && value !== "") {
                return false
            }
            setSelectOrder({ ...selectOrder, ...{ [name]: value } })

        } catch (e) {
            console.log("onChangeHandler_err", e);
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
                // const start_index = (pagination.page - 1) * pagination.limit;
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(0, end_index);
                setOpenOrder(filterData)
                if (count > filterData.length) {
                    setnextPage(true)
                } else {
                    setnextPage(false)
                }

            } else {
                setOpenOrder([])
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

    // Refreshes the table immediately for the tab just clicked, instead of
    // waiting on the updateCurrentTab round-trip / USER_DETAILS socket push.
    const refreshOpenOrders = (pairId, mode) => {
        if (userdetails.marginMode == 'portfolio') {
            ApplyFilters(mode, pairId, openOrderDetails)
        } else {
            setPagination({ page: 1, limit: pagination.limit })
            fetchOpenOrder([], { page: 1, limit: pagination.limit }, pairId, mode)
        }
    }

    useEffect(() => {
        if (userdetails) {
            setSelectedTab(userdetails?.filterType)
            FutureId.current = userdetails?.pairId
            setTradeMode(userdetails?.tradeMode)
            if (userdetails.marginMode == 'portfolio') {
                ApplyFilters(userdetails?.tradeMode, userdetails?.pairId, openOrderDetails)
            } else {
                fetchOpenOrder([], {
                    page: 1,
                    limit: pagination.limit,
                },
                    userdetails?.pairId,
                    userdetails?.tradeMode
                );
            }
        }
    }, [userdetails, openOrderDetails])

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

    useEffect(() => {
        if (userdetails.marginMode != 'portfolio') {
            socketContext.socket.on("FuturesopenOrder", (result) => {
                ApplyFilters(tradeMode, FutureId.current, result.data)
                // setOpenOrder(result.data);
                // setCount(result.count);
                // setnextPage(result.nextPage);
            });
        }
    }, [socketContext, userdetails]);


    return (
        <div>

            <ProfitLossModal
                show={showProfitLossModal}
                handleClose={handleHideProfitLossModal}
                orderData={selectOrder}
                tabType={'open'}
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
                        refreshOpenOrders('all', 'all')
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
                        refreshOpenOrders(pairId, TradMode)
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
                        refreshOpenOrders('all', 'option')
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
                        refreshOpenOrders('all', 'future')
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
                                    {/* <th className="text-end ">INDEX</th> */}
                                    <th className="text-start table-col__sticky-start ">
                                        <div className="table-flexStart ">
                                            <div className="custom-checkInput__container">
                                                {openOrder.length > 0 && <label className="custom-checkInput__label">
                                                    <input
                                                        type="checkbox"
                                                        checked={futureCancelType === 'all' ? true : false}
                                                        onChange={(e) => {
                                                            manageCancelOrder({
                                                                orders: "",
                                                                cancelType: e.target.checked ? 'all' : ''
                                                            })
                                                        }}
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label>}
                                            </div> <span>Symbol</span>
                                        </div>
                                    </th>

                                    <th className="text-end ">Quantity</th>
                                    <th className="text-end ">Filled/Remaining </th>
                                    <th className="text-end">Notional</th>
                                    <th className="text-end ">Order Type</th>
                                    <th className="text-end ">Type</th>
                                    <th className="text-end">Reduce Only</th>
                                    <th className="text-end">Limit Price</th>
                                    <th className="text-end">TP / SL</th>
                                    <th className="text-end">Date/Time</th>
                                    <th className="text-center table-col__sticky-end table-width__120" >Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {}
                                {openOrder.length > 0 ?
                                    openOrder.map((record, i) => {
                                        // console.log(record, "record__")
                                        let Remaining = record?.quantity - record?.filledQuantity;
                                        const pairData = record?.pairData
                                        return (

                                            <tr key={record?._id ?? i}>
                                                {/* <td className="text-end ">
                                                    <p>{i+1}</p>
                                                </td> */}
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
                                                                {formatValue(parseFloat(record.quantity), parseFloat(pairData.baseDecimal))} {record?.baseCurrency}
                                                            </p>
                                                            <button aria-label="penIcon" className="borderLessButton" onClick={() => { setSelectOrder(record); setTableRowEdit(prev => ({ ...prev, quantity: true })) }}><FaPen /></button>
                                                        </div>
                                                    }

                                                </td>
                                                <td className="text-end ">

                                                    <p> {`${formatValue(record.filledQuantity, (pairData?.baseDecimal))} / ${formatValue(Remaining, (pairData?.baseDecimal))}`} <span className="table-value__light">{record?.baseCurrency}</span></p>
                                                </td>
                                                <td className="text-end ">
                                                    <p>{formatValue(parseFloat(record?.orderValue), (pairData.quoteDecimal))}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p className={`${record?.buyorsell == "buy" ? "value-profit" : "value-lose"}`}>{sideEnum[record?.buyorsell]}</p>
                                                </td>
                                                <td className="text-end ">
                                                    <p >{orderTypeEnum[record?.orderType]}</p>
                                                </td>
                                                <td className="text-end ">
                                                    {record?.reduce_only ? <FaCheck color="green" size={18} /> : <IoIosClose color="red" size={25} />}

                                                </td>
                                                <td className="text-end ">
                                                    {/* {record.price} */}
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
                                                            closeHistory<Button
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
                                                                {formatValue(parseFloat(record.price), (pairData.quoteDecimal))}
                                                            </p>
                                                            <button aria-label="penIcon" className="borderLessButton" onClick={() => { setSelectOrder(record); setTableRowEdit(prev => ({ ...prev, limitPrice: true })) }}><FaPen /></button>
                                                        </div>}
                                                </td>

                                                <td className="text-end ">
                                                    <div className="table-flexEnd">
                                                        {
                                                            record?.bracketOrders.length > 0 ?
                                                                <div className="tableTp-Sl-data d-flex align-items-center gap-2 flex-nowrap">
                                                                    <div>
                                                                        <p><span className="table-value__light">TP ({pairData.quoteCurrency}) :</span> {isEmpty(record?.takeprofit?.stopPrice) ? "--" : record?.takeprofit?.stopPrice}</p>
                                                                        <p><span className="table-value__light">SL ({pairData.quoteCurrency}) :</span> {isEmpty(record?.stoploss?.stopPrice) ? "--" : record?.stoploss?.stopPrice}</p>
                                                                    </div>
                                                                    <div className="d-flex align-items-center gap-0">
                                                                        <button
                                                                            aria-label="penIcon"
                                                                            className="borderLessButton"
                                                                            onClick={() => handleShowProfitLossModal(record)}
                                                                        >
                                                                            <FaPen />
                                                                        </button>
                                                                        <button
                                                                            aria-label="penIcon"
                                                                            className="borderLessButton"
                                                                            onClick={() => {
                                                                                removeBracketOrders(record._id)
                                                                            }}
                                                                        >
                                                                            <FaRegTrashCan />
                                                                        </button>
                                                                    </div>
                                                                </div> :
                                                                <Button
                                                                    isLoading={false}
                                                                    loadingText=""
                                                                    btnText={record?.bracketOrders.length > 0 ? "Edit" : "Add"}
                                                                    onClick={() => handleShowProfitLossModal(record)}
                                                                    className="badgeBtnXs"
                                                                    selectedValue={null}
                                                                    disabled={!record['addTP/SL']}
                                                                    reactIconElement={record?.bracketOrders.length > 0 ? <MdModeEdit /> : <FaPlus />}
                                                                />
                                                        }
                                                    </div>
                                                </td>

                                                <td className="text-end ">
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

                    {!openOrder.length ? <div className={styles.noDataContainer}>
                        <NoData content={"No Open Orders"} />
                    </div> : <></>}



                </div>

                {openOrder?.length > 0 && count != openOrder?.length && nextPage ?
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

export default OpenOrders