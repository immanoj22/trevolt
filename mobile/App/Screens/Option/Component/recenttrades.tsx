import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useLazyFutureRecentTradeQuery } from "../../../Slices/future";
import { socketService } from "../../../Actions/Socket/socketManager";
import Flexcomponent from "../../../Components/flexcomponent";
import { windowheight } from "../../../Utilities/dimensions";
import Text from "../../../Components/text";
import Loadercomponent from "../../../Components/loadercomponent";
import NoData from "../../../Components/Nodata";
import { formatToTimeOnly } from "../../../Utilities/helerfunction";
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

const RecentTrades: React.FC<Tradecomponentprops> = ({ pairId, tickerRoot }) => {
    const { theme } = useCustomHooks()
    const styles = style(theme)
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const currentPairId = pairId ?? futureTicker?._id;
    const [recentTradeData, setRecentTrade] = useState<RecentTrade[]>([]);
    const [recentTrades, { isFetching }] = useLazyFutureRecentTradeQuery();

    // const events: any = {
    //     "FuturesrecentTrade": useCallback((data: any) => {
    //         data = JSON.parse(data)
    //         setRecentTrade(data)
    //     }, [])
    // }

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

    useEffect(() => {
        triggerRecentTrade()
    }, [currentPairId])

    return (
        <View style={{ flex: 1, paddingHorizontal: "3%" }} >
            <Flexcomponent height={windowheight * 0.05}>
                <View style={[styles.tableconatiner, { alignItems: "flex-start" }]} >
                    <Text family="medium" color={theme.secondarytext} size={"semimedium"}  >Price ({formatDisplayPair("USDT")})</Text>
                </View>
                <View style={styles.tableconatiner} >
                    <Text family="medium" color={theme.secondarytext} size={"semimedium"}  >Quantity</Text>
                </View>
                <View style={[styles.tableconatiner, { alignItems: "flex-end" }]} >
                    <Text family="medium" color={theme.secondarytext} size={"semimedium"}  >Time</Text>
                </View>
            </Flexcomponent>
            {
                isFetching === true ? (
                    <Loadercomponent />
                ) : (
                    <View style={{ flex: 1 }} >
                        {
                            recentTradeData?.length > 0 ? (
                                <View style={{ height: windowheight * 0.2 }}>
                                    {recentTradeData.map((item, index) => (
                                        <Flexcomponent key={index}>
                                            <View style={[styles.tableconatiner, { alignItems: "flex-start" }]} >
                                                <Text family="medium" color={item.Type == "buy" ? theme.bookBuy : theme.bookSell} size={"semimedium"}  >{isNaN(item?.price) ? 0 : item.price}</Text>
                                            </View>
                                            <View style={[styles.tableconatiner,]} >
                                                <Text family="medium" color={theme.textinput} size={"semimedium"} >{isNaN(item?.filledQuantity) ? 0 : item.filledQuantity}</Text>
                                            </View>
                                            <View style={[styles.tableconatiner, { alignItems: "flex-end", }]} >
                                                <Text family="medium" color={theme.textinput} size={"semimedium"}>{formatToTimeOnly(item.createdAt)}</Text>
                                            </View>
                                         </Flexcomponent>
                                    ))}
                                </View>
                            ) : (
                                <View style={{ alignItems: "center", flex: 1, justifyContent: "center" }}>
                                    <NoData />
                                </View>
                            )
                        }
                    </View>
                )
            }
        </View>
    )

}

export default RecentTrades


const style = (theme: any) => StyleSheet.create({
    tableconatiner: {
        width: "33.3%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: "2.5%"
    },
})