/** PACKAGE IMPORT */


import React, { useEffect, useState } from "react";
import { Container, Offcanvas } from "react-bootstrap";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa6";
import { IoMdClose } from "react-icons/io";


/** LOCAL FILES IMPORT */

import styles from "./institutionalLayout.module.css"
import Header from "../Header/Header";
import Sidebar from "../Sidebar/Sidebar";
import Images from "../../utils/Images";
import Footer from "../Footer/Footer";
import { institutionalLinks } from "../../utils/navigationLinks";
import { useGlobalContext } from "../../context/GlobalProvider";



/** ACTIONS */

/** CODE START */


const InstitutionalLayout = () => {
    // const { activeSection } = props;
    const { theme, isAuth, isAuthChecked } = useGlobalContext();

    const [sidebarShow, setSidebarShow] = useState(false);
    let navigate = useNavigate()

    const handleSidebarClose = () => {
        setSidebarShow(false);
    };

    /**
     * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
     * Previously gated on the raw JWT's presence in localStorage
     * ("accessToken"), which no longer exists — the token is now an
     * httpOnly cookie the backend set, invisible to JS. This now waits for
     * GlobalProvider's cookie-authenticated session check
     * (`isAuthChecked`) to finish before deciding whether to redirect, so
     * a legitimately logged-in user isn't bounced out on page refresh
     * while that check is still in flight.
     */
    useEffect(() => {
        if (!isAuthChecked) return;
        if (!isAuth) {
            navigate("/")
        }
    }, [isAuthChecked, isAuth]);

    return (
        <div>
            <Header />

            <div className={styles.container}>
                <div className={styles.sidebar}>
                    <Sidebar navigationLinks={institutionalLinks} />
                </div>

                <button aria-label="arrowRight" className={styles.offCanvaButton + " d-block d-lg-none"}>
                    <FaArrowRight fill="#ff602e" onClick={() => setSidebarShow(true)} />
                </button>
                <div className={styles.main}>
                    {/* <AuthProtected> */}
                    <Outlet />
                    {/* </AuthProtected> */}
                </div>
            </div>
            <Footer />

            {/* start of mobile */}
            <Offcanvas
                show={sidebarShow}
                className="custom_canvas sidebar_canvas d-lg-none"
                onHide={handleSidebarClose}
            >
                <Offcanvas.Header>
                    <Offcanvas.Title className="d-flex align-items-center justify-content-between w-100">
                        <NavLink to="/" className="logo_wrap d-flex align-items-center">
                            {/* <img src={Images.logo} alt="logo" className="img-fluid" /> */}
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
                    <Sidebar navigationLinks={institutionalLinks} handleSidebarClose={handleSidebarClose} />
                </Offcanvas.Body>
            </Offcanvas>

            {/* end of mobile */}
        </div>
    );
};

export default InstitutionalLayout;