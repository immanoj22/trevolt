import React from "react";
import { Pressable, TextInput, View } from "react-native";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Sheet from "../../../Components/bottomsheet";
import MiniOrderBook from "./MiniOrderBook";
import VectorIcons from "../../../Utilities/vectoricons";
import { Colors } from "../../../Utilities/uiasset";
import { StrategyLeg } from "../../../Utilities/strategyPayoffMath";

import { styles } from "./styles";

// Backend greeks fields can come through as a Mongo Decimal128-shaped object
// ({ $numberDecimal: "0.35" }) depending on the query path, which makes Number(...)
// silently produce NaN -> "NaN".toFixed crashes -> a blank Text node. Handle both
// plain numbers and that shape so the value always renders something real.
const safeFixed = (raw: any, digits: number) => {
    const num = typeof raw === "object" && raw !== null ? parseFloat(raw.$numberDecimal ?? raw) : parseFloat(raw);
    return Number.isFinite(num) ? num.toFixed(digits) : (0).toFixed(digits);
};

// Purely presentational - Expiry/Strike selection is done via two sibling bottom
// sheets owned by the parent (StrategyBuilder/index.tsx), NOT nested inside this one.
// @gorhom/bottom-sheet doesn't support mounting a BottomSheetModal inside another
// BottomSheetModal's children (only as siblings under the same provider) - nesting them
// here previously made the whole sheet silently fail to open.
type Props = {
    sheetref: React.RefObject<BottomSheetModal | null>;
    leg: StrategyLeg | null;
    theme: any;
    options: string;
    buyOrSell: boolean;
    onSetBuyOrSell: (v: boolean) => void;
    posType: "C" | "P";
    onSetPosType: (v: "C" | "P") => void;
    expiryLabel: string;
    onOpenExpiry: () => void;
    strikeLabel: string;
    onOpenStrike: () => void;
    marketOrLimit: boolean;
    onSetMarketOrLimit: (v: boolean) => void;
    limitPrice: string;
    onSetLimitPrice: (v: string) => void;
    qty: string;
    onSetQty: (v: string) => void;
    greeks?: any;
    bookPairId?: any;
    bookTickerRoot?: any;
    onDelete: () => void;
    onUpdate: () => void;
};

const EditLegSheet: React.FC<Props> = ({
    sheetref, leg, theme, options,
    buyOrSell, onSetBuyOrSell,
    posType, onSetPosType,
    expiryLabel, onOpenExpiry,
    strikeLabel, onOpenStrike,
    marketOrLimit, onSetMarketOrLimit,
    limitPrice, onSetLimitPrice,
    qty, onSetQty,
    greeks, bookPairId, bookTickerRoot,
    onDelete, onUpdate,
}) => {
    const style = styles(theme);

    return (
        <Sheet sheetref={sheetref} custominterface snappoint={["75%"]}>
            {!leg ? <View style={{ flex: 1 }} /> : (
                <BottomSheetScrollView
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 }}
                >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <Text family="medium" size="medium" color={theme.primarytext}>Edit Contract</Text>
                        <Pressable onPress={() => sheetref.current?.dismiss()} hitSlop={10}>
                            <VectorIcons family="Ionicons" name="close" size={22} iconcolor={theme.primarytext} />
                        </Pressable>
                    </View>

                    <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Buy / Sell</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
                        <Pressable
                            style={[style.segmentBtn, buyOrSell && { backgroundColor: Colors.green, borderColor: Colors.green }]}
                            onPress={() => onSetBuyOrSell(true)}
                        >
                            <Text size="semimedium" color={buyOrSell ? Colors.white : theme.primarytext} family="bold">Buy</Text>
                        </Pressable>
                        <Pressable
                            style={[style.segmentBtn, !buyOrSell && { backgroundColor: Colors.red, borderColor: Colors.red }]}
                            onPress={() => onSetBuyOrSell(false)}
                        >
                            <Text size="semimedium" color={!buyOrSell ? Colors.white : theme.primarytext} family="bold">Sell</Text>
                        </Pressable>
                    </View>

                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
                        <View style={{ flex: 1 }}>
                            <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Expiry</Text>
                            <Pressable style={style.dropdownPill} onPress={onOpenExpiry}>
                                <Text size="small" numoflines={1} color={theme.primarytext}>{expiryLabel || "Select"}</Text>
                                <VectorIcons family="Ionicons" name="chevron-down" size={14} iconcolor={theme.secondarytext} />
                            </Pressable>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Strike</Text>
                            <Pressable style={style.dropdownPill} onPress={onOpenStrike}>
                                <Text size="small" numoflines={1} color={theme.primarytext}>{strikeLabel || "Select"}</Text>
                                <VectorIcons family="Ionicons" name="chevron-down" size={14} iconcolor={theme.secondarytext} />
                            </Pressable>
                        </View>
                    </View>

                    <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Call / Put</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
                        <Pressable
                            style={[style.segmentBtn, posType === "C" && { backgroundColor: Colors.brand, borderColor: Colors.brand }]}
                            onPress={() => onSetPosType("C")}
                        >
                            <Text size="semimedium" color={posType === "C" ? Colors.white : theme.primarytext} family="bold">Call</Text>
                        </Pressable>
                        <Pressable
                            style={[style.segmentBtn, posType === "P" && { backgroundColor: Colors.red, borderColor: Colors.red }]}
                            onPress={() => onSetPosType("P")}
                        >
                            <Text size="semimedium" color={posType === "P" ? Colors.white : theme.primarytext} family="bold">Put</Text>
                        </Pressable>
                    </View>

                    <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Order Type & Size</Text>
                    <View style={[style.priceQtyRow, { marginBottom: 18 }]}>
                        <Pressable
                            style={style.mlToggle}
                            onPress={() => onSetMarketOrLimit(!marketOrLimit)}
                        >
                            <Text size="small" color={Colors.brand} family="bold">{marketOrLimit ? "M" : "L"}</Text>
                        </Pressable>
                        {marketOrLimit ? (
                            <View style={[style.sheetInputBox, { flex: 1.4 }]}>
                                <Text color={theme.secondarytext}>Market Price</Text>
                            </View>
                        ) : (
                            <TextInput
                                style={[style.sheetInputBox, { flex: 1.4 }]}
                                keyboardType="decimal-pad"
                                placeholder="Limit Price"
                                placeholderTextColor={theme.secondarytext}
                                value={limitPrice}
                                onChangeText={onSetLimitPrice}
                            />
                        )}
                        <TextInput
                            style={[style.sheetInputBox, { flex: 1, textAlign: "right" }]}
                            keyboardType="decimal-pad"
                            value={qty}
                            onChangeText={onSetQty}
                        />
                        <View style={style.qtyUnitBox}>
                            <Text size="small" color={theme.secondarytext}>{leg.qtyUnit ?? options}</Text>
                        </View>
                    </View>

                    <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Order Book</Text>
                    <View style={style.bookContainer}>
                        <MiniOrderBook theme={theme} pairId={bookPairId} tickerRoot={bookTickerRoot} />
                    </View>

                    <Text size="small" color={theme.secondarytext} style={style.sheetSectionLabel}>Greeks</Text>
                    <View style={[style.statsRow, { flexWrap: "nowrap" }]}>
                        <View style={style.greekCell}>
                            <Text size="small" color={theme.secondarytext}>Delta</Text>
                            <Text family="medium" fontSize={12} color={theme.primarytext}>{safeFixed(greeks?.delta, 2)}</Text>
                        </View>
                        <View style={style.greekCell}>
                            <Text size="small" color={theme.secondarytext}>Gamma</Text>
                            <Text family="medium" fontSize={12} color={theme.primarytext}>{safeFixed(greeks?.gamma, 4)}</Text>
                        </View>
                        <View style={style.greekCell}>
                            <Text size="small" color={theme.secondarytext}>Theta</Text>
                            <Text family="medium" fontSize={12} color={theme.primarytext}>{safeFixed(greeks?.theta, 2)}</Text>
                        </View>
                        <View style={style.greekCell}>
                            <Text size="small" color={theme.secondarytext}>Vega</Text>
                            <Text family="medium" fontSize={12} color={theme.primarytext}>{safeFixed(greeks?.vega, 2)}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10, marginTop: 4, marginBottom: 16 }}>
                        <Pressable style={[style.sheetActionBtn, { backgroundColor: "transparent", borderWidth: 1.5, borderColor: Colors.red }]} onPress={onDelete}>
                            <Text color={Colors.red} family="bold">Delete</Text>
                        </Pressable>
                        <Pressable style={[style.sheetActionBtn, { backgroundColor: Colors.brand }]} onPress={onUpdate}>
                            <Text color={Colors.white} family="bold">Update</Text>
                        </Pressable>
                    </View>
                </BottomSheetScrollView>
            )}
        </Sheet>
    );
};

export default EditLegSheet;
