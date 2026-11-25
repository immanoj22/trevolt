/** PACKAGE IMPORT */

import React, { useState, useEffect, useContext, useRef } from 'react'
import isEmpty from "is-empty";
import { CgProfile } from "react-icons/cg";
import { TbLayoutDashboardFilled } from "react-icons/tb";
import { CiWallet } from "react-icons/ci";
import { IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import { IoMoon } from "react-icons/io5";
import { HiOutlineCheckBadge } from "react-icons/hi2";
import { GrGroup } from "react-icons/gr";
import { AiOutlineSafetyCertificate } from "react-icons/ai";
import { MdOutlineHistory } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineContactSupport } from "react-icons/md";
import { SlCompass } from "react-icons/sl";
import { PiWallet } from "react-icons/pi";
import { MdOutlineAccountTree } from "react-icons/md";
import { RiLogoutBoxRLine } from "react-icons/ri";
import { GiHamburgerMenu } from "react-icons/gi";
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IoIosArrowDown } from "react-icons/io";
import { MdOutlineEdit } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa";

/** ACTIONS */

/** LOCAL FILES IMPORT */
import styles from './header.module.css'
import Images from '../../utils/Images'
import Button from '../../components/Button/Button';
import { useGlobalContext } from '../../context/GlobalProvider';
import { useDispatch, useSelector } from 'react-redux';
import config from '../../config/env';
import { getNotifications, updateUserSettingsHooks } from '../../actions/userAction';
import CustomDropdown from '../../components/UiComponents/DropDownComponent';
import { showToastMessage } from '../../lib/toast';
import { useParams } from "react-router-dom";
import { BeforeLogin, UserDetails } from '../../redux/action';
import { ChangeMarginMode, ReloadWallet } from '../../actions/subAccountAction';
import SwitchModal from '../../features/futuresTrading/modal/SwitchModal';
import ChangeMarginModel from '../../features/futuresTrading/modal/ChangeMarginModel';
import usePriceConversion from '../../hooks/usePriceConversion';
import { Accordion } from 'react-bootstrap';
import { ConversionDetail } from '../../redux/walletaction';
import SocketContext from '../../context/socketContext';

/** CONFIG */

/** CODE START */

const HeaderRight = ({ handleCanvaShow, handleNotificationCanvaShow, handleSettingCanvaShow, handleSettingsCanvaClose }) => {

    const navigate = useNavigate();
    let dispatch = useDispatch()
    const location = useLocation().pathname
    const { tikerRoot } = useParams()
    // const { convertValue } = usePriceConversion("USDT", 'INR')
    const [switchModal, setSwitchModal] = useState(false);
    const socketContext = useContext(SocketContext);
    const [changeMarginModal, setChangeMarginModal] = useState(false);
    // const [unreadCount, setUnreadCount] = useState(0)
    const unreadCount = useRef(0)
    const [themeOverlay, setThemeOverlay] = useState(false);
    const { toggleTheme, theme, isAuth, handleLogin, handleLogout, conversionRate, convertValue, convertSecValue } = useGlobalContext();

    const { userdetails, wallet } = useSelector((state) => state.user);
    const { futureTradePair } = useSelector((state) => state.future);
    const { priceConversionList } = useSelector((state) => state.currency);
    const { showCurrency, secondaryCurrency } = useSelector((state) => state.wallet);

    const { firstName, lastName, userId, referralCode, profileImage, userTheme } = userdetails;

    const loginHandle = () => {
        // handleLogin();
        navigate("/login")
    }
    const signupHandle = () => {
        // handleLogin();
        navigate("/register")
    }

    const beforeLoginThemeChange = async () => {
        try {
            let theme = localStorage.getItem("trevolt-theme");
            let data = theme == "dark" ? "light" : "dark";
            localStorage.setItem("trevolt-theme", data);
            dispatch(BeforeLogin({ beforelogin: data }));
            toggleTheme();
            // dispatch(AccessToken({ accessToken: value }));
        } catch (e) {
            console.log("beforeLoginThemeChange__Err", e)
        }
    }

    const handleTheme = async () => {
        try {
            // console.log("handleThemehandleTheme", userTheme);
            if (Object.values(userdetails).length > 0) {
                const formData = new FormData();
                formData.append("type", "setting");
                formData.append("userTheme", userTheme == "dark" ? "light" : "dark");
                const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
                if (resp?.data?.success) {
                    showToastMessage("Theme Changed Successfully", "success");
                    // showToastMessage(resp?.data?.message, "success");
                } else if (!resp?.data?.success) {
                    if (resp?.data?.message) {
                        showToastMessage(resp?.data?.message, "error")
                    }
                }
            } else {
                toggleTheme()
                // let theme = localStorage.getItem("trevolt-theme");
                // if (theme != undefined) {
                //     let data = theme == "dark" ? "light" : "dark";
                //     console.log("theme_det", data)
                //     localStorage.setItem("trevolt-theme", data)
                // }
            }
        } catch (e) {
            console.log("handleTheme__Err", e);
        }
    }

    // theme animation
    // const handleTheme = async () => {
    //     console.log('handleTheme',)
    //     setThemeOverlay(true);
    //     setTimeout(async () => {
    //         try {
    //             // console.log("handleThemehandleTheme", userTheme);
    //             if (Object.values(userdetails).length > 0) {
    //                 const formData = new FormData();
    //                 formData.append("type", "setting");
    //                 formData.append("userTheme", userTheme == "dark" ? "light" : "dark");
    //                 const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
    //                 console.log("resp_myprofile", resp?.data?.success, resp?.data?.message);
    //                 if (resp?.data?.success) {
    //                     showToastMessage(resp?.data?.message, "success");
    //                 } else if (!resp?.data?.success) {
    //                     if (resp?.data?.message) {
    //                         showToastMessage(resp?.data?.message, "error")
    //                     }
    //                 }
    //             } else {
    //                 console.log('toggleTheme else',)
    //                 toggleTheme()
    //                 // let theme = localStorage.getItem("trevolt-theme");
    //                 // if (theme != undefined) {
    //                 //     let data = theme == "dark" ? "light" : "dark";
    //                 //     console.log("theme_det", data)
    //                 //     localStorage.setItem("trevolt-theme", data)
    //                 // }
    //             }
    //         } catch (e) {
    //             console.log("handleTheme__Err", e);
    //         } finally {
    //             setTimeout(() => {
    //                 setThemeOverlay(false);
    //             }, 200)
    //         }
    //     }, 700);
    // }
    const switchModalOpenHandle = (value) => {
        if (value == undefined) {
            setSwitchModal(!switchModal);
        } else {
            setSwitchModal(value);
        }
    }

    const getNotification = async (page, showRead = false, fromShowread = false) => {
        try {
            const payload = {
                // secretKey: userdetails?.secretKey,
                page: page,
                limit: 10,
                showRead: showRead
            }
            const result = await getNotifications(payload)
            if (result?.status) {
                unreadCount.current = result?.result?.unreadcount
            }
        } catch (error) {
            console.log("getNotifications_err", error)
        }
    }

    const updateSettings = async () => {
        try {
            const nextHideBalance = !userdetails?.hideBalance;
            const formData = new FormData();
            formData.append("hideBalance", nextHideBalance);
            formData.append("type", "setting");
            // const resp = await updateUserSettingsHooks(formData, userdetails?.secretKey);
            // if (resp?.data?.success) {
                dispatch(UserDetails({ userdetails: { ...userdetails, hideBalance: nextHideBalance } }));
            // }
        } catch (e) {
            console.log("updateSettings_err", e);
        }
    }

    useEffect(() => {
        socketContext.socket.on('USER_NOTIFICATIONUPDATE', (result) => {
            // console.log("socket_unreadcount_notification", result)
            unreadCount.current = result?.unreadcount
        });
    }, [socketContext])

    useEffect(() => {
    }, [unreadCount])

    useEffect(() => {
        getNotification(1)
    }, [])

    // console.log("userTheme_headerrig", userTheme)
    const profileMouseHandle = (e) => {
        // console.log('profileMouseHandle', e)
        if (e) {
            document.body.click();
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
    return (
        <div className={`${styles.headerRightContainer}`}>
            {/* {
        } */}
            <SwitchModal
                show={switchModal}
                handleClose={() => switchModalOpenHandle(false)}
            />
            {changeMarginModal && <ChangeMarginModel
                show={changeMarginModal}
                handleClose={() => setChangeMarginModal(false)}
                changeOption={true}
                marginMode={userdetails?.marginMode}
                accountId={userdetails?.accountId}
            />}
            {(isAuth) ? (
                <div className={`${styles.headerRight}`}>
                    <div className={`${styles.accountMariginPart} d-none d-lg-flex gap-2`}>
                        {
                            (location.includes('/futures') || location.includes('/options')) ?
                                <CustomDropdown
                                    inSideClickClose={false}
                                    toggleElement={
                                        <div className={styles.amTogglePart}>
                                            <p>Account Margin</p>
                                            <h4>{userdetails?.accountName} {userdetails?.marginMode}</h4>
                                        </div>}
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
                                                    <p>{userdetails?.marginMode?.toUpperCase()}</p>
                                                </div>
                                                <div className='d-flex align-items-center justify-content-between  my-2'>
                                                    <h3>Available Margin</h3>
                                                    <p>{wallet?.availableBalance && wallet?.availableBalance?.toFixed(futureTradePair?.quoteDecimal)} <span>{futureTradePair?.quoteCurrency}</span></p>
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
                                    <h4 className='fs14'>{userdetails?.hideBalance ? "*****" : convertValue(parseFloat(wallet?.tradingBalance))}</h4>

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

                                        <h3 className='fs20 mt-3'>
                                            {userdetails?.hideBalance ? "*****" : convertValue(wallet?.tradingBalance)}
                                            <span className='fs15 mx-2'>
                                                {userdetails?.hideBalance ? "****" : convertSecValue(wallet?.tradingBalance)}
                                            </span>
                                        </h3>
                                        {config.ENV == 'live' ?
                                            <Button
                                                btnText={"Add Funds"}
                                                onClick={() => {
                                                    if (userdetails?.kycStatus != "approved") {
                                                        showToastMessage("Please complete your KYC verification to continue using deposit", "error")
                                                        navigate('/verification')
                                                        return false
                                                    }
                                                    navigate('/deposit')
                                                }}
                                                className='successFillRectangleBtn'
                                                staticClass='p-2 mt-2 h-100'
                                            /> :
                                            <Button
                                                btnText={"Reload Wallet"}
                                                onClick={() => {
                                                    // if (userdetails?.kycStatus != "approved") {
                                                    //     showToastMessage("Please complete your KYC verification to continue using deposit", "error")
                                                    //     navigate('/verification')
                                                    //     return false
                                                    // }
                                                    // navigate('/deposit')

                                                    ReloadBalance()
                                                }}
                                                className='successFillRectangleBtn'
                                                staticClass='py-2 mt-2'
                                            />
                                        }
                                    </div>
                                    <div className={styles.walletDetailPart}>
                                        <ul className='mt-3 d-flex flex-column gap-3'>
                                            <Accordion className="walletAccordionComponent">
                                                <Accordion.Item eventKey="0">
                                                    <Accordion.Header className='p-0 '>
                                                        <li className='w-100 d-flex gap-2 align-items-start justify-content-between'>
                                                            <h3 className='fs13'>Trading wallet <IoIosArrowDown className="walletAccordionArrow" /></h3>
                                                            <div className='text-end'>
                                                                <h4 className='fs13'>
                                                                    {userdetails?.hideBalance ? "*****" : convertValue(wallet?.tradingBalance)}
                                                                </h4>
                                                                <h4 className='fs13 mt-2'>
                                                                    {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.tradingBalance))}
                                                                </h4>
                                                            </div>
                                                        </li>
                                                    </Accordion.Header>
                                                    <Accordion.Body className='p-0 '>
                                                        {/**Trading Wallet */}
                                                        <li className='d-flex gap-2 align-items-start justify-content-between mb-3'>
                                                            <h3 className='fs13'>Wallet Balance</h3>
                                                            <div className='text-end'>
                                                                <h4 className='fs13'>
                                                                    {/* <span className="inrTag">
                                                                        ₹
                                                                    </span> */}
                                                                    {userdetails?.hideBalance ? "*****" : convertValue(wallet?.walletBalance)}
                                                                </h4>
                                                                <h4 className='fs13 mt-2'>
                                                                    {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.walletBalance))}
                                                                </h4>
                                                            </div>
                                                        </li>
                                                        <li className='d-flex gap-2 align-items-start justify-content-between mb-3'>
                                                            <h3 className='fs13'>UnRealized PnL</h3>
                                                            <div className='text-end'>
                                                                <h4 className='fs13'>

                                                                    {userdetails?.hideBalance ? "*****" : convertValue(wallet?.unRealizedPnL)}
                                                                </h4>
                                                                <h4 className='fs13 mt-2'>
                                                                    {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.unRealizedPnL))}
                                                                </h4>
                                                            </div>
                                                        </li>
                                                        <li className='d-flex gap-2 align-items-start justify-content-between '>
                                                            <h3 className='fs13'>Frozen wallet</h3>
                                                            <div className='text-end'>
                                                                <h4 className='fs13'>
                                                                    {userdetails?.hideBalance ? "*****" : convertValue(wallet?.freezeBalance)}
                                                                </h4>
                                                                <h4 className='fs13 mt-2'>
                                                                    {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.freezeBalance))}
                                                                </h4>
                                                            </div>
                                                        </li>
                                                        {/**Trading Wallet */}
                                                    </Accordion.Body>
                                                </Accordion.Item>


                                            </Accordion>


                                            <li className='d-flex gap-2 align-items-start justify-content-between'>
                                                <h3 className='fs13'>Available Margin</h3>
                                                <div className='text-end'>
                                                    <h4 className='fs13'>
                                                        {userdetails?.hideBalance ? "*****" : convertValue(wallet?.availableBalance)}
                                                    </h4>
                                                    <h4 className='fs13 mt-2'>
                                                        {userdetails?.hideBalance ? "****" : convertSecValue(parseFloat(wallet?.availableBalance))}
                                                    </h4>
                                                </div>
                                            </li>
                                            <li>
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
                    </div >
                    <div className="custom-toggle__primary d-flex gap-2 align-items-center mx-3 d-none d-lg-flex">
                        <p className={`${showCurrency !== "INR" && "opacity-50"}`}>INR</p>
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
                        <p className={`${showCurrency == "INR" && "opacity-50"}`}>USD</p>
                    </div>
                    <div onMouseOver={profileMouseHandle} className={`${styles.hoverTooltip} ${styles.headerRightMenus}`}>
                        {profileImage ?
                            <img
                                src={profileImage ? profileImage : theme == 'dark' ? Images.darkDefaultProfile : Images.lightDefaultProfile}
                                alt="profile"
                                className={styles.profileIcon}
                            /> : <CgProfile fontSize={24} fill="#fff" />}
                        <div className={`${styles.hoverTooltipContent}`}>

                            <div data-click-effect="none" onClick={() => navigate("/my-profile")} className={styles.headerRightProfileHeader}>
                                <div className={styles.headerRightProfileWrapper}>
                                    <img
                                        src={profileImage ? profileImage : theme == 'dark' ? Images.darkDefaultProfile : Images.lightDefaultProfile}
                                        alt="profile"
                                        className=""
                                    />
                                </div>
                                <div className={styles.headerUserDetails}>
                                    <div className={styles.headerUserDetailsContainer}>
                                        <p className={styles.headerUserName}>
                                            {`${firstName}-${lastName}`}
                                        </p>
                                        <div className={styles.headerUIDInfo}>
                                            <p className={styles.headerUID}>
                                                UID : {userId == undefined ? "" : `${userId.substring(0, 5)}.....${userId.substring(19, 24)}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.headerTooltipNavlinksContainer}>

                                <NavLink data-click-effect="none" to="/dashboard"
                                    className={`${styles.headerTooltipNavlinks} ${location == '/dashboard' ? styles.active : ""}`}
                                >
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <SlCompass fontSize={17} />
                                    </div>

                                    <p className="">Dashboard</p>
                                </NavLink>

                                <NavLink data-click-effect="none" to="/sub-account" className={`${styles.headerTooltipNavlinks} ${location == '/wallet' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <MdOutlineAccountTree fontSize={19} />
                                    </div>
                                    <p className="">Sub Account</p>
                                </NavLink>
                                <NavLink data-click-effect="none" to="/verification" className={`${styles.headerTooltipNavlinks} ${location == '/verification' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <HiOutlineCheckBadge fontSize={20} />
                                    </div>
                                    <p className="">Verification</p>
                                </NavLink>

                                <NavLink data-click-effect="none" to="/referral" className={`${styles.headerTooltipNavlinks} ${location == '/referral' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <GrGroup fontSize={15} />
                                    </div>
                                    <p className="">Referral</p>
                                </NavLink>
                                <NavLink data-click-effect="none" to="/security" className={`${styles.headerTooltipNavlinks} ${location == '/security' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <AiOutlineSafetyCertificate fontSize={19} />
                                    </div>
                                    <p className="">Security</p>
                                </NavLink>
                                <NavLink data-click-effect="none" to="/history" className={`${styles.headerTooltipNavlinks} ${location == '/history' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <MdOutlineHistory fontSize={19} />
                                    </div>
                                    <p className="">History</p>
                                </NavLink>
                                <NavLink data-click-effect="none" to="/preferences" className={`${styles.headerTooltipNavlinks} ${location == '/preferences' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <IoSettingsOutline fontSize={19} />
                                    </div>
                                    <p className="">Preferences</p>
                                </NavLink>

                                {/* <NavLink data-click-effect="none" to="/settings" className={`${styles.headerTooltipNavlinks} ${location == '/settings' ? styles.active : ""}`}>
                                    <div className={styles.headerNavlinksIconWrapper}>
                                        <IoSettingsOutline fontSize={17} />
                                    </div>
                                    <p className="">Settings</p>
                                </NavLink> */}
                            </div>

                            <div className={styles.headerLogoutContainer}>
                                <button
                                    aria-label='logout'
                                    data-click-effect="none"
                                    className={styles.headerLogoutButton}
                                    onClick={handleLogout}>
                                    <RiLogoutBoxRLine fontSize={18} />
                                    <p className="">Logout</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.headerRightMenus} d-none`}>
                        {/* <div className={`${styles.headerRightMenus} d-none d-lx-flex`}> */}

                    </div>
                    <div className='d-flex gap-0 mx-2'>
                        <button
                            aria-label='notificationIcon'
                            className={`${styles.themeChangeButton} ${styles.notificationBtn}`}
                            onClick={handleNotificationCanvaShow}
                        >
                            <img src={Images.notificationIcon} alt="notificationIcon" />
                            {/* <span className={styles.notificationCountText}>{unreadCount.current}</span> */}
                            {(unreadCount.current && unreadCount.current > 0) ? <span className={styles.notificationCountText}>{unreadCount.current}</span> : ""}
                        </button>
                        <button
                            aria-label="UpDownIcon"
                            aria-labelledby="UpDownIcon"
                            value={"UpDownIcon"}
                            className={`${styles.themeChangeButton}`}
                            onClick={() => navigate('/positions')}
                        >
                            <img src={Images.upDownIcon} alt="upDownIcon" />
                        </button>
                        <button
                            className={`${styles.themeChangeButton}`}
                            value={"themeButton"}
                            aria-label='themeButton'
                            aria-labelledby='themeButton'
                            id="themeButton"
                            title={userTheme === "dark" ? "Light" : "Dark"}
                            onClick={() => handleTheme()}
                            data-click-effect="none"
                        >
                            {userTheme === "dark" ? <IoSunnyOutline className={`${styles.themeChanger} ${styles.sun}`} /> : <IoMoonOutline className={styles.themeChanger} />}
                        </button>
                        <button
                            aria-label='notificationIcon'
                            className={`${styles.themeChangeButton} ${styles.notificationBtn}`}
                            onClick={handleSettingCanvaShow}
                        >
                            <IoSettingsOutline />

                        </button>
                        <div className={`themeChangeOverlay ${userTheme === "dark" ? "Light" : "Dark"} ${themeOverlay ? "isShow" : "isHide"}`}></div>
                    </div>
                    <div className={`${styles.headerRightMenus} d-lg-none`}>
                        <button
                            aria-label='hanburgerMenu'
                            className={styles.headerHamburger}
                            onClick={handleCanvaShow}
                        >
                            <GiHamburgerMenu fontSize={23} />
                        </button>
                    </div>
                </div >
            ) : (
                <>
                    <div className={`${styles.headerRight}`}>
                        <div className={`${styles.headerRightMenus}`}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Login"
                                onClick={loginHandle}
                                className="darkFillBtnXs"
                                selectedValue={null}
                            />

                        </div>
                        <div className={`${styles.headerRightMenus} d-none d-lg-block`}>
                            <Button
                                isLoading={false}
                                loadingText="Redirecting..."
                                btnText="Signup"
                                onClick={signupHandle}
                                className="primaryBtnXs"
                                selectedValue={null}
                            />
                        </div>

                        <div className={`${styles.headerRightMenus}`}>
                            <button
                                aria-label='themeIcon'
                                className={`${styles.themeChangeButton}`}
                                onClick={() => {
                                    beforeLoginThemeChange()
                                }}
                            >
                                {localStorage.getItem("trevolt-theme") === "dark" ? <IoSunnyOutline className={`${styles.themeChanger} ${styles.sun}`} /> : <IoMoonOutline className={styles.themeChanger} />}
                            </button>
                        </div>

                        {/* Settings (Restore Default trading layout) — previously only
                            rendered in the isAuth branch above, so logged-out users had
                            no way to reach "Restore Default". SettingsCanva itself is
                            already mounted unconditionally in Header.jsx and only reads/
                            clears localStorage layout keys, so it needs no auth — this
                            just adds the missing trigger button for logged-out users,
                            reusing the same handleSettingCanvaShow prop and button
                            markup already used above, with no other behavior changed. */}
                        <div className={`${styles.headerRightMenus}`}>
                            <button
                                aria-label='settingsIcon'
                                className={`${styles.themeChangeButton} ${styles.notificationBtn}`}
                                onClick={handleSettingCanvaShow}
                            >
                                <IoSettingsOutline />
                            </button>
                        </div>

                        <div className={`${styles.headerRightMenus} d-xl-none`}>
                            <button
                                aria-label='hamburgerMenu'
                                className={styles.headerHamburger}
                                onClick={handleCanvaShow}
                            >
                                <GiHamburgerMenu fontSize={23} />
                            </button>
                        </div>

                    </div>
                </>
            )
            }

        </div>
    )
}

export default HeaderRight