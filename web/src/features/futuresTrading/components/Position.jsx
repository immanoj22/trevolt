/** PACKAGE IMPORT */

import React, { useState, useRef, useEffect, useContext } from "react";
import { IoClose } from "react-icons/io5";
import { GoShareAndroid } from "react-icons/go";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from "is-empty";
import { FaPen } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import Swal from 'sweetalert2';

/** LOCAL FILES IMPORT */

import styles from '../styles/tradeTable.module.css'
import Button from "../../../components/Button/Button";
import NoData from "../../../components/NoData/NoData";
import ProfitLossModal from "../modal/ProfitLossModal";
import GrossPLModel from "../modal/grossPLModel";
import { showToastMessage } from "../../../lib/toast";
import CloseOrder from "../modal/CloseOrder";
import { MdShare, MdModeEdit } from "react-icons/md";
/** Context */
import SocketContext from "../../../context/socketContext";
import { useGlobalContext } from "../../../context/GlobalProvider";
/** CODE START */


/** Actions */
import { futureCancelBracketOrders, futureClosePosition, futurePositionOrders } from "../../../actions/futureActions";
import { UpdateTab } from "../../../actions/userAction";

/** REDUX */
import { FuturePairsList } from "../../../redux/futureAction";
import { PiSigmaThin } from "react-icons/pi";
import { IoIosArrowForward } from "react-icons/io";
import TooltipComponent from "../../../components/UiComponents/tooltipComponent";
import { formatValue } from "../../../lib/Common";
import { formatDisplayPair } from "../../../lib/pairDisplay";


const sideEnum = {
    "long": "Long",
    "short": "Short",
}

const Position = () => {
    const dispatch = useDispatch()

    const navigate = useNavigate()

    const socketContext = useContext(SocketContext);
    const { theme } = useGlobalContext()
    const { userdetails, wallet, positionDetails } = useSelector((state) => state.user);
    const { futureTradePair, futurePairsList, futureTicker } = useSelector((state) => state.future);
    const [showProfitLossModal, setShowProfitLossModal] = useState(false)
    const [positionOrder, setPositionOrder] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [errors, setErrors] = useState(0);
    const [closeData, setCloseData] = useState({});
    const [showCloseOrders, setShowCloseOrders] = useState(false)
    const [selectOrder, setSelectOrder] = useState({});
    const [nextPage, setnextPage] = useState(true);
    const [selectedTab, setSelectedTab] = useState('all')
    const [showGrossModal, setShowGrossModal] = useState(false)
    const [pnlCard, setPnlCard] = useState({})
    const [tradeMode, setTradeMode] = useState('all');


    const FutureId = useRef('all');


    const handleShowCloseOrders = (data) => {
        setCloseData(data)
        setShowCloseOrders(true)
    }

    const handleHideCloseOrders = () => {
        setShowCloseOrders(false)
    }

    const handleShowProfitLossModal = (data) => {
        setSelectOrder({ ...data, ...{ quantity: data.positionFilled } })
        setShowProfitLossModal(true)
    }
    const handleHideProfitLossModal = () => {
        setShowProfitLossModal(false)
    }

    const removeBracketOrders = async (data) => {
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
                const { status, message } = await futureCancelBracketOrders(data, userdetails.secretKey);
                showToastMessage(message, status ? "success" : "error");
            });
        } catch (err) {
            console.log(err, "removeBracketOrders__err")
        }
    }


    const manageCloseOrder = (data) => {
        try {
            const isExist = futurePairsList.some((el) => el === data);
            const updateOrder = isExist ? futurePairsList.filter((el) => el !== data) : [...futurePairsList, data]
            dispatch(FuturePairsList({
                pairsList: updateOrder,
                closeType: ''
            }))
        } catch (e) {
            console.log("manageCancelOrder_err", e);
        }
    }

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

    useEffect(() => {
        if (!isEmpty(futureTradePair) && FutureId.current != futureTradePair._id && FutureId.current !== 'all') {
            FutureId.current = futureTradePair._id;
        }
    }, [futureTradePair]);

    // useEffect(() => {
    //     if (!isEmpty(futureTicker)) {
    //         ArrangePositionOrder(futureTicker)
    //     }
    // }, [futureTicker])

    // useEffect(() => {
    //     fetchPositionOrders([], {
    //         page: 1,
    //         limit: pagination.limit,
    //     });
    // }, [FutureId.current, userdetails?.secretKey]);

    // useEffect(() => {
    //     socketContext.socket.on("FuturesPositionOrder", (result) => {
    //         console.log("FuturesPositionOrderFuturesPositionOrder", result)
    //         if (FutureId.current != 'all') {
    //             let findData = result.data.find((val) => (val.pairId == FutureId.current))
    //             console.log("FuturesPositionOrderFuturesPositionOrder", findData)
    //             if (!isEmpty(findData)) {
    //                 setPositionOrder([findData]);
    //                 setCount(1);
    //             } else {
    //                 setPositionOrder([]);
    //                 setCount(0);
    //             }
    //         } else {
    //             setPositionOrder(result.data);
    //             setCount(result.count);
    //             setnextPage(result.nextPage);
    //         }
    //         // setcurrentPage(result.currentPage);

    //     });
    // }, [socketContext]);

    const ApplyFilters = (tradeMode = 'all', pairId = 'all') => {
        try {
            // console.log(positionDetails, "ApplyFilters__positionDetails")
            if (!isEmpty(positionDetails) && positionDetails?.length > 0) {
                let filterData = [...positionDetails]
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
                // if (!isEmpty(search)) {
                //     const regex = new RegExp(search, 'i');
                //     filterData = filterData.filter((val) => {
                //         return regex.test(val.tradeMode) || regex.test(val.pairName) || regex.test(val.positionSide);
                //     })
                // }
                let count = filterData.length
                // const start_index = (pagination.page - 1) * pagination.limit;
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(0, end_index);
                setPositionOrder(filterData)
                if (count > filterData.length) {
                    setnextPage(true)
                } else {
                    setnextPage(false)
                }

            } else {
                setPositionOrder([])
                setCount(0);
                setnextPage(false)
            }
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    const loadMore = async () => {
        try {
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            ApplyFilters(tradeMode, FutureId.current);
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

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

    // Initialize / sync the selected tab from the persisted user preference.
    // NOTE: this must NOT depend on `tradeMode` / `FutureId.current` — those are
    // updated locally the instant a tab button is clicked, and if this effect
    // re-ran on every such change it would immediately overwrite the just-picked
    // tab with the (still stale) userdetails values, making the buttons appear
    // to do nothing.
    useEffect(() => {
        if (userdetails) {
            setSelectedTab(userdetails?.filterType)
            FutureId.current = userdetails?.pairId
            setTradeMode(userdetails?.tradeMode)
            ApplyFilters(userdetails.tradeMode, userdetails.pairId)
        }
    }, [userdetails])

    // Re-apply the current filter whenever the underlying position data changes,
    // using whatever tab is currently selected (not the possibly-stale userdetails).
    useEffect(() => {
        ApplyFilters(tradeMode, FutureId.current)
    }, [positionDetails])

    return (

        <>

            {/* modal import - start */}

            <ProfitLossModal
                show={showProfitLossModal}
                handleClose={handleHideProfitLossModal}
                orderData={selectOrder}
                tabType={'position'}
            />

            <GrossPLModel
                show={showGrossModal}
                record={pnlCard}
                handleClose={() => setShowGrossModal(false)}
            />

            <CloseOrder
                show={showCloseOrders}
                handleClose={handleHideCloseOrders}
                record={closeData}
            />
            {/* modal import - end */}

            <div>


                <div className={styles.headerTabs}>
                    <button
                        aria-label="all"
                        data-click-effect="none"
                        className={`${styles.headerTabsButton} ${selectedTab == 'all' ? styles.active : ""}`}
                        onClick={() => {
                            setTradeMode('all')
                            FutureId.current = 'all';
                            setSelectedTab('all')
                            ApplyFilters('all', 'all')
                            updateCurrentTab('all', 'all', 'all')
                        }}>
                        All
                    </button>
                    <button
                        aria-label="currentContract"
                        data-click-effect="none"
                        className={`${styles.headerTabsButton} ${selectedTab == 'currentContract' ? styles.active : ""}`}
                        onClick={() => {
                            setTradeMode(futureTradePair.tradeMode)
                            FutureId.current = futureTradePair._id;
                            setSelectedTab('currentContract')
                            ApplyFilters(futureTradePair.tradeMode, futureTradePair._id)
                            updateCurrentTab(futureTradePair._id, futureTradePair.tradeMode, 'currentContract')
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
                            ApplyFilters('option', 'all')
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
                            ApplyFilters('future', 'all')
                            updateCurrentTab('all', 'future', 'futures')
                        }}>
                        Futures
                    </button>

                    <button
                        className={styles.totalCard}
                        onClick={() => {
                            navigate("/pnl-analytics")
                        }}
                    >
                        <span >
                            <PiSigmaThin size={22} />
                        </span>
                        <span>Total UPNL</span>
                        <span className={wallet?.unRealizedPnL > 0 ? "value-profit" : "value-lose"}>$ {(wallet?.unRealizedPnL)?.toFixed(2)}</span>
                        <span><IoIosArrowForward size={18} /></span>
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
                                                    <label className="custom-checkInput__label">
                                                        {positionOrder.length > 0 && <input
                                                            type="checkbox"
                                                            checked={positionOrder.length > 0 && futurePairsList.length === positionOrder.length}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    const pairId = positionOrder.map((el) => el.pairId)
                                                                    dispatch(FuturePairsList({
                                                                        pairsList: pairId,
                                                                        closeType: 'all'
                                                                    }))
                                                                } else {
                                                                    dispatch(FuturePairsList({
                                                                        pairsList: [],
                                                                        closeType: ''
                                                                    }))
                                                                }
                                                            }}

                                                        />}
                                                        <span className="custom-checkInput__checkmark"></span>
                                                    </label>
                                                </div> <span>Symbol</span>
                                            </div>
                                        </th>
                                        <th className="text-end ">Position Side</th>
                                        <th className="text-end ">
                                            <TooltipComponent text={"Notional"} triggerType='click'>
                                                Size
                                            </TooltipComponent>
                                        </th>
                                        <th className="text-end ">Notional</th>
                                        <th className="text-end">Entry Price</th>
                                        <th className="text-end ">
                                            <TooltipComponent text={"TP (take profit) and SL (stop loss) orders for this position"} triggerType='click'>
                                                TP / SL
                                            </TooltipComponent>
                                        </th>
                                        {/* <th className="text-end">Index Price</th> */}
                                        <th className="text-end">Mark Price</th>
                                        <th className="text-end">
                                            <TooltipComponent text={"Price/ percentage change at which your position will go into liquidation. Note that, it is not possible to compute liquidation prices of portfolio margined positions or cross margined positions"} triggerType='click'>
                                                Est. Liq. Price
                                            </TooltipComponent>
                                        </th>
                                        <th className="text-end">
                                            <TooltipComponent text={"Margin allocated to a position. Available only for isolated margin mode"} triggerType='click'>
                                                Margin
                                            </TooltipComponent>
                                        </th>
                                        {/* <th className="text-end">Auto Top-up</th> */}
                                        <th className="text-end">
                                            <TooltipComponent text={"Note: The cashflows that will take place if all your futures positions are closed at prevailing mark prices and your options positions are closed at the best bid or offer, whichever is applicable"} triggerType='click'>
                                                UPNL
                                            </TooltipComponent>
                                        </th>
                                        {/* <th className="text-end">Share</th> */}
                                        {/* <th className="text-end">Cashflows</th> */}
                                        {/* <th className="text-end">Gross P/L</th> */}
                                        <th className="text-center table-col__sticky-end table-width__120" >Action</th>
                                        {/* <th className="text-end" >Action</th> */}
                                        {/* <th className="text-center table-col__sticky-end table-width__120" ></th> */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {positionOrder.length > 0 ?
                                        positionOrder.map((record) => {
                                            // console.log(record, "positionOrder__page")
                                            return (
                                                <tr key={`${record?.pairId}_${record?.positionSide}`}>
                                                    <td className="text-start  table-col__sticky-start ">

                                                        <div className="table-flexStart ">
                                                            <div className="custom-checkInput__container">
                                                                <label className="custom-checkInput__label">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={futurePairsList.some((el) => el === record.pairId)}
                                                                        onChange={() => {
                                                                            manageCloseOrder(record.pairId)
                                                                        }}

                                                                    />
                                                                    <span className="custom-checkInput__checkmark"></span>
                                                                </label>
                                                            </div> <span>{formatDisplayPair(record?.pairName)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-end ">
                                                        <div className={`table-value__profit`}>
                                                            <p className={`${record?.positionSide === "long" ? "value-profit" : "value-lose"}`}>{sideEnum[record?.positionSide]}</p>
                                                        </div>
                                                    </td>

                                                    <td className="text-end ">
                                                        <p className={``}>
                                                            {formatValue(parseFloat(record?.positionFilled), (record?.pairData?.baseDecimal))}
                                                        </p>
                                                    </td>
                                                    <td className="text-end ">
                                                        <p>{formatValue(parseFloat(parseFloat(record?.positionFilled) * parseFloat(record?.entryPrice)), (record?.pairData?.quoteDecimal))} </p>
                                                    </td>
                                                    <td className="text-end ">
                                                        <p>{formatValue(record?.entryPrice, record?.pairData?.quoteDecimal)}</p>
                                                    </td>
                                                    <td className="text-end ">
                                                        <div className="table-flexEnd">
                                                            {record?.bracketOrders.length > 0 ?
                                                                <div className="tableTp-Sl-data d-flex align-items-center gap-2 flex-nowrap">
                                                                    <div>
                                                                        <p><span className="table-value__light">TP ({record?.pairData?.quoteCurrency}) :</span> {isEmpty(record?.takeprofit?.stopPrice) ? "--" : record?.takeprofit?.stopPrice}</p>
                                                                        <p><span className="table-value__light">SL ({record?.pairData?.quoteCurrency}) :</span> {isEmpty(record?.stoploss?.stopPrice) ? "--" : record?.stoploss?.stopPrice}</p>
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
                                                                                removeBracketOrders({
                                                                                    pairId: record.pairId,
                                                                                    positionSide: record.positionSide
                                                                                })
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
                                                                    reactIconElement={record?.bracketOrders.length > 0 ? <MdModeEdit /> : <FaPlus />
                                                                    }
                                                                />

                                                            }

                                                        </div>
                                                    </td>

                                                    <td className="text-end ">
                                                        {formatValue(record?.close_price, (record?.pairData?.quoteDecimal))}
                                                    </td>
                                                    <td className="text-end ">
                                                        <p className={`table-value__loss`}>{
                                                            userdetails.marginMode == 'portfolio' || (record?.tradeMode == 'option' && record?.positionSide == 'long') ?
                                                                "N/A" :
                                                                (formatValue(parseFloat(record?.liquidityPrice) ?? 0, (record?.pairData?.quoteDecimal) ?? 0))
                                                        }
                                                        </p>
                                                    </td>
                                                    <td className="text-end ">
                                                        <p >{userdetails.marginMode == 'portfolio' ? "--" : (formatValue(parseFloat(record?.initialMargin), record?.pairData?.quoteDecimal) ?? 0)}</p>
                                                    </td>
                                                    <td className="text-end ">
                                                        <p className={record.pnl > 0 ? `table-value__profit` : "table-value__loss"}>{
                                                            formatValue(parseFloat(record?.pnl), (record?.pairData?.quoteDecimal))} </p>
                                                    </td>
                                                    <td className="d-flex justify-content-center">
                                                        <div className="table-flexEnd">
                                                            <Button
                                                                isLoading={false}
                                                                loadingText=""
                                                                btnText=''
                                                                onClick={() => {
                                                                    setPnlCard(record)
                                                                    setShowGrossModal(true)
                                                                }}
                                                                className="badgeBtnXs"
                                                                selectedValue={null}
                                                                reactIconElement={<MdShare />}
                                                            />
                                                            <Button
                                                                isLoading={false}
                                                                loadingText=""
                                                                btnText=""
                                                                // onClick={() => { closingPositionOrder(record) }}
                                                                onClick={() => { handleShowCloseOrders(record) }}
                                                                className="dangerOuterlineButtonXs"
                                                                selectedValue={null}
                                                                reactIconElement={<IoClose />}
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* <td className="table-col__sticky-end table-width__120">
                                                    <div className={`table-flexCenter`}>

                                                        <Button
                                                            isLoading={false}
                                                            loadingText=""
                                                            btnText=""
                                                            // onClick={() => { closingPositionOrder(record) }}
                                                            onClick={() => { handleShowCloseOrders(record) }}
                                                            className="dangerOuterlineButtonXs"
                                                            selectedValue={null}
                                                            reactIconElement={<IoClose />}
                                                        />
                                                    </div>
                                                </td> */}

                                                </tr>
                                            )
                                        })
                                        :
                                        <></>
                                    }
                                </tbody>
                            </table>
                        </div>

                        {!positionOrder.length ? <div className={styles.noDataContainer}>
                            <NoData content={"No Position"} />
                        </div> : <></>}
                    </div>

                    {positionOrder?.length > 0 && count != positionOrder?.length && nextPage ?
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
            </div >
        </>
    )
}

export default Position