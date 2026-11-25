import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { BarChart } from "react-native-gifted-charts";

import Text from "../../../../Components/text";
import Card from "../../../../Components/Card";
import NoData from "../../../../Components/Nodata";
import { Colors } from "../../../../Utilities/uiasset";
import { windowwidth } from "../../../../Utilities/dimensions";
import useCustomHooks from "../../../../Actions/Hooks/customhook";
import { getItem } from "../../../../Actions/Storage/localstorage";

import { styles } from "../styles";

interface Pnlprops {
    chartData?: {
        series: any;
        categories: any;
    };
    amount?: any;
    noData?: any
}

const FeePaid: React.FC<Pnlprops> = ({ chartData, amount, noData }) => {
    const { theme, convertValueforChart } = useCustomHooks();
    const style = styles(theme);

    const [apexState, setApexState] = useState({
        series: [],
        options: { xaxis: { categories: [] } }
    });

    useEffect(() => {
        if (!chartData) return;

        setApexState({
            series: chartData.series ?? [],
            options: {
                xaxis: {
                    categories: chartData.categories ?? []
                }
            }
        });
    }, [chartData]);

    const convertApexToGiftedData = (apex: any) => {
        const values = apex?.series?.[0]?.data ?? [];
        const categories = apex?.options?.xaxis?.categories ?? [];

        return values.map((value: number, index: number) => {
            const convertedValue = Number(convertValueforChart(value));
            return {
                value: convertedValue,
                label: categories[index] || "",
                onPress: () => console.log(index),
                labelComponent: () => (
                    <Text style={style.label}>{categories[index]}</Text>
                ),
                ...(convertedValue === 0 ? {
                    topLabelComponent: () => (
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#F5A524" }} />
                    )
                } : {}),
            }
        });
    };

    const barData = useMemo(() => convertApexToGiftedData(apexState), [apexState]);

    const chartWidth = Math.max(
        barData.length * 90,
        windowwidth - 85
    );

    return (
        <Card containerStyle={style.container}>
            <View style={style.contentContainer}>
                <View style={{ marginTop: "5%", marginBottom: "5%" }}>
                    <Text size="medium">Fees Paid <Text color={Colors.brand}>{amount}</Text></Text>
                </View>
                <View style={{ marginBottom: 20, height: 270 }}>
                    {
                        !noData ?
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <BarChart
                                    data={barData}
                                    width={chartWidth}
                                    dashGap={0}
                                    rulesColor={theme.theme === "dark" ? Colors.datebg_txt : Colors.grey}
                                    barWidth={8}
                                    spacing={70}
                                    noOfSections={5}
                                    yAxisThickness={1}
                                    xAxisThickness={1}
                                    yAxisColor={theme.theme === "dark" ? Colors.datebg_txt : Colors.grey}
                                    xAxisColor={theme.theme === "dark" ? Colors.datebg_txt : Colors.grey}
                                    barBorderRadius={4}
                                    yAxisLabelPrefix={getItem("convertCurrency") === "USDT" ? "$" : "₹"}
                                    isAnimated
                                    yAxisTextStyle={style.yaxis}
                                    initialSpacing={40}
                                    renderTooltip={(item: any, index: any) => {
                                        return (
                                            <View style={style.toolTip} key={index}>
                                                <Text style={{ fontSize: 10 }}>Fee: {getItem("convertCurrency") === "USDT" ? "$" : "₹"}{convertValueforChart(item.value.toFixed(2))}</Text>
                                            </View>
                                        );
                                    }}
                                    frontColor="#F5A524"

                                />
                            </ScrollView>
                            :
                            <View style={style.noData}>
                                <NoData />
                            </View>
                    }
                </View>
            </View>
        </Card>

    );
};

export default FeePaid;