/** PACKAGE IMPORT */

import React, { useContext, useEffect, useState } from "react";
import { RxTriangleDown } from "react-icons/rx";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FaAngleDown, FaEye, FaEyeSlash } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa6";
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from "react-router-dom";
import isEmpty from "is-empty";
/** ACTIONS */

/** LOCAL FILES IMPORT */

import styles from './header.module.css'
import Images from "../../utils/Images";
import Button from "../../components/Button/Button";
import CustomDropdown from "../../components/UiComponents/DropDownComponent";
import { useGlobalContext } from "../../context/GlobalProvider";
import { showToastMessage } from "../../lib/toast";
import { ChangeMarginMode, ReloadWallet } from "../../actions/subAccountAction";
import { CiWallet } from "react-icons/ci";
import SwitchModal from "../../features/futuresTrading/modal/SwitchModal";
import ChangeMarginModel from '../../features/futuresTrading/modal/ChangeMarginModel';
import { Accordion } from "react-bootstrap";
import { IoIosArrowDown } from "react-icons/io";
import { ConversionDetail } from '../../redux/walletaction';
import { UserDetails } from '../../redux/action';
import { updateUserSettingsHooks } from "../../actions/userAction";
import config from "../../config/env";
import featureFlags from "../../config/featureFlags";
import ComingSoon from "../../components/ComingSoon/ComingSoon";
/** CONFIG */

/** CODE START */

const HeaderMenus = ({ handleNotificationCanvaShow, handleCanvaShow }) => {

    const navigate = useNavigate();
    let dispatch = useDispatch()
    const location = useLocation()
    const { tikerRoot } = useParams();
    const [switchModal, setSwitchModal] = useState(false);
    const [changeMarginModal, setChangeMarginModal] = useState(false);
    // Demo Trade normally navigates straight out to an external domain
    // (config.DEMO_URL) — while that's not ready, clicking it shows the
    // Coming Soon overlay directly on top of whatever page the user is
    // already on, with no route/URL change at all (unlike
    // Options/Affiliate/Institutional, which each have their own real,
    // dedicated internal page/route to show Coming Soon on).
    const [showDemoComingSoon, setShowDemoComingSoon] = useState(false);
    const { isAuth, conversionRate, convertValue, convertSecValue } = useGlobalContext();

    const { userdetails, wallet } = useSelector((state) => state.user);
    const { futureTradePair } = useSelector((state) => state.future);
    const { priceConversionList } = useSelector((state) => state.currency);
    const { showCurrency, secondaryCurrency } = useSelector((state) => state.wallet);
    const { firstName, lastName, userId, referralCode, profileImage, userTheme } = userdetails;

    const switchModalOpenHandle = (value) => {
        if (value == undefined) {
            setSwitchModal(!switchModal);
        } else {
            setSwitchModal(value);
        }
    }

    const updateSettings = async () => {
        try {
            const nextHideBalance = !userdetails?.hideBalance;
            const formData = new FormData();
            formData.append("hideBalance", nextHideBalance);
            formData.append("type", "setting");
            const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
            // BUG FIX: this only ever called the API — it never updated
            // Redux, so the eye icon toggle relied entirely on a later
            // socket USER_DETAILS event (or a manual refresh) to actually
            // flip the balance to "****". Update local state immediately
            // on a successful save so it reflects right away.
            if (resp?.data?.success) {
                dispatch(UserDetails({ userdetails: { ...userdetails, hideBalance: nextHideBalance } }));
            }
        } catch (e) {
            console.log("updateSettings_err", e);
        }
    }

    const ReloadBalance = async () => {
        try {
            const { status, message } = await ReloadWallet(userdetails?.secretKey);
            if (status) {
                showToastMessage(message, 'success');
            } else {
                showToastMessage(message, 'error');
            }
        } catch (e) {
            console.log("updateSettings_err", e);
        }
    }
    // console.log("useParams_Det", tikerRoot)
    return (

        <ul className={styles.headerMenuUl}>
            <SwitchModal show={switchModal} handleClose={() => switchModalOpenHandle(false)} />
            {changeMarginModal && <ChangeMarginModel
                show={changeMarginModal}
                handleClose={() => setChangeMarginModal(false)}
                changeOption={true}
                marginMode={userdetails?.marginMode}
                accountId={userdetails?.accountId}
            />}
            {/* Demo Trade Coming Soon overlay — see the NavLink's onClick
                below. Fixed/full-viewport (see comingSoon.module.css), so
                its position here in the tree doesn't matter; it covers
                whatever page is currently showing underneath. Closing it
                (via onClose) just hides it again — no navigation, no URL
                change, the user stays exactly where they were. */}
            {featureFlags.showDemoTradeComingSoon && (
                <ComingSoon
                    active={showDemoComingSoon}
                    showDemoBadge={true}
                    title="Coming Soon..."
                    message="Demo trading is being finalized. Please check back soon."
                    onClose={() => setShowDemoComingSoon(false)}
                    closeButtonText="Close"
                />
            )}
            {
                false &&
                <div className={`${styles.headerSingleMenusLinks} ${styles.demoLabel}`}>
                    <span className={styles.demoBadge}>Demo</span>
                </div> 
            }
            <div className={`${styles.headerSingleMenusLinks}`}>
                {tikerRoot != undefined ?
                    location.pathname.includes("options") ?
                        <NavLink to='/futures' data-click-effect="none">
                            Futures
                        </NavLink> :
                        <NavLink data-click-effect="none"
                            className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                            Futures
                        </NavLink>
                    : <NavLink data-click-effect="none"
                        to='/futures'
                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                        Futures
                    </NavLink>}
            </div>
            <div className={`${styles.headerSingleMenusLinks}`}>
                <NavLink data-click-effect="none" to='/options'
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    Options
                </NavLink>
            </div>
            {/* don't remove below commented code !!!*/}

            {/* <div className={`${styles.hoverTooltip}`}>
                <p
                    className={`text-decoration-none ${styles.hoverTootipTitle} ${styles.subMenuHead}
                       ${location.pathname.includes('/options')
                            // || location.pathname.includes('/algo-trading')
                            || location.pathname.includes('/futures') ? styles.active : ""}`}
                >
                    Trade  <FaAngleDown className={`${styles.arrowIcon}`} fontSize={14} />
                </p>
                <div className={`${styles.hoverTooltipContent}`}>
                    <ul className={`${styles.hoverTooltipUl}`}>
                        <li>
                            <NavLink
                                to="/futures"
                                data-click-effect="none"
                                className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                            >
                                <div className={`${styles.headerMenuWrapper}`}>
                                    <div className={styles.headerMenuSingleNav}>
                                        <p className={styles.title}>Futures</p>
                                        <FaArrowRight className={`${styles.rightArrowIcon}`} />
                                    </div>
                                    <p className={`${styles.desc}`}>Buy and sell on the futures market with advanced tools</p>
                                </div>
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                data-click-effect="none"
                                to="/options"
                                className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}>
                                <div className={`${styles.headerMenuWrapper}`}>
                                    <div className={styles.headerMenuSingleNav}>
                                        <p className={styles.title}>Options</p>
                                        <FaArrowRight className={`${styles.rightArrowIcon}`} />
                                    </div>
                                    <p className={`${styles.desc}`}>Buy and sell on the futures market with advanced tools</p>
                                </div>
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </div> */}



            {/* <div className={`${styles.headerSingleMenusLinks}`}>
                <span className={styles.commingText}>Upcoming</span>
                <NavLink data-click-effect="none" to='/copy-trade'
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    Copy Trade
                </NavLink>
            </div> */}
            {/* <div className={`${styles.headerSingleMenusLinks}`}>
                <span className={styles.commingText}>Upcoming</span>
                <NavLink data-click-effect="none" to='/institutional'
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    Institutional
                </NavLink>
            </div> */}
            {/* 
            {
                config.ENV == 'live' &&
                <div className={`${styles.headerSingleMenusLinks}`}>
                    <NavLink data-click-effect="none" to='/affiliate'
                        className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                        Affiliate
                    </NavLink>
                </div>
            } */}
            {/* <div className={`${styles.headerSingleMenusLinks}`}>
                <NavLink data-click-effect="none" to='/trading-bot'
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    Algo
                </NavLink>
            </div> */}
            {/* <div className={`${styles.headerSingleMenusLinks}`}>
                <NavLink data-click-effect="none" to='/learn'
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    Learn
                </NavLink>
            </div> */}
            {/* <div className={`${styles.headerSingleMenusLinks}`}>
                <NavLink data-click-effect="none" to='/blog'
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    Blog
                </NavLink>
            </div> */}
            <div className={`${styles.headerSingleMenusLinks}`}>
                <NavLink data-click-effect="none" to={"/about-us"}
                    className={({ isActive }) => isActive ? `${styles.staticLinks} ${styles.active}` : `${styles.staticLinks} `}>
                    About us
                </NavLink>
            </div>
            {

                config.ENV == 'live' &&
                <div className={`${styles.hoverTooltip}`}>
                    <p
                        className={`text-decoration-none ${styles.hoverTootipTitle} ${styles.subMenuHead}`}
                    >
                        More <FaAngleDown className={`${styles.arrowIcon}`} fontSize={14} />
                    </p>
                    <div className={`${styles.hoverTooltipContent}`}>
                        <ul className={`${styles.hoverTooltipUl}`}>
                            <li>
                                <NavLink
                                    to={config.DEMO_URL}
                                    data-click-effect="none"
                                    onClick={(e) => {
                                        if (featureFlags.showDemoTradeComingSoon) {
                                            // No route/URL change at all — show Coming
                                            // Soon as an overlay on top of the current
                                            // page instead of navigating anywhere.
                                            e.preventDefault();
                                            setShowDemoComingSoon(true);
                                        }
                                        // else: flag is off, let the NavLink navigate
                                        // to the real external demo URL as normal.
                                    }}
                                    className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                                >
                                    <div className={`${styles.headerMenuWrapper}`}>
                                        <div className={styles.headerMenuSingleNav}>
                                            <p className={styles.title}>Demo Trade</p>
                                        </div>
                                    </div>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to={"/copy-trade"}
                                    data-click-effect="none"
                                    className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                                >
                                    <div className={`${styles.headerMenuWrapper} d-flex gap-5`}>
                                        <div className={styles.headerMenuSingleNav}>
                                            <p className={styles.title}>Copy-trade</p>
                                        </div>
                                        {/* <span className={`${styles.commingText} mb-3`}>Upcoming</span> */}
                                    </div>
                                </NavLink>
                            </li>
                            <li>
                                <NavLink
                                    to={"/affiliate"}
                                    data-click-effect="none"
                                    className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                                >
                                    <div className={`${styles.headerMenuWrapper}`}>
                                        <div className={styles.headerMenuSingleNav}>
                                            <p className={styles.title}>Affiliate</p>
                                        </div>
                                    </div>
                                </NavLink>
                            </li>
                            <li>
                                {/* Was pointing to "/trading-bot", which sits inside
                                    <UserProtectedLayout /> in App.jsx — so a logged-out
                                    user clicking "Algo" here never reached any Coming
                                    Soon page at all (it got redirected to login instead).
                                    "/algo-trading" is the public route (same block as
                                    Options/Institutional/About Us) rendering
                                    AlgoTradingLanding, which already wraps its content in
                                    <ComingSoon active={featureFlags.showAlgoTradingComingSoon}>
                                    — so this now shows Coming Soon for logged-out and
                                    logged-in users alike, matching how Options behaves.
                                    Nothing else about this link changed. */}
                                <NavLink
                                    to={"/algo-trading"}
                                    data-click-effect="none"
                                    className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                                >
                                    <div className={`${styles.headerMenuWrapper}`}>
                                        <div className={styles.headerMenuSingleNav}>
                                            <p className={styles.title}>Algo</p>
                                        </div>
                                    </div>
                                </NavLink>
                            </li>
                            {/* <li>
                                <NavLink
                                    to={"/blog"}
                                    data-click-effect="none"
                                    className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                                >
                                    <div className={`${styles.headerMenuWrapper}`}>
                                        <div className={styles.headerMenuSingleNav}>
                                            <p className={styles.title}>Blog</p>
                                        </div>
                                    </div>
                                </NavLink>
                            </li> */}
                            <li>
                                <NavLink
                                    to={"/learn"}
                                    data-click-effect="none"
                                    className={({ isActive }) => isActive ? `${styles.hoverTooltipContentLinks} ${styles.active}` : `${styles.hoverTooltipContentLinks}`}
                                >
                                    <div className={`${styles.headerMenuWrapper}`}>
                                        <div className={styles.headerMenuSingleNav}>
                                            <p className={styles.title}>Learn</p>
                                        </div>
                                    </div>
                                </NavLink>
                            </li>
                        </ul>
                    </div>
                </div>
            }
            {
                isAuth ?
                    <>
                        <div className={`${styles.accountMariginPart} d-flex gap-3 flex-wrap d-lg-none mx-2`}>
                            {location.pathname.includes('/futures') || location.pathname.includes('/options') ?
                                <CustomDropdown
                                    inSideClickClose={false}
                                    toggleElement={
                                        <div className={styles.amTogglePart}>
                                            <p>Account Margin</p>
                                            <h4>{userdetails?.accountName} {userdetails?.marginMode}</h4>
                                        </div>
                                    }
                                    menuItems={
                                        <div className={styles.amMenuPart}>
                                            <div className={`${styles.amMenuHeadPart}`}>
                                                <h2>Account in Use</h2>
                                                <div>
                                                    <h2 className="mb-2 text-end">{userdetails?.accountName}</h2>
                                                    <Button btnText={"Switch"} onClick={switchModalOpenHandle} className="cardSuccessBtnXs" />
                                                </div>
                                            </div>
                                            <div className={styles.amMenuBodyPart}>

                                                <div className='d-flex align-items-center justify-content-between my-2'>
                                                    <h3>Margin Mode</h3>
                                                    <p>{userdetails?.marginMode}</p>
                                                </div>
                                                <div className='d-flex align-items-center justify-content-between  my-2'>
                                                    <h3>Available Margin</h3>
                                                    <p>{wallet && wallet?.availableBalance?.toFixed(futureTradePair?.quoteDecimal)} <span>{futureTradePair?.quoteCurrency}</span></p>
                                                </div>
                                                <div className={styles.btnWrapper}>
                                                    <Button className='successOutLineRectangleBtn'
                                                        btnText={`Change margin mode`}
                                                        onClick={() => {
                                                            setChangeMarginModal(true)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    }
                                />

                                : ""}
                            <CustomDropdown
                                align='end'
                                inSideClickClose={false}
                                toggleElement={
                                    <div className={styles.walletTogglePart}>
                                        <div>
                                            <CiWallet size={20} />
                                        </div>
                                        <h4 className='fs14'>{userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.tradingBalance))}</h4>
                                    </div>
                                }
                                menuItems={
                                    <div className={styles.walletMenuPart}>
                                        <div className={styles.accountValuePart}>
                                            <h2 className='fs15'>Account Value
                                                <button className={styles.amtShowBtn} onClick={updateSettings}>
                                                    {
                                                        !userdetails?.hideBalance ?
                                                            <FaEye />
                                                            :
                                                            <FaEyeSlash />

                                                    }
                                                </button>
                                            </h2>
                                            <h3 className='fs20 mt-2'>

                                                {userdetails?.hideBalance ? "*****" : convertValue(wallet?.tradingBalance)}
                                                <span className='fs15 mx-2'>
                                                    {
                                                        userdetails?.hideBalance ? "*****" : convertSecValue(parseFloat(wallet?.tradingBalance))
                                                    }
                                                </span>
                                            </h3>
                                            {config.ENV == 'live' ?
                                                <Button
                                                    btnText={"Add Funds"}
                                                    className='successFillRectangleBtn'
                                                    staticClass='py-2 mt-2'
                                                    onClick={() => {
                                                        if (userdetails?.kycStatus != "approved") {
                                                            showToastMessage("Please complete your KYC verification to continue using deposit", "error")
                                                            navigate('/verification')
                                                            return false
                                                        }
                                                        navigate('/deposit')
                                                    }}
                                                /> :
                                                <Button
                                                    btnText={"Reload Wallet"}
                                                    className='successFillRectangleBtn'
                                                    staticClass='py-2 mt-2'
                                                    onClick={() => {
                                                        ReloadBalance()
                                                        // if (userdetails?.kycStatus != "approved") {
                                                        //     showToastMessage("Please complete your KYC verification to continue using deposit", "error")
                                                        //     navigate('/verification')
                                                        //     return false
                                                        // }
                                                        // navigate('/deposit')
                                                    }}
                                                />
                                            }
                                        </div>
                                        <div className={styles.walletDetailPart}>
                                            <ul className='mt-3 d-flex flex-column gap-3'>
                                                <Accordion className="walletAccordionComponent">
                                                    <Accordion.Item eventKey="0">
                                                        <Accordion.Header className='p-0 '>
                                                            <li className='w-100 d-flex gap-2 align-items-start justify-content-between p-0'>
                                                                <h3 className='fs13'>Trading wallet <IoIosArrowDown className="walletAccordionArrow" /></h3>
                                                                <div className='text-end'>
                                                                    <h4 className='fs13'>
                                                                        {userdetails?.hideBalance ? "*****" : convertValue(wallet?.tradingBalance)}
                                                                    </h4>
                                                                    <h4 className='fs13'>
                                                                        {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.tradingBalance))}
                                                                    </h4>
                                                                </div>
                                                            </li>
                                                        </Accordion.Header>
                                                        <Accordion.Body className='p-0 '>
                                                            {/**Trading Wallet */}
                                                            <li className='d-flex gap-2 align-items-start justify-content-between mb-3 p-0'>
                                                                <h3 className='fs13'>Wallet Balance</h3>
                                                                <div className='text-end'>
                                                                    <h4 className='fs13'>
                                                                        {userdetails?.hideBalance ? "*****" : convertValue(wallet?.walletBalance)}
                                                                    </h4>
                                                                    <h4 className='fs13'>
                                                                        {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.walletBalance))}
                                                                    </h4>
                                                                </div>
                                                            </li>
                                                            <li className='d-flex gap-2 align-items-start justify-content-between mb-3 p-0'>
                                                                <h3 className='fs13'>UnRealized PnL</h3>
                                                                <div className='text-end'>
                                                                    <h4 className='fs13'>

                                                                        {userdetails?.hideBalance ? "*****" : convertValue(wallet?.unRealizedPnL)}
                                                                    </h4>
                                                                    <h4 className='fs13'>
                                                                        {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.unRealizedPnL))}
                                                                    </h4>
                                                                </div>
                                                            </li>
                                                            <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                                <h3 className='fs13'>Frozen wallet</h3>
                                                                <div className='text-end'>
                                                                    <h4 className='fs13'>

                                                                        {userdetails?.hideBalance ? "*****" : convertValue(wallet?.freezeBalance)}
                                                                    </h4>
                                                                    <h4 className='fs13'>
                                                                        {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.freezeBalance))}
                                                                    </h4>
                                                                </div>
                                                            </li>
                                                            {/**Trading Wallet */}
                                                        </Accordion.Body>
                                                    </Accordion.Item>


                                                </Accordion>
                                                {/* <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                    <h3 className='fs13'>Trading wallet</h3>
                                                    <div className='text-end'>
                                                        <h4 className='fs16'>
                                                            <span className="inrTag">
                                                                ₹
                                                            </span>
                                                            {convertValue(wallet?.tradingBalance)?.toFixed(2)}
                                                        </h4>
                                                        <h4 className='fs14'>
                                                            ${parseFloat(wallet?.availableBalance).toFixed(2)}
                                                        </h4>
                                                    </div>
                                                </li>

                                                <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                    <h3 className='fs13'>Wallet Balance</h3>
                                                    <div className='text-end'>
                                                        <h4 className='fs16'>
                                                            <span className="inrTag">
                                                                ₹
                                                            </span>
                                                            {convertValue(wallet?.walletBalance)?.toFixed(2)}
                                                        </h4>
                                                        <h4 className='fs14'>
                                                            ${parseFloat(wallet?.walletBalance).toFixed(2)}
                                                        </h4>
                                                    </div>
                                                </li>
                                                <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                    <h3 className='fs13'>UnRealized PnL</h3>
                                                    <div className='text-end'>
                                                        <h4 className='fs16'>
                                                            <span className="inrTag">
                                                                ₹
                                                            </span>
                                                            {convertValue(wallet?.unRealizedPnL)?.toFixed(2)}
                                                        </h4>
                                                        <h4 className='fs14'>
                                                            ${parseFloat(wallet?.unRealizedPnL).toFixed(2)}
                                                        </h4>
                                                    </div>
                                                </li>
                                                <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                    <h3 className='fs13'>Frozen wallet</h3>
                                                    <div className='text-end'>
                                                        <h4 className='fs16'>
                                                            <span className="inrTag">
                                                                ₹
                                                            </span>
                                                            {convertValue(wallet?.freezeBalance)?.toFixed(2)}
                                                        </h4>
                                                        <h4 className='fs14'>
                                                            ${parseFloat(wallet?.freezeBalance).toFixed(2)}
                                                        </h4>
                                                    </div>
                                                </li> */}


                                                <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                    <h3 className='fs13'>Available Margin</h3>
                                                    <div className='text-end'>
                                                        <h4 className='fs13'>

                                                            {userdetails?.hideBalance ? "*****" : convertValue(wallet?.availableBalance)}
                                                        </h4>
                                                        <h4 className='fs13'>
                                                            {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.availableBalance))}
                                                        </h4>
                                                    </div>
                                                </li>
                                                {/* <li className='d-flex gap-2 align-items-start justify-content-between p-0'>
                                                    <h3 className='fs13'>Trevolt cash</h3>
                                                    <div className='text-end'>
                                                        <h4 className='fs16'>₹100</h4>
                                                        <h4 className='fs14'>$10</h4>
                                                    </div>
                                                </li> */}
                                                <li className="p-0">
                                                    <div className={styles.convertRate}>
                                                        <p className='fs13'>Conversion Rate</p>
                                                        <p className='fs13'>1 USD = INR {parseFloat(conversionRate?.price)?.toFixed(2)}</p>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                }
                            />
                        </div>
                    </>
                    :
                    <div className="d-flex flex-wrap gap-2 my-3 d-flex d-lg-none">
                        <div className={`${styles.headerRightMenus}`}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Login"
                                className="darkFillBtnXs"
                                selectedValue={null}
                                onClick={() => navigate('/login')}
                            />

                        </div>
                        <div className={`${styles.headerRightMenus}`}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Signup"
                                className="primaryBtnXs"
                                selectedValue={null}
                                onClick={() => navigate('/register')}
                            />
                        </div>
                    </div>
            }
            <div className="custom-toggle__primary mt-3 d-flex gap-2 align-items-center mx-3 d-flex d-lg-none">
                <p className={`${showCurrency !== "INR" && "opacity-50"} textWhite`}>INR</p>
                <label className="switch">
                    <input
                        type="checkbox"
                        onChange={(e) => {
                            const data = e.target.checked ? { showCurrency: "USD", secondaryCurrency: "INR" } : { showCurrency: "INR", secondaryCurrency: "USD" }
                            dispatch(ConversionDetail(data))
                        }}
                        checked={showCurrency === 'INR' ? false : true}
                    />
                    <span className="slider round"></span>
                </label>
                <p className={`${showCurrency == "INR" && "opacity-50"} textWhite`}>USD</p>
            </div>

            <div className={`${styles.headerRightMenus} mt-3 d-none`}>
                {/* <button
                    aria-label="UpDownIcon"
                    aria-labelledby="UpDownIcon"
                    value={"UpDownIcon"}
                    className={`${styles.themeChangeButton}`}
                    onClick={() => navigate('/positions')}
                >
                    <img src={Images.upDownIcon} alt="upDownIcon" />
                </button>
                <button
                    aria-label="NotificationIcon"
                    aria-labelledby="NotificationIcon"
                    className={`${styles.themeChangeButton}`}
                    onClick={() => {
                        handleNotificationCanvaShow();
                        handleCanvaShow();
                    }}
                >
                    <img src={Images.notificationIcon} alt="notificationIcon" />
                </button> */}
            </div>

        </ul>
    )
}

export default HeaderMenus