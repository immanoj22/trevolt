import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import Calendar from "./Calendar";
import FeePaid from "./Chart.tsx/FeePaid";
import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import RealizedPnl from "./Chart.tsx/RealizedPnl";
import VolumnTrade from "./Chart.tsx/VolumnTrade";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import TradingEquity from "./Chart.tsx/TradingEquity";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { useFuturePnlChartMutation, useFuturePnLSummaryMutation } from "../../../Slices/future";
import { getPnlColor } from "../../../Utilities/helerfunction";

import { styles } from "./styles";

interface ChartData {
    categories?: string[];
    series?: { data?: any[] }[];
}

type Props = NativeStackScreenProps<Stacknavigationtypes, 'PnlAnalytics'>;

const PnlAnalytics: React.FC<Props> = () => {
    const { theme, navigation, openbottomsheet, closebottomsheet, bottomsheetref, convertSec, convert } = useCustomHooks();

    const style = styles(theme)
    const [filterData, setFilterData] = useState({
        range: "30d",
        startDate: null,
        endDate: null
    });

    const [lastSet, setLast] = useState('');
    const [barChart, setBarChart] = useState<any>({});

    const [isAllEmpty, setIsAllEmpty] = useState(false);
    const [chartData, setChartData] = useState({});
    const [summaryDetails, setSummaryDetails] = useState<any>({});

    const [isEmptyfeeChart, setIsEmptyfeeChart] = useState(false)
    const [isEmptyProfitChart, setIsEmptyProfitChart] = useState(false)
    const [isEmptyVolumeChart, setIsEmptyVolumeChart] = useState(false)

    const isCustomFilter =
        filterData.startDate !== null && filterData.endDate !== null;

    const onChangeHandler = (data: any, isCustom = false) => {
        if (String(data)) {
            setLast(data);
            setFilterData(prev => ({
                ...prev,
                range: data,
                startDate: null,
                endDate: null
            }));
        }

        if (isCustom && data?.startDate && data?.endDate) {
            setFilterData((prev: any) => ({
                ...prev,
                range: null,
                startDate: data.startDate,
                endDate: data.endDate
            }));
        }

        if (data?.hasOwnProperty('startDate') && data?.startDate === 0) {
            setFilterData(prev => ({
                ...prev,
                range: lastSet,
                startDate: null,
                endDate: null
            }));
        }
    };

    const [futurePandLChart, { error }] = useFuturePnlChartMutation();
    const [futurePandLSummary] = useFuturePnLSummaryMutation();

    useApiError(error)

    const getChartData = async () => {
        try {
            const response = await futurePandLChart(filterData).unwrap();
            console.log("response___response___", response)
            if (response.success) {
                const isAllEmpty = response?.result?.series?.every(
                    (item: any) => item.data.length === 0
                );
                setIsAllEmpty(isAllEmpty);
                setChartData(response?.result);
            }
        } catch (e) {
            console.log('Chart API error', e);
        }
    };

    const getPandLSummary = async () => {
        const response = await futurePandLSummary(filterData).unwrap();
        console.log("futurePandLSummary______", response)
        if (response.success) {
            setSummaryDetails(response?.result?.summary)
            setBarChart(response?.result?.charts);


            const chartCheck = checkChartsEmpty(response?.result?.charts)
            setIsEmptyfeeChart(chartCheck?.feeChart)
            setIsEmptyProfitChart(chartCheck?.profitChart)
            setIsEmptyVolumeChart(chartCheck?.volumeChart)
        }
    }

    const checkChartsEmpty = (obj: Record<string, ChartData>) => {
        const result: Record<string, boolean> = {};

        for (const [key, value] of Object.entries(obj)) {
            const hasCategories = Array.isArray(value.categories) && value.categories.length > 0;
            const hasSeriesData =
                Array.isArray(value.series) &&
                value.series.some(s => Array.isArray(s.data) && s.data.length > 0);

            result[key] = !(hasCategories || hasSeriesData);
        }

        return result;
    };

    useFocusEffect(
        useCallback(() => {
            getChartData()
            getPandLSummary()
        }, [filterData])
    );


    console.log("isAllEmpty", barChart)
    return (
        <Mainview
            iskeyboardaware={false}
            onleftfn={() => navigation.goBack()}
            headertitle="PNL Analytics"
            righticon={
                <Pressable onPress={() => navigation.navigate('PnlAnalyticsOverview')} style={{ justifyContent: "flex-end" }}>
                    <Images
                        type="svg"
                        name={theme.theme == 'dark' ? "Dollerbag" : "DollerbagLight"}
                        width={windowwidth * 0.065}
                        height={windowwidth * 0.065}
                    />
                </Pressable>
            }
            isheader={true}
            isscollable={true}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Button
                        title="Last 7 days"
                        buttonStyle={{ width: "33%", backgroundColor: filterData.range === '7d' ? Colors.brand : theme.card }}
                        textStyle={{ fontSize: Fontsize.semismall, color: filterData.range === '7d' ? theme.theme == 'dark' ? Colors.black : Colors.white : theme.darktext }}
                        onPress={() => onChangeHandler("7d")}
                    />
                    <Button
                        title="Last 30 days"
                        buttonStyle={{ width: "33%", marginLeft: 10, backgroundColor: filterData.range === '30d' ? Colors.brand : theme.card }}
                        textStyle={{ fontSize: Fontsize.semismall, color: filterData.range === '30d' ? theme.theme == 'dark' ? Colors.black : Colors.white : theme.darktext }}
                        onPress={() => onChangeHandler("30d")}
                    />
                    <Pressable onPress={() => openbottomsheet(bottomsheetref)}>
                        <VectorIcons
                            family="FontAwesome"
                            name="calendar"
                            style={{ marginLeft: 15 }}
                            size={windowwidth * 0.050}
                            iconcolor={
                                isCustomFilter
                                    ? Colors.brand 
                                    : theme.darktext
                            }
                        />
                    </Pressable>
                </View>

                <TradingEquity
                    noData={isAllEmpty}
                    chartData={chartData}
                />

                <Flexcomponent justifyContent="space-between" style={{ marginTop: "5%" }}>
                    <View>
                        <Text size="medium">Total Realized PNL</Text>
                        <View style={style.line} />
                        <Text color={getPnlColor(summaryDetails?.totalPnL)} family="semiBold">{convert(summaryDetails?.totalPnL ?? 0)}</Text>
                    </View>
                    <View>
                        <Text size="medium">Win Rate</Text>
                        <View style={style.line} />
                        <Text color={Colors.green} family="semiBold" >{summaryDetails?.winingPercentage?.toFixed(2) ?? 0} %</Text>
                    </View>
                    <View>
                        <Text size="medium">Average Win</Text>
                        <View style={style.line} />
                        <Text color={getPnlColor(summaryDetails?.profit)} family="semiBold">{convert(summaryDetails?.profit ?? 0)}</Text>
                    </View>
                </Flexcomponent>
                <Flexcomponent style={{ justifyContent: "flex-start", marginTop: "5%" }}>
                    <View>
                        <Text size="medium">Average Loss</Text>
                        <View style={style.line} />
                        <Text color={getPnlColor(summaryDetails?.loss)} family="semiBold">{convert(summaryDetails?.loss ?? 0)}</Text>
                    </View>
                </Flexcomponent>

                <RealizedPnl
                    noData={isEmptyProfitChart}
                    chartData={barChart?.profitChart}
                    amount={convert(summaryDetails?.totalPnL ?? 0)}
                    rawAmount={summaryDetails?.totalPnL ?? 0}
                />

                <VolumnTrade
                    noData={isEmptyVolumeChart}
                    chartData={barChart?.volumeChart}
                    amount={convert(summaryDetails?.volume ?? 0)}
                />

                <FeePaid
                    noData={isEmptyfeeChart}
                    chartData={barChart?.feeChart}
                    amount={convert(summaryDetails?.fee ?? 0)}
                />

                <Flexcomponent style={{ marginTop: "5%", flexDirection: "column" }}>
                    <Text color={Colors.grey}>➤ Due to the complexity of financial data, there might be nuances and delay. Data displayed above is for reference only.</Text>
                    <Text color={Colors.grey} style={{ marginTop: "3%" }}>➤ The filter customization enables you to access data spanning a maximum of 93 days at once, and it can retrieve information going back up to 4 months. Historical data can be downloaded from Here.</Text>
                    <Text color={Colors.grey} style={{ marginTop: "3%" }}>➤ Positions opened and closed at the same price are not considered as trades.</Text>
                </Flexcomponent>
            </View>

            <Calendar
                sheetref={bottomsheetref}
                onselect={onChangeHandler}
                snappoint={["35%"]}
            />
        </Mainview>

    )

}
export default PnlAnalytics;