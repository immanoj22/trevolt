import React, { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import useCustomHooks from "../../Actions/Hooks/customhook";
import useApiError from "../../Actions/Hooks/errorhook";
import { useFutureOrderPlacingMutation } from "../../Slices/future";
import { LotToquantity } from "../../Actions/Hooks/usePriceConversion";
import { formatDisplayPair } from "../../Utilities/formatPair";
import { Colors } from "../../Utilities/uiasset";
import { RFvalue } from "../../Utilities/dimensions";

interface QuickTradeBarProps {
    // The pair the fullscreen chart's WebView is actually pointed at. Compared
    // against the currently-selected redux trade pair below - if they've drifted
    // apart (e.g. mid pair-switch) the buttons disable rather than risk placing
    // a market order against the wrong market.
    tickerRoot?: string;
}

const MIN_LOT = 1;

// One-tap market Long/Short bar for the fullscreen futures chart, matching the
// bottom trade bar competitor charting screens (e.g. Delta Exchange) show. Built
// as a self-contained component - deliberately not reusing BuysellNew's state -
// because future.tsx early-returns to <FullViewChart> while `showFullChart` is
// true (see future.tsx), which unmounts BuysellNew entirely. There is nothing of
// its state left to hook into here.
const QuickTradeBar: React.FC<QuickTradeBarProps> = ({ tickerRoot }) => {
    const { theme, successtoast, failuretoast } = useCustomHooks();

    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const currentLeverage = useSelector((state: any) => state.auth.leverage);

    const tradePair = {
        _id: futureTradePair?._id,
        baseCurrency: futureTradePair?.baseCurrency ?? futureTicker?.baseCurrency ?? "",
        minAmount: futureTradePair?.minAmount ?? 0,
        baseDecimal: futureTradePair?.baseDecimal ?? 4,
        max_leverage: futureTradePair?.max_leverage ?? futureTradePair?.maxLeverage ?? 100,
    };

    const pairReady = !!tradePair._id
        && (!tickerRoot || futureTradePair?.tickerRoot === tickerRoot || futureTicker?.tickerRoot === tickerRoot);

    const [lots, setLots] = useState(MIN_LOT);

    const [futureOrderPlacing, { isLoading: orderLoading, error: orderErr }] = useFutureOrderPlacingMutation();
    useApiError(orderErr);

    // Which side is in flight, so the spinner only replaces the tapped button.
    const [submittingSide, setSubmittingSide] = useState<"buy" | "sell" | null>(null);

    const placeQuickOrder = useCallback(async (side: "buy" | "sell") => {
        if (!pairReady || orderLoading) return;
        const numericQuantity = Number(LotToquantity(lots, tradePair.minAmount, tradePair.baseDecimal)) || 0;
        if (!numericQuantity) {
            failuretoast("Error", "Enter a valid lot size");
            return;
        }
        setSubmittingSide(side);
        try {
            const payload = {
                pairId: tradePair._id,
                price: futureTicker?.marketPrice,
                quantity: numericQuantity,
                buyorsell: side,
                orderType: "market",
                stopPrice: "",
                reduce_only: false,
                makeronly: false,
                leverage: currentLeverage || tradePair.max_leverage || 1,
            };
            const response = await futureOrderPlacing(payload).unwrap();
            if (response?.success) {
                successtoast("Success", response.message ?? `${side === "buy" ? "Long" : "Short"} order placed`);
            } else {
                failuretoast("Error", response?.message || "Something went wrong!");
            }
        } catch (e) {
            console.log("QuickTradeBar__placeQuickOrder__err", e);
        } finally {
            setSubmittingSide(null);
        }
    }, [
        pairReady,
        orderLoading,
        lots,
        tradePair._id,
        tradePair.minAmount,
        tradePair.baseDecimal,
        tradePair.max_leverage,
        futureTicker?.marketPrice,
        currentLeverage,
        futureOrderPlacing,
        successtoast,
        failuretoast,
    ]);

    const styles = style(theme);
    const disabled = !pairReady || orderLoading;
    const lotBaseQty = LotToquantity(lots, tradePair.minAmount, tradePair.baseDecimal);

    return (
        <View style={styles.container}>
            <Pressable
                disabled={disabled}
                onPress={() => placeQuickOrder("sell")}
                style={[styles.sideButton, { backgroundColor: Colors.red, opacity: disabled ? 0.5 : 1 }]}
            >
                {submittingSide === "sell" ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                    <Text family="semiBold" size="semimedium" color={Colors.white}>Short</Text>
                )}
            </Pressable>

            <View style={styles.lotStepper}>
                <Pressable
                    hitSlop={10}
                    disabled={disabled}
                    onPress={() => setLots((l) => Math.max(MIN_LOT, l - 1))}
                    style={styles.stepBtn}
                >
                    <Text family="bold" size="small" color={theme.primarytext}>-</Text>
                </Pressable>
                <View style={{ alignItems: "center" }}>
                    <Text family="semiBold" size="semismall" color={theme.primarytext} numoflines={1}>{lots} Lot</Text>
                    <Text family="regular" size="semismall" color={theme.secondarytext} numoflines={1}>
                        {lotBaseQty} {formatDisplayPair(tradePair.baseCurrency)}
                    </Text>
                </View>
                <Pressable
                    hitSlop={10}
                    disabled={disabled}
                    onPress={() => setLots((l) => l + 1)}
                    style={styles.stepBtn}
                >
                    <Text family="bold" size="small" color={theme.primarytext}>+</Text>
                </Pressable>
            </View>

            <Pressable
                disabled={disabled}
                onPress={() => placeQuickOrder("buy")}
                style={[styles.sideButton, { backgroundColor: Colors.brand, opacity: disabled ? 0.5 : 1 }]}
            >
                {submittingSide === "buy" ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                    <Text family="semiBold" size="semimedium" color={Colors.white}>Long</Text>
                )}
            </Pressable>
        </View>
    );
};

// Rendered inside Chart/chart.tsx, which re-renders on every futureTicker socket
// tick - memo keeps this bar's own (unrelated) re-render cycle independent of that.
export default React.memo(QuickTradeBar);

const style = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "stretch",
        paddingHorizontal: 12,
        paddingTop: 6,
        paddingBottom: RFvalue(6),
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: theme.boderColor,
        backgroundColor: theme.theme === "dark" ? "#111A2D" : "#FFFFFF",
    },
    sideButton: {
        flex: 1,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 6,
    },
    lotStepper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.boderColor,
        backgroundColor: theme.theme === "dark" ? "#0A101C" : "#FFFFFF",
        minWidth: RFvalue(90),
    },
    stepBtn: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
});
