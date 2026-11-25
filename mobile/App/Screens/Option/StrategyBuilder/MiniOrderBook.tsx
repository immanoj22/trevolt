import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, View } from "react-native";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import { useLazyFutureOrderBookQuery } from "../../../Slices/future";
import { socketService } from "../../../Actions/Socket/socketManager";

type Props = {
    theme: any;
    pairId?: any;
    tickerRoot?: any;
};

const VISIBLE_ROWS = 5;
const ROW_HEIGHT = 26;

// Mirrors the app's real two-column Order Book layout (bids left/green, asks
// right/red) - the same one already used on the main Option screen's Order Book tab -
// but capped to a top-5-visible, scroll-for-more box so it fits inside this sheet
// instead of stretching/breaking like the full-tab Future/book.tsx component did here.
const MiniOrderBook: React.FC<Props> = ({ theme, pairId, tickerRoot }) => {
    const [fetchBook] = useLazyFutureOrderBookQuery();
    const [rows, setRows] = useState<{ buy: any[]; sell: any[] }>({ buy: [], sell: [] });

    useFocusEffect(
        useCallback(() => {
            if (!pairId) return;
            let cancelled = false;
            (async () => {
                const res: any = await fetchBook({ id: pairId, limit: 15 });
                if (cancelled || !res?.data?.success) return;
                setRows({
                    buy: res.data.result.buyOrder ?? [],
                    sell: res.data.result.sellOrder ?? [],
                });
            })();
            return () => { cancelled = true; };
        }, [pairId])
    );

    useEffect(() => {
        if (!socketService || !tickerRoot) return;
        const handle = (data: any) => {
            const parsed = JSON.parse(data);
            if (parsed?.tickerRoot !== tickerRoot) return;
            setRows({
                buy: parsed.buyOrder ?? [],
                sell: parsed.sellOrder ?? [],
            });
        };
        socketService.on("FuturesorderBook", handle);
        return () => socketService.off("FuturesorderBook", handle);
    }, [tickerRoot]);

    const column = (items: any[], side: "buy" | "sell") => (
        <ScrollView
            style={{ maxHeight: ROW_HEIGHT * VISIBLE_ROWS, flex: 1 }}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
        >
            {items.length === 0 ? (
                <Text size="small" color={theme.secondarytext} style={{ paddingVertical: 8 }}>-</Text>
            ) : items.map((item, i) => (
                <View
                    key={`${side}${i}`}
                    style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        height: ROW_HEIGHT,
                        paddingHorizontal: 6,
                        marginBottom: 2,
                        borderRadius: 3,
                        backgroundColor: side === "buy" ? "rgba(39,150,70,0.18)" : "rgba(242,78,83,0.18)",
                    }}
                >
                    <Text size="small" family="medium" color={side === "buy" ? Colors.green : Colors.red}>{item?._id}</Text>
                    <Text size="small" color={theme.primarytext}>{item?.quantity}</Text>
                </View>
            ))}
        </ScrollView>
    );

    if (!pairId) {
        return (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
                <Text size="small" color={theme.secondarytext}>Loading order book...</Text>
            </View>
        );
    }

    return (
        <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text size="small" color={theme.secondarytext}>Bid</Text>
                    <Text size="small" color={theme.secondarytext}>Qty</Text>
                </View>
                {column(rows.buy, "buy")}
            </View>
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text size="small" color={theme.secondarytext}>Ask</Text>
                    <Text size="small" color={theme.secondarytext}>Qty</Text>
                </View>
                {column(rows.sell, "sell")}
            </View>
        </View>
    );
};

export default MiniOrderBook;
