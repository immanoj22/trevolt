import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import WebView from "react-native-webview";

import Images from "../../Utilities/images";
import { Colors } from "../../Utilities/uiasset";
import { APIURL } from "../../Actions/Constant/constant";
import WebviewModal from "../../Components/DialogBox/Web";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";
import { getItem } from "../../Actions/Storage/localstorage";
import { GX_BRACKET_UPDATE_MESSAGE, bracketBridgeScript, useChartAuthBridgeScript } from "../../Utilities/chartAuthBridge";
import Text from "../../Components/text";
interface Chartprops {
    ticker?: any
    interval?: string
}

const Chart: React.FC<Chartprops> = ({ ticker, interval }) => {
    const { theme } = useCustomHooks()
    const { triggerpositionOrders } = useApihooks();
    const mobiletheme = getItem("mobiletheme") || "dark"
    const intervalParam = interval ? `&interval=${interval}` : ""
    const chartBg = theme.theme === "dark" ? "#000000" : "#FFFFFF"
    const [popup, setPopup] = useState(false);
    // Hands the chart WebView this device's own authenticated session before
    // its page scripts run, so it runs the full TradingView broker path
    // (real native order/position/TP-SL lines, drag) instead of a read-only
    // approximation — see chartAuthBridge.ts.
    const authBridgeScript = useChartAuthBridgeScript();

    const [showIcon, setShowIcon] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIcon(true);
        }, 2500); // delay in ms

        return () => clearTimeout(timer);
    }, []);


    return (
        <View style={{ flex: 1, backgroundColor: chartBg, marginTop: "2%", position: "relative" }} >
            {
                showIcon && (
                    <Pressable style={{ position: "absolute", zIndex: 100, right: 12, top: 10, backgroundColor: theme.theme === "dark" ? "#171717" : Colors.white }} hitSlop={20} onPress={() => setPopup(true)}>
                        <Images
                            type="svg"
                            name="Output"
                            width={20}
                            height={18}
                        />
                    </Pressable>
                )
            }
            {
                ticker ? (
                    <WebView
                        injectedJavaScriptBeforeContentLoaded={`${authBridgeScript}\n${bracketBridgeScript}`}
                        // bracketBridgeScript above posts this once a chart TP/SL drag's
                        // REST call resolves - refetch positions so Portfolio > Positions
                        // reflects it without needing a full app restart.
                        onMessage={(e: any) => {
                            if (e?.nativeEvent?.data === GX_BRACKET_UPDATE_MESSAGE) {
                                triggerpositionOrders();
                            }
                        }}
                        bounces={false}
                        startInLoadingState={true}
                        key={`${ticker}-${interval}`}
                        source={{ uri: `${APIURL}/futures-chart/${ticker}?theme=${mobiletheme}&webview=1${intervalParam}` }}
                        // Same iOS fixes proven in Components/DialogBox/Web.tsx's WebView for
                        // the same chart URL: incognito blocks the localStorage/canvas APIs
                        // TradingView's charting_library needs to initialize, which is why
                        // the chart rendered blank on iOS while tolerating it on Android.
                        incognito={false}
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
                        onError={(e: any) => console.warn("[FutureNew/chart] error:", e.nativeEvent)}
                        onHttpError={(e: any) => console.warn("[FutureNew/chart] HTTP error:", e.nativeEvent.statusCode)}
                        // The chart is embedded inside this screen's own outer ScrollView -
                        // a scrollable WebView nested in there fights the outer scroll view
                        // for the pan gesture on iOS (Android's nested-scrolling handles
                        // this cooperatively; iOS doesn't), which reads as the screen
                        // suddenly jumping/freezing mid-scroll. The chart is sized to fit
                        // its box (webview=1 embed mode), so it doesn't need its own scroll.
                        scrollEnabled={Platform.OS !== "ios"}
                        containerStyle={{ backgroundColor: chartBg }}
                        style={{ flex: 1, backgroundColor: chartBg, marginLeft: -3, marginBottom: -44 }}
                    />
                ) : (
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                        <ActivityIndicator size="small" color={theme.primarytext} />
                    </View>
                )
            }
            {
                popup && ticker &&
                <WebviewModal
                    title=""
                    url={`${APIURL}/futures-chart/${ticker}?theme=${mobiletheme}&webview=1`}
                    onCloseHandler={() => setPopup(false)}
                    leftIcon={false}
                    rightIcon={true}
                />

            }
        </View>
    )
}

export default Chart;
