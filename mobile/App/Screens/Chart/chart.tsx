import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import WebView from "react-native-webview";

import Mainview from "../../Components/mainview";
import ComingSoon from "../../Components/ComingSoon";
import QuickTradeBar from "./QuickTradeBar";
import { APIURL } from "../../Actions/Constant/constant";
import { SetFutureparams } from "../../Slices/helper";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";
import { getItem } from "../../Actions/Storage/localstorage";
import { GX_BRACKET_UPDATE_MESSAGE, bracketBridgeScript, useChartAuthBridgeScript } from "../../Utilities/chartAuthBridge";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import Currencyselect from "../../Components/currencyselect";
import LinearGradient from "../../Components/lineargradient";
import Text from "../../Components/text";
import Images from "../../Utilities/images";
import { formatDisplayPair } from "../../Utilities/formatPair";

interface Chartprops {
    ticker?: any;
    onBack?: () => void;
    // Fired specifically by tapping the pair name/chevron - falls back to onBack
    // when not supplied, so callers that don't need the distinction (there aren't
    // any left, but keeps this component usable standalone) still work.
    onSelectPair?: () => void;
}

// How long to wait for the chart's auth bridge (redux userData) and for an
// authoritative pair before mounting the WebView regardless - see waitingToMount.
const MOUNT_WAIT_MS = 8000;

const Chart: React.FC<Chartprops> = ({ ticker, onBack, onSelectPair }) => {
    const { theme, navigation, dispatch } = useCustomHooks();
    const { triggerpositionOrders } = useApihooks();
    const mobiletheme = getItem("mobiletheme") || "dark";
    const chartBg = theme.theme === "dark" ? "#000000" : "#FFFFFF";
    const webviewRef = useRef<any>(null);
    // New value every mount, so the WebView is a fresh native instance each time
    // the screen is opened - a reused instance comes back blank on the 2nd visit.
    const mountKey = useMemo(() => `${Date.now()}`, []);

    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    // Flips true once the pair-list API has resolved at least once (see
    // Slices/future.ts setFuturePairData) - lets us tell "still loading" apart from
    // "loaded, and this pair genuinely has no futures market" below. Deciding
    // Coming Soon before this is true is exactly the glitch to avoid: it would flash
    // Coming Soon on every cold open (pair list not fetched yet) before the real
    // chart pops in once the API actually responds.
    const futurePairDataLoaded = useSelector((state: any) => state.future.futurePairDataLoaded);

    // The Chart bottom tab renders this screen with no ticker prop, so resolve one:
    // last-selected pair (redux) -> persisted pair -> first available pair -> EURUSD.
    const resolvedTicker = useMemo(() => {
        return (
            ticker ||
            futureTicker?.tickerRoot ||
            getItem("futurespair") ||
            (Array.isArray(futurePairData) && futurePairData[0]?.tickerRoot) ||
            "EURUSD"
        );
    }, [ticker, futureTicker?.tickerRoot, futurePairData]);

    // A specific pair was requested (via the `ticker` prop - e.g. tapped from a
    // coin list elsewhere in the app) but it isn't in the active futures pair list,
    // or there are no active futures pairs at all right now: no point pointing the
    // WebView at /futures-chart/<ticker> for a market that doesn't exist - show
    // Coming Soon instead. Only ever decided once futurePairDataLoaded is true.
    const noFuturePair = useMemo(() => {
        if (!futurePairDataLoaded) return false;
        if (!Array.isArray(futurePairData) || !futurePairData.length) return true;
        if (ticker) return !futurePairData.some((val: any) => val.tickerRoot === ticker);
        return false;
    }, [futurePairDataLoaded, futurePairData, ticker]);

    // Must stay `webview=1`. The page's JS couples two things to this one flag:
    //   webview=1  -> enables `iframe_loading_compatibility_mode` (chart renders in a
    //                 mobile WebView) BUT disables `header_widget` + `left_toolbar`
    //   no flag    -> toolbars shown BUT compat mode off -> charting_library iframe
    //                 never paints here -> blank screen
    // Getting the toolbars needs a backend change (split the flag / add `&toolbar=1`).
    const uri = `${APIURL}/futures-chart/${resolvedTicker}?theme=${mobiletheme}&webview=1`;

    // Hands the chart WebView this device's own authenticated session before
    // its page scripts run, so it runs the full TradingView broker path
    // (real native order/position/TP-SL lines, drag) instead of a read-only
    // approximation — see chartAuthBridge.ts.
    const authBridgeScript = useChartAuthBridgeScript();

    // Cold-start race. `token`/`secretkey` come straight from storage, but the
    // `accountId` chartAuthBridge also needs lives ONLY in redux
    // (state.auth.userData - this app has no redux-persist), so for the first
    // moments after an app launch it isn't there yet and the bridge returns "".
    // Because injectedJavaScriptBeforeContentLoaded is snapshotted at document
    // load, a WebView that mounts inside that window never receives auth
    // afterwards - a later prop change does nothing. It then runs session-less
    // for its entire life: MobileChart.jsx sees no __GX_MOBILE_AUTH__, falls back
    // to tradeType 'option', TradingViewChart's isBrokerCapable is false, and
    // useBrokerAdapter's loadInitialData() early-returns - so the first chart
    // opened after every cold start silently came up with no broker at all (no
    // order lines, no position line, no TP/SL, no drag). Waiting for the bridge
    // before mounting is what makes that first open a real trading chart.
    //
    // Deliberately only ever waits when auth is actually inbound - a token
    // exists but userData hasn't landed - so a logged-out viewer still gets the
    // chart immediately. And if that profile fetch never resolves, the wait
    // expires and we mount anyway, falling back to exactly today's behaviour
    // instead of spinning forever.
    const [mountWaitExpired, setMountWaitExpired] = useState(false);
    const authPending = !!getItem("token") && !authBridgeScript;

    // Second reason to hold the mount: the pair in `uri` must be the real one,
    // not a guess. future.tsx passes `ticker={futureTicker?.tickerRoot}`, and
    // futureTicker resets to [] on a pair switch and before the first live tick
    // (Slices/future.ts `state.futureTicker = next ?? []`), so the prop goes
    // briefly undefined and resolvedTicker falls back to the persisted pair.
    // The WebView's key embeds `uri`, so mounting on that fallback and then
    // snapping to the real pair destroyed the instance and built a second one -
    // that is the "chart opens, then opens again" double load, most obvious
    // right after switching pairs. Waiting for an authoritative tickerRoot
    // means we mount once, on the correct pair.
    const pairPending = !(ticker || futureTicker?.tickerRoot);

    // One deadline from mount rather than a timer per condition, so a condition
    // flipping can't keep pushing the fallback further out.
    useEffect(() => {
        const timer = setTimeout(() => setMountWaitExpired(true), MOUNT_WAIT_MS);
        return () => clearTimeout(timer);
    }, []);
    const waitingToMount = (authPending || pairPending) && !mountWaitExpired;

    // Stay on webview=1 so `iframe_loading_compatibility_mode` keeps the chart painting
    // in the WebView, but monkey-patch TradingView.widget before the page creates it to
    // strip the toolbar entries the page adds to `disabled_features` in webview mode -
    // this brings back the left drawing toolbar + top header (fₓ indicators).
    const injectToolbar = `
      (function () {
        var STRIP = ["header_widget","left_toolbar","header_screenshot","chart_download_image","header_saveload","saveload_separate_drawings_storage"];
        function patch() {
          try {
            var TV = window.TradingView;
            if (TV && typeof TV.widget === "function" && !TV.__gxPatched) {
              var Orig = TV.widget;
              function Patched(opts) {
                try {
                  if (opts && Array.isArray(opts.disabled_features)) {
                    opts.disabled_features = opts.disabled_features.filter(function (f) { return STRIP.indexOf(f) === -1; });
                  }
                  if (opts && Array.isArray(opts.enabled_features) && opts.enabled_features.indexOf("header_widget") === -1) {
                    opts.enabled_features.push("header_widget");
                  }
                } catch (e) {}
                return new Orig(opts);
              }
              Patched.prototype = Orig.prototype;
              TV.widget = Patched;
              TV.__gxPatched = true;
            }
          } catch (e) {}
        }
        patch();
        var iv = setInterval(patch, 25);
        setTimeout(function () { clearInterval(iv); }, 15000);

        // TradingView's symbol-search / "Compare symbol" dialog renders the active
        // type chip (e.g. "All types") with a light background but doesn't flip its
        // label colour, so the text vanishes. Force a readable colour on the active
        // chip / selected rows, in the main document and every same-origin iframe.
        var TEXT = ${JSON.stringify(theme.theme === "dark" ? "#FFFFFF" : "#000000")};
        var SELECTED =
          '[class*="tab"][class*="selected"],[class*="tab"][class*="active"],' +
          '[class*="chip"][class*="selected"],[class*="chip"][class*="active"],' +
          '[class*="filter"][class*="selected"],[class*="filter"][class*="active"],' +
          '[class*="item"][class*="selected"],[aria-selected="true"]';
        var ACCENT = ${JSON.stringify(theme.theme === "dark" ? "#2A2A2A" : "#E8EFFC")};
        var CSS =
          SELECTED + ',' + SELECTED + ' *{color:' + TEXT + ' !important;}' +
          SELECTED + '{background:' + ACCENT + ' !important;}' +
          SELECTED + ' *{background:transparent !important;background-color:transparent !important;box-shadow:none !important;}';
        function styleDoc(doc) {
          try {
            if (!doc) return;
            var id = "__gx_search_css__";
            var el = doc.getElementById(id);
            if (!el) { el = doc.createElement("style"); el.id = id; (doc.head || doc.documentElement).appendChild(el); }
            el.textContent = CSS;
            var fr = doc.querySelectorAll("iframe");
            for (var i = 0; i < fr.length; i++) {
              try { styleDoc(fr[i].contentDocument); } catch (e) {}
            }
          } catch (e) {}
        }
        setInterval(function () { styleDoc(document); }, 500);
        true;
      })();
    `;

    // authBridgeScript must run first — it just assigns a global, so
    // concatenating ahead of injectToolbar/bracketBridgeScript (both IIFEs)
    // is safe order-wise.
    const injectedBeforeLoad = `${authBridgeScript}\n${bracketBridgeScript}\n${injectToolbar}`;

    return (
        <Mainview
            isheader={false}
            isbottomtab={true}
            isscollable={false}
            horizontalpadding={0}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
            >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 12,
                    marginTop: 10,
                    marginBottom: 10,
                }}
            >
                <View style={{ width: windowwidth * 0.6 }}>
                    <Currencyselect
                         currency={formatDisplayPair(futureTicker?.tickerRoot)}
                        descrption="PERPETUALS"
                        // Tapping the pair name should always land on Market's pair list.
                        // - Reached as a component swap from FutureNew/future.tsx
                        //   (`showFullChart`): `onSelectPair` closes both that swap and
                        //   Future's own swap in one go; `onBack` is the fallback.
                        // - Reached standalone (bottom-tab "Chart" entry via the Home
                        //   "Chart" shortcut, or the FullViewChart stack route): no
                        //   onSelectPair/onBack wiring. Market can't be reached with a
                        //   plain navigation param here (screens outside Market can't
                        //   set its local state directly - see market.tsx's
                        //   `futureparams` comment), so signal "whichever pair gets
                        //   picked next should open straight into its Chart view" the
                        //   same way Home's other trade shortcuts already do, then
                        //   navigate to the Market tab.
                        onselect={() => {
                            if (onSelectPair || onBack) {
                                (onSelectPair ?? onBack)?.();
                                return;
                            }
                            dispatch(SetFutureparams("chart"));
                            navigation?.navigate("Dashboard", { screen: "Market" });
                        }}
                    />
                </View>

                {/* Chart button - active here, tap to go back. When reached standalone
                    (Home's "Chart" shortcut, no onBack/onSelectPair wiring) there's no
                    trade screen to return to, so `onBack?.()` alone was a silent no-op -
                    fall back to a plain goBack so the button actually does something. */}
                {/* {onBack && ( */}
                <Pressable onPress={() => (onBack ?? (() => navigation?.goBack()))()}>
                    <LinearGradient
                        colors={
                            theme.theme === "dark"
                                ? ["#2563EB", "#2563EB"]
                                : ["#2563EB", "#2563EB"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            borderRadius: borderradius * 3,
                            paddingVertical: 8,
                            paddingHorizontal: 18,
                            alignItems: "center",
                            borderWidth: 0.8,
                            borderColor: theme.theme === "dark" ? "#F1F5F9" : "#D0D0D0",
                            flexDirection: "row",
                            gap: 8,
                        }}
                    >
                        <Text family="medium" style={{ color: "#FFFFFF" }}>
                            Chart
                        </Text>
                        <Images
                            type="svg"
                            name="ChartTabWhiteIcon"
                            width={15}
                            height={15}
                            style={{ marginBottom: 2 }}
                        />
                    </LinearGradient>
                </Pressable>
                {/* )} */}
            </View>

            {noFuturePair ? (
                <ComingSoon
                    title="Coming Soon"
                    message="There's no futures market for this pair yet. Please check back later."
                    onGoBack={onBack ?? (() => navigation?.goBack())}
                />
            ) : resolvedTicker && futurePairDataLoaded && !waitingToMount ? (
                <>
                <View style={{ flex: 1, backgroundColor: chartBg }}>
                    <WebView
                        ref={webviewRef}
                        containerStyle={{ backgroundColor: chartBg }}
                        key={`${uri}-${mountKey}`}
                        bounces={false}
                        startInLoadingState={true}
                        source={{ uri }}
                        injectedJavaScriptBeforeContentLoaded={injectedBeforeLoad}
                        incognito={false}
                        // "software" layer avoids the all-black/blank WebView some Android
                        // GPUs render for this TradingView page on remount.
                        androidLayerType={Platform.OS === "android" ? "software" : undefined}
                        onContentProcessDidTerminate={() => webviewRef.current?.reload()}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        allowsBackForwardNavigationGestures={false}
                        mixedContentMode="compatibility"
                        userAgent={
                            Platform.OS === "android"
                                ? "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36"
                                : "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
                        }
                        onError={(e: any) => console.warn("[Chart] error:", e.nativeEvent)}
                        onHttpError={(e: any) => console.warn("[Chart] HTTP error:", e.nativeEvent.statusCode)}
                        // bracketBridgeScript above posts this once a chart TP/SL drag's
                        // REST call resolves - refetch positions so Portfolio > Positions
                        // reflects it without needing a full app restart.
                        onMessage={(e: any) => {
                            if (e?.nativeEvent?.data === GX_BRACKET_UPDATE_MESSAGE) {
                                triggerpositionOrders();
                            }
                        }}
                        renderLoading={() => (
                            <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: chartBg }}>
                                <ActivityIndicator size="small" color={theme.primarytext} />
                            </View>
                        )}
                        style={{ flex: 1, backgroundColor: chartBg }}
                    />
                </View>
                <QuickTradeBar tickerRoot={resolvedTicker} />
                </>
            ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>

                    <ActivityIndicator size="small" color={theme.primarytext} />
                </View>
            )}
        </Mainview>
    );
};

export default Chart;
