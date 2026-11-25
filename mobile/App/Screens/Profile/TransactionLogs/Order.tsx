import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux"

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import { helperSelector } from "../../../Slices/helper";
import { Colors, limit } from "../../../Utilities/uiasset";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowheight } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useLazyOrderHistoryQuery } from "../../../Slices/future";
import Loadercomponent from "../../../Components/loadercomponent";
import { capitalizeFirst } from "../../../Utilities/helerfunction";
import { formatDisplayPair } from "../../../Utilities/formatPair";

interface Recenttransactionprops {
    startdate?: any,
    enddate?: any,
}

const Orders: React.FC<Recenttransactionprops> = ({ }) => {
    const { theme } = useCustomHooks();
    const futurePairData = useSelector((state: any) => state.future.futurePairData);

    const [futureOrderHistory, { error, isLoading }] = useLazyOrderHistoryQuery()

    useApiError(error)
    const [page, setPage] = useState(1)

    const { transactionlogdata } = useSelector(helperSelector)
    const [transaction, setTransactions] = useState<any[]>([])
    const [maxreached, setMaxreached] = useState(false);

    useEffect(() => {
        if (transactionlogdata) {
            setMaxreached(false)
            setPage(1)
            fetchhistory(1)
        }
    }, [transactionlogdata])

    useFocusEffect(
        useCallback(() => {
            fetchhistory(page)
        }, [page])
    );

    // Accepts the page explicitly instead of reading the `page` state via closure -
    // when the filter changes mid-scroll (page > 1), the stale closured `page` from
    // before the reset would still be whatever the user had scrolled to, so the reset
    // fetch would APPEND its (now unfiltered) results onto the old filtered list
    // instead of replacing it, and the tester would see leftover/incorrect entries
    // instead of a clean reset.
    const fetchhistory = async (pageParam: number = page) => {
        try {
            let reqData = {
                pairId: "all",
                page: pageParam,
                tradeMode: "all",
                limit: limit.recent_tranaction,
                startDate: (transactionlogdata?.startdate) ?? "",
                endDate: (transactionlogdata?.enddate) ?? "",
            };
            const res = await futureOrderHistory(reqData).unwrap();
            const result: any[] = res?.result?.data
            if (pageParam == 1) {
                setTransactions(result ?? [])
            }
            else {
                setTransactions((prevstate) => [...prevstate, ...(result ?? [])])
            }
            if ((result?.length < Number(limit.recent_tranaction))) {
                setMaxreached(true)
            }
        } catch (error) {
            console.log('fetchhistory__err', error);
        }
    }

    const handleNextPage = () => {
        if (!maxreached && !isLoading) {
            setPage(prev => prev + 1)
        }
    }

    return (
        <View style={{ flex: 1 }} >
            {(isLoading && (page == 1)) ?
                <Loadercomponent containerstyle={{ flex: 1 }} /> :
                <FlatList
                    data={transaction}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ flex: 1, marginTop: 20 }}
                    contentContainerStyle={{ paddingBottom: transaction.length ? windowheight * 0.18 : 0, flexGrow: 1 }}
                    scrollEnabled={transaction.length > 0}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => handleNextPage()}
                    onEndReachedThreshold={0.5}
                     renderItem={({ item }) => {
                        let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                        return (
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: 15, marginBottom: 10 }}>
                                <Flexcomponent justifyContent="space-between" alignItems="flex-start" >
                                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                                        <Text family="regular" size="small" color={theme.graytext} >Symbol</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{formatDisplayPair(item?.pairName)}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: "center" }}>
                                        <Text family="regular" size="small" color={theme.graytext} >Qty</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{item?.quantity}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                                        <Text family="regular" size="small" color={theme.graytext} >Price</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{parseFloat(item?.price).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                    </View>

                                </Flexcomponent>

                                <Flexcomponent justifyContent="space-between" alignItems="flex-start" style={{ marginTop: 10 }} >

                                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                                        <Text family="regular" size="small" color={theme.graytext} >Side</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} color={item?.buyorsell == "buy" ? Colors.green : Colors.red}>{capitalizeFirst(item?.buyorsell)}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: "center" }}>
                                        <Text family="regular" size="small" color={theme.graytext} >Order Type</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{capitalizeFirst(item?.orderType)}</Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: "flex-end" }}>
                                        <Text family="regular" size="small" color={theme.graytext} >Execution Price</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{item?.exePrice ? parseFloat(item?.exePrice).toFixed(futureTradePair?.quoteDecimal) : "-"}</Text>
                                    </View>

                                </Flexcomponent>

                                {/* <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Price</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{parseFloat(item?.price).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Execution Price</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{item?.exePrice ? parseFloat(item?.exePrice).toFixed(futureTradePair?.quoteDecimal) : "-"}</Text>
                                    </View>
                                </Flexcomponent> */}


                                <Flexcomponent top={"5%"} justifyContent="space-between" >
                                    <Card backgroundColor={theme.background} containerStyle={{ padding: "2.5%", width: "45%", alignItems: "center" }} >
                                        <Text family="medium" size="semimedium"  >{(new Date(item?.orderDate)).toDateString()}</Text>
                                    </Card>

                                    <View style={{ width: "50%", alignItems: "flex-end" }} >
                                        <Text color={item?.status == "completed" ? Colors.green : (item?.status == "rejected") ? Colors.red : theme.activetab} family="medium" size="semimedium">{capitalizeFirst(item?.status)}</Text>
                                    </View>
                                </Flexcomponent>


                            </Card>
                        )
                    }
                    }

                    ListFooterComponent={(page > 1 && isLoading) ?
                        <Loadercomponent containerstyle={{ height: windowheight * 0.05 }} /> : null
                    }

                    ListEmptyComponent={() => (
                        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", }} >
                            <Text family="medium" size="small" style={{ marginTop: 10 }} >No Data Found</Text>
                        </View>

                    )}

                />
            }
        </View>
    )

}

export default Orders;