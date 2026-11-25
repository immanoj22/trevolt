import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import Head from "../../Portfolio/Components/Head";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import Options from "../../Portfolio/Components/Options";
import { momentFormat } from "../../../Utilities/dateTime";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { orderTypeEnum, sideEnum } from "../../../Actions/type";
import { useCopyOrderHistoryMutation } from "../../../Slices/copy";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { capitalizeFirst, isEmpty, truncateString } from "../../../Utilities/helerfunction";

interface Orderprops {
    data?: any;
    userId?: any;
    accountId?: any;
    ref?: any;
    tab?: any;
    active?: any;
    type?: any;
    tradeMode?: any;
    futureId?: any;
}

const OrderHistory: React.FC<Orderprops> = ({ data, accountId, ref, active, futureId, tradeMode, tab }) => {
    const { theme, convert, convertSec } = useCustomHooks();
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const [orderhistory] = useCopyOrderHistoryMutation();

    const [filledOrders, setFilledOrders] = useState<any>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);

    const fetchFilledHistory = async (ordersHisy: any, reqData: any) => {
        const payload = {
            strategyId: data.strategyId,
            type: 'copier',
            userId: data.copierId,
            pairId: "all",
            accountId: accountId,
            page: reqData.page,
            limit: reqData.limit
        }
        const response = await orderhistory(payload).unwrap();
        console.log("response", response)
        if (response.success) {
            setFilledOrders([...ordersHisy, ...response.result?.data]);
            setCount(response.data.result?.count || 0);
            setnextPage(response.data.result?.nextPage || 0);
        } else {
            console.log("Error", "Something sis went wrong")
        }
    }

    const loadMore = async () => {
        try {
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            let reqData = {
                page: Page,
                limit: pagination.limit,
            };
            fetchFilledHistory(filledOrders, reqData);
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };


    useEffect(() => {
        if (!isEmpty(futureTradePair) && futureId.current != futureTradePair._id && futureId.current !== 'all') {
            futureId.current = futureTradePair._id;
        }
    }, [futureTradePair]);


    useFocusEffect(
        useCallback(() => {
            fetchFilledHistory([], {
                page: 1,
                limit: pagination.limit,
            });
        }, [futureId.current, tradeMode])
    );

    return (
        <View style={{ flex: 1 }}>
            <Options
                ref={ref}
                tab={tab}
                active={active}
                containerStyle={{ paddingHorizontal: 0 }}
            />
            {
                <FlatList
                    data={filledOrders}
                    keyExtractor={(item, index) => index.toString()}
                    showsVerticalScrollIndicator={false}
                    style={{ paddingBottom: 50 }}
                    onEndReached={() => {
                        if (filledOrders?.length > 0 && count !== filledOrders?.length && nextPage) {
                            loadMore();
                        }
                    }}
                    onEndReachedThreshold={0.1}
                    // ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                    renderItem={({ item, index }) => {
                        const isExpanded = expandedIndex === index;
                        const buyorsell = String(item?.buyorsell ?? "").trim().toLowerCase();
                        let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                        return (
                            <Card containerStyle={{ marginTop: "2.5%", padding: 10, width: "100%", }}>
                                <View style={{ width: "100%", }}>
                                    <Head pairname={item?.pairName} />
                                    <Card containerStyle={{ backgroundColor: theme.midblack, padding: 13, marginTop: 10 }}>
                                        <View>
                                            <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                <View style={{ width: "30%" }}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey}>Qty</Text>
                                                    <Text family="medium" size="semimedium" color={Colors.brand}>{parseFloat(item?.quantity).toFixed(futureTradePair?.baseDecimal)} {item?.baseCurrency}</Text>
                                                </View>
                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Side</Text>
                                                    <Text family="medium" size="semimedium" align="flex-start" color={buyorsell == "buy" ? Colors.green : Colors.red}>{sideEnum[buyorsell]}</Text>
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
                        <View style={{ height: windowheight * 0.5, justifyContent: "center", alignItems: "center", }} >
                            <NoData title="No Order History" />
                        </View>
                    )}
                />
            }
        </View>
    )
}

export default OrderHistory;