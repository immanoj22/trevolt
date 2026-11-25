import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import useThemeChange from '../hooks/useThemeChange'
import { useNavigate, useLocation } from 'react-router-dom'
import { GetLocalStorageItem, RemoveItemLocalStorageItem, SetLocalStorageItem } from '../lib/storage';
import { useDispatch, useSelector } from 'react-redux';
import { AccessToken, BeforeLogin, IsAuth, UserDetails } from '../redux/action';
import { logoutHooks, getUserDetailsHooks } from '../actions/userAction';
import PageLoader from '../components/Loader/PageLoader';
import usePriceConversion from '../hooks/usePriceConversion';
import { createSocketUser } from '../config/socketConnectivity';

// SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
// The raw JWT is no longer written to localStorage. The backend already
// sets it as an httpOnly cookie on login/loginVerification
// (Library/authCookie.js, Modules/User/Hooks/authHooks.js:issueSession),
// and axios sends that cookie automatically (config/axios.js sets
// axios.defaults.withCredentials = true). All this key does is remember,
// for THIS browser only, that a session cookie was issued, so the app
// knows to attempt the cookie-authenticated `getUserDetailsHooks()` call
// on page load instead of silently treating the user as logged out. It
// is not a bearer credential by itself and grants no access on its own.
const SESSION_FLAG_KEY = "isLoggedIn";

const GlobalContext = createContext(null);

export const GlobalProvider = ({ children }) => {

    let dispatch = useDispatch();
    const navigate = useNavigate()
    let location = useLocation()

    // Extract redirect URL if present
    const params = new URLSearchParams(location.search);
    // console.log("Params_det redirect_Det", params)
    const redirect = params.get("redirect") || "/dashboard";
    const { theme, toggleTheme } = useThemeChange('trevolt-theme', 'light');
    const { convertValue, convertSecValue, conversionRate, ChangeConversionRate, convertValueforChart, convertTo } = usePriceConversion('USD', 'INR');

    const [isPageLoader, setIsPageLoader] = useState(false)
    const [isAuth, setIsAuth] = useState(false)
    // SECURITY FIX (VAPT: Points 44/49/70) support flag: hydrating the
    // session now requires an async cookie-authenticated API call instead
    // of a synchronous localStorage read, so route guards elsewhere
    // (InstitutionalLayout, UserProtectedLayout, AuthLayout,
    // AffiliateLayout) need to know when that check has actually finished,
    // otherwise they would redirect a legitimately logged-in user away on
    // page refresh before the cookie check resolves.
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    // Non-sensitive session flag only (see comment above) — no longer the JWT itself.
    const hasSessionFlag = GetLocalStorageItem({ key: SESSION_FLAG_KEY });
    const [userType, setUserType] = useState('institutional-user')

    const { userdetails, beforelogin } = useSelector((state) => state.user);

    /**
     * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
     * `value` used to be the raw JWT, persisted to localStorage and echoed
     * into Redux as `accessToken` so the rest of the app could treat its
     * presence as "logged in". The actual auth token now lives only in the
     * httpOnly cookie the backend set during login (never readable by JS),
     * so `handleLogin` no longer takes or stores a token at all — it just
     * flips local UI/session state once the caller has confirmed login
     * succeeded, and pulls the user's profile (incl. their response
     * -encryption secretKey) via the cookie-authenticated
     * `getUserDetailsHooks()` call.
     */
    const handleLogin = async () => {
        try {
            SetLocalStorageItem({ key: SESSION_FLAG_KEY, value: "1" });
            const resp = await getUserDetailsHooks();
            const result = resp?.data;
            if (result?.success) {
                dispatch(UserDetails({ userdetails: result?.result?.data }));
                createSocketUser(result?.result?.data?.userId);
            }
            setIsAuth(true);
            setIsAuthChecked(true);
            dispatch(IsAuth({ isAuth: true }));
            navigate(redirect)
        } catch (e) {
            console.log("handleLogin__Err", e)
        }
    }

    const handleLogout = async () => {
        if (Object.values(userdetails).length > 0) {
            // logoutHooks() no longer needs the secretKey passed in — the
            // backend identifies the session from the (cookie or header)
            // auth token itself and clears the httpOnly cookie server-side
            // (Modules/User/Controller/userController.js -> clearAuthCookie).
            let resp = await logoutHooks();
            let result = resp?.data;
            if (result?.success) {
                RemoveItemLocalStorageItem({ key: SESSION_FLAG_KEY });
                dispatch(AccessToken({ accessToken: "" }));
                dispatch(BeforeLogin({ beforlogin: "light" }));
                localStorage.setItem("trevolt-theme", "light");
                dispatch(IsAuth({ isAuth: false }));
                setIsAuth(false)
                // navigate('/login')
                window.location.href =`/login`
            }
        }
    }

    useLayoutEffect(() => {
        setIsPageLoader(true);
        setTimeout(() => {
            setIsPageLoader(false);
        }, 1000)
    }, [])

    /**
     * SECURITY FIX (VAPT: "Token Storage Security" — Points 44/49/70).
     * Session hydration on page load/refresh used to depend on reading the
     * raw JWT back out of localStorage. It now only checks the non
     * -sensitive SESSION_FLAG_KEY as a hint, then relies on the browser
     * automatically sending the httpOnly auth cookie (axios
     * withCredentials: true) to actually re-authenticate via
     * getUserDetailsHooks(). If that cookie is missing/expired the call
     * fails and we correctly fall back to logged-out state, so a stale or
     * tampered local flag alone can never grant access.
     */
    useEffect(() => {
        let cancelled = false;
        const hydrate = async () => {
            if (!hasSessionFlag) {
                setIsAuth(false);
                dispatch(IsAuth({ isAuth: false }));
                setIsAuthChecked(true);
                return;
            }
            try {
                const resp = await getUserDetailsHooks();
                const result = resp?.data;
                if (!cancelled && result?.success) {
                    dispatch(UserDetails({ userdetails: result?.result?.data }));
                    // Re-join the user's socket room on page load/refresh —
                    // previously done by decoding the JWT out of
                    // localStorage (see socketConnectivity.jsx Reconnect()).
                    createSocketUser(result?.result?.data?.userId);
                    setIsAuth(true);
                    dispatch(IsAuth({ isAuth: true }));
                } else if (!cancelled) {
                    RemoveItemLocalStorageItem({ key: SESSION_FLAG_KEY });
                    setIsAuth(false);
                    dispatch(IsAuth({ isAuth: false }));
                }
            } catch (e) {
                if (!cancelled) {
                    setIsAuth(false);
                    dispatch(IsAuth({ isAuth: false }));
                }
            } finally {
                if (!cancelled) setIsAuthChecked(true);
            }
        };
        hydrate();
        return () => { cancelled = true; };
    }, [hasSessionFlag]);


    return (
        <GlobalContext.Provider value={{ theme, toggleTheme, setIsPageLoader, isAuth, isAuthChecked, userType, handleLogin, handleLogout, convertValue, convertValueforChart, convertSecValue, conversionRate, ChangeConversionRate, convertTo }}>
            {children}
            {isPageLoader && <PageLoader />}
        </GlobalContext.Provider>
    )
}

export const useGlobalContext = () => useContext(GlobalContext)