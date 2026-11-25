

/** PACKAGE IMPORT */

import React, { useEffect, useRef, useState } from "react";
import { MdArrowBackIos, MdArrowForwardIos } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { FaSearch } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

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



/** CODE START */


const TradeTabs = () => {

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
            title: "Tracker Assets",
            content: <TrackerAssets />,
        },
        {
            id: 5,
            title: "Fills",
            content: <Fills />,
        },
        {
            id: 6,
            title: "Order History",
            content: <OrderHistory />,
        },
    ];


    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

    const [containerWidth, setContainerWidth] = useState()
    const [actualButtonContainerWidth, setActualButtonContainerWidth] = useState(0)
    const [enableScrollControl, setEnableScrollControl] = useState(false);
    const [headerRightWidth, setHeaderRightWidth] = useState()
    const [tradeTabSearch, setTradeTabSearch] = useState('')
    const [showSearchBar, setShowSearchBar] = useState(false)

    const screenWidth = useBreakpoint()
    const scrollRef = useRef(null)
    const containerRef = useRef(null);
    const headerRightRef = useRef(null)
    const searchBoxContainerRef = useRef(null)

    const handleSearch = (e) => {
        setTradeTabSearch(e.target.value)
    }

    const handleShowSearchBar = () => {
        setShowSearchBar(!showSearchBar)
    }


    const categoryScroll = (scrollOffset) => {
        scrollRef.current.scrollLeft += scrollOffset;
    }


    const handleOrderTabClick = (getIndex) => {
        setCurrentOrderIndex(getIndex);
    };

    useEffect(() => {
        const containerDiv = containerRef.current;
        const headerRightDiv = headerRightRef.current;

        if (!containerDiv && !headerRightDiv) return;

        const observer = new ResizeObserver(() => {
            if (containerDiv?.offsetHeight) {
                setContainerWidth(containerDiv.offsetWidth);
            }
            if (headerRightDiv?.offsetHeight) {
                setHeaderRightWidth(headerRightDiv.offsetWidth);
            }
        });

        if (containerDiv) observer.observe(containerDiv);
        if (headerRightDiv) observer.observe(headerRightDiv);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!scrollRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            if (scrollRef.current.scrollWidth) {
                setActualButtonContainerWidth(scrollRef.current.scrollWidth);
            }
        });
        resizeObserver.observe(scrollRef.current);
        return function cleanup() {
            resizeObserver.disconnect();
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


    return (
        <div className={styles.container}
            ref={containerRef}>
            <div className={styles.header}>
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
                        {tradeOrderData.map((tabs, index) => (
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
                        ))}
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
                        <div className={styles.searchBoxContainer}>
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
                        </div>
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
                            showSearchIcon={true}
                        />
                        <Button
                            isLoading={false}
                            loadingText="Redirecting..."
                            btnText="Cancel"
                            onClick={() => {}}
                            className="dangerOuterlineButton"
                            selectedValue={null}
                        />
                    </div>
                </div>
            </div>
            <div className={styles.body}>
                {tradeOrderData[currentOrderIndex] &&
                    tradeOrderData[currentOrderIndex].content}
            </div>
        </div>
    );
};

export default TradeTabs;