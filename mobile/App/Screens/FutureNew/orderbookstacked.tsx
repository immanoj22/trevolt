import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import NoData from "../../Components/Nodata";
import LinearGradient from "../../Components/lineargradient";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { windowheight } from "../../Utilities/dimensions";
import { formatValue } from "../../Utilities/helerfunction";
import { useLazyFutureOrderBookQuery } from "../../Slices/future";
import { socketService } from "../../Actions/Socket/socketManager";
import { formatDisplayPair } from "../../Utilities/formatPair";
import { Colors } from "../../Utilities/uiasset";

interface OrderBookStackedProps {
    currentIndex?: any;
    tickerRoot?: any;
    // Caps this panel's fixed height so it never extends past the sibling
    // BuysellNew column (i.e. never past the Buy/Sell button) - see future.tsx,
    // which measures that column via onLayout and passes its height down.
    maxHeight?: number;
}

interface OrderItem {
    _id: string;
    total: number;
    totalAmount: number;
    quantity: any;
}

type ViewMode = "Default" | "Buy Orders" | "Sell Orders";

// Buy on top / sell on bottom around a live price row - the exact arrangement
// Tradecomponent (the recent-trade-print stand-in this replaces) already used in
// this slot, kept deliberately rather than switching to ask-top-bid-bottom.
// The Default/Buy Orders/Sell Orders toggle mirrors book.tsx's existing (but never
// UI-wired) `selectedOrder` concept, styled after a cleaner reference exchange's UI.
const OrderBookStacked: React.FC<OrderBookStackedProps> = ({ currentIndex, tickerRoot, maxHeight }) => {
    const { theme } = useCustomHooks();
    const styles = style(theme);
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);

    const [viewMode, setViewMode] = useState<ViewMode>("Default");
    const [orderBook, setOrderBook] = useState<{ buyOrder: OrderItem[]; sellOrder: OrderItem[] }>({ buyOrder: [], sellOrder: [] });
    const tickerRootRef = useRef(tickerRoot ?? futureTradePair?.tickerRoot);

    useEffect(() => {
        tickerRootRef.current = tickerRoot ?? futureTradePair?.tickerRoot;
    }, [tickerRoot, futureTradePair?.tickerRoot]);

    const [futureorderBook] = useLazyFutureOrderBookQuery();

    const handleOrderBook = useCallback((data: any) => {
        data = JSON.parse(data);
        // Global broadcast, not scoped to one pair - filter to the ticker we're showing,
        // same guard book.tsx's Bookcomponent and web's OrderBook.jsx both apply.
        if (tickerRootRef.current && data?.tickerRoot && data.tickerRoot !== tickerRootRef.current) return;

        let buyOrderTotal = 0;
        let sellOrderTotal = 0;

        const buyOrder = data?.["buyOrder"]?.map((val: any) => {
            buyOrderTotal += parseFloat(val.total) || 0;
            return { ...val, totalAmount: buyOrderTotal };
        });

        const sellOrder = data?.["sellOrder"]?.map((val: any) => {
            sellOrderTotal += parseFloat(val.total) || 0;
            return { ...val, totalAmount: sellOrderTotal };
        });

        setOrderBook({ buyOrder, sellOrder });
    }, []);

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FuturesorderBook", handleOrderBook);
        return () => {
            socketService.off("FuturesorderBook", handleOrderBook);
        };
    }, [socketService]);

    const triggerFutureOrderBook = async () => {
        if (!currentIndex) return;
        const res = await futureorderBook({ id: currentIndex, limit: 15 });

        if (res.data?.success) {
            let buyOrderTotal = 0;
            let sellOrderTotal = 0;

            const buyOrder = res.data.result.buyOrder.map((val: any) => {
                buyOrderTotal += parseFloat(val.total) || 0;
                return { ...val, totalAmount: buyOrderTotal };
            });

            const sellOrder = res.data.result.sellOrder.map((val: any) => {
                sellOrderTotal += parseFloat(val.total) || 0;
                return { ...val, totalAmount: sellOrderTotal };
            });

            setOrderBook({ buyOrder, sellOrder });
        } else {
            setOrderBook({ buyOrder: [], sellOrder: [] });
        }
    };

    useFocusEffect(
        useCallback(() => {
            triggerFutureOrderBook();
        }, [currentIndex])
    );

    // `strong` = the vivid, near-solid fill used when a single side fills the whole
    // panel (Buy Orders / Sell Orders tabs, matching the reference's punchier look
    // there); Default mode keeps the subtler transparent-to-solid fade so both halves
    // don't visually compete for attention in the smaller compact view.
    const renderRow = (item: OrderItem, index: number, side: "buy" | "sell", list: OrderItem[], strong: boolean) => {
        const lastTotal = list[list.length - 1]?.totalAmount || 1;
        const percentage = (item.totalAmount / lastTotal) * 100;
        const solid = side === "buy"
            ? (theme.theme === "dark" ? "#0e1e3c" : "#D5FFF9")
            : (theme.theme === "dark" ? "#3E1B29" : "#FFD3E5");
        const barColors = strong ? [solid, solid] : ["#18191e08", solid];
        const priceColor = side === "buy" ? theme.bookBuy : theme.bookSell;

        return (
            <View key={`${side}-${item._id}-${index}`} style={styles.row}>
                {Platform.OS === "ios" ? (
                    // iOS: flat single color, no gradient - see lineargradient.tsx's
                    // Fabric-compatibility note for the fallback this sidesteps.
                    <View style={[styles.rowBar, { width: `${isNaN(percentage) ? 0 : percentage}%`, backgroundColor: solid }]} />
                ) : (
                    <LinearGradient
                        colors={barColors}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.rowBar, { width: `${isNaN(percentage) ? 0 : percentage}%` }]}
                    />
                )}
                <View style={styles.rowContent}>
                    <Text family="medium" color={priceColor} size="small" numoflines={1} style={[styles.colPrice, {paddingHorizontal: "5%"}]}>
                        {item?._id}
                    </Text>
                    <Text family="medium" color={theme.textinput} size="small" numoflines={1} style={[styles.colSize, {paddingHorizontal: "5%"}]}>
                        {isNaN(item?.quantity) ? 0 : formatValue(item?.quantity, futureTradePair?.baseDecimal)}
                    </Text>
                </View>
            </View>
        );
    };

    const renderList = (list: OrderItem[], side: "buy" | "sell", strong: boolean) => (
        list.length > 0 ? (
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
            >
                {list.map((item, index) => renderRow(item, index, side, list, strong))}
            </ScrollView>
        ) : (
            <View style={styles.noData}>
                <NoData />
            </View>
        )
    );

    const tabs: { key: ViewMode; icon: React.ReactNode }[] = [
        {
            key: "Default",
            icon: (
                <View style={{ flexDirection: "row", gap: 2 }}>
                    <View style={[styles.tabSwatch, { backgroundColor: theme.bookBuy }]} />
                    <View style={[styles.tabSwatch, { backgroundColor: theme.bookSell }]} />
                </View>
            ),
        },
        { key: "Buy Orders", icon: <View style={[styles.tabSwatch, { backgroundColor: theme.bookBuy, width: 14 }]} /> },
        { key: "Sell Orders", icon: <View style={[styles.tabSwatch, { backgroundColor: theme.bookSell, width: 14 }]} /> },
    ];

    // Generous fixed height like the original design, but never past the sibling
    // BuysellNew column's actual height (`maxHeight`, measured by future.tsx via
    // onLayout) - so it stays tall/scrollable on a device where the form runs
    // long, yet stops right at the Buy/Sell button (not past it, into the tabs
    // below) on a device where the form is shorter than this fixed target.
    const targetHeight = windowheight * 0.7;
    const resolvedHeight = maxHeight ? Math.min(targetHeight, maxHeight) : targetHeight;

    return (
        <View style={{ height: resolvedHeight, paddingRight: "7%" }}>
            <Flexcomponent justifyContent="flex-start" height={windowheight * 0.035} style={{ gap: 10 }}>
                {tabs.map((tab) => (
                    <Pressable
                        key={tab.key}
                        onPress={() => setViewMode(tab.key)}
                        style={[
                            styles.tabButton,
                            {
                                borderColor: viewMode === tab.key
                                    ? Colors.brand
                                    : (theme.theme === "dark" ? "#2F2F2F" : "#E2E8F0"),
                            },
                        ]}
                        hitSlop={8}
                    >
                        {tab.icon}
                    </Pressable>
                ))}
            </Flexcomponent>

            {/* Same paddingHorizontal as the outer container (not repeated on the header/row
                Views below) so header labels and row values share one consistent inset. */}
            {/* adjustsFontSizeToFit instead of a fixed size - "Price (USDT)" was wide
                enough to get ellipsized ("Price (US...") in this half-column on a
                narrow device (iPhone mini), especially now that the order book column
                itself was narrowed to make room for the form beside it. */}
            <Flexcomponent height={windowheight * 0.04}>
                <Text family="medium" color={theme.secondarytext} size={Platform.OS === "ios" ? "semismall" : "small"} numoflines={1} style={styles.colPrice} textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}>
                    Price ({formatDisplayPair(futureTradePair?.quoteCurrency)})
                </Text>
                <Text family="medium" color={theme.secondarytext} size={Platform.OS === "ios" ? "semismall" : "small"} numoflines={1} style={[styles.colSize, { textAlign: "right" }]} textProps={{ adjustsFontSizeToFit: true, minimumFontScale: 0.7 }}>
                    Size ({futureTradePair?.baseCurrency})
                </Text>
            </Flexcomponent>

            {viewMode === "Default" ? (
                <>
                    {/* Fixed flex:1 height: this screen's Mainview scrolls (isscollable=true),
                        so a flex:1 list here would otherwise collapse to 0 height. The list
                        itself uses react-native-gesture-handler's ScrollView (not RN's plain
                        one), and future.tsx's Mainview opts into isnestedscrollable so its
                        outer scroll is gesture-handler-based too - that's what lets this inner
                        list scroll independently on iOS instead of the outer scroll eating the
                        gesture and freezing it, the same way Android's real nested scroll did. */}
                    <View style={{ flex: 1, paddingHorizontal: "3%" }}>{renderList(orderBook.buyOrder, "buy", false)}</View>

                    <View style={[styles.spread, { borderColor: theme.theme === "dark" ? "#1B2740" : "#E2E8F0" }]}>
                        <Text
                            family="semiBold"
                            color={futureTicker?._dir === "down" ? theme.bookSell : theme.bookBuy}
                            size="medium"
                            numoflines={1}
                        >
                            {futureTicker?.marketPrice || "0.00"} 
                        </Text>
                        <View style={{ marginLeft: 7, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0", backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF", borderRadius: 4, paddingHorizontal: 7, paddingVertical: 0, alignItems: "center", justifyContent: "center" }}>
                            <Text color={theme.primarytext} family="bold" size="small" style={{ textAlign: "center" }}>MP</Text>
                        </View>
                    </View>

                    {/* Sell half (bottom) - same bounded-height/scroll technique as above. */}
                    <View style={{ flex: 1 }}>{renderList(orderBook.sellOrder, "sell", false)}</View>
                </>
            ) : viewMode === "Buy Orders" ? (
                <View style={{ flex: 1,paddingHorizontal:"3%" }}>
                    {renderList(orderBook.buyOrder, "buy", true)}
                    </View>
            ) : (
                <View style={{ flex: 1,paddingHorizontal:"3%" }}>{renderList(orderBook.sellOrder, "sell", true)}</View>
            )}
        </View>
    );
};

// Rendered as <OrderBookStacked /> inside future.tsx, which re-renders on every
// futureTicker tick - memo keeps this from re-rendering in lockstep with the parent.
export default React.memo(OrderBookStacked);

const style = (theme: any) => StyleSheet.create({
    // Same fixed % widths on every column, on both the header and each row, so they
    // line up exactly regardless of content length - deliberately not flex:1, since
    // that depends on the parent stretching correctly and this app already uses fixed
    // % column widths for every other table in this screen (tradecomponent.tsx,
    // recenttrades.tsx). % widths scale with screen size on their own, so this holds
    // up on a narrow device (iPhone mini) the same as on a larger one.
    colPrice: {
        width: "50%",
        textAlign: "left",
    },
    colSize: {
        width: "50%",
        textAlign: "right",
    },
    tabButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    tabSwatch: {
        width: 8,
        height: 8,
        borderRadius: 2,
    },
    row: {
        width: "100%",
        marginBottom: "2%",
        borderRadius: 4,
        overflow: "hidden",
    },
    rowBar: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        borderRadius: 4,
    },
    rowContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: "1.5%",
    },
    spread: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: "2%",
        marginVertical: "1%",
        borderTopWidth: 1,
        borderBottomWidth: 1,
    },
    noData: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});
