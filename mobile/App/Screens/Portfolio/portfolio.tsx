import React, { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Fills from "./Sections/Fills";
import Text from "../../Components/text";
import Balances from "./Sections/Balances";
import Options from "./Components/Options";
import StopOrder from "./Sections/StopOrder";
import Positions from "./Sections/Positions";
import { futureOption } from "../../Utilities/filterOptions";
import OpenOrders from "./Sections/OpenOrders";
import RiskMargin from "./Sections/RiskMargin";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import OrderHistory from "./Sections/OrderHistory";
import CloseHistory from "./Sections/CloseHistory";
import VectorIcons from "../../Utilities/vectoricons";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import Currencyswitch from "../../Components/currencyswitch";
import SelectItem from "../Profile/Security/Helpers/SelectItem";
import { setCancelOrders, setPairsList, useUpdateTabMutation } from "../../Slices/future";
import { getItem, setItem } from "../../Actions/Storage/localstorage";
import { BottomTabParamList } from "../../Navigations/navigationtypes";

import { styles } from "./styles";

type Props = NativeStackScreenProps<BottomTabParamList, 'Portfolio'>;

const Portfolio: React.FC<Props> = () => {
    const { theme, bottomsheetref, closebottomsheet, dispatch, navigation } = useCustomHooks();
    const [UpdateTab, { isLoading, error }] = useUpdateTabMutation();
    const style = styles(theme);
    const FutureId = useRef("all");
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const [tradeMode, setTradeMode] = useState('all');
    const [selectedTab, setSelectedTab] = useState('All');
    const [activeTab, setActiveTab] = useState("Positions");
    const { marginMode } = useSelector((state: any) => state.auth.userData);
    const { userData } = useSelector((state: any) => state.auth);
    const [activeindex, setActive] = useState(0);

    const tabs = marginMode === "portfolio"
        ? ["Balances", "Positions", "Open Orders", "Stop Orders", "Risk & Margin Details", "Fills", "Close History", "Order History"]
        : ["Balances", "Positions", "Open Orders", "Stop Orders", "Fills", "Close History", "Order History"];

    const scrollRef = useRef<ScrollView>(null);
    const tabLayouts = useRef<Record<string, number>>({});

    const updateCurrentTab = async (pairId: any, tradeMode: any, selectedTab: any) => {
        try {
            const payload = {
                pairId: pairId,
                tradeMode: tradeMode,
                filterType: selectedTab
            }
            const result = await UpdateTab(payload).unwrap()
        } catch (error) {
            console.log("updateCurrentTab_err", error)
        }
    }

    useEffect(() => {
        if (userData) {
            console.log("userdetails?.tradeMode", userData, userData?.tradeMode)
            // filterType is persisted lowercase (e.g. "futures", "currentContract"); map it
            // back to its display label so the dropdown trigger keeps proper capitalisation.
            const matchedFilter = futureOption.find((o) => o.value === userData?.filterType)
            setSelectedTab(matchedFilter?.label ?? userData?.filterType)
            FutureId.current = userData?.pairId
            setTradeMode(userData?.tradeMode)
        }
    }, [userData])
    return (
        <Mainview
            isheader={false}
            isbottomtab={true}
            horizontalpadding={0}
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#1438181a", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1 }}>
                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ paddingHorizontal: 20, paddingVertical: 15 }}>
                    <Text size="medium" family="medium">Portfolio</Text>
                    {/* <Currencyswitch
                        index={getItem("convertCurrency") || "INR"}
                        onchangeindex={(currency: string) => {
                            setItem("convertCurrency", currency);
                            setActive(currency === "INR" ? 0 : 1);
                        }}
                    /> */}
                </Flexcomponent>
                <View style={style.container}>
                    <ScrollView
                        ref={scrollRef}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        style={{ marginRight: 30 }}>

                        {tabs.map((tab) => (
                            <Pressable
                                key={tab}
                                onLayout={(e) => { tabLayouts.current[tab] = e.nativeEvent.layout.x }}
                                onPress={() => {
                                    scrollRef.current?.scrollTo({
                                        x: tabLayouts.current[tab] || 0,
                                        animated: true,
                                    });

                                    dispatch(setCancelOrders({ cancelOrdersList: [], cancelType: '' }))
                                    dispatch(setPairsList({
                                        pairsList: []
                                    }))
                                    setActiveTab(tab)
                                }}
                                style={style.tab}
                                hitSlop={20}
                            >
                                <Text family="medium" style={[{ color: activeTab === tab ? theme.darktext : Colors.grey }]}>{tab}</Text>
                                {activeTab === tab && <View style={style.tabContent} />}
                            </Pressable>
                        ))}
                    </ScrollView>
                    <View style={{ position: "absolute", right: 0, backgroundColor: "#2563EB", width: 40, alignItems: "center", justifyContent: "center", bottom: 8 }}>
                        <Pressable onPress={() => navigation.navigate("TransactionLogs")}>
                            <VectorIcons
                                family="MaterialDesignIcons"
                                name="history"
                                iconcolor={Colors.textWhite}
                            />
                        </Pressable>
                    </View>
                </View>
                <View style={{ flex: 1 }}>
                    {
                        ["Fills", "Order History", "Close History"].includes(activeTab) && (
                            <Options
                                ref={bottomsheetref}
                                tab={activeTab}
                                active={selectedTab}
                            />
                        )
                    }
                    {
                        activeTab === "Balances" && (
                            <Balances />
                        )
                    }
                    {
                        activeTab === "Risk & Margin Details" && (
                            <RiskMargin />
                        )
                    }
                    {
                        activeTab === "Positions" && (
                            <Positions
                                ref={bottomsheetref}
                                tab={activeTab}
                                active={selectedTab}
                                futureId={FutureId}
                                tradeMode={tradeMode}
                            />
                        )
                    }
                    {
                        activeTab === "Open Orders" && (
                            <OpenOrders
                                ref={bottomsheetref}
                                tab={activeTab}
                                active={selectedTab}
                                futureId={FutureId}
                                tradeMode={tradeMode}
                            />
                        )
                    }
                    {
                        activeTab === "Stop Orders" && (
                            <StopOrder
                                ref={bottomsheetref}
                                tab={activeTab}
                                active={selectedTab}
                                futureId={FutureId}
                                tradeMode={tradeMode}
                            />
                        )
                    }

                    {
                        activeTab === "Fills" && (
                            <Fills
                                futureId={FutureId}
                                tradeMode={tradeMode}
                            />
                        )
                    }
                    {
                        activeTab === "Order History" && (
                            <OrderHistory
                                futureId={FutureId}
                                tradeMode={tradeMode}
                            />
                        )
                    }
                    {
                        activeTab === "Close History" && (
                            <CloseHistory
                                futureId={FutureId}
                                tradeMode={tradeMode}
                            />
                        )
                    }
                </View>
            </View>
            <SelectItem
                value={tradeMode}
                ref={bottomsheetref}
                onSelect={(value) => {
                    if (value === "all") {
                        setTradeMode("all");
                        FutureId.current = "all";
                        setSelectedTab("All");
                        updateCurrentTab("all", "all", "all")
                    } else if (value === "currentContract") {
                        setTradeMode(futureTradePair.tradeMode);
                        FutureId.current = futureTradePair?._id;
                        setSelectedTab("Current Contract");
                        updateCurrentTab(FutureId.current, futureTradePair.tradeMode, 'currentContract')
                    } else if (value === "options") {
                        setTradeMode("options");
                        setSelectedTab("Options")
                        FutureId.current = "all";
                        updateCurrentTab(FutureId.current, 'option', 'options')
                    } else if (value === "futures") {
                        setTradeMode("future");
                        FutureId.current = "all";
                        setSelectedTab("Futures")
                        updateCurrentTab(FutureId.current, 'future', 'futures')
                    }
                }}
                cancel={() => closebottomsheet(bottomsheetref)}
                data={futureOption}
            />
        </Mainview>
    )
}

export default Portfolio;