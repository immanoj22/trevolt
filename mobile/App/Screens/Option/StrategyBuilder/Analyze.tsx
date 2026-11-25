import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSelector } from "react-redux";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LineChart } from "react-native-gifted-charts";
import Slider from "@react-native-community/slider";
import moment from "moment";

import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import Switch from "../../../Components/Field/Switch";
import { Input, Button } from "../../../Components/Field";
import VectorIcons from "../../../Utilities/vectoricons";
import { Colors } from "../../../Utilities/uiasset";
import { windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { optionTradeSelector } from "../../../Slices/option";
import {
    buildPayoffCurve,
    computePayoffStats,
    totalPayoffAtPrice,
    contractPayoffAtPrice,
    contractEstimatedPriceAtTarget,
    positionGreeksAtPrice,
    computeOrderMargin,
    StrategyLeg,
} from "../../../Utilities/strategyPayoffMath";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'StrategyAnalyze'>;

const TABS = ["PNL Chart", "PNL Table", "Greeks Table"];
const MAX_HORIZON_DAYS = 7;

const getContractExpiryLabel = (c: StrategyLeg) => (c.kind === "futures" ? "Perpetual" : (c.expiry?.label ?? "Expiry"));

const getLegLabel = (c: StrategyLeg, options: any) => {
    if (c.kind === "futures") return c.symbol ?? `${options}USD`;
    return `${c.posType?.label ?? "-"}-${c.strike?.label ?? "-"}-${c.expiry?.label ?? "-"}`;
};

const fmt = (val: any, digits = 2) => (Number.isFinite(parseFloat(val)) ? parseFloat(val).toFixed(digits) : "-");

// Numeric cells: positive -> green, negative -> red, zero -> default (theme) text colour.
const signColor = (v: number) => (v > 0 ? Colors.green : v < 0 ? Colors.red : undefined);

const StrategyAnalyze: React.FC<Props> = ({ navigation, route }) => {
    const { theme } = useCustomHooks();
    const style = styles(theme);

    const { strategyContracts, strategyMultiplier, pairlist, options } = useSelector(optionTradeSelector);

    // route.params lets this screen be opened for any arbitrary set of positions (e.g.
    // the Positions tab's own Payoff button) instead of only the Strategy Builder's own
    // leg list - falls back to redux exactly as before when opened from Strategy Builder.
    const params = route.params;
    const baseContracts: StrategyLeg[] = params?.contracts ?? (strategyContracts ?? []).filter((c: StrategyLeg) => c.checked);
    const multiplier = params?.multiplier ?? strategyMultiplier ?? 1;
    const baseCurrency = params?.baseCurrency ?? options;
    const positions = params?.positions;
    const hasLivePositions = Boolean(positions?.length);

    const matchedAsset = pairlist?.find((p: any) => p.symbol === options);
    const currentPrice = params?.currentPrice ?? (parseFloat(matchedAsset?.marketPrice) || 0);

    const [tabIndex, setTabIndex] = useState(0);
    const [dateValue, setDateValue] = useState(0);
    const [targetsExpanded, setTargetsExpanded] = useState(false);
    const [groupByExpiry, setGroupByExpiry] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<any>>(() => new Set(baseContracts.filter((c) => c.checked !== false).map((c) => c.id)));

    // Resync when the incoming contract list itself changes (different ids or checked
    // flags) - keyed on id+checked so this doesn't fight this screen's own checkbox
    // clicks on every re-render, same guard used on the web version of this panel.
    const contractsKey = baseContracts.map((c) => `${c.id}:${c.checked}`).join(",");
    useEffect(() => {
        setSelectedIds(new Set(baseContracts.filter((c) => c.checked !== false).map((c) => c.id)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contractsKey]);

    const activeContracts: StrategyLeg[] = useMemo(
        () => baseContracts.map((c) => ({ ...c, checked: selectedIds.has(c.id) })),
        [baseContracts, selectedIds]
    );
    const selectedCount = activeContracts.filter((c) => c.checked).length;
    const allSelected = baseContracts.length > 0 && selectedCount === baseContracts.length;

    const toggleContract = (id: any) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };
    const toggleAllContracts = () => {
        setSelectedIds((prev) => (prev.size === baseContracts.length ? new Set() : new Set(baseContracts.map((c) => c.id))));
    };

    const daysAhead = (dateValue / 100) * MAX_HORIZON_DAYS;
    const targetDate = moment().add(daysAhead, "days");

    // Two curves matching the "On Expiry Date" (red/green kinked) vs "On Target Date"
    // (smooth blue) legend - same sampling (points/spread) on both so the two arrays
    // line up index-for-index on the same price grid.
    const CURVE_POINTS = 24;
    const curve = useMemo(() => buildPayoffCurve(activeContracts, currentPrice, multiplier, CURVE_POINTS, 0.5, daysAhead), [activeContracts, currentPrice, multiplier, daysAhead]);
    const expiryCurve = useMemo(() => buildPayoffCurve(activeContracts, currentPrice, multiplier, CURVE_POINTS, 0.5, 0, true), [activeContracts, currentPrice, multiplier]);
    const stats = useMemo(() => computePayoffStats(activeContracts, currentPrice, multiplier), [activeContracts, currentPrice, multiplier]);

    const lowPrice = curve.length ? curve[0].x : currentPrice;
    const highPrice = curve.length ? curve[curve.length - 1].x : currentPrice;
    const [targetPrice, setTargetPrice] = useState(currentPrice);
    useEffect(() => {
        if (targetPrice === 0 && currentPrice !== 0) setTargetPrice(currentPrice);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPrice]);

    const hasSelection = selectedCount > 0;
    const hasPrice = currentPrice > 0;
    const effectiveTargetPrice = curve.length ? targetPrice : currentPrice;
    const targetPnl = hasSelection && hasPrice ? totalPayoffAtPrice(activeContracts, effectiveTargetPrice, multiplier, daysAhead) : NaN;
    const margin = hasSelection && hasPrice ? computeOrderMargin(activeContracts, multiplier) : 0;
    const projectedPct = margin ? (targetPnl / margin) * 100 : 0;
    const currentUpnlTotal = activeContracts.filter((c) => c.checked).reduce((sum, c) => sum + (parseFloat(c.pnl) || 0), 0);

    // Only label every ~5th point - one label per data point on a 24-point chart is
    // illegible clutter, not information.
    const LABEL_STRIDE = 5;
    const chartData = expiryCurve.map((p, i) => ({
        value: p.y,
        label: i % LABEL_STRIDE === 0 || i === expiryCurve.length - 1 ? p.x.toFixed(0) : "",
        dataPointColor: p.y >= 0 ? Colors.green : Colors.red,
    }));
    const chartData2 = curve.map((p) => ({ value: p.y }));

    const groups = groupByExpiry
        ? Array.from(new Set(activeContracts.map(getContractExpiryLabel))).map((label) => ({
            label,
            items: activeContracts.filter((c) => getContractExpiryLabel(c) === label),
        }))
        : null;

    const closeSelected = () => {
        if (!positions?.length || !params?.onCloseSelected) return;
        const toClose = positions.filter((p: any) => selectedIds.has(p.pairId ?? p._id));
        params.onCloseSelected(toClose);
    };

    const renderPnlRow = (c: StrategyLeg) => {
        const estimatedPrice = hasPrice ? contractEstimatedPriceAtTarget(c, effectiveTargetPrice, daysAhead) : null;
        const rowTargetPnl = hasPrice ? contractPayoffAtPrice(c, effectiveTargetPrice, daysAhead) * multiplier : null;
        return (
            <View style={style.tableRow} key={c.id}>
                <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
                    {hasLivePositions && (
                        <Input
                            type="checkbox"
                            initial={selectedIds.has(c.id)}
                            onChange={() => toggleContract(c.id)}
                        />
                    )}
                    <Text size="small" numoflines={1}>{getLegLabel(c, baseCurrency)}</Text>
                </View>
                {hasLivePositions && (
                    <Text style={style.tableCell} size="small" color={signColor(parseFloat(c.pnl) || 0)}>{fmt(c.pnl)}</Text>
                )}
                <Text style={style.tableCell} size="small" color={rowTargetPnl !== null ? signColor(rowTargetPnl) : undefined}>{rowTargetPnl !== null ? rowTargetPnl.toFixed(2) : "-"}</Text>
                <Text style={style.tableCell} size="small" color={estimatedPrice !== null ? signColor(estimatedPrice) : undefined}>{estimatedPrice !== null ? estimatedPrice.toFixed(2) : "-"}</Text>
                {hasLivePositions && (
                    <Text style={style.tableCell} size="small" color={signColor(parseFloat(c.markPrice) || 0)}>{fmt(c.markPrice)}</Text>
                )}
            </View>
        );
    };

    return (
        <Mainview isheader={false} isscollable={false} horizontalpadding={0} isbottomtab={false} gradientColors={theme.heroGradient} gradientLocations={[0, 0.22, 0.42]}>
            <View style={style.topBar}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
                    <VectorIcons family="Ionicons" name="chevron-back" size={22} iconcolor={theme.primarytext} />
                </Pressable>
                <Text family="medium">{baseCurrency ? `${baseCurrency} Payoff` : "Analyze"}</Text>
                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30 }}>
                <View style={style.statsRow}>
                    <View style={style.statCell}>
                        <Text size="small" color={theme.secondarytext}>Max Profit</Text>
                        <Text family="bold" color={Colors.green}>{stats.maxProfit}</Text>
                    </View>
                    <View style={style.statCell}>
                        <Text size="small" color={theme.secondarytext}>Max Loss</Text>
                        <Text family="bold" color={Colors.red}>{stats.maxLoss}</Text>
                    </View>
                    <View style={style.statCell}>
                        <Text size="small" color={theme.secondarytext}>Reward / Risk</Text>
                        <Text family="bold">{stats.rewardRisk}</Text>
                    </View>
                    <View style={style.statCell}>
                        <Text size="small" color={theme.secondarytext}>Breakeven</Text>
                        <Text family="bold">{stats.breakeven}</Text>
                    </View>
                </View>

                {!hasSelection && (
                    <View style={style.validationBanner}>
                        <Text size="small">Select at least one contract to preview its payoff</Text>
                    </View>
                )}
                {hasSelection && !hasPrice && (
                    <View style={style.validationBanner}>
                        <Text size="small">Waiting for a live price for {baseCurrency}...</Text>
                    </View>
                )}

                {/* Tab switcher sits right under the stats, before any tab's content, so
                    switching tabs never requires scrolling past the chart first. */}
                <View style={[style.tabsRow, { marginTop: 4 }]}>
                    {TABS.map((t, i) => (
                        <Pressable key={t} style={i === tabIndex ? style.tabBtnActive : style.tabBtn} onPress={() => setTabIndex(i)}>
                            <Text size="small" family={i === tabIndex ? "bold" : "regular"} color={i === tabIndex ? theme.primarytext : theme.secondarytext}>{t}</Text>
                        </Pressable>
                    ))}
                </View>

                {tabIndex === 0 && (
                    <View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: Colors.red }} />
                                <Text size="small" color={theme.secondarytext}>On Expiry</Text>
                            </View>
                            <Text size="small" color={theme.secondarytext}>Price {currentPrice}</Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#008ffb" }} />
                                <Text size="small" color={theme.secondarytext}>On Target</Text>
                            </View>
                        </View>

                        {chartData.length > 1 ? (
                            <LineChart
                                thickness={2}
                                color={expiryCurve.length && expiryCurve[expiryCurve.length - 1].y >= 0 ? Colors.green : Colors.red}
                                data={chartData}
                                data2={chartData2}
                                color2="#008ffb"
                                thickness2={2}
                                curved
                                width={windowwidth - 76}
                                initialSpacing={4}
                                endSpacing={4}
                                height={110}
                                spacing={(windowwidth - 76) / CURVE_POINTS}
                                areaChart
                                startFillColor={expiryCurve.length && expiryCurve[expiryCurve.length - 1].y >= 0 ? Colors.green : Colors.red}
                                endFillColor={theme.background}
                                startOpacity={0.24}
                                endOpacity={0.02}
                                hideDataPoints={false}
                                dataPointsRadius={1.5}
                                hideDataPoints2
                                noOfSections={3}
                                yAxisThickness={0}
                                xAxisThickness={0}
                                isAnimated={false}
                                rulesColor={theme.theme === "dark" ? "#2A2C2F" : Colors.grey}
                                yAxisTextStyle={{ color: theme.secondarytext, fontSize: 9 }}
                                xAxisLabelTextStyle={{ color: theme.secondarytext, fontSize: 9 }}
                            />
                        ) : (
                            <Text size="small" color={theme.secondarytext} style={{ marginTop: 8 }}>Not enough data to draw a curve yet</Text>
                        )}

                        {Number.isFinite(targetPnl) && (
                            <View style={[style.validationBanner, { backgroundColor: targetPnl >= 0 ? "rgba(39,150,70,0.15)" : "rgba(255,85,85,0.15)", marginTop: 6, marginBottom: 0 }]}>
                                <Text size="small" color={targetPnl >= 0 ? Colors.green : Colors.red}>
                                    Projected {targetPnl >= 0 ? "Profit" : "Loss"}: {targetPnl.toFixed(2)} ({Number.isFinite(projectedPct) ? projectedPct.toFixed(0) : 0}%)
                                </Text>
                            </View>
                        )}

                        <Pressable
                            style={[style.dropdownPill, { marginTop: 10 }]}
                            onPress={() => setTargetsExpanded((p) => !p)}
                        >
                            <Text family="medium" size="small">Targets</Text>
                            <VectorIcons family="Ionicons" name={targetsExpanded ? "chevron-up" : "chevron-down"} size={16} iconcolor={theme.secondarytext} />
                        </Pressable>

                        {targetsExpanded && (
                            <>
                                <View style={{ marginTop: 14 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <View>
                                            <Text size="small" color={theme.secondarytext}>{baseCurrency} Target Price</Text>
                                            <Pressable onPress={() => setTargetPrice(currentPrice)}>
                                                <Text size="small" color={Colors.brand}>Reset</Text>
                                            </Pressable>
                                        </View>
                                        <Text family="bold">{targetPrice ? targetPrice.toFixed(2) : "-"}</Text>
                                    </View>
                                    <Slider
                                        minimumValue={lowPrice}
                                        maximumValue={highPrice || lowPrice + 1}
                                        value={targetPrice}
                                        onValueChange={setTargetPrice}
                                        minimumTrackTintColor={Colors.brand}
                                        maximumTrackTintColor="#444"
                                        thumbTintColor={Colors.brand}
                                    />
                                </View>

                                <View style={{ marginTop: 14 }}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                        <View>
                                            <Text size="small" color={theme.secondarytext}>Target Date</Text>
                                            <Pressable onPress={() => setDateValue(0)}>
                                                <Text size="small" color={Colors.brand}>Reset</Text>
                                            </Pressable>
                                        </View>
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text family="bold" size="small">{targetDate.format("DD MMM YYYY, hh:mmA")}</Text>
                                            <Text size="small" color={theme.secondarytext}>{Math.round(daysAhead)} days ahead</Text>
                                        </View>
                                    </View>
                                    <Slider
                                        minimumValue={0}
                                        maximumValue={100}
                                        value={dateValue}
                                        onValueChange={setDateValue}
                                        minimumTrackTintColor={Colors.brand}
                                        maximumTrackTintColor="#444"
                                        thumbTintColor={Colors.brand}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                )}

                {tabIndex === 1 && (
                    <View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Switch value={groupByExpiry} onChange={(v) => setGroupByExpiry(!!v)} label="Group By Expiry" />
                            {hasLivePositions && (
                                <Button
                                    title={selectedCount > 0 ? `Close ${selectedCount}` : "Close All"}
                                    disabled={selectedCount === 0}
                                    onPress={closeSelected}
                                    buttonStyle={[style.outlineButton, { width: undefined, alignSelf: "flex-start", height: 30, paddingHorizontal: 12 }]}
                                    textStyle={{ color: Colors.red, fontSize: 12 }}
                                />
                            )}
                        </View>
                        <View style={[style.tableHeaderRow, { alignItems: "flex-start" }]}>
                            <View style={{ flex: 2, flexDirection: "row", alignItems: "flex-start", gap: 6 }}>
                                {hasLivePositions && <Input type="checkbox" initial={allSelected} onChange={toggleAllContracts} />}
                                <Text size="small" color={theme.secondarytext} style={{ flexShrink: 1 }}>Contracts ({selectedCount}/{baseContracts.length})</Text>
                            </View>
                            {hasLivePositions && <Text style={style.tableCell} size="small" color={theme.secondarytext}>UPNL</Text>}
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Target PNL</Text>
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Est. Price</Text>
                            {hasLivePositions && <Text style={style.tableCell} size="small" color={theme.secondarytext}>Mark Price</Text>}
                        </View>
                        {groups
                            ? groups.map((g) => (
                                <View key={g.label}>
                                    <Text size="small" color={theme.secondarytext} style={{ paddingVertical: 6 }}>{g.label}</Text>
                                    {g.items.map(renderPnlRow)}
                                </View>
                            ))
                            : activeContracts.map(renderPnlRow)}
                    </View>
                )}

                {tabIndex === 2 && (
                    <View>
                        <View style={style.tableHeaderRow}>
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Contract</Text>
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Delta</Text>
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Gamma</Text>
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Theta</Text>
                            <Text style={style.tableCell} size="small" color={theme.secondarytext}>Vega</Text>
                        </View>
                        {activeContracts.map((c) => {
                            const g = hasPrice ? positionGreeksAtPrice(c, currentPrice) : null;
                            return (
                                <View style={style.tableRow} key={c.id}>
                                    <Text style={style.tableCell} size="small" numoflines={1}>{getLegLabel(c, baseCurrency)}</Text>
                                    <Text style={style.tableCell} size="small" color={g ? signColor(g.delta) : undefined}>{g ? g.delta.toFixed(4) : "-"}</Text>
                                    <Text style={style.tableCell} size="small" color={g ? signColor(g.gamma) : undefined}>{g ? g.gamma.toFixed(5) : "-"}</Text>
                                    <Text style={style.tableCell} size="small" color={g ? signColor(g.theta) : undefined}>{g ? g.theta.toFixed(4) : "-"}</Text>
                                    <Text style={style.tableCell} size="small" color={g ? signColor(g.vega) : undefined}>{g ? g.vega.toFixed(4) : "-"}</Text>
                                </View>
                            );
                        })}
                    </View>
                )}
                        {hasLivePositions && (
<View style={[style.footer, { marginTop: "5%" }]}>

                    <View style={style.footerRow}>
                        <Text size="small" color={theme.secondarytext}>Total Target PNL</Text>
                        <Text family="bold" size="small" color={Number.isFinite(targetPnl) ? signColor(targetPnl) : undefined}>{Number.isFinite(targetPnl) ? targetPnl.toFixed(2) : "-"} USD</Text>
                    </View>
                    <View style={style.footerRow}>
                        <Text size="small" color={theme.secondarytext}>Total Current UPNL</Text>
                        <Text family="bold" size="small" color={signColor(currentUpnlTotal)}>{currentUpnlTotal.toFixed(2)} USD</Text>
                    </View>
                </View>
            )}
            </ScrollView>

            {/* {hasLivePositions && (
                <View style={style.footer}>
                    <View style={style.footerRow}>
                        <Text size="small" color={theme.secondarytext}>Total Target PNL</Text>
                        <Text family="bold" size="small" color={Number.isFinite(targetPnl) ? signColor(targetPnl) : undefined}>{Number.isFinite(targetPnl) ? targetPnl.toFixed(2) : "-"} USD</Text>
                    </View>
                    <View style={style.footerRow}>
                        <Text size="small" color={theme.secondarytext}>Total Current UPNL</Text>
                        <Text family="bold" size="small" color={signColor(currentUpnlTotal)}>{currentUpnlTotal.toFixed(2)} USD</Text>
                    </View>
                </View>
            )} */}
        </Mainview>
    );
};

export default StrategyAnalyze;
