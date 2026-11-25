import React, { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSelector } from "react-redux";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useLazyFutureRecentTradeQuery } from "../../../Slices/future";
import { socketService } from "../../../Actions/Socket/socketManager";
import { windowheight } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import Text from "../../../Components/text";
import { formatDisplayPair } from "../../../Utilities/formatPair";

interface Tradecomponentprops {
    pairId?: any
    tickerRoot?: any
}

interface RecentTrade {
    Type: string;
    price: number;
    filledQuantity: number,
    createdAt: any
}

const Tradecomponent: React.FC<Tradecomponentprops> = ({ pairId, tickerRoot }) => {
    const { theme } = useCustomHooks()
    const styles = style(theme)
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const currentPairId = pairId ?? futureTicker?._id;
    const [recentTradeData, setRecentTrade] = useState<RecentTrade[]>([]);
    const [recentTrades, { isFetching }] = useLazyFutureRecentTradeQuery();
    // const buyOrders = recentTradeData?.filter(item => item.Type === "buy") || [];
    // const sellOrders = recentTradeData?.filter(item => item.Type === "sell") || [];
    // const events: any = {
    //     "FuturesrecentTrade": useCallback((data: any) => {
    //         data = JSON.parse(data)
    //         setRecentTrade(data)
    //     }, [])
    // }

    const buyOrders = (recentTradeData ?? []).filter((item: any) => item?.Type === "buy") ?? [];
    const sellOrders = (recentTradeData ?? []).filter((item: any) => item?.Type === "sell") ?? [];

    const handleFuturesrecentTrade = useCallback((data: any) => {
        data = JSON.parse(data)
        // When embedded for a specific contract (e.g. an option strike), the broadcast
        // is global across pairs — filter to the ticker we're actually displaying.
        if (tickerRoot && data?.tickerRoot && data.tickerRoot !== tickerRoot) return;
        setRecentTrade(data?.data ?? data)
    }, [tickerRoot])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FuturesrecentTrade", handleFuturesrecentTrade);
        return () => {
            socketService.off("FuturesrecentTrade", handleFuturesrecentTrade)
        }
    }, [socketService])

    // useSocket({ events });

    const triggerRecentTrade = async () => {
        if (!currentPairId) return;
        const res = await recentTrades(currentPairId);
        if (res.data?.success) {
            setRecentTrade(res.data?.result)
        }
        else {
            setRecentTrade([])
        }
    }

    useFocusEffect(
        useCallback(() => {
            triggerRecentTrade()
        }, [currentPairId])
    );

    return (
        // Bounded total height (same overall budget the old fixed 0.3+0.4 used), split
        // evenly via flex: 1 on each half instead of the old lopsided 0.3/0.4 - flex: 1
        // needs a parent with a definite height to divide, so leaving this unbounded
        // let each half's ScrollView grow to fit ALL of its content instead of
        // scrolling, pushing the whole panel past the buy/sell buttons next to it when
        // one side had a lot of trades. With a fixed total, a short side just shows
        // its few rows (no more 70%-of-screen dead gap) and a long side scrolls
        // contained within its own half instead of expanding past it.
        <View style={{ height: windowheight * 0.7 }}>
            <View style={{ flex: 1 }}>
                <Flexcomponent height={windowheight * 0.05}>
                    <View style={[styles.tableconatiner, { alignItems: "flex-start" }]}>
                        <Text family="medium" color={theme.secondarytext} size="small">
                            Quantity
                        </Text>
                    </View>

                    <View style={styles.tableconatiner}>
                        <Text family="medium" color={theme.secondarytext} size="small">
                            Price({formatDisplayPair(futureTicker?.quoteCurrency ?? "USDT")})
                        </Text>
                    </View>
                </Flexcomponent>

                {/* react-native-gesture-handler's ScrollView (not RN's plain one) - see
                    orderbookstacked.tsx's matching comment. NOTE: this screen's outer
                    Mainview (OptionTrade.tsx) uses iskeyboardaware's default
                    (KeyboardAwareScrollView from react-native-keyboard-controller) rather
                    than the plain-ScrollView path Mainview's isnestedscrollable swaps out -
                    that combination hasn't been wired/verified for iOS nested scroll. This
                    whole screen is currently unreachable behind OPTIONS_COMING_SOON in
                    Option/index.tsx; re-check nested scroll here before that flag flips. */}
                <ScrollView style={{ flex: 1, marginHorizontal: "5%" }} showsVerticalScrollIndicator={false}>
                     {buyOrders.map((item: any, index: number) => (
                        <Flexcomponent
                            key={`buy-${index}`}
                            style={
                                index === 0
                                    ? {
                                        backgroundColor:
                                            theme.theme === "dark"
                                                ? "#122d29e1"
                                                : "#122d296c",
                                    }
                                    : undefined
                            }
                        >
                            <View style={styles.tableconatiner}>
                                <Text family="medium" color={theme.textinput} size="small">
                                    {isNaN(item?.filledQuantity) ? 0 : item.filledQuantity}
                                </Text>
                            </View>

                            <View style={styles.tableconatiner}>
                                <Text family="medium" color={theme.bookBuy} size="small">
                                    {isNaN(item?.price) ? 0 : item.price}
                                </Text>
                            </View>
                        </Flexcomponent>
                    ))}
                </ScrollView>
            </View>


            <View style={{ flex: 1 }}>
                <Flexcomponent height={windowheight * 0.05}>
                    <View style={[styles.tableconatiner, { alignItems: "flex-start" }]}>
                        <Text family="medium" color={theme.secondarytext} size="small">
                            Quantity
                        </Text>
                    </View>

                    <View style={styles.tableconatiner}>
                        <Text family="medium" color={theme.secondarytext} size="small">
                            Price({formatDisplayPair(futureTicker?.quoteCurrency ?? "USDT")})
                        </Text>
                    </View>
                </Flexcomponent>

                <ScrollView style={{ flex: 1, marginHorizontal: "5%" }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true} scrollEnabled={Platform.OS !== "ios"}>
                    {sellOrders.map((item: any, index: number) => (
                        <Flexcomponent
                            key={`sell-${index}`}
                            style={
                                index === 0
                                    ? {
                                        backgroundColor:
                                            theme.theme === "dark"
                                                ? "#3e1b299c"
                                                : "#3e1b2981",
                                    }
                                    : undefined
                            }
                        >
                            <View style={styles.tableconatiner}>
                                <Text family="medium" color={theme.textinput} size="small">
                                    {isNaN(item?.filledQuantity) ? 0 : item.filledQuantity}
                                </Text>
                            </View>

                            <View style={styles.tableconatiner}>
                                <Text family="medium" color={theme.bookSell} size="small">
                                    {isNaN(item?.price) ? 0 : item.price}
                                </Text>
                            </View>
                        </Flexcomponent>
                    ))}
                </ScrollView>
            </View>
        </View>
    )

}

export default Tradecomponent


const style = (theme: any) => StyleSheet.create({
    tableconatiner: {
        width: "43.3%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: "2.5%"
    },
})