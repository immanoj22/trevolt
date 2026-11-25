import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, TextInput, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Mainview from "../../../Components/mainview";
import { Button } from "../../../Components/Field";
import Switch from "../../../Components/Field/Switch";
import VectorIcons from "../../../Utilities/vectoricons";
import { Colors } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import {
    optionTradeSelector,
    removeStrategyContract,
    toggleStrategyContractField,
    updateStrategyContractField,
    updateStrategyLeg,
    clearStrategyContracts,
    useStrategyBasketPlaceMutation,
    useLazyGetContractsQuery,
} from "../../../Slices/option";
import { StrategyLeg } from "../../../Utilities/strategyPayoffMath";
import { buildStrategyLegPayload, formatExpiryNumeric } from "../../../Utilities/strategyLeg";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import EditLegSheet from "./EditLegSheet";
import MultiplierSheet from "./MultiplierSheet";
import OptionList from "../List";

import { styles } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'StrategyBuilder'>;

type StrategyLegRowProps = {
    item: StrategyLeg;
    theme: any;
    style: any;
    onToggle: (id: number, key: string) => void;
    onUpdate: (id: number, key: string, value: any) => void;
    onRemove: (id: number) => void;
    onEditPress: (item: StrategyLeg) => void;
    onMultiplierPress: (item: StrategyLeg) => void;
    getLegLabel: (contract: StrategyLeg) => string;
};

const StrategyLegRow = memo(({ item, theme, style, onToggle, onUpdate, onRemove, onEditPress, onMultiplierPress, getLegLabel }: StrategyLegRowProps) => {
    const [qty, setQty] = useState(String(item.qty));

    useEffect(() => {
        setQty(String(item.qty));
    }, [item.id, item.qty]);

    const commitQty = useCallback(() => {
        if (qty !== String(item.qty)) {
            onUpdate(item.id, "qty", qty);
        }
    }, [item.id, item.qty, onUpdate, qty]);

    return (
        <Card containerStyle={style.legRow}>
            <View style={style.legTopRow}>
                <Switch
                    value={item.checked}
                    onChange={() => onToggle(item.id, "checked")}
                />
                <Pressable
                    style={[style.sideBadge, { backgroundColor: item.buyOrSell ? Colors.green : Colors.red }]}
                    onPress={() => onToggle(item.id, "buyOrSell")}
                >
                    <Text size="small" color={Colors.white} family="bold">{item.buyOrSell ? "B" : "S"}</Text>
                </Pressable>
                <Text style={style.legLabel} numoflines={1}>{getLegLabel(item)}</Text>
                <Pressable style={style.multiplierPill} onPress={() => onMultiplierPress(item)}>
                    <Text size="small" color={theme.secondarytext}>{item.multiplier}</Text>
                </Pressable>
                <Pressable onPress={() => onRemove(item.id)} hitSlop={10}>
                    <VectorIcons family="Ionicons" name="trash-outline" size={16} iconcolor={theme.secondarytext} />
                </Pressable>
            </View>
            <View style={style.legBottomRow}>
                <Pressable
                    style={{ flexDirection: "row", alignItems: "center" }}
                    onPress={() => onEditPress(item)}
                >
                    <View style={style.mlBadge}>
                        <Text size="small" color={Colors.brand}>{item.marketOrLimit ? "M" : "L"}</Text>
                    </View>
                    <Text size="small" color={theme.secondarytext}>
                        {item.marketOrLimit ? "Market" : (item.limitPrice || "Limit Price")}
                    </Text>
                    <VectorIcons family="Ionicons" name="pencil-outline" size={12} iconcolor={theme.secondarytext} />
                </Pressable>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <TextInput
                        style={style.qtyInput}
                        keyboardType="decimal-pad"
                        value={qty}
                        onChangeText={setQty}
                        onBlur={commitQty}
                        onEndEditing={commitQty}
                    />
                    <Text size="small" color={theme.secondarytext}>{item.qtyUnit}</Text>
                </View>
            </View>
        </Card>
    );
});

const StrategyBuilder: React.FC<Props> = ({ navigation }) => {
    const { theme, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);
    const dispatch = useDispatch();

    const { strategyContracts, strategyMultiplier, pairlist, options } = useSelector(optionTradeSelector);
    const { wallet } = useSelector((state: any) => state.wallet);
    const contracts: StrategyLeg[] = strategyContracts ?? [];
    const multiplier = strategyMultiplier ?? 1;

    const matchedAsset = pairlist?.find((p: any) => p.symbol === options);
    const currentPrice = parseFloat(matchedAsset?.marketPrice) || 0;
    const expiryList = matchedAsset?.options ?? [];

    const [placeBasket, { isLoading: placing }] = useStrategyBasketPlaceMutation();

    const editSheetRef = useRef<BottomSheetModal>(null);
    const expirySheetRef = useRef<BottomSheetModal>(null);
    const strikeSheetRef = useRef<BottomSheetModal>(null);
    const [editingLeg, setEditingLeg] = useState<StrategyLeg | null>(null);

    // Draft copy of the fields being edited - only committed to redux on "Update", so
    // "Delete"/dismissing without confirming never mutates the real leg.
    const [buyOrSell, setBuyOrSell] = useState(true);
    const [posType, setPosType] = useState<"C" | "P">("C");
    const [expiryRaw, setExpiryRaw] = useState("");
    const [strikeLabel, setStrikeLabel] = useState("");
    const [marketOrLimit, setMarketOrLimit] = useState(true);
    const [limitPrice, setLimitPrice] = useState("");
    const [editQty, setEditQty] = useState("0.001");
    const [chainItem, setChainItem] = useState<any>(null);
    const [chain, setChain] = useState<{ callpair: any[]; putpair: any[] }>({ callpair: [], putpair: [] });
    const [getContract] = useLazyGetContractsQuery();

    const handleEditPress = useCallback((leg: StrategyLeg) => {
        setEditingLeg(leg);
        setBuyOrSell(!!leg.buyOrSell);
        setPosType((leg.posType?.value as "C" | "P") ?? "C");
        // Leg stores expiry in its own numeric "DDMMYY" convention, but the chain's
        // expiry list uses the raw "DDMMMYY" string (e.g. "15Jul26") - map back to that
        // raw form so it matches an actual expiryList entry.
        const rawMatch = expiryList?.find((e: any) => formatExpiryNumeric(e.expiryDateStr) === leg.expiry?.label);
        setExpiryRaw(rawMatch?.expiryDateStr ?? expiryList?.[0]?.expiryDateStr ?? "");
        setStrikeLabel(leg.strike?.label ?? "");
        setMarketOrLimit(leg.marketOrLimit !== false);
        setLimitPrice(String(leg.limitPrice ?? ""));
        setEditQty(String(leg.qty ?? "0.001"));
        setChainItem(null);
        editSheetRef.current?.present();
    }, [expiryList]);

    const rawExpiryEntry = expiryList?.find((e: any) => e.expiryDateStr === expiryRaw) ?? expiryList?.[0];

    useEffect(() => {
        if (!rawExpiryEntry?.expiryDateStr || !editingLeg) return;
        (async () => {
            const response = await getContract({ token: options, expiry: rawExpiryEntry.expiryDateStr });
            const data = response?.data?.result?.data?.[0];
            setChain({ callpair: data?.callpair ?? [], putpair: data?.putpair ?? [] });
        })();
    }, [rawExpiryEntry?.expiryDateStr, editingLeg]);

    const strikeList = posType === "C" ? chain.callpair : chain.putpair;

    useEffect(() => {
        if (!strikeList?.length) return;
        // Prefer matching by the leg's own pairId (exact, unambiguous) so a fresh chain
        // fetch never silently swaps in a different strike due to a strikePrice string/
        // formatting mismatch - only fall back to the strike-label match once the user
        // has actually picked a different strike than the one the leg was added with.
        const match = strikeList.find((c: any) => c._id === editingLeg?.pairId)
            ?? strikeList.find((c: any) => `${c.strikePrice}` === strikeLabel)
            ?? strikeList[0];
        setChainItem(match);
        if (match && `${match.strikePrice}` !== strikeLabel) setStrikeLabel(`${match.strikePrice}`);
    }, [strikeList]);

    const handleDeleteLeg = useCallback(() => {
        if (!editingLeg) return;
        dispatch(removeStrategyContract(editingLeg.id));
        editSheetRef.current?.dismiss();
    }, [dispatch, editingLeg]);

    const handleUpdateLeg = useCallback(() => {
        if (!editingLeg) return;
        const patch: any = { buyOrSell, marketOrLimit, limitPrice, qty: editQty };
        if (chainItem) {
            Object.assign(patch, buildStrategyLegPayload(chainItem, buyOrSell, editQty), { marketOrLimit, limitPrice });
        } else {
            patch.posType = { label: posType, value: posType };
            patch.strike = { label: strikeLabel, value: strikeLabel };
        }
        dispatch(updateStrategyLeg({ id: editingLeg.id, patch }));
        editSheetRef.current?.dismiss();
    }, [dispatch, editingLeg, buyOrSell, marketOrLimit, limitPrice, editQty, chainItem, posType, strikeLabel]);

    const multiplierSheetRef = useRef<BottomSheetModal>(null);
    const [multiplierLeg, setMultiplierLeg] = useState<StrategyLeg | null>(null);

    const handleMultiplierPress = useCallback((leg: StrategyLeg) => {
        setMultiplierLeg(leg);
        multiplierSheetRef.current?.present();
    }, []);

    const selectedCount = contracts.filter((c) => c.checked).length;
    const allSelected = contracts.length > 0 && selectedCount === contracts.length;

    const getLegLabel = useCallback((c: StrategyLeg) => {
        if (c.kind === "futures") return c.symbol ?? `${options}USD`;
        return `${c.posType?.label ?? "-"}-${c.strike?.label ?? "-"}-${c.expiry?.label ?? "-"}`;
    }, [options]);

    const handleToggleField = useCallback((id: number, key: string) => {
        dispatch(toggleStrategyContractField({ id, key }));
    }, [dispatch]);

    const handleUpdateField = useCallback((id: number, key: string, value: any) => {
        dispatch(updateStrategyContractField({ id, key, value }));
    }, [dispatch]);

    const handleRemoveContract = useCallback((id: number) => {
        dispatch(removeStrategyContract(id));
    }, [dispatch]);

    const handleToggleAll = () => {
        contracts.forEach((c) => {
            if (c.checked === allSelected) {
                dispatch(toggleStrategyContractField({ id: c.id, key: "checked" }));
            }
        });
    };

    const handlePlaceOrder = async () => {
        const legs = contracts.filter((c) => c.checked && c.kind === "option" && c.pairId);
        if (!legs.length) return;

        const orders = legs.map((c) => ({
            pairId: c.pairId,
            price: c.marketOrLimit ? c.markPriceAtAdd : (parseFloat(c.limitPrice) || 0),
            quantity: (parseFloat(c.qty as any) || 0) * multiplier,
            buyorsell: c.buyOrSell ? "buy" : "sell",
            orderType: c.marketOrLimit ? "market" : "limit",
            reduce_only: false,
            makeronly: false,
            isTrailingOrder: false,
            trailPrice: 0,
            trailTypePrice: 0,
            trailType: "market",
            isTake: false,
            isStop: false,
            typeTIF: "",
            orderCost: 0,
            orderValue: 0,
            margin: 0,
            fees: 0,
            stopPrice: "",
            leverage: parseInt(c.multiplier, 10) || 1,
            takeProfit: { stopPrice: "", price: "", orderType: "bracket_tp_market" },
            stopLoss: { stopPrice: "", price: "", orderType: "bracket_sl_market" },
        }));

        try {
            const res: any = await placeBasket({ orders }).unwrap();
            // Backend pushes exactly one result per input order, in the same order it
            // received them (a sequential `for (const leg of orders)` loop, no skips) -
            // so results[i] always corresponds to legs[i] here.
            const results = res?.result ?? [];
            const successCount = results.filter((r: any) => r.success).length;
            const firstFailure = results.find((r: any) => !r.success);

            // Only the legs that actually placed should leave the basket - a failed leg
            // (bad precision, insufficient margin, etc.) stays so the user can fix and
            // retry it, instead of it silently vanishing along with the successful ones.
            legs.forEach((leg, i) => {
                if (results[i]?.success) dispatch(removeStrategyContract(leg.id));
            });

            if (successCount === results.length && results.length > 0) {
                successtoast("Success", `${successCount}/${results.length} leg(s) placed successfully`);
                navigation.goBack();
            } else if (successCount > 0) {
                failuretoast("Partially placed", `${successCount}/${results.length} placed - ${firstFailure?.message ?? "one leg failed"}. Fix the remaining leg and retry.`);
            } else {
                failuretoast("Error", firstFailure?.message ?? "Failed to place strategy order");
            }
        } catch (e: any) {
            failuretoast("Error", e?.data?.message ?? e?.message ?? "Failed to place strategy order");
        }
    };

    const headerBar = (
        <View style={style.topBar}>
            <Text family="medium">{options} <Text color={Colors.brand} size="small">${currentPrice}</Text></Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                {contracts.length > 0 && (
                    <Pressable onPress={() => navigation.navigate("StrategyAddContracts")}>
                        <Text color={Colors.brand} family="medium">+ Contracts</Text>
                    </Pressable>
                )}
                <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
                    <VectorIcons family="Ionicons" name="close" size={22} iconcolor={theme.primarytext} />
                </Pressable>
            </View>
        </View>
    );

    if (contracts.length === 0) {
        return (
            <Mainview isheader={false} isscollable={false} horizontalpadding={0} isbottomtab={false} gradientColors={theme.heroGradient} gradientLocations={[0, 0.22, 0.42]}>
                {headerBar}
                <View style={style.emptyState}>
                    <VectorIcons family="Ionicons" name="layers-outline" size={40} iconcolor={theme.secondarytext} />
                    <Text family="medium" style={{ textAlign: "center" }}>Create and Analyze Strategies & place Basket Orders</Text>
                    <Text size="small" color={theme.secondarytext} style={{ textAlign: "center" }}>
                        Select options contracts via 'Add {options} contracts'
                    </Text>
                    <Button
                        title={`Add ${options} contracts`}
                        buttonStyle={style.outlineButton}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        onPress={() => navigation.navigate("StrategyAddContracts")}
                    />
                    <Pressable onPress={() => navigation.goBack()}>
                        <Text color={Colors.brand} size="small">Select a different underlying &gt;</Text>
                    </Pressable>
                </View>
                <View style={style.footer}>
                    <View style={style.footerRow}>
                        <Text size="small" color={theme.secondarytext}>Available Margin</Text>
                        <Text family="bold">${wallet?.availableBalance?.toFixed(2) ?? "0"}</Text>
                    </View>
                </View>
            </Mainview>
        );
    }

    return (
        <Mainview isheader={false} isscollable={false} horizontalpadding={0} isbottomtab={false} gradientColors={theme.heroGradient} gradientLocations={[0, 0.22, 0.42]}>
            {headerBar}

            <View style={style.header}>
                <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 8 }} onPress={handleToggleAll}>
                    <Switch value={allSelected} onChange={handleToggleAll} />
                    <Text family="medium">Contracts ({selectedCount}/{contracts.length})</Text>
                </Pressable>
                <Pressable onPress={() => dispatch(clearStrategyContracts())} hitSlop={10}>
                    <VectorIcons family="Ionicons" name="trash-outline" size={18} iconcolor={Colors.red} />
                </Pressable>
            </View>

            <FlatList
                data={contracts}
                style={{ flex: 1 }}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 10 }}
                renderItem={({ item }) => (
                    <StrategyLegRow
                        item={item}
                        theme={theme}
                        style={style}
                        onToggle={handleToggleField}
                        onUpdate={handleUpdateField}
                        onRemove={handleRemoveContract}
                        onEditPress={handleEditPress}
                        onMultiplierPress={handleMultiplierPress}
                        getLegLabel={getLegLabel}
                    />
                )}
                initialNumToRender={8}
                maxToRenderPerBatch={6}
                windowSize={5}
                removeClippedSubviews={true}
            />

            <View style={style.footer}>
                {selectedCount === 0 && (
                    <View style={style.validationBanner}>
                        <Text size="small" color={"#ffc107"}>Select at least 1 contract to place an order</Text>
                    </View>
                )}
                <View style={style.footerRow}>
                    <Text size="small" color={theme.secondarytext}>Available Margin</Text>
                    <Text family="bold">${wallet?.availableBalance?.toFixed(2) ?? "0"}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    {/* "Analyse Payoff" button hidden - payoff buttons are hidden app-wide. */}
                    <Button
                        title={placing ? "Placing..." : `Place Order (${selectedCount})`}
                        buttonStyle={{ flex: 1 }}
                        disabled={selectedCount === 0 || placing}
                        onPress={handlePlaceOrder}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>
            </View>

            <EditLegSheet
                sheetref={editSheetRef}
                leg={editingLeg}
                theme={theme}
                options={options}
                buyOrSell={buyOrSell}
                onSetBuyOrSell={setBuyOrSell}
                posType={posType}
                onSetPosType={setPosType}
                expiryLabel={expiryRaw}
                onOpenExpiry={() => expirySheetRef.current?.present()}
                strikeLabel={strikeLabel}
                onOpenStrike={() => strikeSheetRef.current?.present()}
                marketOrLimit={marketOrLimit}
                onSetMarketOrLimit={setMarketOrLimit}
                limitPrice={limitPrice}
                onSetLimitPrice={setLimitPrice}
                qty={editQty}
                onSetQty={setEditQty}
                greeks={chainItem ?? editingLeg?.greeks}
                bookPairId={chainItem?._id ?? editingLeg?.pairId}
                bookTickerRoot={chainItem?.tickerRoot ?? editingLeg?.tickerRoot}
                onDelete={handleDeleteLeg}
                onUpdate={handleUpdateLeg}
            />

            <OptionList
                ref={expirySheetRef}
                data={expiryList}
                title="Expiry"
                onClose={() => expirySheetRef.current?.close()}
                onSelect={(item: any) => setExpiryRaw(item.expiryDateStr)}
                selectedId={rawExpiryEntry}
            />
            <OptionList
                ref={strikeSheetRef}
                data={strikeList}
                title="Strike"
                variant="strike"
                onClose={() => strikeSheetRef.current?.close()}
                onSelect={(item: any) => setStrikeLabel(`${item.strikePrice}`)}
                selectedId={chainItem}
            />

            <MultiplierSheet
                sheetref={multiplierSheetRef}
                theme={theme}
                initialValue={parseInt(multiplierLeg?.multiplier, 10) || 1}
                max={matchedAsset?.max_leverage || 100}
                onConfirm={(value) => {
                    if (multiplierLeg) dispatch(updateStrategyContractField({ id: multiplierLeg.id, key: "multiplier", value: `${value}x` }));
                }}
            />
        </Mainview>
    );
};

export default StrategyBuilder;
