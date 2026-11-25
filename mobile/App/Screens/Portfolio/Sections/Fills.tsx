import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FlatList, View } from "react-native";

import Head from "../Components/Head";
import Footer from "../Components/Footer";
import usePaginatedFetch from "../helpers";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import TruncatedText from "../../../Components/TruncatedText";
import { sideEnum } from "../../../Actions/type";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { momentFormat } from "../../../Utilities/dateTime";
import useSocket from "../../../Actions/Socket/sockethook";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { useLazyFuturefilledHistoryQuery } from "../../../Slices/future";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { capitalizeFirst, isEmpty, shortenText } from "../../../Utilities/helerfunction";
import { socketService } from "../../../Actions/Socket/socketManager";

interface Fillsprops {
    tradeMode?: any;
    futureId?: any;
}

const Fills: React.FC<Fillsprops> = ({
    tradeMode,
    futureId,
}) => {
    const { theme } = useCustomHooks();
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const [futureFilledHistory, { isFetching }] = useLazyFuturefilledHistoryQuery();
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);;
    const [orderList, setorderList] = useState<any>([]);
    const {
        data: filledOrders,
        count,
        pagination,
        nextPage,
        isLoadingMore,
        loadMore,
        refetch,
        setCount,
        setNextPage
    } = usePaginatedFetch({
        apiFunc: futureFilledHistory,
        futureId,
        tradeMode,
    });

    useEffect(() => {
        setorderList(filledOrders)
    }, [filledOrders])

    // useEffect(() => {
    //     if (!isEmpty(futureTradePair) && futureId.current != futureTradePair._id && futureId.current !== 'all') {
    //         futureId.current = futureTradePair._id;
    //     }
    // }, [futureTradePair]);

    const events: any = {
        "FuturefilledHistory": useCallback((data: any) => {
        }, [])
    }

    // useSocket({ events });

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
                setorderList(filterData)
                if (count > filterData.length) {
                    setNextPage(true)
                } else {
                    setNextPage(false)
                }

            } else {
                setorderList([])
                setCount(0);
                setNextPage(false)
            }
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    const handleFuturefilledHistory = useCallback((result: any) => {
        ApplyFilters(tradeMode, futureId.current, result.data)
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FuturefilledHistory", handleFuturefilledHistory);
        return () => {
            socketService.off("FuturefilledHistory", handleFuturefilledHistory);
        }
    }, [socketService])

    return (
        <View style={{ paddingHorizontal: 20, flex: 1, marginBottom: 20 }}>
            {
                isFetching === true && !isLoadingMore ?
                    <Loadercomponent /> :
                    <View style={{ flex: 1 }}>
                        <FlatList
                            data={orderList}
                            keyExtractor={(item, index) => item?._id?.toString() ?? index.toString()}
                            showsVerticalScrollIndicator={false}
                            style={{ paddingBottom: 50 }}
                            onEndReached={() => {
                                if (orderList?.length > 0 && count !== orderList?.length && nextPage) {
                                    loadMore();
                                }
                            }}
                            onEndReachedThreshold={0.1}
                            ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                            renderItem={({ item, index }) => {
                                const isExpanded = expandedIndex === index;
                                let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                                return (
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginTop: "2.5%", padding: 10, width: "100%" }}>
                                        <View style={{ width: "100%", }}>
                                            <Head pairname={item?.pairName} />
                                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: 13, marginTop: 10 }}>
                                                <View>
                                                    <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                        <View style={{ width: "40%" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} >Fill Qty</Text>
                                                            <Text family="medium" size="semimedium" color={Colors.brand} >{parseFloat(item?.filledQuantity).toFixed(futureTradePair?.baseDecimal)} {item?.baseCurrency}</Text>
                                                        </View>
                                                        <View style={{ width: "40%", alignItems: "center" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Side</Text>
                                                            <Text family="medium" size="semimedium" color={item?.side == "buy" ? Colors.green : Colors.red} align="flex-start">{sideEnum[item?.side]}</Text>
                                                        </View>
                                                        <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Order Qty</Text>
                                                            <Text family="medium" size="semimedium" align="flex-start">{parseFloat(item?.orderQty).toFixed(futureTradePair?.baseDecimal)}</Text>
                                                        </View>
                                                    </Flexcomponent>
                                                    {isExpanded && (
                                                        <>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Exection Price</Text>
                                                                    <Text family="medium" size="semimedium" >{parseFloat(item?.price).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                                                </View>
                                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Notional</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{parseFloat(item?.notional).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                                                </View>
                                                                <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Order Type</Text>
                                                                    <TruncatedText
                                                                     text={capitalizeFirst(item.orderType)}
                                                                     head={4} tail={3} />
                                                                </View>
                                                            </Flexcomponent>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Order ID</Text>
                                                                    <Text family="medium" size="semimedium">{shortenText(item.orderId)}</Text>
                                                                </View>
                                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Fill ID</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{shortenText(item.filledId)}</Text>
                                                                </View>
                                                                <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Role</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{item?.isMaker ? 'Maker' : "Taker"}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Trading Fee</Text>
                                                                    <Text family="medium" size="semimedium" >{item.fee}</Text>
                                                                </View>
                                                                <View style={{ width: "45%", alignItems: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Date/Time</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{momentFormat(item.created_at)}</Text>
                                                                </View>
                                                                <View style={{ width: "15%", alignItems: "flex-end" }}>
                                                                </View>
                                                            </Flexcomponent>
                                                        </>
                                                    )
                                                    }
                                                </View>

                                            </Card>
                                            <Flexcomponent style={{ justifyContent: "flex-end", marginTop: 10, width: "100%", }} hit={15} ispress={true} onPress={() => setExpandedIndex(isExpanded ? null : index)}>
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
                                !isFetching ? (
                                    <View style={{ height: windowheight * 0.5, justifyContent: "center", alignItems: "center", }} >
                                        <NoData title="No Fills" />
                                    </View>
                                ) : null
                            )}
                        />
                    </View>
            }
        </View>
    )

}

export default Fills;