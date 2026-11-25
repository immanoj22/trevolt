import React, { useMemo, useState } from "react";
import { Pressable, View, ScrollView } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import Text from "../../../../Components/text";
import Card from "../../../../Components/Card";
import NoData from "../../../../Components/Nodata";
import { Colors } from "../../../../Utilities/uiasset";
import VectorIcons from "../../../../Utilities/vectoricons";
import { windowwidth } from "../../../../Utilities/dimensions";
import Flexcomponent from "../../../../Components/flexcomponent";
import useCustomHooks from "../../../../Actions/Hooks/customhook";
import { getItem } from "../../../../Actions/Storage/localstorage";
import { capitalizeFirst } from "../../../../Utilities/helerfunction";

import { styles } from "../styles";

interface Pnlprops {
    chartData?: any;
    amount?: any;
    noData?: any;
}

const TradingEquity: React.FC<Pnlprops> = ({ chartData, amount, noData }) => {
    const { theme, convertValueforChart } = useCustomHooks();
    const style = styles(theme);

    const tradingSeries = chartData?.series?.find((s: any) => s?.name === "Trading Equity");
    const depositSeries = chartData?.series?.find((s: any) => s?.name === "Deposit");
    const withdrawalSeries = chartData?.series?.find((s: any) => s?.name === "Withdrawal");

    const convertToGiftedChart = (series: any) => {
        if (!series?.data) return [];

        return series.data.map((item: any) => {
            const rawValue = item?.y;
            const numericValue = typeof rawValue === "number" ? rawValue : parseFloat(rawValue?.toString().replace(/[^0-9.-]+/g, "")) || 0;

            const date = new Date(item?.x);
            const formatted = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            });

            const formatteds = date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

            const value = convertValueforChart(numericValue)

            return {
                value: Number(value),
                label: formatted,
                amounts: numericValue.toFixed(2),
                date: formatteds
            };
        });
    };

    const tradingData = convertToGiftedChart(tradingSeries);
    const depositData = convertToGiftedChart(depositSeries);
    const withdrawalData = convertToGiftedChart(withdrawalSeries);

    const [activeLines, setActiveLines] = useState("deposit");


    const finalData = useMemo(() => {
        if (activeLines === "deposit") return depositData;
        if (activeLines === "withdrawal") return withdrawalData;
        return tradingData;
    }, [activeLines, depositData, withdrawalData, tradingData]);

    const findColor = useMemo(() => {
        if (activeLines === "deposit") return "#ffc107";
        if (activeLines === "withdrawal") return Colors.brand;
        return Colors.red;
    }, [activeLines]);

    const chartWidth = Math.max(
        finalData.length * 80,
        windowwidth - 60
    );

    const dataMax = finalData.length > 0
        ? Math.max(...finalData.map((d: any) => d.value))
        : 0;
    const chartMaxValue = dataMax > 0 ? Math.ceil(dataMax * 1.05) : 10;
    const chartStepValue = chartMaxValue / 5;

    return (
        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={style.container}>
            <View style={style.contentContainer}>
                <View style={{ marginTop: "5%", marginBottom: "1%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text size="medium">
                        Trading Equity<Text color={Colors.brand}>{amount}</Text>
                    </Text>

                   
                </View>
                 <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <Pressable onPress={() => setActiveLines("deposit")} style={{ flexDirection: "row", alignItems: "center" }}>
                            <VectorIcons family="Octicons" name="dot-fill" size={20} iconcolor="#ffc107" />
                            <Text size="semismall" color={activeLines === "deposit" ? theme.darktext : Colors.grey}> Deposit</Text>
                        </Pressable>

                        <Pressable onPress={() => setActiveLines("withdrawal")} style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 3 }}>
                            <VectorIcons family="Octicons" name="dot-fill" size={20} iconcolor={Colors.brand} />
                            <Text size="semismall" color={activeLines === "withdrawal" ? theme.darktext : Colors.grey}> Withdrawal</Text>
                        </Pressable>

                        <Pressable onPress={() => setActiveLines("trading")} style={{ flexDirection: "row", alignItems: "center" }}>
                            <VectorIcons family="Octicons" name="dot-fill" size={20} iconcolor={Colors.red} />
                            <Text size="semismall" color={activeLines === "trading" ? theme.darktext : Colors.grey}> Trading Equity</Text>
                        </Pressable>
                    </View>

                <View style={{ marginBottom: 5 }}>
                    {!noData && (finalData.length > 0) ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ marginBottom: 20 }}>
                            <LineChart
                                thickness={3}
                                data={finalData}
                                width={chartWidth}
                                spacing={70}
                                initialSpacing={24}
                                endSpacing={24}
                                color1={findColor}
                                animationDuration={1000}
                                noOfSections={5}
                                // Rotated date labels (styles.label) need reserved
                                // vertical room + a downward shift, otherwise they
                                // render outside the axis area and get clipped.
                                xAxisLabelsHeight={40}
                                xAxisLabelsVerticalShift={18}
                                yAxisThickness={1}
                                xAxisThickness={1}
                                yAxisColor={theme.theme === "dark" ? Colors.datebg_txt : Colors.grey}
                                xAxisColor={theme.theme === "dark" ? Colors.datebg_txt : Colors.grey}
                                isAnimated
                                maxValue={chartMaxValue}
                                stepValue={chartStepValue}
                                yAxisLabelWidth={60}
                                yAxisLabelPrefix={getItem("convertCurrency") === "USDT" ? "$" : "₹"}
                                rulesColor={theme.theme === "dark" ? Colors.datebg_txt : Colors.grey}
                                yAxisTextStyle={style.yaxis}
                                xAxisLabelTextStyle={style.label}
                                dataPointsRadius={4}
                                dataPointsColor1={findColor}
                                pointerConfig={{
                                    activatePointersOnLongPress: false,
                                    autoAdjustPointerLabelPosition: true,
                                    pointerStripColor: "lightgray",
                                    pointerStripWidth: 2,
                                    strokeDashArray: [2, 5],
                                    pointerColor: "lightgray",
                                    pointerLabelWidth: 130,
                                    pointerLabelHeight: 120,
                                    pointerLabelComponent: (items: any) => {
                                        const currency = getItem("convertCurrency") === "USDT" ? "$" : "₹";
                                        return (
                                            <View style={{ width: 150, backgroundColor: "#282C3E", borderRadius: 4, justifyContent: "flex-start" }}>
                                                <View style={{ backgroundColor: Colors.black, padding: 5, borderBottomWidth: 1, borderColor: Colors.grey, paddingHorizontal: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
                                                    <Text color={Colors.white} size="xsmall" style={{ fontSize: 10 }}>{items[0]?.date}</Text>
                                                </View>
                                                <View style={{ backgroundColor: Colors.darkgray, paddingHorizontal: 8, padding: 5, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }}>
                                                    <Text style={{ color: "lightgray", fontSize: 10, marginTop: 6 }}>
                                                        Trading Equity: {currency} {convertValueforChart(items[0]?.amounts)}
                                                    </Text>
                                                </View>
                                            </View>
                                        );
                                    },
                                }}
                            />
                        </ScrollView>
                    ) : (
                        <View style={style.noData}>
                            <NoData title={`No ${capitalizeFirst(activeLines)}`} />
                        </View>
                    )}
                </View>
            </View>
            <Flexcomponent style={{ flexDirection: "column", paddingHorizontal: "5%", marginBottom: "5%", alignItems: "flex-start" }}>
                <Text color={Colors.grey}>➤ The chart will show data only for periods when there has been transactional activity in your account.</Text>
                <Text color={Colors.grey} style={{ marginTop: "3%" }}>➤ The chart updates once every 6 hours.</Text>
                <Text color={Colors.grey} style={{ marginTop: "3%" }}>➤ Referral income is not included in Trading Equity Chart.</Text>
            </Flexcomponent>
        </Card>
    );
};

export default TradingEquity;