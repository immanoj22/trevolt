import React, { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import { useSelector } from "react-redux";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Colors } from "../../../Utilities/uiasset";
import { Input, Button, Dropdown } from "../../../Components/Field";
import Flexcomponent from "../../../Components/flexcomponent";
import { windowwidth } from "../../../Utilities/dimensions";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import useApiError from "../../../Actions/Hooks/errorhook";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";
import { setPairsList, useCloseAllOrdersMutation } from "../../../Slices/future";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import {
    getUnderlying,
    getExpiryLabel,
    getExpiryFullLabel,
    getExpirySortValue,
    getPositionDelta,
    getPositionNotionalUsd,
    getPositionMarkPrice,
    mapPositionToContract,
} from "../../../Utilities/positionRiskUtils";

import { styles } from "../styles";

const TRADE_MODE_OPTIONS = [
    { label: "All", value: "all" },
    { label: "Future", value: "future" },
    { label: "Option", value: "option" },
];
const NOTIONAL_UNIT_OPTIONS = (baseCurrency: string) => [
    { label: baseCurrency, value: "base" },
    { label: "USD", value: "usd" },
];

const fmtNum = (val: any, digits = 4) => (Number.isFinite(parseFloat(val)) ? parseFloat(val).toFixed(digits) : "0.0000");

// Small label-over-value cell, reused for both the Notional/Entry/Mark row and the
// Delta/Theta/Gamma/Vega row - keeps every metric visible without needing horizontal
// scroll, per the "mobile-adapted, not a literal spreadsheet" call.
const MetricCell: React.FC<{ label: string; value: string; color?: string; width?: any }> = ({ label, value, color, width = "20%" }) => {
    const { theme } = useCustomHooks();
    return (
        <View style={{ width, marginBottom: 6 }}>
            <Text size="xsmall" color={theme.secondarytext} numoflines={1}>{label}</Text>
            <Text size="small" color={color} numoflines={1}>{value}</Text>
        </View>
    );
};

// Explicit flex columns (rather than percentage widths inside a flex-wrap
// container) so a row of metrics never has a stray item roll onto its own
// line due to rounding - every column in the row is guaranteed equal width.
const MetricRow: React.FC<{ items: { label: string; value: string; color?: string }[] }> = ({ items }) => {
    const { theme } = useCustomHooks();
    return (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
            {items.map((it, i) => (
                <View key={i}>
                    <Text size="xsmall" color={theme.secondarytext} numoflines={1}>{it.label}</Text>
                    <Text size="small" family="medium" color={it.color} numoflines={1}>{it.value}</Text>
                </View>
            ))}
        </View>
    );
};

function aggregateOf(positions: any[]) {
    return positions.reduce((acc, p) => {
        const qty = parseFloat(p.positionFilled) || 0;
        const sign = p.positionSide === "long" ? 1 : -1;
        const pairData = p.pairData || {};
        acc.notionalBase += qty;
        acc.notionalUsd += getPositionNotionalUsd(p);
        acc.upnl += parseFloat(p.pnl) || 0;
        acc.delta += getPositionDelta(p);
        acc.theta += (parseFloat(pairData.theta) || 0) * qty * sign;
        acc.gamma += (parseFloat(pairData.gamma) || 0) * qty * sign;
        acc.vega += (parseFloat(pairData.vega) || 0) * qty * sign;
        return acc;
    }, { notionalBase: 0, notionalUsd: 0, upnl: 0, delta: 0, theta: 0, gamma: 0, vega: 0 });
}

const GroupedExpiryTable: React.FC<{ underlying: string; positions: any[] }> = ({ underlying, positions }) => {
    const { theme } = useCustomHooks();
    const [notionalUnit, setNotionalUnit] = useState("base");

    const groups = useMemo(() => {
        const labels = Array.from(new Set(positions.map(getExpiryLabel))).sort((a, b) => {
            const pa = positions.find((p) => getExpiryLabel(p) === a);
            const pb = positions.find((p) => getExpiryLabel(p) === b);
            return getExpirySortValue(pa) - getExpirySortValue(pb);
        });
        return labels.map((label) => ({
            label,
            fullLabel: getExpiryFullLabel(positions.find((p) => getExpiryLabel(p) === label)),
            agg: aggregateOf(positions.filter((p) => getExpiryLabel(p) === label)),
        }));
    }, [positions]);

    const total = aggregateOf(positions);
    const unit = notionalUnit === "usd" ? "USD" : underlying;
    const notionalOf = (agg: any) => (notionalUnit === "usd" ? agg.notionalUsd : agg.notionalBase);
    // Stable reference across re-renders where `underlying` hasn't changed - calling
    // NOTIONAL_UNIT_OPTIONS(underlying) inline in the Dropdown's list= prop below
    // returned a new array every render, which the Dropdown's own internal effect
    // (keyed on the list reference) treats as new data and re-syncs on - repeated
    // fast enough (this screen updates on live price ticks) that could trip React's
    // "Maximum update depth exceeded" guard.
    const notionalUnitOptions = useMemo(() => NOTIONAL_UNIT_OPTIONS(underlying), [underlying]);

    const renderRow = (label: string, agg: any, key: string, isTotal = false) => (
        <View
            key={key}
            style={{
                paddingVertical: 10,
                paddingHorizontal: isTotal ? 10 : 0,
                marginTop: isTotal ? 10 : 0,
                borderRadius: isTotal ? 8 : 0,
                backgroundColor: isTotal ? theme.midblack : "transparent",
                borderBottomWidth: isTotal ? 0 : 0.5,
                borderColor: theme.boderColor
            }}
        >
            <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginBottom: 15 }}>
                <Text size="small" family="medium">{label}</Text>
                <View style={{ alignItems: "flex-end" }}>
                    <Text size="small" family="medium">{formatValue(notionalOf(agg), 3)} {unit}</Text>
                    <Text size="xsmall" color={agg.upnl >= 0 ? Colors.green : Colors.red}>{agg.upnl.toFixed(2)} USD</Text>
                </View>
            </Flexcomponent>
            <MetricRow items={[
                { label: "Delta", value: fmtNum(agg.delta, 4) },
                { label: "Theta", value: fmtNum(agg.theta, 4) },
                { label: "Gamma", value: fmtNum(agg.gamma, 5) },
                { label: "Vega", value: fmtNum(agg.vega, 4) },
            ]} />
        </View>
    );

    return (
        <View>
            <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
                <Text size="xsmall" color={theme.secondarytext}>Notional in</Text>
                <View style={{ width: windowwidth * 0.24 }}>
                    <Dropdown
                        themes={theme}
                        value={notionalUnit}
                        list={notionalUnitOptions}
                        height={30}
                        // background={theme.card}
                        background={theme.theme === "dark" ? "#666" : "#FFFFFF"}
                        onChange={(item) => setNotionalUnit(item.value)}
                        inputStyle={{borderRadius: 5}}
                    />
                </View>
            </Flexcomponent>
            {groups.map((g) => renderRow(g.fullLabel, g.agg, g.label))}
            {renderRow("Σ All Positions", total, "total", true)}
        </View>
    );
};

const RiskUnderlyingCard: React.FC<{ underlying: string; positions: any[]; groupByExpiry: boolean }> = ({ underlying, positions, groupByExpiry }) => {
    const { theme, dispatch, navigation, successtoast } = useCustomHooks();
    const style = styles(theme);
    const pairsList = useSelector((state: any) => state.future.pairsList);
    const [closeAllOrders, { error: closeErr, isLoading: closeLoading }] = useCloseAllOrdersMutation();
    const { triggerpositionOrders } = useApihooks();
    useApiError(closeErr);

    const [tradeMode, setTradeMode] = useState("all");
    const [activeTab, setActiveTab] = useState("All");
    const [notionalUnit, setNotionalUnit] = useState("base");

    const livePerp = positions.find((p) => p.tradeMode === "future" && p.close_price != null);
    const indexPrice = parseFloat(livePerp?.close_price ?? positions[0]?.pairData?.last ?? positions[0]?.pairData?.underlyingPrice) || 0;

    const modeFiltered = tradeMode === "all" ? positions : positions.filter((p) => p.tradeMode === tradeMode);

    const expiries = Array.from(new Set(modeFiltered.map(getExpiryLabel))).sort((a, b) => {
        const pa = modeFiltered.find((p) => getExpiryLabel(p) === a);
        const pb = modeFiltered.find((p) => getExpiryLabel(p) === b);
        return getExpirySortValue(pa) - getExpirySortValue(pb);
    });
    // Perpetual positions have no real expiry, so they only ever show under "All" -
    // no dedicated tab for them (matches web's Risk View convention).
    const tabExpiries = expiries.filter((label) => label !== "Perpetual");

    const filtered = activeTab === "All" ? modeFiltered : modeFiltered.filter((p) => getExpiryLabel(p) === activeTab);

    const selectedInCard = filtered.filter((p) => pairsList.includes(p.pairId));
    const allSelectedInCard = filtered.length > 0 && selectedInCard.length === filtered.length;

    const toggleRow = (pairId: any) => {
        const exists = pairsList.some((el: any) => el === pairId);
        dispatch(setPairsList({ pairsList: exists ? pairsList.filter((el: any) => el !== pairId) : [...pairsList, pairId] }));
    };
    const toggleAll = () => {
        const otherSelected = pairsList.filter((id: any) => !filtered.some((p) => p.pairId === id));
        dispatch(setPairsList({ pairsList: allSelectedInCard ? otherSelected : [...otherSelected, ...filtered.map((p) => p.pairId)] }));
    };

    // Matches web: the Close button always acts on every position in the current
    // tab/filter (not just the checked ones) - checkboxes are only for Payoff.
    const closeGroup = (toClose: any[], label: string) => {
        if (!toClose.length) return;
        Commonalert({
            title: `Are you sure you want to ${label.toLowerCase()}?`,
            des: `Are you sure you want to close ${toClose.length} position(s)?`,
            yes: async () => {
                try {
                    const response = await closeAllOrders({ pairId: toClose.map((p) => p.pairId) }).unwrap();
                    if (response.success) {
                        triggerpositionOrders();
                        successtoast("Success", response.message);
                        dispatch(setPairsList({ pairsList: pairsList.filter((id: any) => !toClose.some((p) => p.pairId === id)) }));
                    }
                } catch (err) {
                    console.log("closeSelected_err", err);
                }
            },
        });
    };

    const openPayoff = () => {
        navigation.navigate("StrategyAnalyze", {
            contracts: selectedInCard.map(mapPositionToContract),
            positions: selectedInCard,
            currentPrice: indexPrice,
            baseCurrency: underlying,
            multiplier: 1,
            onCloseSelected: (toClose: any[]) => {
                if (!toClose.length) return;
                Commonalert({
                    title: "Close Positions",
                    des: `Are you sure you want to close ${toClose.length} position(s)?`,
                    yes: async () => {
                        try {
                            const response = await closeAllOrders({ pairId: toClose.map((p) => p.pairId ?? p._id) }).unwrap();
                            if (response.success) {
                                triggerpositionOrders();
                                successtoast("Success", response.message);
                                navigation.goBack();
                            }
                        } catch (err) {
                            console.log("payoffClose_err", err);
                        }
                    },
                });
            },
        });
    };

    const unit = notionalUnit === "usd" ? "USD" : underlying;
    const notionalOf = (p: any) => (notionalUnit === "usd" ? getPositionNotionalUsd(p) : parseFloat(p.positionFilled) || 0);
    // See GroupedExpiryTable above for why this needs to be memoized rather than
    // called inline in the Dropdown's list= prop.
    const notionalUnitOptions = useMemo(() => NOTIONAL_UNIT_OPTIONS(underlying), [underlying]);

    // Matches web's closeBtnLabel: "Close All Positions" in the All tab, otherwise
    // scoped to however many positions the current expiry tab is showing.
    const closeBtnLabel = activeTab === "All"
        ? "Close All Positions"
        : `Close ${filtered.length} Position${filtered.length > 1 ? "s" : ""}`;

    const totalAggregate = aggregateOf(filtered);

    return (
        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.tokenContainer, { marginBottom: "4%" }]}>
            <View style={style.token}>
                <Text size="medium" family="medium" color={Colors.brand}>{underlying}</Text>
                <Text size="small" family="medium" color={Colors.brand} style={{ marginLeft: 8 }}>${formatValue(indexPrice)}</Text>
            </View>
            <View style={style.borderLight} />

            <View style={{ padding: "5%" }}>
                {groupByExpiry ? (
                    <GroupedExpiryTable underlying={underlying} positions={positions} />
                ) : (
                    <>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", rowGap: 8, marginBottom: 12 }}>
                            <View style={{ width: windowwidth * 0.24 }}>
                                <Dropdown
                                    themes={theme}
                                    value={tradeMode}
                                    list={TRADE_MODE_OPTIONS}
                                    height={32}
                                    background={Colors.brand}
                                    textStyle={{ color: Colors.textWhite }}
                                    onChange={(item) => { setTradeMode(item.value); setActiveTab("All"); }}
                                    inputStyle={{borderRadius: 5}}
                                />
                            </View>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                {/* Payoff button is hidden from the order history / positions
                                    section (option trade is hidden from the internal app). */}
                                <Button
                                    title={closeBtnLabel}
                                    disabled={closeLoading}
                                    loading={closeLoading}
                                    onPress={() => closeGroup(filtered, closeBtnLabel)}
                                    buttonStyle={{ width: undefined, alignSelf: "flex-start", height: 32, paddingHorizontal: 12, borderRadius: 6, backgroundColor: theme.background, borderColor: Colors.red, borderWidth: 1 }}
                                    textStyle={{ fontSize: 10, color: Colors.red }}
                                />
                            </View>
                        </View>

                        {tabExpiries.length > 0 && (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ gap: 8, marginBottom: 12 }}
                            >
                                {tabExpiries.map((label) => (
                                    <Button
                                        key={label}
                                        title={label}
                                        onPress={() => setActiveTab(label)}
                                        buttonStyle={{ width: undefined, alignSelf: "flex-start", height: 28, paddingHorizontal: 12, borderRadius: 6, backgroundColor: activeTab === label ? Colors.brand : theme.card }}
                                        textStyle={{ fontSize: 11, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                    />
                                ))}
                            </ScrollView>
                        )}

                        <Flexcomponent
                            justifyContent="space-between"
                            alignItems="center"
                            style={{
                                marginBottom: 10,
                                paddingHorizontal: 10,
                                paddingVertical: 8,
                                borderRadius: 6,
                                backgroundColor: theme.midblack
                            }}
                        >
                            <Input
                                type="checkbox"
                                label="Select All"
                                initial={allSelectedInCard}
                                onChange={toggleAll}
                                labelStyle={{ fontSize: 12 }}
                                boxstyle={{
                                    width: 18,
                                    height: 18,
                                    borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
                                    backgroundColor: theme.card,
                                    borderWidth: 1.5
                                }}
                            />
                            <View style={{ width: windowwidth * 0.2 }}>
                                <Dropdown
                                    themes={theme}
                                    value={notionalUnit}
                                    list={notionalUnitOptions}
                                    height={26}
                                    background={theme.card}
                                    onChange={(item) => setNotionalUnit(item.value)}
                                    inputStyle={{borderRadius: 5}}
                                />
                            </View>
                        </Flexcomponent>

                        {filtered.length === 0 ? (
                            <NoData title="No positions" />
                        ) : (
                            filtered.map((p, index) => {
                                const pairData = p.pairData || {};
                                const markPrice = getPositionMarkPrice(p);
                                const upnl = parseFloat(p.pnl) || 0;
                                const delta = getPositionDelta(p);
                                const qty = parseFloat(p.positionFilled) || 0;
                                const sign = p.positionSide === "long" ? 1 : -1;
                                const theta = (parseFloat(pairData.theta) || 0) * qty * sign;
                                const gamma = (parseFloat(pairData.gamma) || 0) * qty * sign;
                                const vega = (parseFloat(pairData.vega) || 0) * qty * sign;
                                return (
                                    <View key={`${typeof p.pairId === "string" ? p.pairId : index}-${index}`} style={{ flexDirection: "row", paddingVertical: 12, borderBottomWidth: 0.5, borderColor: theme.boderColor }}>
                                        <View style={{ width: 30, paddingTop: 2 }}>
                                            <Input
                                                type="checkbox"
                                                initial={pairsList.includes(p.pairId)}
                                                onChange={() => toggleRow(p.pairId)}
                                                boxstyle={{
                                                    width: 20,
                                                    height: 20,
                                                    marginRight: 0,
                                                    borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
                                                    backgroundColor: theme.midblack,
                                                    borderWidth: 1.5
                                                }}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginBottom: 20 }}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                                                    <View
                                                        style={{
                                                            width: 18,
                                                            height: 18,
                                                            borderRadius: 3,
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            borderWidth: 1,
                                                            borderColor: p.positionSide === "long" ? Colors.green : Colors.red
                                                        }}
                                                    >
                                                        <Text size="xsmall" family="medium" color={p.positionSide === "long" ? Colors.green : Colors.red}>
                                                            {p.positionSide === "long" ? "B" : "S"}
                                                        </Text>
                                                    </View>
                                                    <View>
                                                        <Text size="small" family="medium" numoflines={1}>{formatDisplayPair(pairData.tickerRoot || p.pairName)}</Text>
                                                        <Text size="xsmall" color={p.positionSide === "long" ? Colors.green : Colors.red}>{p.positionSide === "long" ? "Long" : "Short"}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ alignItems: "flex-end" }}>
                                                    <Text size="small" family="medium">{formatValue(markPrice, pairData.quoteDecimal)}</Text>
                                                    <Text size="xsmall" color={upnl >= 0 ? Colors.green : Colors.red}>{upnl.toFixed(2)} USD</Text>
                                                </View>
                                            </Flexcomponent>
                                            <MetricRow items={[
                                                { label: "Notional", value: `${formatValue(notionalOf(p), notionalUnit === "usd" ? 2 : 3)} ${unit}` },
                                                { label: "Entry Price", value: `${formatValue(p.entryPrice, pairData.quoteDecimal)}` },
                                                { label: "Delta", value: fmtNum(delta, 4) },
                                            ]} />
                                            <MetricRow items={[
                                                { label: "Theta", value: fmtNum(theta, 4) },
                                                { label: "Gamma", value: fmtNum(gamma, 5) },
                                                { label: "Vega", value: fmtNum(vega, 4) },
                                            ]} />
                                        </View>
                                    </View>
                                );
                            })
                        )}

                        {filtered.length > 0 && (
                            <View style={{ paddingTop: 12, paddingHorizontal: 10, paddingVertical: 10, borderRadius: 6, backgroundColor: theme.midblack }}>
                                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
                                    <Text size="small" family="medium">Σ All Positions</Text>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text size="small" family="medium">{formatValue(notionalUnit === "usd" ? totalAggregate.notionalUsd : totalAggregate.notionalBase, notionalUnit === "usd" ? 2 : 3)} {unit}</Text>
                                        <Text size="xsmall" color={totalAggregate.upnl >= 0 ? Colors.green : Colors.red}>{totalAggregate.upnl.toFixed(2)} USD</Text>
                                    </View>
                                </Flexcomponent>
                                <MetricRow items={[
                                    { label: "Delta", value: fmtNum(totalAggregate.delta, 4) },
                                    { label: "Theta", value: fmtNum(totalAggregate.theta, 4) },
                                    { label: "Gamma", value: fmtNum(totalAggregate.gamma, 5) },
                                    { label: "Vega", value: fmtNum(totalAggregate.vega, 4) },
                                ]} />
                            </View>
                        )}
                    </>
                )}
            </View>
        </Card>
    );
};

const RiskView: React.FC = () => {
    const positionDetails = useSelector((state: any) => state.future.positionDetails);
    const [groupByExpiry, setGroupByExpiry] = useState(false);

    const underlyingGroups = useMemo(() => {
        const groups: Record<string, any[]> = {};
        (positionDetails || []).forEach((p: any) => {
            const underlying = getUnderlying(p);
            if (!underlying) return;
            groups[underlying] = groups[underlying] || [];
            groups[underlying].push(p);
        });
        return groups;
    }, [positionDetails]);

    if (isEmpty(positionDetails)) {
        return (
            <View style={{ paddingTop: "20%" }}>
                <NoData title="No Position" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ paddingTop: "3%" }} showsVerticalScrollIndicator={false}>
    <Flexcomponent style={{ marginBottom: 10, gap: 20 }}>
         <Input type="checkbox" label="All Positions" initial={!groupByExpiry} onChange={() => setGroupByExpiry(false)} activecheckbox={Colors.btnBgGreen}  />
        <Input type="checkbox" label="Group by Expiry" initial={groupByExpiry} onChange={() => setGroupByExpiry(true)} activecheckbox={Colors.btnBgGreen} />
    </Flexcomponent>
    {Object.entries(underlyingGroups).map(([underlying, positions]) => (
        <RiskUnderlyingCard key={underlying} underlying={underlying} positions={positions} groupByExpiry={groupByExpiry} />
    ))}
</ScrollView>
    );
};

export default RiskView;
