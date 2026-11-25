/** PACKAGE IMPORT */
import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from "react-redux";
import { useParams, useLocation } from "react-router-dom";
import isEmpty from 'is-empty';
import config from '../../../config/env';
import { setAuthToken } from '../../../config/axios';
import { createSocketUser } from '../../../config/socketConnectivity';
import { IsAuth, UserDetails, UserLeverage } from '../../../redux/action';
import { FutureTradePair } from '../../../redux/futureAction';
import TradingViewChart from './TradingViewChart';

const MobileChart = (props) => {
    const { tikerRoot } = useParams()
    const location = useLocation();
    const dispatch = useDispatch();

    // iOS Safari (and WKWebView) does not reliably resolve `100vh` on first
    // paint - it can resolve to 0 or an unstable value before the browser
    // chrome settles, which means the TradingView widget below can get
    // constructed against a 0x0 container and never render anything.
    // `visualViewport.height` (or innerHeight as a fallback) always reflects
    // the real, current viewport, so we track it in JS instead of trusting
    // the CSS unit.
    const [viewportHeight, setViewportHeight] = useState(
        () => (typeof window !== 'undefined'
            ? (window.visualViewport?.height || window.innerHeight)
            : 0)
    );

    useEffect(() => {
        const updateHeight = () => {
            setViewportHeight(window.visualViewport?.height || window.innerHeight);
        };
        updateHeight();
        window.visualViewport?.addEventListener('resize', updateHeight);
        window.addEventListener('resize', updateHeight);
        window.addEventListener('orientationchange', updateHeight);
        return () => {
            window.visualViewport?.removeEventListener('resize', updateHeight);
            window.removeEventListener('resize', updateHeight);
            window.removeEventListener('orientationchange', updateHeight);
        };
    }, []);
    const isWebviewEmbed = new URLSearchParams(location.search).get('webview') === '1';

    // The mobile app injects its own already-authenticated session (Bearer
    // token, secretKey, account/user id, leverage) as `window.__GX_MOBILE_AUTH__`
    // via injectedJavaScriptBeforeContentLoaded — BEFORE this page's own
    // scripts run (see Trevolt-mobile-application/frontend's
    // Utilities/chartAuthBridge.ts, wired into FutureNew/chart.tsx and
    // Chart/chart.tsx). Hydrating this page's own (otherwise-empty) Redux
    // user/auth state from it is what lets TradingViewChart run the *exact
    // same* broker_factory path a logged-in browser session uses — real
    // TradingView-native order/position/TP-SL lines, drag, everything —
    // instead of a hand-rolled approximation. Without it (old app build,
    // or this URL opened outside the real mobile app), this falls back to
    // the broker-disabled, read-only-chart path Options charts already use.
    const [authHydrated, setAuthHydrated] = useState(!isWebviewEmbed);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        if (!isWebviewEmbed) return;
        const bridge = window.__GX_MOBILE_AUTH__;
        if (!bridge?.token || !bridge?.accountId) {
            setAuthHydrated(true);
            return;
        }
        // The backend only honours an Authorization header that literally
        // starts with "Bearer " — see extractToken() in Library/authCookie.js;
        // anything else is ignored and it falls through to the auth cookie,
        // which this WebView doesn't have (→ 401 on every broker call).
        // setAuthToken() writes the header verbatim, so the prefix has to be
        // added here. The app stores the raw token (its own prepareHeaders in
        // Actions/Constant/encryption.tsx adds the same prefix), but tolerate
        // an already-prefixed value rather than sending "Bearer Bearer ...".
        const bearerToken = String(bridge.token).startsWith('Bearer ')
            ? String(bridge.token)
            : `Bearer ${bridge.token}`;
        setAuthToken(bearerToken);
        // HelperRoutes.js gates its whole authenticated bootstrap behind this
        // flag (`localStorage.getItem('isLoggedIn')` — see fetchUserData there),
        // and that bootstrap is what calls FetchPositionOrders() → populates
        // state.user.positionDetails. useBrokerAdapter reads exactly that slice
        // to register positions, and TP/SL lines can only attach to a position
        // that's already registered. The WebView's localStorage starts empty
        // (nobody ever logged in through it), so without this the chart draws
        // order lines but never a position or its TP/SL. The flag is only a
        // hint to attempt the call — the request still fails on its own if the
        // token is missing/expired.
        //
        // Guarded because a throw here (iOS private mode, storage disabled or
        // full) would abort this effect before setAuthHydrated(true) below,
        // and `if (!authHydrated) return null` would then leave a permanently
        // blank chart — the exact failure this whole effect exists to avoid.
        // Losing the flag only costs the bootstrap, not the chart itself.
        try {
            localStorage.setItem('isLoggedIn', 'true');
        } catch {
            console.warn('[MobileChart] localStorage unavailable — position/wallet bootstrap will be skipped');
        }
        dispatch(IsAuth({ isAuth: true }));
        dispatch(UserDetails({
            userdetails: {
                accountId: bridge.accountId,
                userId: bridge.userId,
                secretKey: bridge.secretKey,
            },
        }));
        dispatch(UserLeverage({ leverage: bridge.leverage || 1 }));
        if (bridge.userId) createSocketUser(bridge.userId);
        setHasSession(true);
        setAuthHydrated(true);
    }, [isWebviewEmbed, dispatch]);

    // futurePairData is already fetched app-wide (HelperRoutes.js, mounted
    // globally regardless of route/auth) — just resolve the pair matching
    // this URL's ticker into futureTradePair, the same match TradeActionCard's
    // own page (FuturesTrading.jsx's setPairData) does, so order placement
    // has a real pairId to send.
    const futurePairData = useSelector((s) => s.future.futurePairData);
    const futureTradePair = useSelector((s) => s.future.futureTradePair);

    useEffect(() => {
        if (!hasSession || isEmpty(futurePairData) || !tikerRoot) return;
        const match = futurePairData.find((p) => p.tickerRoot === tikerRoot);
        if (match && futureTradePair?.tickerRoot !== match.tickerRoot) {
            dispatch(FutureTradePair({ tradePair: match }));
        }
    }, [hasSession, futurePairData, futureTradePair?.tickerRoot, tikerRoot, dispatch]);

    const tradeType = hasSession ? 'future' : (isWebviewEmbed ? 'option' : 'future');

    // Wait for the auth-hydration effect above to run before mounting the
    // chart, so it never briefly constructs with the wrong tradeType/broker
    // state and has to rebuild a moment later.
    if (!authHydrated) return null;

    return (
        <div
            className="mobileChartPage"
            style={{
                width: '100vw',
                // Prefer the JS-measured value (always correct); fall back to
                // 100dvh (dynamic viewport height, iOS Safari 15.4+) and then
                // 100vh for very old browsers where none of this matters.
                height: viewportHeight ? `${viewportHeight}px` : '100dvh',
            }}
        >
            <TradingViewChart
                symbol={tikerRoot}
                interval='5'
                containerId='tv_chart_container'
                datafeedUrl={`${config.API_URL}/future`}
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
                tradeType={tradeType}
            />
        </div>
    )

}


export default MobileChart
