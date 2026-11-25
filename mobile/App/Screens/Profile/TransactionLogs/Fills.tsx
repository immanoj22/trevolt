import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import { helperSelector } from "../../../Slices/helper";
import { Colors, limit } from "../../../Utilities/uiasset";
import { windowheight } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { capitalizeFirst } from "../../../Utilities/helerfunction";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import { useLazyFilledHistoryQuery } from "../../../Slices/future";

interface Recenttransactionprops {
}

const Fills: React.FC<Recenttransactionprops> = ({ }) => {

    const { theme } = useCustomHooks();
    const futurePairData = useSelector((state: any) => state.future.futurePairData);

    const [futureOrderHistory, { isLoading }] = useLazyFilledHistoryQuery();

    const [page, setPage] = useState(1)

    const { transactionlogdata } = useSelector(helperSelector);
    const [transaction, setTransactions] = useState<any[]>([]);
    const [maxreached, setMaxreached] = useState(false);

    useEffect(() => {
        if (transactionlogdata) {
            fetchhistory()
            setPage(1)
        }
    }, [transactionlogdata])

    useFocusEffect(
        useCallback(() => {
            fetchhistory()
        }, [page])
    );

    const fetchhistory = async () => {
        let reqData = {
            pairId: "all",
            page: page,
            tradeMode: "all",
            limit: limit.recent_tranaction,
            startDate: (transactionlogdata?.startdate) ?? "",
            endDate: (transactionlogdata?.enddate) ?? "",
        };
        const res = await futureOrderHistory(reqData).unwrap();
        const result: any[] = res?.result?.data
        if (page == 1) {
            setTransactions(result ?? [])
        }
        else {
            setTransactions((prevstate) => [...prevstate, ...(result ?? [])])
        }
        if ((result?.length < Number(limit.recent_tranaction))) {
            setMaxreached(true)
        }
    }

    const handleNextPage = () => {
        if (!maxreached && !isLoading) {
            setPage(prev => prev + 1)
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", marginBottom: 20 }} >
            {(isLoading && (page == 1)) ?
                <Loadercomponent containerstyle={{ flex: 1 }} /> :
                <FlatList
                    data={transaction}
                    keyExtractor={(item, index) => index.toString()}
                    style={{ marginTop: 20, }}
                    showsVerticalScrollIndicator={false}
                    onEndReached={() => handleNextPage()}
                    onEndReachedThreshold={0.5}
                    renderItem={({ item }) => {
                        let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                        return (
                            <Card borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: 15, marginBottom: 10, backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF", }}>
                                <Flexcomponent justifyContent="space-between" alignItems="center" >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Symbol</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{formatDisplayPair(item?.pairname)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Side</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }} color={item?.side == "buy" ? Colors.green : Colors.red}>{capitalizeFirst(item?.side)}</Text>
                                    </View>

                                  </Flexcomponent>

                                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Fill Qty</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{parseFloat(item?.filledQuantity).toFixed(futureTradePair?.baseDecimal)} {item?.baseCurrency}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Order Type</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{capitalizeFirst(item?.orderType)}</Text>
                                    </View>

                                </Flexcomponent>

                                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                    <View style={{ flex: 0.5, }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Notional</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{parseFloat(item?.notional).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                    </View>
                                    <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                        <Text family="regular" size="semimedium" color={theme.graytext} >Execution Price</Text>
                                        <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{parseFloat(item?.price).toFixed(futureTradePair?.quoteDecimal)}</Text>
                                    </View>

                                </Flexcomponent>

                                <Flexcomponent top={"5%"} justifyContent="space-between" >
                                    <Card backgroundColor={theme.background} containerStyle={{ padding: "2.5%", width: "45%", alignItems: "center" }} >
                                        <Text family="medium" size="semimedium"  >{(new Date(item?.created_at)).toDateString()}</Text>
                                    </Card>

                                    <View style={{ width: "50%", alignItems: "flex-end" }} >
                                        {/* <Text color={item?.status == "completed" ? Colors.green : (item?.status == "rejected") ? Colors.red : theme.activetab} family="medium" size="semimedium">{capitalizeFirst(item?.status)}</Text> */}
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
                        <View style={{ height: windowheight * 0.8, justifyContent: "center", alignItems: "center", }} >
                            <Text family="medium" size="small" style={{ marginTop: 10 }} >No Data Found</Text>
                        </View>

                    )}
                />
            }
        </View>
    )

}

export default Fills;