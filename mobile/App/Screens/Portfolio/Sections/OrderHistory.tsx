import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FlatList, View } from "react-native";

import Head from "../Components/Head";
import Footer from "../Components/Footer";
import usePaginatedFetch from "../helpers";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { momentFormat } from "../../../Utilities/dateTime";
import useSocket from "../../../Actions/Socket/sockethook";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { orderTypeEnum, sideEnum } from "../../../Actions/type";
import Loadercomponent from "../../../Components/loadercomponent";
import { useLazyFutureOrderHistoryQuery } from "../../../Slices/future";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { capitalizeFirst, isEmpty, truncateString } from "../../../Utilities/helerfunction";
import { socketService } from "../../../Actions/Socket/socketManager";

interface OrderHistoryprops {
    tradeMode?: any;
    futureId?: any;
}

const OrderHistory: React.FC<OrderHistoryprops> = ({ tradeMode, futureId }) => {
    const { theme, convert, convertSec } = useCustomHooks();
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const [futureOrderHistory, { isFetching }] = useLazyFutureOrderHistoryQuery();

    const [orderList, setorderList] = useState<any>([]);
    const {
        data: filledOrders,
        count,
        nextPage,
        isLoadingMore,
        pagination,
        loadMore,
        refetch,
        setCount,
        setNextPage
    } = usePaginatedFetch({
        apiFunc: futureOrderHistory,
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
        "FuturesorderHistory": useCallback((data: any) => {
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


    const handleFuturesorderHistory = useCallback((result: any) => {
        ApplyFilters(tradeMode, futureId.current, result.data)
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FuturesorderHistory", handleFuturesorderHistory);
        return () => {
            socketService.off("FuturesorderHistory", handleFuturesorderHistory);
        }
    }, [socketService])

    return (
        <View style={{ paddingHorizontal: 20, flex: 1, marginBottom: 20 }}>
            {
                isFetching === true && !isLoadingMore ?
                    <Loadercomponent />
                    : <View style={{ flex: 1 }}>
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
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginTop: "2.5%", padding: 10, width: "100%", }}>
                                        <View style={{ width: "100%", }}>
                                            <Head pairname={item?.pairName} />
                                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: 13, marginTop: 10 }}>
                                                <View>
                                                    <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                        <View style={{ width: "30%" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey}>Qty</Text>
                                                            <Text family="medium" size="semimedium" color={Colors.brand}>{parseFloat(item?.quantity).toFixed(futureTradePair?.baseDecimal)} {item?.baseCurrency}</Text>
                                                        </View>
                                                        <View style={{ width: "40%", alignItems: "center" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Side</Text>
                                                            <Text family="medium" size="semimedium" align="flex-start" color={item?.buyorsell == "buy" ? Colors.green : Colors.red}>{sideEnum[item?.buyorsell]}</Text>
                                                        </View>
                                                        <View style={{ width: "30%", alignItems: "flex-end" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Status</Text>
                                                            <Text family="medium" size="semimedium" align="flex-start">{capitalizeFirst(item?.status)}</Text>
                                                        </View>
                                                    </Flexcomponent>
                                                    {isExpanded && (
                                                        <>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "30%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Executed</Text>
                                                                    <Text family="medium" size="semimedium" >{parseFloat(item?.filledQuantity).toFixed(futureTradePair?.baseDecimal)}</Text>
                                                                </View>
                                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Order Type</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{orderTypeEnum[item?.orderType]}</Text>
                                                                </View>
                                                                <View style={{ width: "30%", alignItems: "flex-end" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Price</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{parseFloat(item?.price).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "30%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Trigger Price</Text>
                                                                    <Text family="medium" size="semimedium">{parseFloat(item?.stopPrice).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                                                </View>
                                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Execution Price</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{item?.exePrice ? parseFloat(item?.exePrice).toFixed(futureTradePair?.quoteDecimal) : "-"}</Text>
                                                                </View>
                                                                <View style={{ width: "30%", alignItems: "flex-end" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Order ID</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{item?._id ? truncateString(item?._id) : "-"}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "30%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Trading Fee</Text>
                                                                    <Text family="medium" size="semimedium" >{convert(item?.fee ?? 0, futureTradePair?.feePrec)}</Text>
                                                                    <Text family="medium" size="semimedium" >{convertSec(item?.fee ?? 0, futureTradePair?.feePrec)}</Text>
                                                                </View>
                                                                <View style={{ width: "40%", alignItems: "center", justifyContent: "center" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Reduce-Only</Text>
                                                                    <View style={{ marginRight: "45%", marginTop: "3%" }}>
                                                                        {item?.reduce_only ? <VectorIcons family="Feather" name="check" iconcolor={Colors.green} /> : <VectorIcons family="Feather" name="x" iconcolor={Colors.red} />}
                                                                    </View>
                                                                </View>
                                                                <View style={{ width: "30%", alignItems: "flex-end" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Date/Time</Text>
                                                                    <Text family="medium" size="semimedium" align="flex-start">{momentFormat(item?.orderDate)}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                        </>
                                                    )
                                                    }
                                                </View>

                                            </Card>
                                            <Flexcomponent style={{ justifyContent: "flex-end", marginTop: 10, width: "100%", }} ispress={true} onPress={() => setExpandedIndex(isExpanded ? null : index)} hit={15} >
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
                                        <NoData title="No Order History" />
                                    </View>
                                ) : null
                            )}
                        />
                    </View>
            }
        </View>
    )

}

export default OrderHistory;