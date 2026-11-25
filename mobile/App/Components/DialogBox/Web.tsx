import React, { useEffect, useRef, useState } from "react";
import { View, StyleProp, ViewStyle, Pressable, Platform, BackHandler } from "react-native";
import { Portal } from "@gorhom/portal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView as RNWebView } from "react-native-webview";

// react-native-webview's WebViewProps type intersects separate iOS/Android/Windows
// prop-set types with conflicting overlapping fields, which collapses several props
// to `never` under TS - a known vendor typing issue, not a real prop mismatch here.
const WebView = RNWebView as any;
import { KYCREDIRECT_URL } from "@env";

import Text from "../text";
import VectorIcons from "../../Utilities/vectoricons";
import { windowheight } from "../../Utilities/dimensions";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { Colors, Fontfamily, Fontsize } from "../../Utilities/uiasset";

type WebviewModalProps = {
    url?: any;
    onCloseHandler?: () => void;
    title?: string;
    containerStyle?: StyleProp<ViewStyle>;
    contentStyle?: any,
    leftIcon?: any,
    rightIcon?: any,
    // Some pages we open here (the marketing site's /learn, /blog) are full pages that
    // ship with the site's own <header>/<footer> chrome - fine standalone on the web,
    // but this modal is meant to show just that page's content inside the app. Opt-in
    // per call site (not a default) since other WebviewModal uses - KYC, TradingView
    // charts - load pages that don't have this chrome and shouldn't run extra JS.
    stripChrome?: boolean
};

const WebviewModal: React.FC<WebviewModalProps> = ({
    url,
    onCloseHandler,
    title = "Refer & Earn",
    containerStyle,
    contentStyle,
    leftIcon = true,
    rightIcon = false,
    stripChrome = false
}) => {

    const { theme } = useCustomHooks()
    const insets = useSafeAreaInsets()

    const webViewRef = useRef<RNWebView>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleNavigationChange = (event: any) => {
        const { url } = event;

        if (url.includes(KYCREDIRECT_URL) && title == "KYC") {
            onCloseHandler?.()
        }
    };

    // The site's <header> (nav bar/logo/menu) makes no sense duplicated inside this
    // modal, which already has its own title bar - stays fully hidden. The <footer>
    // (Trevolt-frontend's Footer.jsx) is desktop-multi-column marketing content that
    // renders unorganized on a narrow phone-width WebView; rather than deleting it
    // (which just leaves blank space), this reformats it into a single readable column,
    // drops the newsletter signup and social-icon row (not meaningful inside an app
    // modal), and keeps the site links/copyright, restyled to fit the app's theme.
    //
    // Footer.jsx's real class names are CSS-modules and get hashed in the production
    // build (e.g. `footerMenus` -> `_footerMenus_a1b2c_3`), so exact class selectors
    // would silently stop matching - `[class*="name"]` substring-matches instead, which
    // survives the hash since the original name stays embedded in it. `header`/`footer`
    // and the `container`/`custom-container` utility classes are literal, stable tags.
    const STRIP_CHROME_JS = stripChrome ? `
        (function() {
            var style = document.createElement('style');
            style.innerHTML = [
                'header { display: none !important; }',
                'footer { background: ${theme.background} !important; padding: 20px 16px !important; }',
                'footer, footer p, footer li, footer a { color: ${theme.theme === "dark" ? "#C9C9C9" : "#3A3A3A"} !important; font-size: 12px !important; line-height: 1.5 !important; }',
                'footer [class*="footerMenusTitle"] { color: ${theme.primarytext} !important; font-size: 13px !important; font-weight: 600 !important; }',
                'footer [class*="footerTopWrapper"] { display: flex !important; flex-direction: column !important; gap: 16px !important; width: 100% !important; max-width: 100% !important; }',
                'footer [class*="footerLogoContainer"] img { max-width: 110px !important; height: auto !important; }',
                'footer ul { list-style: none !important; padding: 0 !important; margin: 6px 0 0 0 !important; }',
                'footer li { margin-bottom: 6px !important; }',
                'footer [class*="footerSubscribe"] { display: none !important; }',
                'footer [class*="footerBottomLeft"] { display: none !important; }',
                'footer [class*="footerBottom"] { display: flex !important; flex-direction: column !important; gap: 4px !important; width: 100% !important; max-width: 100% !important; }',
                'footer, footer div { box-sizing: border-box !important; }'
            ].join(' ');
            document.head.appendChild(style);
        })();
    ` : "";

    // The site reads its own light/dark theme from localStorage('trevolt-theme'),
    // defaulting to 'dark' when unset (see Trevolt-frontend's GlobalProvider.jsx). A
    // WebView session has no such value stored, so the site always renders dark
    // regardless of the app's actual theme - visible as page sections (e.g. the blog
    // list's background, driven by a CSS var that flips per theme) staying black even
    // when the app around this modal is in light mode, while our own footer restyle
    // above forces itself light, producing a mismatched black-block-over-light-page
    // look. Setting this *before* the page's JS runs (via
    // injectedJavaScriptBeforeContentLoaded, not the after-load INJECTED_JS below) makes
    // the site itself render in the matching theme from the first paint.
    const SYNC_THEME_JS = stripChrome ? `
        (function() {
            try { localStorage.setItem('trevolt-theme', '${theme.theme === "dark" ? "dark" : "light"}'); } catch (e) {}
        })();
        true;
    ` : "";

    const INJECTED_JS = `
        (function() {
            // Prevent any redirect attempts
            var pushState = history.pushState;
            history.pushState = function() { return pushState.apply(history, arguments); };
            true;
        })();
        ${STRIP_CHROME_JS}
        true;
    `;

    useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            onCloseHandler?.();
            return true;
        });
        return () => sub.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        // Rendered via Portal instead of a native <Modal> - stays inside the normal
        // view hierarchy and stacks below the app's permanent root FlashMessage, so a
        // toast fired while this webview is open is never hidden behind it.
        <Portal>
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            <View style={{ height: insets.top, backgroundColor: theme.background }} />
            <View style={[{ flex: 1, backgroundColor: theme.background }, containerStyle]}>
                <View style={{ height: windowheight * 0.060, marginTop: 15, justifyContent: "center", flexDirection: "row", alignItems: "center" }} >
                    {
                        leftIcon && (
                            <Pressable onPress={onCloseHandler} style={{ width: "15%", height: "100%", position: "absolute", left: 0, justifyContent: "center", alignItems: "center" }} >
                                <VectorIcons
                                    family="Ionicons"
                                    name="chevron-back"
                                    iconcolor={theme.theme === "dark" ? Colors.white : Colors.black}
                                />
                            </Pressable>
                        )
                    }
                    <Text style={[{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: Fontsize.medium, width: "70%", textAlign: "center" }]} >{title}</Text>
                    {
                        rightIcon && (
                            <Pressable onPress={onCloseHandler} style={{ width: "15%", height: "100%", position: "absolute", right: 0, justifyContent: "center", alignItems: "center" }} >
                                <VectorIcons
                                    family="Ionicons"
                                    name="close"
                                    size={25}
                                />
                            </Pressable>
                        )
                    }
                </View>
                {/* <WebView
                    bounces={false}
                    startInLoadingState={true}
                    source={{ uri: url }}
                    incognito={true}
                    scrollEnabled={true}
                    onNavigationStateChange={handleNavigationChange}
                    style={contentStyle}
                /> */}


                {url && <WebView
                    ref={webViewRef}
                    source={{ uri: url }}

                    // ✅ Critical for TradingView
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    allowsFullscreenVideo={false}

                    // ✅ Fixes blank screen on Android with heavy JS
                    // androidHardwareAccelerationDisabled={false}
                    mixedContentMode="compatibility"   // Android: allow http inside https

                    // ✅ Fixes iOS canvas/WebGL issues (TradingView uses canvas)
                    allowsBackForwardNavigationGestures={false}

                    // ✅ Required for TradingView's localStorage usage (even if disabled in widget)
                    incognito={false}   // ← was true; incognito blocks storage APIs TradingView needs

                    // ✅ User agent — some TV builds check for desktop UA
                    userAgent={
                        Platform.OS === "android"
                            ? "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36"
                            : "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
                    }

                    bounces={false}
                    scrollEnabled={true}
                    startInLoadingState={true}
                    injectedJavaScriptBeforeContentLoaded={SYNC_THEME_JS}
                    injectedJavaScript={INJECTED_JS}
                    onNavigationStateChange={handleNavigationChange}

                    onLoadStart={() => { setLoading(true); setError(null); }}
                    onLoadEnd={() => setLoading(false)}
                    onError={(e: any) => {
                        setLoading(false);
                        setError(e.nativeEvent.description || "Failed to load chart");
                        console.warn("[WebviewModal] error:", e.nativeEvent);
                    }}
                    onHttpError={(e: any) => {
                        console.warn("[WebviewModal] HTTP error:", e.nativeEvent.statusCode, url);
                    }}

                    style={[{ flex: 1, backgroundColor: "transparent" }, contentStyle]}
                />}
            </View>
        </View>
        </Portal>
    );
};

export default WebviewModal;