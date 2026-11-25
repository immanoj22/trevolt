import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { FlatList, View } from "react-native";

import Head from "../Components/Head";
import Footer from "../Components/Footer";
import usePaginatedFetch from "../helpers";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import ShareModal from "../Components/Share";
import NoData from "../../../Components/Nodata";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { momentFormat } from "../../../Utilities/dateTime";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { useLazyCloseHistoryQuery } from "../../../Slices/future";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { getPorfitCalculation } from "../../../Actions/Hooks/usePriceConversion";
import { socketService } from "../../../Actions/Socket/socketManager";
import { formatDisplayPair } from "../../../Utilities/formatPair";

interface CloseHistoryprops {
    tradeMode?: any;
    futureId?: any;
}

const directionEnum: any = {
    'long': 'Long',
    'short': 'Short',
}

const CloseHistory: React.FC<CloseHistoryprops> = ({ tradeMode, futureId }) => {
    const { theme, openbottomsheet, convert, convertSec } = useCustomHooks();
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [pnlCard, setPnlCard] = useState({})

    const shareRef = useRef(null);

    // const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    // const [nextPage, setNextPage] = useState<boolean>(true);
    // const [count, setCount] = useState<number>(0);
    const [orderHistory, setOrderHistory] = useState<any[]>([]);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const [closeHistory, { isLoading }] = useLazyCloseHistoryQuery();

    const {
        data: filledOrders,
        count,
        nextPage,
        isLoadingMore,
        loadMore,
        refetch,
        pagination,
        setCount,
        setNextPage
    } = usePaginatedFetch({
        apiFunc: closeHistory,
        futureId,
        tradeMode,
    });

    useEffect(() => {
        setOrderHistory(filledOrders)
    }, [filledOrders])

    const ApplyFilters = (tradeMode = 'all', pairId = 'all', data: any) => {
        try {
            if (!isEmpty(data) && data?.length > 0) {
                let filterData = [...data]
                if (!isEmpty(tradeMode) && tradeMode != 'all') {
                    filterData = filterData.filter((val) => {
                        return val.tradeMode == tradeMode
                    })
                }
                if (!isEmpty(pairId) && pairId != 'all') {
                    filterData = filterData.filter((val) => {
                        return val.pairId == pairId
                    })
                }
                let count = filterData.length
                const start_index = 0;
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(start_index, end_index);
                setOrderHistory(filterData)
                if (count > filterData.length) {
                    setNextPage(true)
                } else {
                    setNextPage(false)
                }

            } else {
                setOrderHistory([])
                setCount(0);
                setNextPage(false)
            }
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    const handleFutureCloseOrder = useCallback((result: any) => {
        ApplyFilters(tradeMode, futureId.current, result.data)
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FutureClosedPositionHistory", handleFutureCloseOrder);
        return () => {
            socketService.off("FutureClosedPositionHistory", handleFutureCloseOrder);
        }
    }, [socketService])

    // const fetchCloseHistory = useCallback(
    //     async (page: number, isFirstPage = false) => {
    //         if (isFetchingMore) return;

    //         setIsFetchingMore(true);

    //         try {
    //             const payload = {
    //                 page,
    //                 limit: pagination.limit,
    //             };

    //             const response = await closeHistory(payload).unwrap();

    //             if (response?.success) {
    //                 const data = response.result?.data || [];

    //                 setOrderHistory(prev =>
    //                     isFirstPage ? data : [...prev, ...data]
    //                 );

    //                 setCount(response.result?.count || 0);
    //                 setNextPage(Boolean(response.result?.nextPage));
    //             }
    //         } catch (err) {
    //             console.log("Close history error:", err);
    //         } finally {
    //             setIsFetchingMore(false);
    //         }
    //     },
    //     [pagination.limit, isFetchingMore]
    // );

    // useEffect(() => {
    //     setPagination({ page: 1, limit: 10 });
    //     setOrderHistory([]);
    //     setNextPage(true);
    //     fetchCloseHistory(1, true);
    // }, [futureId?.current, tradeMode]);

    // const loadMore = () => {
    //     if (!nextPage || isFetchingMore) return;

    //     const next = pagination.page + 1;
    //     setPagination(prev => ({ ...prev, page: next }));
    //     fetchCloseHistory(next);
    // };

    return (
        <View style={{ paddingHorizontal: 20, flex: 1, marginBottom: 20 }}>
            {
                isLoading === true && !isLoadingMore ?
                    <Loadercomponent /> :
                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={orderHistory}
                            keyExtractor={(item, index) => item?._id?.toString() ?? index.toString()}
                            showsVerticalScrollIndicator={false}
                            style={{ paddingBottom: 50 }}
                            onEndReached={() => {
                                if (orderHistory?.length > 0 && count !== orderHistory?.length && nextPage) {
                                    loadMore();
                                }
                            }}
                            onEndReachedThreshold={0.1}
                            ListFooterComponent={<Footer />}
                            renderItem={({ item, index }) => {
                                const isExpanded = expandedIndex === index;
                                let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                                return (
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginTop: "2.5%", padding: 10, width: "100%" }}>
                                        <View style={{ width: "100%", }}>
                                            <Head ref={shareRef} pairname={item?.pairName} share={true} onClick={() => {
                                                let { percentage } = getPorfitCalculation(item.entryPrice, item.closePrice, item.quantity, item.closing_direction)
                                                setPnlCard({
                                                    ...item,
                                                    pnl: item.grossPandL,
                                                    close_price: item.closePrice,
                                                    positionSide: item.closing_direction,
                                                    pnl_percen: percentage
                                                })
                                                openbottomsheet(shareRef)
                                            }} />
                                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: 13, marginTop: 10 }}>
                                                <View>
                                                    <Flexcomponent justifyContent="space-between" style={{ marginVertical: 1, marginBottom: 10 }}>
                                                        <View style={{ width: "40%" }}>
                                                             <Text family="regular" size="small" color={Colors.stormGrey}>Date/Time</Text>
                                                            <Text family="medium" size="small" style={{ width: "80%" }}>{momentFormat(item?.createdAt)}</Text>
                                                        </View>
                                                        <View style={{ width: "40%", alignItems: "center" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Direction</Text>
                                                            <Text family="medium" size="semimedium" color={item?.closing_direction === "long" ? Colors.green : Colors.red} align="flex-start" >{directionEnum[item?.closing_direction]}</Text>
                                                        </View>
                                                        <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Entry price</Text>
                                                            <Text family="medium" size="semimedium" align="flex-start">{isNaN(item?.entryPrice) ? 0 : formatValue(parseFloat(item?.entryPrice)?.toFixed(futureTradePair?.quoteDecimal))}
                                                            </Text>
                                                            <Text family="medium" size="semimedium" align="flex-start">{formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                                        </View>
                                                    </Flexcomponent>
                                                    {isExpanded && (
                                                        <>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 1 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Closing price</Text>
                                                                    <Text family="medium" size="semimedium" >{isNaN(item?.closePrice)
                                                                        ? 0
                                                                        : formatValue(parseFloat(item?.closePrice)?.toFixed(
                                                                            futureTradePair?.quoteDecimal
                                                                        ))}{" "}
                                                                        {formatDisplayPair(futureTradePair?.quoteCurrency)}</Text>
                                                                </View>
                                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Close quantity</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{isNaN(item?.quantity)
                                                                        ? 0
                                                                        : formatValue(parseFloat(item?.quantity)?.toFixed(
                                                                            futureTradePair?.baseDecimal
                                                                        ))}{" "}
                                                                        {futureTradePair?.baseCurrency}</Text>
                                                                </View>
                                                                <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Gross P/L</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start" color={item?.grossPandL > 0 ? Colors.green : Colors.red}>{convert(item?.grossPandL ?? 0, futureTradePair?.quoteDecimal)}
                                                                    </Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start" color={item?.grossPandL > 0 ? Colors.green : Colors.red}>{convertSec(item?.grossPandL ?? 0, futureTradePair?.quoteDecimal)}
                                                                    </Text>
                                                                </View>
                                                            </Flexcomponent>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 1 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Balance</Text>
                                                                    <Text family="medium" size="semimedium">{convert(item?.afterBalance ?? 0, futureTradePair?.quoteDecimal)}
                                                                    </Text>
                                                                    <Text family="medium" size="semimedium">{convertSec(item?.afterBalance ?? 0, futureTradePair?.quoteDecimal)}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                        </>
                                                    )}
                                                </View>
                                            </Card>
                                            <Flexcomponent style={{ justifyContent: "flex-end", marginTop: 10, width: "100%", }} ispress={true} onPress={() => setExpandedIndex(isExpanded ? null : index)} hit={15}>
                                                <View style={{ flexDirection: "row", width: "auto", alignItems: "center" }}>
                                                    <Text family="medium" size="semimedium">Details</Text>
                                                    <VectorIcons
                                                        family="Ionicons"
                                                        name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                                                        size={windowwidth * 0.045}
                                                        style={{ marginLeft: 10 }}
                                                    />
                                                </View>
                                            </Flexcomponent>
                                        </View>
                                    </Card>
                                )
                            }}
                            ListEmptyComponent={() => (
                                !isLoading ? (
                                    <View style={{ height: windowheight * 0.5, justifyContent: "center", alignItems: "center", }} >
                                        <NoData title="No Close History" />
                                    </View>
                                ) : null
                            )}
                        />
                    </View>
            }
            <ShareModal
                ref={shareRef}
                data={pnlCard}
            />
        </View>
    )
}

export default CloseHistory;