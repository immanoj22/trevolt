import { useMemo } from "react";
import { useSelector } from "react-redux";

import { getItem } from "../Actions/Storage/localstorage";

/**
 * Builds the script injected into the futures chart WebView BEFORE the
 * page's own JS runs (WebView's `injectedJavaScriptBeforeContentLoaded`),
 * handing it this device's own already-authenticated session as
 * `window.__GX_MOBILE_AUTH__`.
 *
 * The WebView has no session of its own (no cookie — it's a fresh browser
 * context, not this app). Trevolt-frontend/src/features/futuresTrading/
 * components/MobileChart.jsx reads this global on load and hydrates its own
 * (otherwise-empty) Redux user/auth state + axios Authorization header from
 * it. That's what lets the chart run the *exact same* TradingView
 * broker_factory path a logged-in browser session uses — native order/
 * position/TP-SL lines, drag, everything — rather than a hand-rolled
 * approximation of it.
 *
 * Not a new secret exposure: this is the same Bearer token/secretKey this
 * device already sends on every authenticated API call (see
 * Actions/Constant/encryption.tsx) — handed to a WebView this same app
 * controls, via injected JS rather than a URL, so it never lands in
 * navigation history, a server access log, or a Referer header.
 */
export function useChartAuthBridgeScript(): string {
    const userData = useSelector((state: any) => state.auth.userData);
    const leverage = useSelector((state: any) => state.auth.leverage);

    const accountId = userData?.accountId;
    const userId = userData?.userId;

    return useMemo(() => {
        const token = getItem("token");
        const secretKey = getItem("secretkey");
        if (!token || !accountId) return "";

        const payload = JSON.stringify({
            token,
            secretKey,
            accountId,
            userId,
            leverage: leverage || 1,
        });
        return `window.__GX_MOBILE_AUTH__ = ${payload}; true;`;
    }, [accountId, userId, leverage]);
}

// Posted by bracketBridgeScript (via window.ReactNativeWebView.postMessage)
// after a TP/SL edit's REST call completes - see chart.tsx's onMessage.
export const GX_BRACKET_UPDATE_MESSAGE = "GX_BRACKET_UPDATED";

/**
 * Injected into the futures chart WebView alongside the auth bridge above.
 *
 * Dragging a TP/SL line on the chart is handled entirely by the web
 * frontend's own broker code running inside the WebView (BrokerAdapter.js's
 * editPositionBrackets -> apiWrappers.js's updateBrackets), over that page's
 * own isolated Redux/socket instance - this RN app has no visibility into
 * that at all otherwise. This patches XMLHttpRequest (not `fetch` - the web
 * frontend's axios wrapper, Trevolt-frontend's config/axios.js, uses axios's
 * default browser adapter, which is XHR-based) to notice when a request to
 * the bracket-update endpoint completes, and tells the RN side via
 * postMessage so it can refetch positions with its own already-authenticated
 * REST call.
 *
 * Request/response bodies are end-to-end encrypted (see that same
 * axios.js), so this can only detect THAT the endpoint returned a 2xx, not
 * what actually changed - refetching on a technically-failed edit just
 * re-shows the unchanged value, which is harmless.
 */
export const bracketBridgeScript = `
(function () {
  if (window.__gxBracketBridgeInstalled) return;
  window.__gxBracketBridgeInstalled = true;
  var OrigOpen = XMLHttpRequest.prototype.open;
  var OrigSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    try {
      this.__gxIsBracketUpdate = typeof url === "string" && url.indexOf("/future/updateBracketOrders") !== -1;
    } catch (e) {}
    return OrigOpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    if (this.__gxIsBracketUpdate) {
      this.addEventListener("loadend", function () {
        try {
          if (this.status >= 200 && this.status < 300 && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(${JSON.stringify(GX_BRACKET_UPDATE_MESSAGE)});
          }
        } catch (e) {}
      });
    }
    return OrigSend.apply(this, arguments);
  };
  true;
})();
`;
