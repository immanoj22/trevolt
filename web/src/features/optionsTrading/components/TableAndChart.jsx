/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState, useContext } from 'react'
import { useDispatch, useSelector } from "react-redux";
import { FaAngleDown } from "react-icons/fa6";
import Offcanvas from 'react-bootstrap/Offcanvas';
import { IoClose } from "react-icons/io5";
import { useParams, useNavigate } from "react-router-dom";
import isEmpty from 'is-empty';
import { CiMenuKebab } from "react-icons/ci";


/** LOCAL FILES IMPORT */

import styles from "../styles/tableAndChart.module.css"
import TradedPriceChart from './TradedPriceChart'
import MarkPriceChart from './MarkPriceChart'
import FundingChart from './FundingChart'
import DepthChart from './DepthChart'
import useBreakpoint from '../../../hooks/useBreakpoint'
import CallPutTable from './CallPutTable';
import { SearchInput } from '../../../components/Input/InputFields';
import Button from '../../../components/Button/Button';
import DateFilters from './DateFilters';
import NoData from '../../../components/NoData/NoData';
import { TableHead } from '../../../utils/tableDatas';
import CustomDropdown from '../../../components/UiComponents/DropDownComponent';
import StrategyBuilder from './StrategyBuilder';
import ClickableTooltip from './ClickableTooltip';

/** REDUX */
import { Options, UnderlyingData } from '../../../redux/optionAction';

/** Context */
import SocketContext from "../../../context/socketContext";
import { getDateDifference } from '../../../lib/dateTimeHelper';
import { getOptionDetails } from '../../../actions/OptionTradeAction';
import { findBetweenArray } from '../constants';
import TradingViewChart from '../../futuresTrading/components/TradingViewChart';
import config from '../../../config/env';
import { FaRegFileAlt } from 'react-icons/fa';

/** CODE START */

const TableAndChart = ({
    isStrategyBuilderEnable,
    handleStrategyBuilderChange,
    selectedView,
    setSelectedView
}) => {

    const navigate = useNavigate();
    const dispatch = useDispatch();
    const socketContext = useContext(SocketContext);
    const { underlyingSymbol, tikerRoot } = useParams();
    const { underlyingDetails, optionsData, underlyingData } = useSelector((state) => state.option)
    // console.log(underlyingData, "underlyingDetails")

    const width = useBreakpoint()

    const containerRef = useRef(null);
    const scrollRef = useRef(null)

    const [containerHeight, setContainerHeight] = useState()
    const [containerWidth, setContainerWidth] = useState()
    const [actualFilterButtonContainerWidth, setActualFilterButtonContainerWidth] = useState(0)
    const [enableFilterScrollControl, setEnableFilterScrollControl] = useState(false);
    // const [selectedView, setSelectedView] = useState('table')
    const [selectedCurrency, setSelectedCurrency] = useState('btc')
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const [showTableOffCanva, setShowTableOffCanva] = useState(false)
    const [tradeTableSearch, setTradeTableSearch] = useState('')
    const [selectExpireDate, setSelectExpireDate] = useState(null)
    const [headCheck, setHeadCheck] = useState([]);
    const [showMenu, setShowMenu] = useState(false);



    const [expireDate, setExpireDate] = useState(optionsData || [])

    const [tableData, setTableData] = useState([
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
        { id: 1 },
    ])

    const tradeChartData = [
        {
            id: 1,
            title: "Traded Price",
            content: <TradingViewChart
                symbol={tikerRoot}
                interval='5'
                containerId='tv_chart_container'
                datafeedUrl={`${config.API_URL}/option`}
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
                tradeType={'option'}
            />,
        },
        {
            id: 2,
            title: "Mark Price",
            content: <MarkPriceChart />,
        },
        {
            id: 3,
            title: "Funding",
            content: <FundingChart />,
        },
        {
            id: 4,
            title: "Depth",
            content: <DepthChart />,
        },

    ];

    const handleTradeTableSearch = (e) => {
        setTradeTableSearch(e.target.value)
    }
    const handleShowTableOffCanva = () => {
        setShowTableOffCanva(true)
    }
    const handleCloseTableOffCanva = () => {
        setShowTableOffCanva(false)
    }
    const handleChangeChart = (getIndex) => {
        setCurrentOrderIndex(getIndex);
    };

    const categoryScroll = (scrollOffset) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({
                left: scrollOffset,
                behavior: "smooth",
            });
        }
    }


    useEffect(() => {
        const containerDiv = containerRef.current;
        if (!containerDiv) return;
        const observer = new ResizeObserver(() => {
            if (containerDiv?.offsetHeight) {
                setContainerWidth(containerDiv.offsetWidth);
                setContainerHeight(containerDiv.offsetHeight);
            }
        });

        if (containerDiv) observer.observe(containerDiv);

        return () => observer.disconnect();
    }, []);


    useEffect(() => {
        if (!scrollRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            if (scrollRef.current.scrollWidth) {
                setActualFilterButtonContainerWidth(scrollRef.current.scrollWidth);
            }
        });
        resizeObserver.observe(scrollRef.current);
        return function cleanup() {
            resizeObserver.disconnect();
        };
    }, [scrollRef.current]);

    useEffect(() => {
        const shouldEnable = (containerWidth - 48 - 30 - 52 < actualFilterButtonContainerWidth);

        /** calculate - 48px ==> padding left and right of header class -> 16 + 16 = 32px , gap of header class -> 16px*/

        /** 98px = 32 + 20 + 46 */

        /** calculate - 52px ==> width of headerScrollButton class svg -> 16 + 16 = 32px , gap of headerLeftContainer class -> 10 + 10 = 20px */

        /** 52px = 32 + 20  */

        setEnableFilterScrollControl(shouldEnable);

    }, [containerWidth, actualFilterButtonContainerWidth, width]);

    useEffect(() => {
        setHeadCheck(TableHead.map(h => h.name));
    }, []);

    const fetchContractDetails = async (underlyingAsset, expiryDateStr) => {
        const { data } = await getOptionDetails({
            underlyingAsset: underlyingAsset,
            expiryDateStr: expiryDateStr
        }, dispatch);
        return data;
    }

    const setInitialDetails = async (selectedCurrency) => {
        const underlyingData = underlyingDetails?.find((val) => (val.symbol == selectedCurrency))
        const options = underlyingData?.options
        const expiryDateStr = options?.[0]?._id;
        const contractData = await fetchContractDetails(selectedCurrency, expiryDateStr)
        const tickerIndex = findBetweenArray(contractData?.[0]?.strikePrice, underlyingData?.marketPrice)
        const safeIndex = Number.isInteger(tickerIndex) ? tickerIndex : 0;
        const pair = contractData?.[0]?.callpair?.[safeIndex]?.tickerRoot || contractData?.[0]?.callpair?.[0]?.tickerRoot
        // const pair = contractData?.[0]?.callpair?.[0]?.tickerRoot
        localStorage.setItem("optionspair", pair)
        navigate(`/options/${selectedCurrency}/${pair}`, { replace: true });
        dispatch(Options({ optionsData: options }))
        dispatch(UnderlyingData({
            underlyingData: {
                _id: underlyingData?._id,
                symbol: underlyingData?.symbol,
                marketPrice: underlyingData?.marketPrice,
                minQuantity: underlyingData?.minQuantity,
            }
        }))
        return true;
    }

    useEffect(() => {
        setExpireDate(Array.isArray(optionsData) ? optionsData : [])
    }, [optionsData])

    useEffect(() => {
        setSelectedCurrency(underlyingSymbol?.toLowerCase())
    }, [underlyingSymbol])

    const checkHead = (name) => {
        if (name === 'head-1') return;
        setHeadCheck(prev =>
            prev.includes(name)
                ? prev.filter(n => n !== name)
                : [...prev, name]
        );
    };

    useEffect(() => {
        if (!isEmpty(tikerRoot) && !isEmpty(optionsData)) {
            const [, expiryDateStr] = tikerRoot.split('-')
            let option = optionsData.find((val) => (val?.expiryDateStr == expiryDateStr));
            setSelectExpireDate(option?.expiryDate)
        }
    }, [tikerRoot, optionsData])

    return (
        <>
            <div className={styles.container}
                ref={containerRef}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={`${styles.headerViewTabs} d-none d-lg-block`}>
                            <button className={`${selectedView == 'table' ? styles.active : ""}`} onClick={() => setSelectedView('table')}>Table</button>
                            <button className={`${selectedView == 'chart' ? styles.active : ""}`} onClick={() => setSelectedView('chart')}>Chart</button>
                        </div>

                        {selectedView == 'table' ?
                            <div className={styles.currencyTabs}>
                                {underlyingDetails?.length > 0 ?
                                    // Only list underlying assets that actually have at least
                                    // one active option contract — an asset with no contracts
                                    // has nothing to show and just leads straight to the Coming
                                    // Soon page if selected, so it's filtered out of the tabs.
                                    underlyingDetails
                                        .filter((val) => Array.isArray(val?.options) && val.options.length > 0)
                                        .map((val) => {
                                            return (
                                                <button
                                                    key={val?._id || val?.symbol}
                                                    className={`${selectedCurrency == val?.symbol?.toLowerCase() ? styles.active : ''}`}
                                                    onClick={() => {
                                                        setSelectedCurrency(val?.symbol?.toLowerCase())
                                                        setInitialDetails(val?.symbol)
                                                    }}
                                                >
                                                    {val.symbol}
                                                </button>
                                            )
                                        }) : ""}
                                {/* <button className={`${selectedCurrency == 'btc' ? styles.active : ''}`} onClick={() => setSelectedCurrency('btc')}>BTC</button>
                                <button className={`${selectedCurrency == 'eth' ? styles.active : ''}`} onClick={() => setSelectedCurrency('eth')}>ETH</button> */}
                            </div> :
                            <button className={styles.tableOffcanvas} onClick={handleShowTableOffCanva}>
                                <p className={styles.tableOffcanvasTitle}>C-EURUSD-1.0850-271126</p>
                                <div className={styles.tableOffcanvasBadge}>100x</div>
                                <span className={`${styles.tableOffcanvasIcon} ${showTableOffCanva ? styles.active : ""}`}><FaAngleDown />
                                </span>
                            </button>
                        }

                    </div>


                    <div className={styles.headerRight}>
                        {/* <button>Resource</button> */}
                        <div className={styles.strategyBuilderContainer}>
                            <div className='d-flex align-items-center gap-2'>
                                <p className={styles.strategyText}>Strategy builder</p>
                                <div className="custom-toggle__secondaryXs">
                                    <label className="switch">
                                        <input
                                            type="checkbox"
                                            checked={isStrategyBuilderEnable}
                                            onChange={handleStrategyBuilderChange}
                                        />
                                        <span className="slider round"></span>
                                    </label>
                                </div>
                            </div>
                            {/* <div className={styles.menuWrapper}>
                                <div
                                    onClick={() => setShowMenu((prev) => !prev)}
                                    className={styles.menuButton}
                                >
                                    <CiMenuKebab />
                                </div>

                                {showMenu && (
                                    <div className={styles.settlementPopup}>
                                        <div
                                            className={styles.settlementItem}
                                            onClick={() => navigate("/expired-futures-and-options")}
                                        >
                                            <FaRegFileAlt className={styles.settlementIcon} />
                                            <span>Settlement Prices</span>
                                        </div>
                                    </div>
                                )}
                            </div> */}
                        </div>
                    </div>
                </div>

                <div className={styles.body}>

                    {selectedView == 'table' ?
                        <div className={styles.tableSection}>
                            <div className={styles.filterContainer}>
                                <div className={styles.filterContainerLeft}>
                                    <DateFilters
                                        enableFilterScrollControl={enableFilterScrollControl}
                                        expireDate={expireDate}
                                        scrollRef={scrollRef}
                                        categoryScroll={categoryScroll}
                                        className={styles.expireDateButtons} />
                                </div>
                                <div className={`${styles.fitlerContainerRight} d-flex align-items-center`}>
                                    <div className={styles.arrowNavigation}>
                                        <button
                                            aria-label='arrowBack'
                                            className={styles.arrowBtn}
                                            onClick={() => categoryScroll(-50)}>
                                            ‹
                                        </button>

                                        <button
                                            aria-label='arrowForward'
                                            className={styles.arrowBtn}
                                            onClick={() => categoryScroll(50)}>
                                            ›
                                        </button>
                                    </div>
                                    <CustomDropdown icon={false}
                                        toggleElement={
                                            <div className={styles.tableFilterButton}>
                                                <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg" data-palette="FourSquareBox"><path d="M2.5 12.25H0.75V11.0834H2.5V9.91671H4.25V13.4167H2.5V12.25ZM2.5 2.91671H0.75V1.75004L2.5 1.75004V0.583374L4.25 0.583374V4.08337H2.5V2.91671ZM9.5 6.41671H11.25V7.58337H9.5V8.75004H7.75V5.25004H9.5V6.41671ZM6.58333 6.41671V7.58337L0.75 7.58337V6.41671L6.58333 6.41671ZM5.41667 1.75004L11.25 1.75004V2.91671L5.41667 2.91671V1.75004ZM5.41667 11.0834H11.25V12.25H5.41667V11.0834Z" fill="currentColor"></path></svg>
                                            </div>
                                        }
                                        menuItems={
                                            <div className={styles.tableFilterOptions}>
                                                {TableHead.map((head, index) => (
                                                    <div className="custom-checkInput__container3 mb-2" key={index}>
                                                        <label className="custom-checkInput__label3">
                                                            <input
                                                                type="checkbox"
                                                                id={`head-${index}`}
                                                                checked={headCheck.includes(head.name)}
                                                                onChange={() => checkHead(head.name)}
                                                            />
                                                            <span className="custom-checkInput__checkmark3"></span>
                                                        </label>
                                                        <p className="custom-checkInput__content3">
                                                            {head.name}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        }
                                    />
                                    <div className={styles.menuWrapper}>
                                        <div
                                            onClick={() => setShowMenu((prev) => !prev)}
                                            className={styles.menuButton}
                                        >
                                            <CiMenuKebab />
                                        </div>

                                        {showMenu && (
                                            <div className={styles.settlementPopup}>
                                                <div
                                                    className={styles.settlementItem}
                                                    onClick={() => navigate("/expired-futures-and-options")}
                                                >
                                                    <FaRegFileAlt className={styles.settlementIcon} />
                                                    <span>Settlement Prices</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>


                            </div>
                            <div className={styles.tableHeaders}>
                                <p className={styles.title}>Calls</p>
                                <div className={styles.tableHeaderExpireContainer}>
                                    <p className={styles.title}>{underlyingSymbol}

                                        {/* dynamic class - styles.high , styles.low */}

                                        <span className={`${styles.high} ms-2`}>${underlyingData?.marketPrice}</span>
                                    </p>
                                    <p className={`${styles.title} d-none d-sm-block`}>Time to expiry <span>{getDateDifference(new Date(), selectExpireDate)}</span></p>
                                </div>
                                <p className={styles.title}>Puts</p>
                            </div>

                            <div>
                                <CallPutTable
                                    containerHeight={containerHeight}
                                    checkHead={checkHead}
                                    headCheck={headCheck}
                                    isStrategyBuilderEnable={isStrategyBuilderEnable} />
                                <ClickableTooltip />
                            </div>
                        </div> :
                        <div className={styles.chartSection}>
                            <div className={styles.chartSectionHeader}>
                                <p className={styles.title}>Trading View</p>

                                <div className={styles.headerRightActions}>
                                    {tradeChartData.map((tabs, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleChangeChart(index)}
                                            className={`${styles.headerTabs}
                                                                ${currentOrderIndex === index ? styles.active : ""}`}
                                        >
                                            {tabs.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className={styles.chartSectionBody}>
                                {tradeChartData[currentOrderIndex] &&
                                    tradeChartData[currentOrderIndex].content}
                            </div>
                        </div>
                    }
                </div>
            </div>


            {/* offcanva start */}

            <div className="tradeTableOffcanvasContainer">
                <Offcanvas
                    backdropClassName='tradeTableOffcanvasBackdrop'
                    show={showTableOffCanva}
                    onHide={handleCloseTableOffCanva}
                    className='tradeTableOffcanvasStyles'>
                    <Offcanvas.Body>
                        <div className='tradeTableOffcanvasHeader'>
                            <SearchInput
                                type={"text"}
                                error={null}
                                onChange={handleTradeTableSearch}
                                disabled={false}
                                placeholder={"Search"}
                                value={tradeTableSearch}
                                name={"tableSearch"}
                                className={"secondarySearch"}
                                readOnly={false}
                                showSearchIcon={true}
                            />


                            <Button
                                isLoading={false}
                                loadingText=""
                                btnText=""
                                onClick={handleCloseTableOffCanva}
                                className="rectIconBtn"
                                selectedValue={null}
                                reactIconElement={<IoClose />}
                            />
                        </div>

                        <div className={styles.currencyTabsOffcanvas}>
                            <button className={`${selectedCurrency == 'all' ? styles.active : ''}`} onClick={() => setSelectedCurrency('all')}>All</button>
                            <button className={`${selectedCurrency == 'btc' ? styles.active : ''}`} onClick={() => setSelectedCurrency('btc')}>BTC</button>
                            <button className={`${selectedCurrency == 'eth' ? styles.active : ''}`} onClick={() => setSelectedCurrency('eth')}>ETH</button>
                        </div>

                        <div className={styles.dateFilterContainer}
                        >
                            <DateFilters
                                enableFilterScrollControl={enableFilterScrollControl}
                                expireDate={expireDate}
                                scrollRef={scrollRef}
                                selectExpireDate={selectExpireDate}
                                categoryScroll={categoryScroll}
                                className={styles.offCanvasExpireDateButtons} />
                        </div>

                        <div className={styles.tradeTableOffcanvasSection}>
                            <div className="tradeOffcanvas-sticky-table ">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th className="text-start ">Type</th>
                                            <th className="text-end ">Strikes</th>
                                            <th className="text-end">Expiry Date</th>
                                            <th className="text-end ">Last Price</th>
                                            <th className="text-end">24 change</th>
                                        </tr>
                                    </thead>
                                    <tbody>

                                        {tableData.length > 0 ?
                                            tableData.map((record, index) => (

                                                <tr key={record?._id || record?.id || `${record?.type || 'row'}-${record?.expiryDate || index}`} onClick={handleCloseTableOffCanva}>
                                                    <td className="text-end "><p className={`text-start`}>P-EURUSD</p></td>
                                                    <td className="text-end "><p>103500</p></td>
                                                    <td className="text-end "><p>29 Aug</p></td>
                                                    <td className="text-end ">12730.0</td>

                                                    {/*  dynamic class - 'table-value__profit' || 'table-value__loss' */}

                                                    <td className="text-end ">
                                                        <p className='table-value__profit'>116281.5</p>
                                                    </td>
                                                </tr>
                                            ))
                                            :
                                            <></>
                                        }
                                    </tbody>
                                </table>
                            </div>

                            {!tableData.length ? <div className={styles.noDataContainer}>
                                <NoData content={"No Data"} />
                            </div> : <></>}
                        </div>


                    </Offcanvas.Body>
                </Offcanvas>
            </div>

            {/* <div className="strategyBuilderOffcanvasContainer " >
                <Offcanvas
                    backdropClassName='strategyBuilderOffcanvasBackdrop'
                    show={width > 992 ? false : isStrategyBuilderEnable}
                    onHide={handleCloseTableOffCanva}
                    className='strategyBuilderOffcanvasStyles'>
                    <Offcanvas.Body>

                        <div className='strategyBuilderOffcanvasHeader'>
                            <p className='title'>Strategy Builder</p>
                            <Button
                                isLoading={false}
                                loadingText=""
                                btnText=""
                                onClick={handleStrategyBuilderChange}
                                className="rectIconBtn"
                                selectedValue={null}
                                reactIconElement={<IoClose />}
                            />
                        </div>

                        <div className='mt-3'>
                            <StrategyBuilder />
                        </div>

                    </Offcanvas.Body>
                </Offcanvas>
            </div> */}

            {/* offcanva end */}

        </>
    )
}

export default TableAndChart