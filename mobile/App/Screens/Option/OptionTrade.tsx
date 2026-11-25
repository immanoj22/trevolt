import React, { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import LinearGradient from "../../Components/lineargradient";

import OptionChart from "./chart";
import Text from "../../Components/text";
import Buysell from "../Buysell/buysell";
import Mainview from "../../Components/mainview";
import Images from "../../Utilities/images";
import Positions from "../Portfolio/Sections/Positions";
import Flexcomponent from "../../Components/flexcomponent";
import Tradecomponent from "./Component/tradecomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import Currencyselect from "../../Components/currencyselect";
import { getTokenImage } from "../../Utilities/helerfunction";
import { getRemainingTimeFromDate } from "../../Utilities/dateTime";
import { Colors, Fontfamily } from "../../Utilities/uiasset";
import { borderradius, RFvalue, windowheight, windowwidth } from "../../Utilities/dimensions";
import OptionBuySell from "../Buysell/OptionBuySell";
import RecentTrades from "./Component/recenttrades";

// Left/right split (recent trades + embedded order form) and Position/Recent Trades
// tabs below mirror FutureNew/future.tsx exactly - this is the option-contract
// counterpart of that screen, swapped in in-place (not pushed) so the bottom tab bar
// stays visible, same as how Market swaps in <Future/>.
interface OptionTradeProps {
    contract: any;
    underlyingSymbol?: string;
    onBack: () => void;
}

const OptionTrade: React.FC<OptionTradeProps> = ({ contract, underlyingSymbol, onBack }) => {
    const { theme, convert } = useCustomHooks();
    const [showChart, setShowChart] = useState(true);
    const [activeTab, setActiveTab] = useState("Position");
    const embeddedFutureId = useRef("all");
    const scrollRef = useRef<ScrollView>(null);
    const tabLayouts = useRef<Record<string, number>>({});

    const tabs = ["Position", "Recent Trades"];
    const isCall = contract?.optionType === "CALL";

    return (
        <Mainview
            isheader={false}
            isbottomtab={true}
            isscollable={true}
            horizontalpadding={0}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flexShrink: 0, paddingHorizontal: "3%" }}>
                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 20,
                        marginTop: 20,
                    }}
                >
                    <Pressable
                        style={{ flexDirection: "row", alignItems: "center", marginLeft: "2%" }}
                        onPress={() => onBack?.()}
                    >
                        <Text style={{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: RFvalue(16) }}>
                            Options
                        </Text>
                    </Pressable>
                </View>

                <View
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        width: "100%",
                    }}
                >
                    <View style={{ width: "58%", alignItems: "flex-start" }}>
                        <View style={{ width: windowwidth * 0.80 }}>
                            <Currencyselect
                                currency={`${contract?.strikePrice ?? "--"} ${isCall ? "CALL" : "PUT"}`}
                                descrption={`${underlyingSymbol ?? ""} OPTIONS`}
                                onselect={onBack}
                            />
                        </View>

                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 16,
                                width: windowwidth * 0.54,
                                backgroundColor: theme.theme === "dark" ? "#151a1759" : "#FFFFFF",
                                borderRadius: borderradius,
                                paddingVertical: 12,
                                paddingHorizontal: 14,
                                borderWidth: 1,
                                borderColor: "#1B2740"
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text fontSize={RFvalue(10)} family="medium" color={theme.secondarytext} style={{ letterSpacing: 0.8 }} numoflines={1}>
                                    MARK PRICE
                                </Text>
                                <Text fontSize={RFvalue(12)} family="medium" color={theme.futuretext} style={{ marginTop: 5 }} numoflines={1}>
                                    {convert(contract?.marketPrice ?? 0)}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text fontSize={RFvalue(10)} family="medium" color={theme.secondarytext} style={{ letterSpacing: 0.8 }} numoflines={1}>
                                    IV
                                </Text>
                                <Text fontSize={RFvalue(12)} family="medium" color={theme.futuretext} style={{ marginTop: 5 }} numoflines={1}>
                                    {Number.isFinite(parseFloat(contract?.markIV)) ? `${parseFloat(contract?.markIV).toFixed(1)}%` : "--"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={{ width: "42%", alignItems: "flex-end" }}>
                        <Text
                            style={{ textAlign: "right", lineHeight: RFvalue(18) }}
                            color={theme.secondarytext}
                            fontSize={RFvalue(12)}
                            family="medium"
                        >
                            {contract?.expiryDate ? `Expires in\n${getRemainingTimeFromDate(contract.expiryDate)}` : ""}
                        </Text>

                        <Pressable style={{ marginTop: 16 }} onPress={() => setShowChart(!showChart)}>
                            <LinearGradient
                                colors={
                                    showChart
                                        ? theme.theme === "dark" ? ["#0d4195", "#2c24247a"] : ["#2563EB", "#2563EB"]
                                        : theme.theme === "dark" ? ["#081730", "#000000"] : ["#D9D9D9", "#D9D9D9"]
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
                                <Text family="medium" style={{ color: showChart ? "#FFFFFF" : theme.theme === "dark" ? "#FFFFFF" : theme.primarytext }}>
                                    Chart
                                </Text>
                                <Images
                                    type="svg"
                                    name={!showChart ?
                                        theme.theme === "dark"
                                            ? "ChartTabIcon"
                                            : "ChartTabIconLight" : "ChartTabWhiteIcon"
                                    }
                                    width={15}
                                    height={15}
                                    style={{ marginBottom: 2 }}
                                />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>
            </View>

            {showChart && (
                <View style={{ width: "100%", height: windowheight * 0.40, marginTop: "3%" }}>
                    <OptionChart ticker={contract?.tickerRoot} />
                </View>
            )}

            <View style={{ flexDirection: "row", width: "100%" }}>
                <View style={{ width: "45%", marginTop: "5%" }}>
                    <Tradecomponent pairId={contract?._id} tickerRoot={contract?.tickerRoot} />
                </View>

                <View style={{ width: "53%", marginTop: "5%" }}>
                    <OptionBuySell embedded pageName="buy" screen="options" data={contract} onClose={onBack} />
                </View>
            </View>

            <View style={{
                flexDirection: "row",
                justifyContent: "space-around",
                borderBottomWidth: 2,
                borderBottomColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
                marginTop: 10,
                position: "relative",
            }}>
                <ScrollView
                    ref={scrollRef}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    style={{ marginRight: 30 }}
                >
                    {tabs.map((tab) => (
                        <Pressable
                            key={tab}
                            onLayout={(e) => { tabLayouts.current[tab] = e.nativeEvent.layout.x }}
                            onPress={() => {
                                scrollRef.current?.scrollTo({ x: tabLayouts.current[tab] || 0, animated: true });
                                setActiveTab(tab)
                            }}
                            style={{ alignItems: "center", paddingHorizontal: 20, marginBottom: 10 }}
                            hitSlop={20}
                        >
                            <Text family="medium" style={[{ color: activeTab === tab ? theme.darktext : Colors.grey }]}>{tab}</Text>
                            {activeTab === tab && (
                                <View style={{
                                    height: 2,
                                    backgroundColor: theme.darktext,
                                    width: windowwidth * 0.10,
                                    borderRadius: 1,
                                    position: "absolute",
                                    bottom: -10,
                                }} />
                            )}
                        </Pressable>
                    ))}
                </ScrollView>
            </View>
            <View style={{ flex: 1 }}>
                {activeTab === "Position" && (
                    <Positions
                        tab="Positions"
                        active="Options"
                        futureId={embeddedFutureId}
                        tradeMode="option"
                        showFilter={false}
                        nestedInScrollView={true}
                    />
                )}
                {activeTab === "Recent Trades" && (
                    <RecentTrades pairId={contract?._id} tickerRoot={contract?.tickerRoot} />
                )}
            </View>
        </Mainview>
    );
};

export default OptionTrade;
