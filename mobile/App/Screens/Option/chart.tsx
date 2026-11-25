import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import WebView from "react-native-webview";

import Images from "../../Utilities/images";
import { Colors } from "../../Utilities/uiasset";
import { APIURL } from "../../Actions/Constant/constant";
import WebviewModal from "../../Components/DialogBox/Web";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { getItem } from "../../Actions/Storage/localstorage";

interface OptionChartProps {
    ticker?: any
}

const OptionChart: React.FC<OptionChartProps> = ({ ticker }) => {
    const { theme } = useCustomHooks()
    const mobiletheme = getItem("mobiletheme") || "dark"
    const [popup, setPopup] = useState(false);

    const [showIcon, setShowIcon] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowIcon(true);
        }, 2500); // delay in ms

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background, marginTop: "2%", position: "relative" }} >
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
                        bounces={false}
                        startInLoadingState={true}
                        source={{ uri: `${APIURL}/options-chart/${ticker}?theme=${mobiletheme}&webview=1` }}
                        incognito={true}
                        scrollEnabled={true}
                        style={{ flex: 1, backgroundColor: theme.background, marginLeft: -3, marginBottom: -44 }}
                    />
                ) : null
            }
            {
                popup && ticker &&
                <WebviewModal
                    title=""
                    url={`${APIURL}/options-chart/${ticker}?theme=${mobiletheme}&webview=1`}
                    onCloseHandler={() => setPopup(false)}
                    leftIcon={false}
                    rightIcon={true}
                />

            }
        </View>
    )
}

export default OptionChart;
