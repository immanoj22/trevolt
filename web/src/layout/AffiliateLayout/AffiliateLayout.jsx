/** PACKAGE IMPORT */
import React, { useEffect, useState } from "react";
import { Offcanvas } from "react-bootstrap";
import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";

/** LOCAL FILES IMPORT */
import styles from "./affiliateLayout.module.css";
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Images from "../../utils/Images";
import Footer from "../Footer/Footer";
import { affiliateLinks, navigationLinks } from "../../utils/navigationLinks";
import { useGlobalContext } from "../../context/GlobalProvider";
import { useSelector } from "react-redux";

/** CODE START */
const AffiliateLayout = ({ children }) => {
    const { theme, isAuth, isAuthChecked } = useGlobalContext();
    const { isAuthStatus, affiliateDetails, userdetails } = useSelector((state) => state.user);

    const navigate = useNavigate();
    const [sidebarShow, setSidebarShow] = useState(false);

    const handleSidebarClose = () => {
        setSidebarShow(false);
    };

    /**
     * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
     * Previously gated on the raw JWT's presence in localStorage
     * ("accessToken"), which no longer exists — auth is now an httpOnly
     * cookie, invisible to JS. Waits for GlobalProvider's
     * cookie-authenticated check (`isAuthChecked`) before redirecting.
     */
    useEffect(() => {
        if (!isAuthChecked) return;
        if (!(isAuth || isAuthStatus)) {
            navigate("/affiliate")
        }
    }, [isAuthChecked, isAuth, isAuthStatus]);

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    return (
        <div>
            <Header />

            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <Sidebar navigationLinks={affiliateLinks} />
                </div>

                <button aria-label="arrowRight" className={styles.offCanvaButton + " d-block d-lg-none"}>
                    <FaArrowRight fill="#ff602e" onClick={() => setSidebarShow(true)} />
                </button>

                <div className={styles.main}>
                    {/* Either children OR <Outlet /> depending on usage */}
                    {children || <Outlet />}
                </div>
            </div>

            <Footer />

            {/* start of mobile */}
            <Offcanvas
                show={sidebarShow}
                onHide={handleSidebarClose}
                className="custom_canvas sidebar_canvas d-lg-none"
            >
                <Offcanvas.Header>
                    <Offcanvas.Title className="d-flex align-items-center justify-content-between w-100">
                        <NavLink to="/" className="logo_wrap d-flex align-items-center">
                            <img src={theme == 'dark' ? Images.logo : Images.logoDark} alt="logo" className={`img-fluid`} />
                        </NavLink>
                        <button
                            aria-label="closeIcon"
                            className="d-lg-none border-0 bg-transparent outline-0 closeIcon"
                            onClick={handleSidebarClose}
                        >
                            <IoMdClose fontSize={25} />
                        </button>
                    </Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Sidebar navigationLinks={affiliateLinks} handleSidebarClose={handleSidebarClose} />
                </Offcanvas.Body>
            </Offcanvas>
            {/* end of mobile */}
        </div>
    );
};

export default AffiliateLayout;