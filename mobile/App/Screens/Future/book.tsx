import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, View } from "react-native";
import { useSelector } from "react-redux";
import { LinearGradient } from "../../Components/lineargradient";

import Text from "../../Components/text";
import NoData from "../../Components/Nodata";
import { Button } from "../../Components/Field";
import useSocket from "../../Actions/Socket/sockethook";
import ThemeContext from "../../Utilities/themecontext";
import { windowheight } from "../../Utilities/dimensions";
import { Colors, Fontsize } from "../../Utilities/uiasset";
import Flexcomponent from "../../Components/flexcomponent";
import { formatValue } from "../../Utilities/helerfunction";
import { useLazyFutureOrderBookQuery, useLazyFutureSingleOrderBookQuery } from "../../Slices/future";

import { style } from "./style";
import { socketService } from "../../Actions/Socket/socketManager";
import { formatDisplayPair } from "../../Utilities/formatPair";

interface Bookprops {
    currentIndex?: any
    themes?: any,
    type?: any
    space?: any
    header?: any
    tickerRoot?: any
    selectedOrder?: any
}

interface OrderItem {
    _id: string;
    total: number;
    totalAmount: number,
    index: any;
    quantity: any;
}

const Bookcomponent: React.FC<Bookprops> = React.memo(({
    currentIndex,
    themes,
    space,
    header = true,
    tickerRoot,
    selectedOrder
}) => {
    const theme = themes ?? useContext(ThemeContext)
    const styles = style(theme);
    const futureTicker = useSelector((state: any) => state.future.futureTicker);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const [orderBook, setOrderBook] = useState<{ sellOrder: OrderItem[]; buyOrder: OrderItem[]; }>({ sellOrder: [], buyOrder: [] });
    const tickerRootRef = useRef(tickerRoot ?? futureTradePair?.tickerRoot);

    useEffect(() => {
        tickerRootRef.current = tickerRoot ?? futureTradePair?.tickerRoot;
    }, [tickerRoot, futureTradePair?.tickerRoot]);

    const [activeindex, setActiveidnex] = useState("");
    const [activeSellOrder, setactiveSellOrder] = useState("");

    const [buyPage, setBuyPage] = useState(1);
    const [sellPage, setSellPage] = useState(1);

    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [buyCount, setBuyCount] = useState(0);
    const [sellCount, setSellCount] = useState(0);

    const [futureorderBook] = useLazyFutureOrderBookQuery();
    const [futureSingleOrderBook] = useLazyFutureSingleOrderBookQuery();

    const handleOrderBook = useCallback((data: any) => {
        data = JSON.parse(data)
        // This is a global broadcast, not scoped to a single pair/contract — without
        // filtering, any other pair's order-book update (future or option) would
        // overwrite what's currently displayed here. Web's OrderBook.jsx already does
        // this same tickerRoot check; this component was missing it.
        if (tickerRootRef.current && data?.tickerRoot && data.tickerRoot !== tickerRootRef.current) return;
        let buyOrderTotal: number = 0;
        let sellOrderTotal: number = 0;

        let buyOrder = data?.["buyOrder"]?.map((val: any) => {
            buyOrderTotal += parseFloat(val.total) || 0;
            return { ...val, totalAmount: buyOrderTotal };
        });

        let sellOrder = data?.["sellOrder"]?.map((val: any) => {
            sellOrderTotal += parseFloat(val.total) || 0;
            return { ...val, totalAmount: sellOrderTotal };
        });
        console.log("[orderbook][SOCKET]", "tickerRoot:", data?.tickerRoot, "has buyOrder field:", "buyOrder" in data, "buyOrder.length:", buyOrder?.length, "sellOrder.length:", sellOrder?.length);
        setOrderBook({ sellOrder, buyOrder });
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FuturesorderBook", handleOrderBook);
        return () => {
            socketService.off("FuturesorderBook", handleOrderBook)
        }
    }, [socketService])

    const triggerfurorderBook = async (loadMore = false) => {
        if (loadMore && isLoadingMore) return;

        setIsLoadingMore(true);

        const payload = {
            id: currentIndex,
            limit: 15,
        }

        const res = await futureorderBook(payload);
        console.log("[orderbook][REST]", "id:", currentIndex, "buyOrder.length:", res?.data?.result?.buyOrder?.length, "sellOrder.length:", res?.data?.result?.sellOrder?.length);
        setIsLoadingMore(false);

        if (res.data?.success) {
            let buyOrderTotal: number = 0;
            let sellOrderTotal: number = 0;

            let buyOrder = res.data.result.buyOrder.map((val: any) => {
                buyOrderTotal += parseFloat(val.total) || 0;
                return { ...val, totalAmount: buyOrderTotal };
            });

            let sellOrder = res.data.result.sellOrder.map((val: any) => {
                sellOrderTotal += parseFloat(val.total) || 0;
                return { ...val, totalAmount: sellOrderTotal };
            });

            setSellCount(res?.data?.result?.sellOrderCount);
            setBuyCount(res?.data?.result?.buyOrderCount);

            // if (res.data.buyOrderCount > buyOrder.length) setHasMoreBuy(true);
            // if (res.data.sellOrderCount > sellOrder?.length) setHasMoreSell(true);
            setOrderBook({ buyOrder, sellOrder });
        }
        else {
            setOrderBook({ buyOrder: [], sellOrder: [] });
        }
    }

    const fetchSingleOrderBook = async ({ type, page }: any) => {
        try {
            if (isLoadingMore) return;
            setIsLoadingMore(true);
            const payload = {
                id: currentIndex,
                limit: 15,
                type,
                page
            }
            const res = await futureSingleOrderBook(payload);
            setIsLoadingMore(false);
            if (res.data?.success) {
                let OrderTotal: number = 0;
                let Order = res.data.result.order.map((val: any) => {
                    OrderTotal += parseFloat(val.total) || 0;
                    return { ...val, totalAmount: OrderTotal };
                });
                setOrderBook((prev: any) => {
                    return {
                        ...prev,
                        [`${type}Order`]: [...prev[`${type}Order`], ...Order]
                    }
                });
            }
        } catch (err) {
            console.log(err, "fetchSingleOrderBook___err")
        }
    }

    const loadMoreBuy = () => {
        if (buyCount <= orderBook?.buyOrder?.length || isLoadingMore) return;
        const nextBuyPage = buyPage + 1;
        fetchSingleOrderBook({ type: 'buy', page: nextBuyPage });
        setBuyPage(nextBuyPage);
    };

    const loadMoreSell = () => {
        if (sellCount <= orderBook?.sellOrder?.length || isLoadingMore) return;
        const nextSellPage = sellPage + 1;
        fetchSingleOrderBook({ type: 'sell', page: nextSellPage });
        setSellPage(nextSellPage);
    };

    useFocusEffect(
        useCallback(() => {
            setBuyPage(1);
            setSellPage(1);
            setBuyCount(0);
            setSellCount(0);
            triggerfurorderBook();
        }, [currentIndex])
    );

    console.log(buyCount > orderBook?.buyOrder?.length && !isLoadingMore, orderBook?.buyOrder?.length, buyCount, "Load__more")

    return (
        <View style={{ flex: 1, paddingHorizontal: space ? space : "3%" }} >
            {
                header === true && (
                    <View style={styles.table}>
                        <View style={styles.tableContent}>
                            <View style={{ alignItems: "flex-start" }} >
                                <Text family="medium" color={theme.secondarytext}>Price ({formatDisplayPair(futureTradePair.quoteCurrency)})</Text>
                         </View>
                            <View>
                                <Text family="medium" color={theme.secondarytext}>Size ({futureTradePair.baseCurrency})</Text>
                            </View>
                        </View>
                        <View style={{ width: "4%" }} />
                        <View style={styles.tableContent}>
                            <View>
                                <Text family="medium" color={theme.secondarytext}>Price ({formatDisplayPair(futureTradePair.quoteCurrency)})</Text>
                            </View>
                            <View style={[, { alignItems: "flex-end" }]} >
                                <Text family="medium" color={theme.secondarytext}>Size ({futureTradePair.baseCurrency})</Text>
                            </View> 

                        </View>
                    </View>
                )
            }

            {selectedOrder == "Default" &&
                <View style={styles.container}>
                    {
                        orderBook?.buyOrder?.length > 0 ?
                            (
                                <FlatList
                                    data={orderBook?.buyOrder}
                                    showsVerticalScrollIndicator={false}
                                    keyExtractor={(item, index) => `${item._id}-${index}`}
                                    style={{ width: "48%" }}
                                    renderItem={({ item, index }) => {
                                        var lastindex = orderBook?.buyOrder.length;
                                        var toam = orderBook?.buyOrder[lastindex - 1].totalAmount;
                                        var precentage = (item.totalAmount / toam) * 100;
                                        const green = theme.theme === "dark" ? theme.futuregreen : "#afebe2ff";
                                        const modeColors = theme.theme === 'dark' ? ['#18191e08', '#0e1e3c'] : ['#D5FFF9', '#D5FFF9'];
                                        return (

                                            <Flexcomponent ispress={true} onPress={() => setactiveSellOrder(item._id)} justifyContent="space-between" style={styles.content} key={index}>
                                                <LinearGradient colors={(item._id === activeSellOrder ? [green, green] : modeColors) as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                    style={[styles.line, item._id === activeSellOrder ? { width: 250 } : { width: `${precentage}%` }]}
                                                />
                                                <View style={styles.item}  >
                                                    <Text family="medium" color={theme.textinput} size={"semimedium"}>{item?._id}</Text>
                                                </View>

                                                <View style={styles.quan} >
                                                    <Text family="medium" color={"#00D0B2"} size={"semimedium"}>{isNaN(item?.quantity) ? 0 : formatValue(item?.quantity, futureTradePair?.baseDecimal)}</Text>
                                                </View>
                                            </Flexcomponent>
                                        )
                                    }}
                                    ListFooterComponent={buyCount > orderBook?.buyOrder?.length && !isLoadingMore ?
                                        <View style={{ alignItems: "center" }}>
                                            <Button
                                                buttonStyle={{ width: "60%", height: windowheight * 0.035, marginVertical: 6 }}
                                                title="Load More"
                                                onPress={loadMoreBuy}
                                                textStyle={{ fontSize: Fontsize.xsmall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            />
                                        </View> : null}
                                />
                            ) : (
                                <View style={styles.noData}>
                                    <NoData />
                                </View>
                            )
                    }
                    <View style={{ width: "4%" }} />
                    {
                        orderBook?.sellOrder?.length > 0 ?
                            (
                                <FlatList
                                    data={orderBook?.sellOrder}
                                    showsVerticalScrollIndicator={false}
                                    keyExtractor={(item, index) => `${item._id}-${index}`}
                                    style={{ width: "48%" }}
                                    renderItem={({ item, index }) => {
                                        var lastindex = orderBook?.sellOrder.length;
                                        var toam = orderBook?.sellOrder[lastindex - 1].totalAmount;
                                        var precentage = (item.totalAmount / toam) * 200;
                                        const red = theme.theme === "dark" ? "#3E1B29" : "#f0b0c9ff";
                                        const modeColors = theme.theme === 'dark' ? ['#18191e08', '#3E1B29'] : ["#FFD3E5", "#FFD3E5"];
                                        return (
                                            <Flexcomponent ispress={true} onPress={() => setActiveidnex(item._id)} justifyContent="space-between" key={index} style={styles.content}>
                                                <LinearGradient colors={(item._id === activeindex ? [red, red] : modeColors) as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                    style={[styles.line, item._id === activeindex ? { width: 300 } : { width: `${precentage}%` }]} />
                                                <View style={styles.item} >
                                                    <Text family="medium" color={theme.textinput} size={"semimedium"} >{item?._id}</Text>
                                                </View>
                                                <View style={styles.quantity} >
                                                    <Text family="medium" color={"#FF0066"} size={"semimedium"} >{isNaN(item?.quantity) ? 0 : formatValue(item?.quantity ?? 0, futureTicker?.baseDecimal)}</Text>
                                                </View>
                                            </Flexcomponent>
                                        )
                                    }}
                                    ListFooterComponent={sellCount > orderBook?.sellOrder?.length && !isLoadingMore ?
                                        <View style={{ alignItems: "center" }}>
                                            <Button
                                                buttonStyle={{ width: "60%", height: windowheight * 0.035, marginVertical: 6, backgroundColor: Colors.red }}
                                                title="Load More"
                                                onPress={loadMoreSell}
                                                textStyle={{ fontSize: Fontsize.xsmall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            />
                                        </View>
                                        : null}
                                />
                            )
                            : (
                                <View style={styles.noData}>
                                    <NoData />
                                </View>
                            )
                    }
                </View>
            }

            {selectedOrder == "Buy Orders" &&
                <View style={styles.container}>
                    {
                        orderBook?.buyOrder?.length > 0 ?
                            (
                                <FlatList
                                    data={orderBook?.buyOrder}
                                    showsVerticalScrollIndicator={false}
                                    keyExtractor={(item, index) => `${item._id}-${index}`}
                                    style={{ width: "48%" }}
                                    renderItem={({ item, index }) => {
                                        var lastindex = orderBook?.buyOrder.length;
                                        var toam = orderBook?.buyOrder[lastindex - 1].totalAmount;
                                        var precentage = (item.totalAmount / toam) * 100;
                                        const green = theme.theme === "dark" ? theme.futuregreen : "#afebe2ff";
                                        const modeColors = theme.theme === 'dark' ? ['#18191e08', '#0e1e3c'] : ['#D5FFF9', '#D5FFF9'];
                                        return (

                                            <Flexcomponent ispress={true} onPress={() => setactiveSellOrder(item._id)} justifyContent="space-between" style={styles.content} key={index}>
                                                <LinearGradient colors={(item._id === activeSellOrder ? [green, green] : modeColors) as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                    style={[styles.line, item._id === activeSellOrder ? { width: 250 } : { width: `${precentage}%` }]}
                                                />
                                                <View style={styles.item}  >
                                                    <Text family="medium" color={theme.textinput} size={"semimedium"}>{item?._id}</Text>
                                                </View>

                                                <View style={styles.quan} >
                                                    <Text family="medium" color={"#00D0B2"} size={"semimedium"}>{isNaN(item?.quantity) ? 0 : formatValue(item?.quantity, futureTradePair?.baseDecimal)}</Text>
                                                </View>
                                            </Flexcomponent>
                                        )
                                    }}
                                    ListFooterComponent={buyCount > orderBook?.buyOrder?.length && !isLoadingMore ?
                                        <View style={{ alignItems: "center" }}>
                                            <Button
                                                buttonStyle={{ width: "60%", height: windowheight * 0.035, marginVertical: 6 }}
                                                title="Load More"
                                                onPress={loadMoreBuy}
                                                textStyle={{ fontSize: Fontsize.xsmall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            />
                                        </View> : null}
                                />
                            ) : (
                                <View style={styles.noData}>
                                    <NoData />
                                </View>
                            )
                    }
                </View>
            }

            {selectedOrder == "Sell Orders" &&
                <View style={styles.container}>
                    {
                        orderBook?.sellOrder?.length > 0 ?
                            (
                                <FlatList
                                    data={orderBook?.sellOrder}
                                    showsVerticalScrollIndicator={false}
                                    keyExtractor={(item, index) => `${item._id}-${index}`}
                                    style={{ width: "48%" }}
                                    renderItem={({ item, index }) => {
                                        var lastindex = orderBook?.sellOrder.length;
                                        var toam = orderBook?.sellOrder[lastindex - 1].totalAmount;
                                        var precentage = (item.totalAmount / toam) * 200;
                                        const red = theme.theme === "dark" ? "#3E1B29" : "#f0b0c9ff";
                                        const modeColors = theme.theme === 'dark' ? ['#18191e08', '#3E1B29'] : ["#FFD3E5", "#FFD3E5"];
                                        return (
                                            <Flexcomponent ispress={true} onPress={() => setActiveidnex(item._id)} justifyContent="space-between" key={index} style={styles.content}>
                                                <LinearGradient colors={(item._id === activeindex ? [red, red] : modeColors) as string[]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                                    style={[styles.line, item._id === activeindex ? { width: 300 } : { width: `${precentage}%` }]} />
                                                <View style={styles.item} >
                                                    <Text family="medium" color={theme.textinput} size={"semimedium"} >{item?._id}</Text>
                                                </View>
                                                <View style={styles.quantity} >
                                                    <Text family="medium" color={"#FF0066"} size={"semimedium"} >{isNaN(item?.quantity) ? 0 : formatValue(item?.quantity ?? 0, futureTicker?.baseDecimal)}</Text>
                                                </View>
                                            </Flexcomponent>
                                        )
                                    }}
                                    ListFooterComponent={sellCount > orderBook?.sellOrder?.length && !isLoadingMore ?
                                        <View style={{ alignItems: "center" }}>
                                            <Button
                                                buttonStyle={{ width: "60%", height: windowheight * 0.035, marginVertical: 6, backgroundColor: Colors.red }}
                                                title="Load More"
                                                onPress={loadMoreSell}
                                                textStyle={{ fontSize: Fontsize.xsmall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            />
                                        </View>
                                        : null}
                                />
                            )
                            : (
                                <View style={styles.noData}>
                                    <NoData />
                                </View>
                            )
                    }
                </View>
            }

        </View>
    )
})

export default Bookcomponent;