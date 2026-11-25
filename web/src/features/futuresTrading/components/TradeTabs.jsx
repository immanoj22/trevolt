/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { MdArrowBackIos, MdArrowForwardIos } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useDispatch, useSelector } from "react-redux";
import Swal from 'sweetalert2';

/** LOCAL FILES IMPORT */

import styles from "../styles/tradeTabs.module.css"
import useBreakpoint from "../../../hooks/useBreakpoint";
import Button from "../../../components/Button/Button";
import { PasswordInput, SearchInput } from "../../../components/Input/InputFields";
import Position from "./Position";
import OpenOrders from "./OpenOrders";
import StopOrders from "./StopOrders";
import OrderHistory from "./OrderHistory";
import TrackerAssets from "./TrackerAssets";
import Fills from "./Fills";
import { showToastMessage } from "../../../lib/toast";
import CancelOrder from "../modal/CancelOrder";
import CloseOrderHistory from "./CloseOrder";
import RiskandMarginDetails from "./RiskandMarginDetails";
import SideModel from "../../../components/Modal/SideModel";
import StrategyPayoffPanel from "../../optionsTrading/components/strategyBuilder/StrategyPayoffPanel";
import { mapPositionToContract, getUnderlying } from "../../dashboard/components/RiskView/positionToContract";

/** REDUX */
import { FutureCancelOrders, FuturePairsList } from "../../../redux/futureAction";

/** ACTIONS */
import { futureCancelAllOrder, futureCloseAllOrder } from "../../../actions/futureActions";

/** CONTEXT */
import { useGlobalContext } from "../../../context/GlobalProvider";

/** CODE START */


const TradeTabs = () => {

    const dispatch = useDispatch()
    const { futureCancelOrdersList, futureCancelType, futurePairsList } = useSelector((state) => state.future);
    const { userdetails, positionDetails } = useSelector((state) => state.user);
    const { theme } = useGlobalContext()

    const tradeOrderData = [
        {
            id: 1,
            title: "Position",
            content: <Position />,
        },
        {
            id: 2,
            title: "Open Orders",
            content: <OpenOrders />,
        },
        {
            id: 3,
            title: "Stop Orders",
            content: <StopOrders />,
        },
        {
            id: 4,
            title: "Risk & Margin Details",
            content: <RiskandMarginDetails />,
        },
        {
            id: 5,
            title: "Fills",
            content: <Fills />,
        },
        {
            id: 6,
            title: "Close History",
            content: <CloseOrderHistory />,
        },
        {
            id: 7,
            title: "Order History",
            content: <OrderHistory />,
        }
    ];


    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

    const [containerWidth, setContainerWidth] = useState()
    const [actualButtonContainerWidth, setActualButtonContainerWidth] = useState(0)
    const [enableScrollControl, setEnableScrollControl] = useState(false);
    const [headerRightWidth, setHeaderRightWidth] = useState()
    const [tradeTabSearch, setTradeTabSearch] = useState('')
    const [showSearchBar, setShowSearchBar] = useState(false)
    const [showCancelModal, setShowCancelModal] = useState(false)
    const [showPayoffModal, setShowPayoffModal] = useState(false)

    const screenWidth = useBreakpoint()
    const scrollRef = useRef(null)
    const containerRef = useRef(null);
    const headerRightRef = useRef(null)
    const searchBoxContainerRef = useRef(null)

    const confirmBtnColor = "#2563EB"; // Same for dark and light
    const cancelBtnColor = theme === "dark" ? "#2A2C2F" : "#eaecef";

    const handleSearch = (e) => {
        setTradeTabSearch(e.target.value)
    }

    const handleShowSearchBar = () => {
        setShowSearchBar(!showSearchBar)
    }

    const handleShowCancelModal = () => {
        setShowCancelModal(true)
    }

    const handleHideCancelModal = () => {
        setShowCancelModal(false)
    }

    const categoryScroll = (scrollOffset) => {
        scrollRef.current.scrollLeft += scrollOffset;
    }


    const handleOrderTabClick = (getIndex) => {
        setCurrentOrderIndex(getIndex);
        dispatch(FutureCancelOrders({
            cancelOrdersList: [],
            cancelType: ''
        }))
        dispatch(FuturePairsList({
            pairsList: [],
            closeType: ''
        }))
    };


    const cancelAllOrders = async () => {
        try {
            const payload = {
                orderId: futureCancelOrdersList,
                isOpen: false,
                isStop: false
            }

            Swal.fire({
                title: "Are you sure you want to cancel this order ?",
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
                const { status, message } = await futureCancelAllOrder(payload, userdetails.secretKey);
                showToastMessage(message, status ? 'success' : 'error')
                if (status) {
                    dispatch(FutureCancelOrders({
                        cancelOrdersList: [],
                        cancelType: ''
                    }))
                }
            });



        } catch (e) {
            console.log("cancelAllOrders_err", e);
        }
    }

    const closeAllOrders = async () => {
        try {
            const payload = {
                pairId: futurePairsList
            }
            Swal.fire({
                title: "Are you sure you want to close this order ?",
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

    // Checked positions from the Position tab's own checkboxes (futurePairsList is
    // reset on every tab switch, so while on tab 0 it's exactly this selection) -
    // reused as the payoff panel's contracts, same as Risk View does.
    const selectedPayoffPositions = (positionDetails || []).filter((p) => futurePairsList.includes(p.pairId));
    const selectedPayoffUnderlyings = new Set(selectedPayoffPositions.map(getUnderlying));
    // A payoff diagram only makes sense for one underlying at a time (mixing BTC and
    // ETH legs on one price axis is meaningless), so disable rather than guess.
    const isPayoffDisabled = selectedPayoffPositions.length === 0 || selectedPayoffUnderlyings.size > 1;
    const payoffCurrentPrice = parseFloat(
        selectedPayoffPositions[0]?.close_price
        ?? selectedPayoffPositions[0]?.pairData?.last
        ?? selectedPayoffPositions[0]?.pairData?.underlyingPrice
    ) || 0;
    const payoffBaseCurrency = selectedPayoffPositions[0] ? getUnderlying(selectedPayoffPositions[0]) : '';

    const closeSelectedPayoffPositions = async (positionsToClose) => {
        if (!positionsToClose?.length) return;
        const payload = { pairId: positionsToClose.map((p) => p.pairId) };
        Swal.fire({
            title: "Are you sure you want to close this order ?",
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
            const { status, message } = await futureCloseAllOrder(payload, userdetails.secretKey);
            showToastMessage(message, status ? 'success' : 'error');
            if (status) {
                dispatch(FuturePairsList({ pairsList: [], closeType: '' }));
                setShowPayoffModal(false);
            }
        });
    };

    useEffect(() => {
        const containerDiv = containerRef.current;
        const headerRightDiv = headerRightRef.current;

        if (!containerDiv && !headerRightDiv) return;

        // rAF-debounced and threshold-guarded: without this, any tiny
        // (sub-pixel-rounding-level) measurement change on every observer
        // firing would still count as "different" and keep nudging
        // containerWidth/headerRightWidth by a pixel or two each time —
        // which shows up as the tab bar continuously drifting sideways
        // even though nothing the user did actually changed its size.
        let frame = null;
        const observer = new ResizeObserver(() => {
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (containerDiv?.offsetHeight) {
                    setContainerWidth((prev) => {
                        const next = containerDiv.offsetWidth;
                        return prev !== undefined && Math.abs(prev - next) < 2 ? prev : next;
                    });
                }
                if (headerRightDiv?.offsetHeight) {
                    setHeaderRightWidth((prev) => {
                        const next = headerRightDiv.offsetWidth;
                        return prev !== undefined && Math.abs(prev - next) < 2 ? prev : next;
                    });
                }
            });
        });

        if (containerDiv) observer.observe(containerDiv);
        if (headerRightDiv) observer.observe(headerRightDiv);

        return () => {
            observer.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    useEffect(() => {
        if (!scrollRef.current) {
            return;
        }
        let frame = null;
        const resizeObserver = new ResizeObserver(() => {
            if (frame) cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                if (scrollRef.current?.scrollWidth) {
                    const next = scrollRef.current.scrollWidth;
                    setActualButtonContainerWidth((prev) => (Math.abs(prev - next) < 2 ? prev : next));
                }
            });
        });
        resizeObserver.observe(scrollRef.current);
        return function cleanup() {
            resizeObserver.disconnect();
            if (frame) cancelAnimationFrame(frame);
        };
    }, [scrollRef.current]);

    useEffect(() => {
        const shouldEnable = (containerWidth - 48 - headerRightWidth - 52 < actualButtonContainerWidth);

        /** calculate - 48px ==> padding left and right of header class -> 16 + 16 = 32px , gap of header class -> 16px*/

        /** 98px = 32 + 20 + 46 */

        /** calculate - 52px ==> width of headerScrollButton class svg -> 16 + 16 = 32px , gap of headerLeftContainer class -> 10 + 10 = 20px */

        /** 52px = 32 + 20  */

        setEnableScrollControl(shouldEnable);

    }, [containerWidth, actualButtonContainerWidth, screenWidth]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchBoxContainerRef.current && !searchBoxContainerRef.current.contains(event.target)) {
                setShowSearchBar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // console.log('setContainerWidth', actualButtonContainerWidth)

    const isNotFirstOrder = currentOrderIndex !== 0;
    const hasCancelOrders = futureCancelOrdersList.length > 0;
    const isCancelAll = futureCancelType === "all";
    const isCloseAll = futureCancelType === "all"
    // console.log("isCancelAll_Det", isCancelAll)

    const isDisabled = isNotFirstOrder
        ? !(isCancelAll || hasCancelOrders)
        : futurePairsList.length <= 0;

    const btnText = isNotFirstOrder
        ? isCancelAll
            ? "Cancel All"
            : `Cancel ${hasCancelOrders ? futureCancelOrdersList.length + " order" : ""} `
        : isCloseAll ? "Close All"
            : "Close";

    const handleClick = () => {
        isNotFirstOrder ? btnText === "Cancel All" ? handleShowCancelModal() : cancelAllOrders() : closeAllOrders();
    };

    return (

        <>

            <CancelOrder show={showCancelModal} handleClose={handleHideCancelModal} />

            <div className={styles.container}
                ref={containerRef}>
                <div className={styles.header} data-panel-drag-handle="true">
                    <div className={styles.headerLeftContainer}
                        style={{ width: `${containerWidth - 48 - headerRightWidth}px` }}>

                        {enableScrollControl ?
                            <button
                                aria-label="arrowBack"
                                className={`${styles.headerScrollButton} ${styles.left}`}
                                onClick={() => categoryScroll(-50)}>
                                <MdArrowBackIos />
                            </button>
                            :
                            <></>
                        }
                        <div className={styles.headerLeftButtons}
                            style={{ width: `fit-content` }}
                            ref={scrollRef}>
                            {tradeOrderData.map((tabs, index) => {
                                if (userdetails.marginMode != 'portfolio' && tabs.title == "Risk & Margin Details") {
                                    return false
                                }
                                return (
                                    <button
                                        aria-label={tabs.title}
                                        data-click-effect="none"
                                        key={index}
                                        onClick={() => handleOrderTabClick(index)}
                                        className={`${styles.headerTabs}
                                 ${currentOrderIndex === index ? styles.active : ""}`}
                                    >
                                        {tabs.title}
                                    </button>
                                )
                            })}
                        </div>
                        {enableScrollControl ?
                            <button
                                aria-label="arrowForward"
                                className={`${styles.headerScrollButton} ${styles.right}`}
                                onClick={() => categoryScroll(50)}>
                                <MdArrowForwardIos />
                            </button> : <></>
                        }
                    </div>
                    <div
                        className={styles.headerRight}
                        ref={headerRightRef}
                    >

                        {/* mobile responsive - start */}

                        <div className={styles.headerRightMobile}>
                            {/* <div className={styles.searchBoxContainer}>
                                <button
                                    aria-label="searchIcon"
                                    className={styles.searchButtonXs}
                                    onClick={handleShowSearchBar}>
                                    <FiSearch fontSize={14} />
                                </button>
                                <div
                                    className={`${styles.searchBoxWrapper} ${showSearchBar ? styles.active : ""}`}
                                    ref={searchBoxContainerRef}>
                                    <SearchInput
                                        type={"text"}
                                        error={null}
                                        onChange={handleSearch}
                                        disabled={false}
                                        placeholder={"Search"}
                                        value={tradeTabSearch}
                                        name={"tableSearch"}
                                        className={"defaultSearch"}
                                        readOnly={false}
                                        showSearchIcon={false}
                                    />

                                </div>
                            </div> */}
                            {/* <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText=""
                            onClick={() => {}}
                            className="dangerOuterlineButton"
                            selectedValue={null}
                            reactIconElement={<IoClose />}
                        /> */}
                        </div>

                        {/* mobile responsive - end */}

                        <div className={styles.headerRightDesktop}>
                            {/* <SearchInput
                                type={"text"}
                                error={null}
                                onChange={handleSearch}
                                disabled={false}
                                placeholder={"Search"}
                                value={tradeTabSearch}
                                name={"tableSearch"}
                                className={"defaultSearch"}
                                readOnly={false}
                                showSearchIcon={true}
                            /> */}
                            {/* {
                                currentOrderIndex === 0 && (
                                    <Button
                                        isLoading={false}
                                        loadingText="Loading..."
                                        disabled={isPayoffDisabled}
                                        btnText={'Payoff'}
                                        onClick={() => setShowPayoffModal(true)}
                                        className="cardBtnRectangleSm"
                                        selectedValue={null}
                                    />
                                )
                            } */}
                            {
                                [3, 4, 5, 6].includes(currentOrderIndex) ? "" : <Button
                                    isLoading={false}
                                    loadingText="Redirecting..."
                                    disabled={isDisabled}
                                    btnText={btnText}   
                                    onClick={handleClick}
                                    className="dangerOuterlineButton"
                                    selectedValue={null}
                                />
                            }

                        </div>
                    </div>
                </div>
                <div className={styles.body}>
                    {tradeOrderData[currentOrderIndex] &&
                        tradeOrderData[currentOrderIndex].content}
                </div>
            </div>

            {/* {showPayoffModal && (
                <SideModel
                    show={showPayoffModal}
                    title={`${payoffBaseCurrency} contracts Payoff`}
                    handleClose={() => setShowPayoffModal(false)}
                >
                    <StrategyPayoffPanel
                        contracts={selectedPayoffPositions.map(mapPositionToContract)}
                        currentPrice={payoffCurrentPrice}
                        baseCurrency={payoffBaseCurrency}
                        multiplier={1}
                        positions={selectedPayoffPositions}
                        onCloseSelected={closeSelectedPayoffPositions}
                    />
                </SideModel>
            )} */}
        </>
    );
};

export default TradeTabs;