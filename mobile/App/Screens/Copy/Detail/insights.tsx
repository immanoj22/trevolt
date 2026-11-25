import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleProp, View, ViewStyle } from "react-native";
import LinearGradient from "../../../Components/lineargradient";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { useSelector } from "react-redux";

import { source, source2, getYAxisConfig, prepareChartData } from "../helper";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Colors } from "../../../Utilities/uiasset";
import Linecomponent from "../../../Components/line";
import { Dropdown } from "../../../Components/Field";
import { isEmpty, timeAgo } from "../../../Utilities/helerfunction";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { borderradius, RFvalue, windowheight } from "../../../Utilities/dimensions";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import { useInvestmentChartMutation, useLazyGetCopierStatsQuery, usePerformanceDetailsMutation, useProfitandLossChartMutation, useVolumeBreakDownMutation } from "../../../Slices/copy";

import Icon from "react-native-vector-icons/Feather";
import { style } from "../styles"

interface Insightsprops {
    data?: any,
    page?: any,
    strategyId?: any
}
interface Buttonprops {
    colors?: any[],
    title: string,
    des: string,
    style?: StyleProp<ViewStyle>
}


const Insights: React.FC<Insightsprops> = ({ data, page, strategyId }) => {
    const { theme } = useCustomHooks()
    const { totalPandL, totalAUM, createdAt, copierDetails } = data;
    const { userId } = useSelector((state: any) => state.auth.userData);
    const styles = style(theme);

    const [type, setType] = useState("rio");
    const [filter1, setFilter1] = useState("1y");
    const [filter2, setFilter2] = useState("1y");
    const [filter3, setFilter3] = useState("1y");

    const [roi, setRoi] = useState<any>([]);
    const [ptData, setPtData] = useState<any>([]);
    const [piedata, setPieData] = useState<any>([]);
    const [copier, setCopier] = useState<any>([]);
    const [performance, serPerformance] = useState<any>([]);

    const [investmentChart] = useInvestmentChartMutation();
    const [profitandLossChart] = useProfitandLossChartMutation();
    const [volumeBreak] = useVolumeBreakDownMutation();
    const [copierStats] = useLazyGetCopierStatsQuery();
    const [performanceDetails, { error }] = usePerformanceDetailsMutation();

    const roiAxis = getYAxisConfig(roi, 4, true);
    const ptAxis = getYAxisConfig(ptData, 4, true);

    const isFlatROI = !roi.length;
    const isFlatPnL = !ptData.length;
    const spacing = Math.max(
        50,
        250 / Math.max(ptData.length - 1, 1),
    );

    console.log("ROI Data:", roi, ptData);
    console.log("ROI Axis:", roiAxis);

    const handleInvestmentChart = async () => {
        try {
            const payload: any = {
                strategyId: strategyId,
                type: ["user", "viewtrader", "your"].includes(page) ? "trader" : "copier",
                time: filter1,
            }
            if (page === "viewcoiper") {
                payload["id"] = isEmpty(userId) ? "" : userId
            }
            const reponse = await investmentChart(payload).unwrap();
            console.log("handleInvestmentChart____response", JSON.stringify(reponse));
            const { labels = [], values = [] } = reponse.result ?? {};

            const formattedData = prepareChartData(
                labels,
                values,
                "roi"
            );

            setRoi(formattedData)
        } catch (error: any) {
            const result = error?.data?.result;
            if (!isEmpty(result?.labels)) {
                setRoi(prepareChartData(result.labels, result.values, "roi"));
            }
            console.log("handleInvestmentChart____error", JSON.stringify(error))
        }
    }

    const handleProfitandLossChart = async () => {
        try {
            const payload: any = {
                strategyId: strategyId,
                type: ["user", "viewtrader", "your"].includes(page) ? "trader" : "copier",
                time: filter1,
            }
            if (page === "viewcoiper") {
                payload["id"] = isEmpty(userId) ? "" : userId
            }
            const reponse = await profitandLossChart(payload).unwrap();
            const { labels = [], values = [] } = reponse.result ?? {};

            const formattedData = prepareChartData(
                labels,
                values,
                "pnl"
            );

            setPtData(formattedData)
        } catch (error: any) {
            const result = error?.data?.result;
            if (!isEmpty(result?.labels)) {
                setPtData(prepareChartData(result.labels, result.values, "pnl"));
            }
            console.log("handleProfitandLossChart____error", error)
        }
    }

    const handleVolumeBreak = async () => {
        try {
            const payload: any = {
                strategyId: strategyId,
                type: ["user", "viewtrader", "your"].includes(page) ? "trader" : "copier",
                time: filter3,
            }
            if (page === "viewcoiper") {
                payload["id"] = isEmpty(userId) ? "" : userId
            }
            const response = await volumeBreak(payload).unwrap();
            const colors = ["#09806D", "#12233f", "#102c5c"];
            const total = response.result.reduce((sum: any, item: any) => sum + item.count, 0);
            const pieData = response.result.map((item: any, index: any) => {
                const percentage = ((item.count / total) * 100).toFixed(0);
                return {
                    value: Number(percentage),
                    percent: item.count,
                    color: colors[index],
                    label: item.symbol
                };
            });
            setPieData(pieData);
        } catch (error: any) {
            const result = error?.data?.result;
            if (!isEmpty(result)) {
                const colors = ["#a5364eff", "#346e75ff", "#2e6831ff"];
                const total = result.reduce((sum: any, item: any) => sum + item.count, 0);
                setPieData(result.map((item: any, index: any) => ({
                    value: Number(((item.count / total) * 100).toFixed(0)),
                    percent: item.count,
                    color: colors[index],
                    label: item.symbol
                })));
            }
            console.log("handleVolumeBreak____error", error)
        }
    }

    const handleCopierStats = async () => {
        const response = await copierStats(data?._id).unwrap();
        setCopier(response?.result)
    }

    const handlePerformanceDetails = async () => {
        try {
            const payload: any = {
                strategyId: strategyId,
                type: ["user", "viewtrader", "your"].includes(page) ? "trader" : "copier",
                time: filter2
            }
            if (page === "viewcoiper") {
                payload["id"] = isEmpty(userId) ? "" : userId
            }
            const response = await performanceDetails(payload).unwrap();
            console.log("performanceDetails__ ", response, payload)
            if (response.success) {
                serPerformance(response?.result)
            } else {
                console.log("Error", "HandlePerformanceDetails error");
            }
        } catch (error: any) {
            if (!isEmpty(error?.data?.result)) {
                serPerformance(error?.data?.result)

            }
            console.log("handlePerformanceDetails____error", error)
        }
    }
    useEffect(() => {
        handleCopierStats();
    }, [data, page])

    useEffect(() => {
        if (!strategyId || !page) return;
        handleInvestmentChart();
    }, [strategyId, page, filter1]);

    useEffect(() => {
        if (!strategyId || !page) return;
        console.log("performance____", filter1)
        handleProfitandLossChart();
    }, [strategyId, page, filter1]);

    useEffect(() => {
        if (!strategyId || !page) return;
        handleVolumeBreak();
    }, [strategyId, page, filter3]);

    useEffect(() => {
        console.log("handlePerformanceDetails___", page, strategyId)
        if (!strategyId || !page) return;

        handlePerformanceDetails();
    }, [strategyId, page, filter2]);

    const Button = ({ colors = ["#4A95F3", "#0053BA"], title, des, style }: Buttonprops,) => {
        return (
            <View style={[styles.linear, style, {backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF", borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"}]}>
                <Text style={{fontSize: RFvalue(12)}} color={theme.primarytext}>{title}</Text>
                <Text family="regular" color={theme.secondarytext} fontSize={RFvalue(12)} >{des}</Text>
            </View>
        )
    }

    const profit = performance?.profitCount || 0;
    const loss = performance?.losingCount || 0;

    const total = profit + loss;

    const profitPercent = total > 0 ? (profit / total) * 100 : 0;
    const lossPercent = total > 0 ? (loss / total) * 100 : 0;

    const copierProfit = copier?.copiersProfitcount || 0;
    const copierLoss = copier?.copierslossingcount || 0;
    const copierTotal = copierProfit + copierLoss;
    const copierWinPercent = copierTotal > 0 ? (copierProfit / copierTotal) * 100 : 0;
    const copierLossPercent = copierTotal > 0 ? (copierLoss / copierTotal) * 100 : 0;


    const values = ptData.map((d: any) => d.value);

    const minY = Math.min(...values, 0);
    const maxY = Math.max(...values, 0);

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Flexcomponent style={{ flexWrap: "wrap" }} justifyContent="space-between" top={"5%"} bottom={"5%"}>
                {
                    page !== "viewtrader" && (
                        <>
                            {
                                (page === "viewcoiper") ?
                                    <>
                                        <Button
                                            title={`${(data?.totalPandL ?? 0).toFixed(2)} ${formatDisplayPair("USDT")}`}
                                            des="Total PNL"
                                        />
                                        <Button
                                            title={`${data?.totalAUM?.toFixed(2)} ${formatDisplayPair("USDT")}`}
                                            des="Invested Amount"
                                            colors={["#FFAC3C", "#D85348"]}
                                        />
                                    </>
                                    :
                                    <>
                                        <Button
                                            title={timeAgo(createdAt)}
                                            des="Trade Start Date"
                                            colors={theme.theme == 'dark' ? ["#101A2C", "#101A2C"] : ["#FFFFFF", "#FFFFFF"]}
                                        />
                                        <Button
                                            title={data?.totalCopier}
                                            des="Followers"
                                            colors={theme.theme == 'dark' ? ["#101A2C", "#101A2C"] : ["#FFFFFF", "#FFFFFF"]}
                                        />
                                        <Button
                                            title={`${totalPandL?.toFixed(2) || 0}  ${formatDisplayPair("USDT")}`}
                                            des="Total PNL"
                                            colors={theme.theme == 'dark' ? ["#101A2C", "#101A2C"] : ["#FFFFFF", "#FFFFFF"]}
                                            style={{ marginTop: "10%" }}
                                        />
                                        <Button
                                            title={`${totalAUM?.toFixed(2) || 0} ${formatDisplayPair("USDT")}`}
                                            des="Total AUM"
                                            colors={theme.theme == 'dark' ? ["#101A2C", "#101A2C"] : ["#FFFFFF", "#FFFFFF"]}
                                            style={{ marginTop: "10%" }}
                                        />
                                    </>
                            }
                        </>
                    )
                }
                {
                    page === "viewtrader" && (
                        <>
                            <Button
                                title={timeAgo(createdAt)}
                                des="Trade Start Date"
                            />
                            <Button
                                title={data?.totalCopier || data?.curCopier}
                                des="Followers"
                            />
                            <Button
                                title={`${Number(data?.stradegyDetails?.[0]?.totalPnl ?? 0).toFixed(6)}  ${formatDisplayPair("USDT")}`}
                                des="Total Pnl"
                                style={{ marginTop: "10%" }}
                            />
                            <Button
                                title={`${copierDetails[0]?.totalAUM?.toFixed(2) || 0} ${formatDisplayPair("USDT")}`}
                                des="Total AUM"
                                style={{ marginTop: "10%" }}
                            />
                        </>
                    )
                }
            </Flexcomponent>

            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.rio}>
                <Flexcomponent justifyContent="space-between" paddingVertical={"3%"}>
                    <View style={{ flexDirection: "row" }}>
                        <Pressable onPress={() => setType("rio")}>
                            <Text family="semiBold" color={type === "rio" ? theme.darktext : theme.graytext}>ROI</Text>
                        </Pressable>
                        <Pressable style={{ marginLeft: 30 }} onPress={() => setType("pnl")}>
                            <Text family="semiBold" color={type === "pnl" ? theme.darktext : theme.graytext}>PNL</Text>
                        </Pressable>
                    </View>
                    <View style={{ width: "35%" }}>
                        <Dropdown
                            value={filter1}
                            placeholder={"Select"}
                            list={source2}
                            bottom={0}
                            onChange={(item) => setFilter1(item.value)}
                            height={windowheight * 0.05}
                            inputStyle={styles.input}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                        />

                    </View>
                </Flexcomponent>
                <Linecomponent backgroundcolor={theme.theme === "dark" ? Colors.darkgray : "#797979"} />

                <ScrollView contentContainerStyle={{ marginTop: "5%" }} scrollEnabled={false}>
                    {
                        type === "rio" && (
                            isFlatROI ? (
                                <View style={{ height: 250, alignItems: "center", justifyContent: "center" }}>
                                    <NoData />
                                </View>
                            ) : (
                                <LineChart
                                    areaChart
                                    curved
                                    data={roi}
                                    height={250}

                                    color1={Colors.brand}

                                    rulesThickness={0}
                                    hideDataPoints

                                    initialSpacing={50}

                                    isAnimated

                                    startFillColor1={Colors.brand}
                                    startOpacity={0.8}
                                    endOpacity={0}

                                    yAxisThickness={0}
                                    xAxisColor={Colors.grey}

                                    yAxisTextStyle={styles.yaxis}
                                    xAxisLabelTextStyle={styles.xaxis}

                                    stepValue={roiAxis.stepValue}
                                    noOfSections={roiAxis.noOfSections}
                                    noOfSectionsBelowXAxis={roiAxis.noOfSectionsBelowXAxis}
                                    maxValue={roiAxis.maxValue}
                                    mostNegativeValue={roiAxis.mostNegativeValue}

                                    yAxisLabelWidth={45}
                                    spacing={spacing}
                                />
                            )
                        )
                    }
                    {
                        type === "pnl" && (
                            isFlatPnL ? (
                                <View style={{ height: 250, alignItems: "center", justifyContent: "center" }}>
                                    <NoData />
                                </View>
                            ) : (
                                <LineChart
                                    areaChart
                                    curved
                                    data={ptData}
                                    height={250}

                                    color1={Colors.brand}

                                    rulesThickness={0}
                                    hideDataPoints

                                    spacing={150}
                                    initialSpacing={40}

                                    isAnimated

                                    startFillColor1={Colors.brand}
                                    startOpacity={0.8}
                                    endOpacity={0}

                                    yAxisThickness={0}
                                    xAxisColor={Colors.grey}

                                    yAxisTextStyle={styles.yaxis}
                                    xAxisLabelTextStyle={styles.xaxis}

                                    stepValue={ptAxis.stepValue}
                                    noOfSections={ptAxis.noOfSections}
                                    noOfSectionsBelowXAxis={ptAxis.noOfSectionsBelowXAxis}
                                    maxValue={ptAxis.maxValue}
                                    mostNegativeValue={ptAxis.mostNegativeValue}
                                    yAxisLabelWidth={45}
                                />
                            )
                        )
                    }
                </ScrollView>
            </Card>

            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.performance}>
                <Flexcomponent justifyContent="space-between" paddingVertical={"3%"}>
                    <Text family="semiBold">Performance</Text>
                    <View style={{ width: "35%" }}>
                        <Dropdown
                            value={filter2}
                            placeholder={"Select"}
                            list={source2}
                            bottom={0}
                            height={windowheight * 0.05}
                            onChange={(item) => setFilter2(item.value)}
                            inputStyle={styles.input}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                        />
                    </View>
                </Flexcomponent>
                <Linecomponent backgroundcolor={theme.theme === "dark" ? Colors.darkgray : "#797979"} />
                <View style={styles.usd}>
                    <Flexcomponent justifyContent="space-between">
                        {/* <Text size="semimedium" color={performance?.returnOfInvestment > 0 ? Colors.green : Colors.red}>+ {performance?.returnOfInvestment || "0.00"} %</Text>
                            <Text size="semimedium" color={Colors.green}>{performance?.totalPandL || "0.00"} USDT</Text> */}

                        <Text
                            size="semimedium"
                            color={performance?.returnOfInvestment > 0 ? Colors.green : Colors.red}
                        >
                            {performance?.returnOfInvestment > 0 ? "+" : ""}
                            {Number(performance?.returnOfInvestment || 0).toFixed(4)} %
                        </Text>

                        <Text
                            size="semimedium"
                            color={performance?.totalPandL > 0 ? Colors.green : Colors.red}
                        >
                            {Number(performance?.totalPandL || 0).toFixed(4)} {formatDisplayPair("USDT")}
                        </Text>

                    </Flexcomponent>
                    <Flexcomponent top={"2.5%"} justifyContent="space-between" >
                        <Text color={theme.secondarytext} size="small">ROI</Text>
                        <Text color={theme.secondarytext} size="small">Total Profit</Text>
                    </Flexcomponent>
                </View>

                {/* <Flexcomponent justifyContent="space-between" top={"5%"} >
                        <Text color={theme.secondarytext} size="small">Win Rate</Text>
                        <Text size="small">{performance?.winningPercentage || "0"} %</Text>
                    </Flexcomponent>
                    <Flexcomponent justifyContent="space-between" top={"5%"} >
                        <Text color={theme.secondarytext} size="small">Loss Rate</Text>
                        <Text size="small">{performance?.losingPercentage || "0"} %</Text>
                    </Flexcomponent> */}

                <Flexcomponent justifyContent="space-between" top={"5%"}>
                    <Text color={theme.secondarytext} size="small">Win Rate</Text>
                    <Text size="small">
                        {Number(performance?.winningPercentage || 0).toFixed(2)} %
                    </Text>
                </Flexcomponent>

                <Flexcomponent justifyContent="space-between" top={"5%"}>
                    <Text color={theme.secondarytext} size="small">Loss Rate</Text>
                    <Text size="small">
                        {Number(performance?.losingPercentage || 0).toFixed(2)} %
                    </Text>
                </Flexcomponent>

                <Flexcomponent justifyContent="space-between" top={"5%"} >
                    <Text color={theme.secondarytext} size="small">Total Followers</Text>
                    {
                        page != "viewcoiper" ?
                            <Text size="small">{performance?.totalFollowers || "0"}</Text> :
                            <Text>-</Text>
                    }
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" top={"5%"} >
                    <Text color={theme.secondarytext} size="small" >Followers PnL’s</Text>
                    {/* <Text color={Colors.green} size="small">{performance?.copiersTotalPnl || "0.00"} USDT</Text> */}

                    {page != "viewcoiper" ?
                        <>
                            <Text
                                color={copier?.copiersTotalPnl > 0 ? Colors.green : Colors.red}
                                size="small"
                            >
                                {Number(copier?.copiersTotalPnl || 0).toFixed(2)} {formatDisplayPair("USDT")}
                            </Text>
                        </> :
                        <Text>-</Text>
                    }

                </Flexcomponent>
                <Flexcomponent top={"5%"} width={"100%"}>
                    <View style={{ height: 5, width: `${profitPercent}%`, backgroundColor: Colors.green, borderTopLeftRadius: borderradius * 3, borderBottomLeftRadius: borderradius * 3 }} />
                    <View style={{ height: 5, width: `${lossPercent}%`, backgroundColor: Colors.red, borderTopRightRadius: borderradius * 3, borderBottomRightRadius: borderradius * 3 }} />
                </Flexcomponent>
                <Flexcomponent top={"5%"} justifyContent="space-between">
                    <Text size="small">Profitable Trade : <Text color={Colors.green} size="small">{performance?.profitCount || "0"}</Text></Text>
                    <Text size="small">Losing Trade : <Text color={Colors.red} size="small">{performance?.losingCount || "0"}</Text></Text>
                </Flexcomponent>
            </Card>
            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.volume}>
                <Flexcomponent justifyContent="space-between" paddingVertical={"3%"}>
                    <Text family="semiBold" >Volume Allocation</Text>
                    <View style={{ width: "35%" }}>
                        <Dropdown
                            value={filter3}
                            placeholder={"Select"}
                            list={source2}
                            bottom={0}
                            onChange={(item) => setFilter3(item.value)}
                            height={windowheight * 0.05}
                            inputStyle={styles.input}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                        />

                    </View>
                </Flexcomponent>
                <Linecomponent backgroundcolor={theme.theme === "dark" ? Colors.darkgray : "#797979"} />
                {
                    piedata.length > 0 ?
                        <>
                            <View style={styles.pie}>
                                <PieChart
                                    data={piedata}
                                    donut
                                    radius={85}
                                    innerRadius={50}
                                    innerCircleColor={theme.card}
                                    sectionAutoFocus
                                    focusOnPress
                                    showValuesAsLabels
                                    showText
                                    textSize={10}
                                    textColor="white"
                                    fontWeight="bold"
                                />
                            </View>
                            <View style={styles.ens}>
                                {
                                    piedata.map((item: any, index: number) => (
                                        <View key={index} style={{ marginBottom: 20 }}>
                                            <Text size="semimedium">{item.label} {item.percent}</Text>
                                        </View>
                                    ))
                                }
                            </View>
                        </>
                        :
                        <View style={{ marginVertical: '15%' }}>
                            <NoData />
                        </View>
                }
            </Card>
            {
                page != "viewcoiper" && (
                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.win}>
                        <Flexcomponent justifyContent="space-between" paddingVertical={"3%"}>
                            <Text family="semiBold">Copy Traders</Text>
                            {/* <View style={styles.traders}>
                                    <Text>{copier?.totalCopier || "0"}</Text>
                                </View> */}

                            <View style={[styles.traders, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
                                <Icon name="users" size={14} color={theme.secondarytext} />
                                <Text> {copier?.totalCopier || "0"}</Text>
                            </View>
                        </Flexcomponent>
                        <Linecomponent backgroundcolor={theme.theme === "dark" ? Colors.darkgray : "#797979"} />
                        <Flexcomponent justifyContent="space-between" top={"5%"} >
                            <Text color={theme.secondarytext} size="small">Profit and Loss</Text>
                            <Text size="small" color={Number(copier?.copiersTotalPnl ?? 0) < 0 ? Colors.red : Colors.green}>{(copier?.copiersTotalPnl ?? 0).toFixed(2)} {formatDisplayPair("USDT")}</Text>
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" top={"5%"} >
                            <Text color={theme.secondarytext} size="small">Profit</Text>
                            <Text size="small">{copier?.copiersProfitcount || "0"}</Text>
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" top={"5%"} >
                            <Text color={theme.secondarytext} size="small">Loss</Text>
                            <Text size="small">{copier?.copierslossingcount || "0"}</Text>
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" top={"5%"} >
                            <Text color={theme.secondarytext} size="small">Winning Percentage</Text>
                            <Text size="small">{copierWinPercent.toFixed(2)} %</Text>
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" top={"5%"} >
                            <Text color={theme.secondarytext} size="small">Losing Percentage</Text>
                            <Text size="small">{copierLossPercent.toFixed(2)} %</Text>
                        </Flexcomponent>
                    </Card>
                )
            }
        </View>
    )

}

export default Insights;