import React from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, ScrollViewProps, StatusBar, StyleProp, Text, TextProps, TextStyle, View } from "react-native";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { KeyboardAvoidingView, KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "./lineargradient";

import VectorIcons from "../Utilities/vectoricons";
import useCustomHooks from "../Actions/Hooks/customhook";
import { Colors, Fontfamily, Fontsize } from "../Utilities/uiasset";
import { RFvalue, windowheight } from "../Utilities/dimensions";

interface Mainviewprops {
    isstatusbar?: boolean,
    statusbarcolor?: string,
    bottombarcolor?: string,
    backgroundcolor?: string,
    isheader?: boolean,
    headertitle?: string,
    lefticon?: React.ReactNode,
    righticon?: React.ReactNode,
    onleftfn?: () => void;
    onrightfn?: () => void;
    headertextprops?: TextProps,
    headerTextstyle?: StyleProp<TextStyle>
    customheader?: React.ReactNode,
    isscollable?: boolean,
    children?: React.ReactNode,
    ismainloading?: boolean,
    isnodata?: boolean,
    nodatacontent?: string,
    isoverlaploader?: boolean,
    horizontalpadding?: any,
    scrollprops?: ScrollViewProps,
    isbottomtab?: boolean
    bottomContent?: React.ReactNode,
    customnodata?: React.ReactNode,
    onreload?: () => void,
    isrefreshing?: boolean,
    isrefereshcontrol?: boolean,
    stickyHeader?: React.ReactNode,
    gradientColors?: string[],
    gradientLocations?: number[],
    iskeyboardaware?: boolean
    // Opt-in only: renders the outer scroll (when iskeyboardaware is false) through
    // react-native-gesture-handler instead of plain RN ScrollView, so a gesture-handler
    // ScrollView nested inside it (e.g. orderbookstacked.tsx) can scroll on iOS without
    // freezing the outer scroll - see that file's `scrollEnabled` comment. Off by default
    // so every other screen using Mainview keeps its exact current scroll behavior.
    isnestedscrollable?: boolean
}

const Mainview: React.FC<Mainviewprops> = ({
    isstatusbar = true,
    statusbarcolor,
    bottombarcolor,
    backgroundcolor,
    isheader = true,
    headertitle,
    lefticon,
    righticon,
    onleftfn,
    onrightfn,
    headertextprops,
    headerTextstyle,
    customheader,
    isscollable = false,
    children,
    ismainloading = false,
    isnodata = false,
    nodatacontent = "No Data Found",
    isoverlaploader = false,
    horizontalpadding = "6%",
    scrollprops,
    isbottomtab = false,
    bottomContent,
    customnodata,
    onreload,
    isrefreshing = false,
    isrefereshcontrol = false,
    stickyHeader,
    gradientColors,
    gradientLocations,
    iskeyboardaware = true,
    isnestedscrollable = false,
}) => {
    const OuterScrollView = isnestedscrollable ? GestureScrollView : ScrollView;

    const { theme } = useCustomHooks()
    const insets = useSafeAreaInsets()

    const content = (
        <>
            {isstatusbar &&
                <View style={{ height: insets.top, backgroundColor: gradientColors ? "transparent" : statusbarcolor ?? theme.background }} />}
            <View style={{ flex: 1, backgroundColor: gradientColors ? "transparent" : bottombarcolor ?? theme.background, }} >
                <View style={{ flex: 1, backgroundColor: gradientColors ? "transparent" : backgroundcolor ?? theme.background, marginBottom: isbottomtab ? 0 : insets.bottom }}  >
                    {
                        isheader && (
                            <View style={{ height: windowheight * 0.1, justifyContent: "center", flexDirection: "row", alignItems: "center" }} >
                                <Pressable onPress={onleftfn} style={{ width: "15%", height: "100%", position: "absolute", left: 0, justifyContent: "center", alignItems: "center" }} >
                                    {lefticon ?
                                        lefticon :
                                        <VectorIcons
                                            family="Ionicons"
                                            name="chevron-back"
                                        />}
                                </Pressable>
                                <Text {...headertextprops} style={[{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: RFvalue(16), width: "70%", textAlign: "center" }, headerTextstyle]} >{headertitle}</Text>
                                {
                                    righticon && (
                                        <Pressable onPress={onrightfn} style={{ width: "15%", height: "100%", position: "absolute", right: 5, justifyContent: "center", alignItems: "center" }} >
                                            {righticon}
                                        </Pressable>
                                    )
                                }
                            </View>
                        )

                    }
                    {customheader && customheader}
                    <View style={{ flex: 1, paddingHorizontal: horizontalpadding, }} >
                        <KeyboardAvoidingView
                            behavior="padding"
                            enabled={iskeyboardaware}
                            style={{ flex: 1, marginBottom: isbottomtab ? "0.5%" : "2.5%" }}
                        >
                            {ismainloading ?
                                <View style={{ flex: 0.9, justifyContent: "center", alignItems: "center" }} >
                                    <ActivityIndicator size={"small"} color={theme.primarytext} />
                                </View> :

                                <>
                                    {isnodata ?
                                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }} >
                                            {customnodata ?
                                                customnodata :
                                                <>
                                                    <Text style={{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: Fontsize.medium }} >{nodatacontent}</Text>
                                                </>}
                                        </View> :
                                        <>
                                            {!isscollable ?
                                                children :
                                                <>
                                                    {isrefereshcontrol ?
                                                        (iskeyboardaware ?
                                                            <KeyboardAwareScrollView
                                                                refreshControl={
                                                                    <RefreshControl
                                                                        refreshing={isrefreshing}
                                                                        onRefresh={() => onreload?.()}
                                                                        // No tintColor (iOS) / colors (Android) previously - iOS
                                                                        // fell back to the plain system-gray spinner instead of
                                                                        // the app's green brand color used everywhere else.
                                                                        tintColor={theme.homegreen ?? Colors.brand}
                                                                        colors={[theme.homegreen ?? Colors.brand]}
                                                                    />
                                                                }
                                                                showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...scrollprops} >
                                                                {children}
                                                            </KeyboardAwareScrollView> :
                                                            <OuterScrollView
                                                                refreshControl={
                                                                    <RefreshControl
                                                                        refreshing={isrefreshing}
                                                                        onRefresh={() => onreload?.()}
                                                                        tintColor={theme.homegreen ?? Colors.brand}
                                                                        colors={[theme.homegreen ?? Colors.brand]}
                                                                    />
                                                                }
                                                                showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...scrollprops} >
                                                                {children}
                                                            </OuterScrollView>) :
                                                        <>
                                                            {
                                                                stickyHeader && (
                                                                    stickyHeader
                                                                )
                                                            }
                                                            {iskeyboardaware ?
                                                                <KeyboardAwareScrollView
                                                                    showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...scrollprops}>
                                                                    {children}
                                                                </KeyboardAwareScrollView> :
                                                                <OuterScrollView
                                                                    showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" {...scrollprops}>
                                                                    {children}
                                                                </OuterScrollView>}
                                                        </>

                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                        </KeyboardAvoidingView>
                    </View>
                    {
                        bottomContent && (
                            <View style={{ paddingHorizontal: horizontalpadding, marginBottom: "5%" }}>
                                {bottomContent}
                            </View>
                        )
                    }
                </View>
            </View>
            {isoverlaploader &&
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, position: "absolute", left: 0, right: 0, top: 0, bottom: 0, justifyContent: "center", alignItems: "center" }} >
                    <ActivityIndicator size={"small"} color={"#fff"} />
                </View>
            }
        </>
    )

    if (gradientColors) {
        return (
            <LinearGradient colors={gradientColors} locations={gradientLocations} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
                {content}
            </LinearGradient>
        )
    }

    return content;

}

export default Mainview;