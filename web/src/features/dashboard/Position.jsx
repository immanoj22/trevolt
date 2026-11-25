/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState, useContext } from 'react'
import Select from 'react-select'
import Table from "react-bootstrap/Table";
import { IoClose } from "react-icons/io5";
import { IoMdCheckmark } from "react-icons/io";
import Form from 'react-bootstrap/Form';
import { useDispatch, useSelector } from "react-redux";
import { Link } from 'react-router-dom'
import isEmpty from "is-empty";
import Swal from 'sweetalert2';

/** LOCAL FILES IMPORT */

import styles from "./styles/authInnerPage.module.css"
import { InputWithCurrencyAndLabel, SearchInput } from '../../components/Input/InputFields';
import Button from '../../components/Button/Button';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

/** Actions */
import { futurePositionOrders, futureClosePosition, futureCloseAllOrder } from '../../actions/futureActions';

/** Context */
import SocketContext from '../../context/socketContext';

/** REDUX */
import { FuturePairsList } from '../../redux/futureAction';
import { showToastMessage } from '../../lib/toast';
import { capitalize } from '../../lib/Common';
import PositionDetails from './components/PositionDetailCard';
import { useGlobalContext } from '../../context/GlobalProvider';
import NoData from '../../components/NoData/NoData';
import RiskView from './components/RiskView/RiskView';

/** CODE START */

const Position = () => {
    const dispatch = useDispatch()
    const { theme } = useGlobalContext()
    const socketContext = useContext(SocketContext);
    const { userdetails, positionDetails } = useSelector((state) => state.user);
    const { futurePairsList, futureTicker } = useSelector((state) => state.future);

    const [currentTab, setCurrentTab] = useState('standard')
    const [currentStandardViewTableRow, setCurrentStandardViewTableRow] = useState(null);
    const [currentRiskViewTableRow, setCurrentRiskViewTableRow] = useState(null);
    const [showMarginEdit, setShowMarginEdit] = useState(false)
    const [positionOrder, setPositionOrder] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [nextPage, setnextPage] = useState(true);
    const [tradeMode, setTradeMode] = useState('all');
    const [count, setCount] = useState(0);
    const [search, setSearch] = useState('');
    const [openRowId, setOpenRowId] = useState(null);

    const marketAndLimitOption = [
        {
            label: "LOT",
            value: "LOT",
        },
        {
            label: "USD",
            value: "USD",
        },
        {
            label: "EUR",
            value: "EUR",
        },
    ]

    const tradeModeOption = [
        { value: 'all', label: 'All' },
        { value: 'future', label: 'Future' },
        { value: 'option', label: 'Option' },
    ];

    const handleRiskPositionView = (getId) => {
        setCurrentRiskViewTableRow(
            currentRiskViewTableRow == getId ? null : getId
        );
    };

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

    const closeAllOrders = async () => {
        try {
            const payload = {
                pairId: futurePairsList
            }
            const confirmBtnColor = "#2563EB"; // Same for dark and light
            const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";
            Swal.fire({
                title: "Are you sure you want to close this order?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Continue",
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
                const { status, message } = await futureCloseAllOrder(payload, userdetails.secretKey)
                showToastMessage(message, status ? 'success' : 'error')
                if (status) {
                    dispatch(FuturePairsList({
                        pairsList: [],
                        closeType: ''
                    }))
                }
            });

        } catch (e) {
            console.log("cancelAllOrders_err", e);
        }
    }

    const ApplyFilters = (tradeMode = 'all', search = '') => {
        try {
            if (!isEmpty(positionDetails) && positionDetails?.length > 0) {
                let filterData = [...positionDetails]
                if (!isEmpty(tradeMode) && tradeMode != 'all') {
                    filterData = filterData.filter((val) => {
                        return val.tradeMode == tradeMode
                    })
                }
                if (!isEmpty(search)) {
                    const regex = new RegExp(search, 'i');
                    filterData = filterData.filter((val) => {
                        return regex.test(val.tradeMode) || regex.test(val.pairName) || regex.test(val.positionSide);
                    })
                }
                let count = filterData.length
                const start_index = (pagination.page - 1) * pagination.limit;
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(start_index, end_index);
                setPositionOrder(filterData)
                if (count > filterData.length) {
                    setnextPage(true)
                } else {
                    setnextPage(false)
                }

            }
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    const isCancelAll = positionOrder.length > 0 && futurePairsList.length === positionOrder.length
    const hasCloseOrders = futurePairsList.length > 0;
    const btnText = isCancelAll ? "Close All Position" : `Close ${hasCloseOrders ? futurePairsList.length + " order" : ""} `
    const isDisabled = futurePairsList.length <= 0;


    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    useEffect(() => {
        if (!isEmpty(positionDetails) && positionDetails?.length > 0) {
            ApplyFilters(tradeMode, search)
        } else {
            setPositionOrder([])
            setCount(0)
            setnextPage(false)
        }

    }, [positionDetails])

    return (
        <div>

            <div className={styles.innerPageHeader}>
                <h5 className={styles.pageTitle}>Positions</h5>
                <SearchInput
                    type={"text"}
                    error={null}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        ApplyFilters(tradeMode, e.target.value)
                    }}
                    disabled={false}
                    placeholder={"Search"}
                    value={search}
                    name={"tableSearch"}
                    className={"defaultSearch"}
                    readOnly={false}
                    showSearchIcon={true}
                />
            </div>

            <div className={`${styles.pageTabs} mt-4`}>
                <button
                    className={`${currentTab === 'standard' ? styles.active : ''} `}
                    onClick={() => setCurrentTab('standard')}>Standard View</button>
                <button
                    className={`${currentTab === 'risk' ? styles.active : ''} `}
                    onClick={() => setCurrentTab('risk')}>Risk View</button>
            </div>
            {currentTab == 'standard' ?
                <>
                    <div className={`${styles.cardHeader} mt - 4`}>
                        <div></div>
                        <div className={`react-select__width-sm ${styles.positionSelectPart}`}>
                            <Select
                                isSearchable={false}
                                placeholder={tradeMode}
                                classNamePrefix="react-select__primary"
                                options={tradeModeOption}
                                value={tradeModeOption.find((el) => el.value === tradeMode)}
                                onChange={(e) => {
                                    ApplyFilters(e.value, search)
                                    setTradeMode(e.value)
                                }}
                                menuPosition='fixed'
                            />
                        </div>
                        <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText={btnText}
                            disabled={isDisabled}
                            onClick={() => closeAllOrders()}
                            className="invertFillRectangleBtnXs"
                            selectedValue={null}
                        />
                    </div>

                    <div className={'mt-4 tableContainer table-responsive'}>
                        <div className={`sticky-table ${currentStandardViewTableRow != null && "sticky-none"}`}>
                            <table className='table'>
                                <thead>
                                    <tr>
                                        {/* <th className="table-width__40">
                                        </th> */}
                                        <th
                                            // className=""
                                            className={`${currentStandardViewTableRow != null && "sticky-none"} table-col__sticky-start table-width__120`}

                                        >
                                            <div className="custom-checkInput__container">
                                                <label className="custom-checkInput__label tblCheckBox_positionRyt">
                                                    <input
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
                                                    />
                                                    <span className="custom-checkInput__checkmark"></span>
                                                </label>
                                            </div>
                                        </th>
                                        <th className="table-width__120 text-start">Type</th>
                                        <th className="table-width__220 text-start">Symbol</th>
                                        <th className="table-width__140">Notional / Qty.</th>
                                        <th className="table-width__140">Entry Price</th>
                                        {/* <th className="table-width__200">Mark Price / Index Price</th> */}
                                        <th className="table-width__200">Mark Price </th>
                                        <th className="table-width__140">Unrealized PnL</th>
                                        <th className="table-width__140">TP / SL</th>
                                        <th className={`${currentStandardViewTableRow != null && "sticky-none"} text-center table-col__sticky-end table-width__120`}>Close Position</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {positionOrder.length > 0 ?
                                        positionOrder?.map((record, index) => (
                                            <PositionDetails 
                                                record={record} 
                                                tradeMode={tradeMode} 
                                                openRowId={openRowId}
                                                setOpenRowId={setOpenRowId} 
                                            />
                                            // <>
                                            //     <tr
                                            //         key={record._id}
                                            //         onClick={() => handleStandardPositionView(record)}
                                            //         className=""
                                            //     >
                                            //         <>
                                            //             {/* <td className="text-start">
                                            //                 {record._id === currentStandardViewTableRow ? (
                                            //                     <FaChevronUp fontSize={10} />

                                            //                 ) : (
                                            //                     <FaChevronDown fontSize={10} />
                                            //                 )}
                                            //             </td> */}
                                            //             <td
                                            //                 // className=""
                                            //                 className={`${currentStandardViewTableRow != null && "sticky-none"} table-col__sticky-start`}
                                            //             >
                                            //                 <div className='d-flex align-items-center gap-4'>
                                            //                     {record._id === currentStandardViewTableRow ? (
                                            //                         <FaChevronUp fontSize={10} />

                                            //                     ) : (
                                            //                         <FaChevronDown fontSize={10} />
                                            //                     )}
                                            //                     <div className="custom-checkInput__container">
                                            //                         <label className="custom-checkInput__label">
                                            //                             <input
                                            //                                 type="checkbox"
                                            //                                 checked={futurePairsList.some((el) => el === record.pairId)}
                                            //                                 onChange={() => {
                                            //                                     manageCloseOrder(record.pairId)
                                            //                                 }}
                                            //                             />
                                            //                             <span className="custom-checkInput__checkmark"></span>
                                            //                         </label>
                                            //                     </div>
                                            //                 </div>
                                            //             </td>
                                            //             <td className="text-start">{capitalize(record.tradeMode)}</td>
                                            //             <td className="text-start">
                                            //                 <div className='table-flexStart'>
                                            //                     {tradeMode === 'options' && <div className={record.symbolType == 'buy' ? 'table-buy__indicator' : "table-sell__indicator"}> <span>{record.symbolType == 'buy' ? "B" : "S"} </span></div>}
                                            //                     <p>{record.pairName}</p>
                                            //                 </div>
                                            //             </td>
                                            //             <td className="">
                                            //                 <div className='table-flexColEnd'>
                                            //                     <p>
                                            //                         {record?.orderValue}
                                            //                         <span className='table-value__light ms-1'>{record?.pairData?.quoteCurrency}</span>
                                            //                     </p>
                                            //                     <p className='table-value__light-xs'><span className='table-value__profit'>{record?.positionFilled}</span> size</p>
                                            //                 </div>
                                            //             </td>

                                            //             <td className="">
                                            //                 <p>{record?.entryPrice} {record?.pairData?.quoteCurrency}</p>
                                            //             </td>
                                            //             <td className="">
                                            //                 <div className='table-flexColEnd'>
                                            //                     <p>
                                            //                         {record?.close_price} {record?.pairData?.quoteCurrency}
                                            //                     </p>
                                            //                     {/* <p className='table-value__light-xs'> 0</p> */}
                                            //                 </div>
                                            //             </td>
                                            //             <td className="">
                                            //                 <div className='table-flexColEnd'>
                                            //                     {/* dynamic class for positive and negative - table-value__profit , table-value__loss */}
                                            //                     <p className={record.pnl > 0 ? `table - value__profit` : "table-value__loss"}>
                                            //                         {record?.pnl?.toFixed(record?.pairData?.quoteDecimal)} <span className='ms-1'>{record?.pairData?.quoteCurrency}</span>
                                            //                     </p>
                                            //                     <p className='table-value__light-xs table-value__loss'> {record?.pnl_percen?.toFixed(2)} <span className='ms-1'>%</span></p>
                                            //                 </div>
                                            //             </td>
                                            //             <td className="">
                                            //                 <p><span className="table-value__light">TP ({record?.pairData?.quoteCurrency}) :</span> {isEmpty(record?.takeprofit?.stopPrice) ? "--" : record?.takeprofit?.stopPrice}</p>
                                            //                 <p><span className="table-value__light">SL ({record?.pairData?.quoteCurrency}) :</span> {isEmpty(record?.stoploss?.stopPrice) ? "--" : record?.stoploss?.stopPrice}</p>
                                            //             </td>{" "}
                                            //             <td
                                            //                 // className="table-col__sticky-end table-width__120"
                                            //                 className={`${currentStandardViewTableRow != null && "sticky-none"} table-col__sticky-end table-width__120`}
                                            //             >
                                            //                 {/* {index === currentPatientDetails ? (
                                            //                 <FaChevronUp />
                                            //             ) : (
                                            //                 <FaChevronDown />
                                            //             )} */}

                                            //                 <div className={`table-flexCenter`}>
                                            //                     <Button
                                            //                         isLoading={false}
                                            //                         loadingText=""
                                            //                         btnText=""
                                            //                         onClick={() => { console.log('close') }}
                                            //                         className="dangerOuterlineButtonXs"
                                            //                         selectedValue={null}
                                            //                         reactIconElement={<IoClose />}
                                            //                     />
                                            //                 </div>
                                            //             </td>
                                            //         </>
                                            //     </tr>

                                            //     {record._id === currentStandardViewTableRow ? (
                                            //         <tr className={`tableContainterDetails`}>

                                            //             <td colSpan={10} className='text-center'>
                                            //                 <div className={styles.tableDetailsGrid}>
                                            //                     <div className={styles.tdGridOne}>
                                            //                         <div className={styles.gridOneContainer}>
                                            //                             <div className={styles.gridOneLeft}>
                                            //                                 <p className={''}><span className={`me-2 table-value__light`}>UPNL</span><span className={`me-2 ${record?.pnl > 0 ? "table-value__profit" : "table-value__loss"}`}>{record?.pnl?.toFixed(record?.pairData?.quoteDecimal)} {record?.pairData?.quoteCurrency}</span><span>{`(${record?.pnl_percen?.toFixed(2)})`}%</span></p>
                                            //                             </div>
                                            //                             {/* <div className={styles.gridOneCenter}>
                                            //                                 <p className={''}><span className='me-2 table-value__light'>Realized Cashflows</span><span className='me-2'>{record?.pnlPercentage?.toFixed(2)}</span><span className='me-2 table-value__light'>USD</span></p>
                                            //                             </div> */}
                                            //                             <div className={styles.gridOneRight}>
                                            //                                 <Link className="cardSuccessBtnXs" to="/futures" target="_blank" rel="noopener noreferrer">
                                            //                                     Trade
                                            //                                 </Link>
                                            //                                 {/* <Button
                                            //                                 isLoading={false}
                                            //                                 loadingText="Redirecting..."
                                            //                                 btnText="Trade"
                                            //                                 onClick={() => {

                                            //                                 }}
                                            //                                 className="cardSuccessBtnXs"
                                            //                                 selectedValue={null}
                                            //                             /> */}
                                            //                                 <Button
                                            //                                     isLoading={false}
                                            //                                     loadingText="Redirecting..."
                                            //                                     btnText="Share Position"
                                            //                                     onClick={() => console.log('clear')}
                                            //                                     className="cardSuccessBtnXs"
                                            //                                     selectedValue={null}
                                            //                                 />
                                            //                             </div>
                                            //                         </div>
                                            //                     </div>
                                            //                     <div className={styles.tdGridTwo}>
                                            //                         <div className={styles.tdGridTwoContainer}>
                                            //                             <div className={`${styles.tableDropdownTabs} mb-3`}>
                                            //                                 <button
                                            //                                     aria-label='market'
                                            //                                     className={`${currentTradeType == 'market' ? styles.active : ''} `}
                                            //                                     onClick={() => setCurrentTradeType('market')}>
                                            //                                     Market</button>
                                            //                                 <button
                                            //                                     aria-label='limit'
                                            //                                     className={`${currentTradeType == 'limit' ? styles.active : ''} `}
                                            //                                     onClick={() => setCurrentTradeType('limit')}>Limit</button>
                                            //                             </div>

                                            //                             <div className={`${styles.tdGridTwoContainerBody} mt - 4`}>
                                            //                                 {currentTradeType === 'limit' &&
                                            //                                     <div className='table-flexColStart '>
                                            //                                         <InputWithCurrencyAndLabel
                                            //                                             id={'limitAmount'}
                                            //                                             name={'price'}
                                            //                                             onChange={(name, value) => {
                                            //                                                 changeExpectedLoss(record?.entryPrice, value, formData?.quantity, record.positionSide)
                                            //                                             }}
                                            //                                             placeholder={'Price'}
                                            //                                             type={'number'}
                                            //                                             value={formData?.price}
                                            //                                             disabled={false}
                                            //                                             key={'limitAmount'}
                                            //                                             readOnly={false}
                                            //                                             currency={record?.pairData?.quoteCurrency}
                                            //                                             error={null}
                                            //                                             className={"InputTextStartCurrencyAndLabel"} />
                                            //                                         <span>{errors?.price}</span>


                                            //                                     </div>
                                            //                                 }
                                            //                                 <div className='table-flexColStart '>
                                            //                                     <p className='table-value__light'>Quantity</p>
                                            //                                     <div className={'dualBtn-input'}>
                                            //                                         <div className='dualBtn-input__left'>
                                            //                                             <button
                                            //                                                 aria-label='percentage'
                                            //                                                 className={formData.percentage == 50 ? 'active' : ''}
                                            //                                                 onClick={() => { changePercentage(50, record) }}>50%</button>
                                            //                                             <button
                                            //                                                 aria-label='percentage'
                                            //                                                 className={formData.percentage == 100 ? 'active' : ''}
                                            //                                                 onClick={() => { changePercentage(100, record) }}>100%</button>
                                            //                                         </div>


                                            //                                         <div className='dualBtn-input__right'>
                                            //                                             <input type="text" value={formData?.quantity}
                                            //                                                 onChange={(e) => { setFormData({ ...formData, ...{ quantity: e.target.value } }) }} />
                                            //                                         </div>
                                            //                                     </div>
                                            //                                     <span>{errors?.quantity}</span>

                                            //                                 </div>
                                            //                                 <div className={`${styles.tdGridTwoFooter} mt-5`}>
                                            //                                     <div>
                                            //                                         <p className='table-value__light'>Expected Loss</p>

                                            //                                         {/* dynamic class - table-value__profit , table-value__loss */}

                                            //                                         <p className={`mt-2 text-start table-value__loss`}>{formData.expectedProfit.toFixed(record?.pairData?.quoteDecimal)} {record?.pairData?.quoteCurrency}</p>
                                            //                                     </div>

                                            //                                     <Button
                                            //                                         isLoading={false}
                                            //                                         loadingText="Redirecting..."
                                            //                                         btnText="Close Position"
                                            //                                         className="successOutLineRectangleBtn"
                                            //                                         selectedValue={null}
                                            //                                         onClick={() => closingPositionOrder(record)}
                                            //                                     />

                                            //                                 </div>
                                            //                             </div>
                                            //                         </div>
                                            //                     </div>
                                            //                     <div className={styles.tdGridThree}>
                                            //                         <div className={styles.tdGridThreeContainer}>
                                            //                             <div className='table-flexStart'>
                                            //                                 <p>Margin</p>
                                            //                                 <div className='table-badge__xs mx-2'>{userdetails?.tradeMode}</div>

                                            //                                 {/* {showMarginEdit ?
                                            //                                     <>
                                            //                                         <Button
                                            //                                             isLoading={false}
                                            //                                             loadingText=""
                                            //                                             btnText=""
                                            //                                             onClick={() => { handleCloseMarginEdit() }}
                                            //                                             className="successOuterlineButtonXs"
                                            //                                             selectedValue={null}
                                            //                                             reactIconElement={<IoMdCheckmark />}
                                            //                                         />
                                            //                                         <Button
                                            //                                             isLoading={false}
                                            //                                             loadingText=""
                                            //                                             btnText=""
                                            //                                             onClick={() => { handleCloseMarginEdit() }}
                                            //                                             className="dangerOuterlineButtonXs"
                                            //                                             selectedValue={null}
                                            //                                             reactIconElement={<IoClose />}
                                            //                                         />
                                            //                                     </>
                                            //                                     : <Button
                                            //                                         isLoading={false}
                                            //                                         loadingText="Redirecting..."
                                            //                                         btnText="Edit"
                                            //                                         onClick={() => handleShowMarginEdit()}
                                            //                                         className="cardSuccessBtnXxs"
                                            //                                         selectedValue={null}
                                            //                                     />
                                            //                                 } */}

                                            //                             </div>

                                            //                             <div className={`${styles.tdGridThreeBody} mt - 4`}>
                                            //                                 {/* <div className='table-flexColStart'>
                                            //                                     <p className='table-value__light'>Auto top-up</p>
                                            //                                     <div className="custom-toggle__secondaryXs">
                                            //                                         <label className="switch">
                                            //                                             <input
                                            //                                                 type="checkbox"
                                            //                                             />
                                            //                                             <span className="slider round"></span>
                                            //                                         </label>
                                            //                                     </div>
                                            //                                 </div> */}
                                            //                                 <div className='table-flexColStart mt-4'>
                                            //                                     <p className='table-value__light'>Est. Liquidation Price</p>
                                            //                                     <p>{record?.liquidityPrice} <span className='ms-2 table-value__light'>{record?.pairData?.quoteCurrency}</span></p>
                                            //                                 </div>
                                            //                                 {/* <div className='table-flexColStart mt-4'>
                                            //                                     <p className='table-value__light'>Assigned Margin</p>
                                            //                                     <p>{record?.initialMargin} <span className='ms-2 table-value__light'>USD</span></p>
                                            //                                 </div> */}

                                            //                                 {showMarginEdit ?
                                            //                                     <div className='table-flexColStart mt-4'>
                                            //                                         <p className='table-value__light'>Assigned Margin</p>
                                            //                                         <div className={'dualBtn-input'}>
                                            //                                             <div className='dualBtn-input__left'>
                                            //                                                 <button
                                            //                                                     aria-label='min'
                                            //                                                     className={currentMarginType == 'minimum' ? 'active' : ''}
                                            //                                                     onClick={() => setCurrentMarginType('minimum')}>Min</button>
                                            //                                                 <button
                                            //                                                     aria-label='max'
                                            //                                                     className={currentMarginType == 'maximum' ? 'active' : ''}
                                            //                                                     onClick={() => setCurrentMarginType('maximum')}>Max</button>
                                            //                                             </div>

                                            //                                             <div className='dualBtn-input__right'>
                                            //                                                 <input type="text" value='1.31' />
                                            //                                             </div>

                                            //                                         </div>
                                            //                                     </div>
                                            //                                     :
                                            //                                     <>
                                            //                                         <div className='table-flexColStart mt-4'>
                                            //                                             <p className='table-value__light'>Assigned Margin</p>
                                            //                                             <p>{record?.initialMargin} <span className='ms-2 table-value__light'>{record?.pairData?.quoteCurrency}</span></p>
                                            //                                         </div>
                                            //                                         {/* <div className='table-flexColStart mt-4'>
                                            //                                             <p className='table-value__light'>Effective Lev.</p>
                                            //                                             <p>101.14x</p>
                                            //                                         </div> */}
                                            //                                     </>}

                                            //                             </div>
                                            //                         </div>
                                            //                     </div>
                                            //                     <div className={styles.tdGridFour}>
                                            //                         <div className='table-flexStart'>
                                            //                             <p className={``}>TP / SL</p>
                                            //                         </div>

                                            //                         <div className={`${styles.tdGridThreeBody} mt - 4`}>
                                            //                             <div className='table-flexColStart'>
                                            //                                 <p className='table-value__light'>TP Trigger</p>
                                            //                                 <p>{record?.takeprofit?.stopPrice ?? "-"}</p>
                                            //                             </div>

                                            //                             <div className='table-flexColStart'>
                                            //                                 <p className='table-value__light'>TP Limit</p>
                                            //                                 <p>{record?.takeprofit?.price ?? "-"}</p>
                                            //                             </div>

                                            //                             <div className='table-flexColStart'>
                                            //                                 <p className='table-value__light'>SL Trigger</p>
                                            //                                 <p>{record?.stoploss?.stopPrice ?? "-"}</p>
                                            //                             </div>

                                            //                             <div className='table-flexColStart'>
                                            //                                 <p className='table-value__light'>SL Limit</p>
                                            //                                 <p>{record?.stoploss?.price ?? "-"}</p>
                                            //                             </div>

                                            //                         </div>
                                            //                     </div>
                                            //                 </div>
                                            //             </td>


                                            //         </tr>
                                            //     ) : null}
                                            // </>
                                        )) :
                                        <></>
                                    }
                                </tbody>
                            </table>
                        </div>
                        {!positionOrder.length ? <div className={styles.noDataContainer}>
                            <NoData content={"No Position"} />
                        </div> : <></>}
                    </div>
                </>
                :
                <RiskView positionDetails={positionDetails} />
            }

        </div >
    )
}

export default Position