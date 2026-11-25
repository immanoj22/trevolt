/** PACKAGE IMPORT */
import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

/** LOCAL FILES IMPORT */

import styles from "./authLayout.module.css"
import Header from "../Header/Header";
import { useGlobalContext } from "../../context/GlobalProvider";

/** CODE START */

const AuthLayout = () => {
    let navigate = useNavigate()
    let location = useLocation()
    const { isAuth, isAuthChecked } = useGlobalContext();

    // Extract redirect URL if present
    const params = new URLSearchParams(location.search);
    const redirect = params.get("redirect") || "/dashboard";

    useEffect(() => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    }, []);

    /**
     * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
     * Previously gated on the raw JWT's presence in localStorage
     * ("accessToken"), which no longer exists — auth is now an httpOnly
     * cookie, invisible to JS. Waits for GlobalProvider's
     * cookie-authenticated check (`isAuthChecked`) before redirecting an
     * already-logged-in user away from the login/register pages.
     */
    useEffect(() => {
        if (!isAuthChecked) return;
        if (isAuth) {
            navigate(redirect)
        }
    }, [isAuthChecked, isAuth]);

    return (
        <div>
            <Header />


            <Outlet />

        </div>
    );
};

export default AuthLayout;