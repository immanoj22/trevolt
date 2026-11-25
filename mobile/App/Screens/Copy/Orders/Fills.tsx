import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FlatList, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { sideEnum } from "../../../Actions/type";
import Head from "../../Portfolio/Components/Head";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import Options from "../../Portfolio/Components/Options";
import { momentFormat } from "../../../Utilities/dateTime";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useCopyFillHistoryMutation } from "../../../Slices/copy";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { capitalizeFirst, isEmpty, shortenText } from "../../../Utilities/helerfunction";

interface OpenOrdersprops {
    tradeMode?: any;
    futureId?: any;
    ref?: any;
    tab?: any;
    active?: any;
    accountId?: any
    data?: any
    userId?: any
    type?: any
}

const Fills: React.FC<OpenOrdersprops> = ({
    accountId,
    data,
    ref,
    tradeMode,
    futureId,
    active,
    tab
}) => {
    const { theme } = useCustomHooks();
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const [filledOrders, setFilledOrders] = useState<any>([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);

    const [closeorder] = useCopyFillHistoryMutation();

    const fetchFilledHistory = async (orderHistory: any, reqData: any) => {
        const payload = {
            strategyId: data.strategyId,
            type: 'copier',
            userId: data.copierId,
            pairId: "all",
            accountId: accountId,
            page: reqData.page,
            limit: reqData.limit
        }
        const response = await closeorder(payload).unwrap();
        if (response.success) {
            setFilledOrders([...orderHistory, ...response.result?.data]);
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
            <View style={{ flex: 1 }}>
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
                        const side = String(item?.side ?? "").trim().toLowerCase();
                        let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                        return (
                            <Card containerStyle={{ marginTop: "2.5%", padding: 10, width: "100%" }}>
                                <View style={{ width: "100%", }}>
                                    <Head pairname={item?.pairname} />
                                    <Card containerStyle={{ backgroundColor: theme.midblack, padding: 13, marginTop: 10 }}>
                                        <View>
                                            <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                <View style={{ width: "40%" }}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Fill Qty</Text>
                                                    <Text family="medium" size="semimedium" color={Colors.brand} >{parseFloat(item?.filledQuantity).toFixed(futureTradePair?.baseDecimal)} {item?.baseCurrency}</Text>
                                                </View>
                                                <View style={{ width: "40%", alignItems: "center" }}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Side</Text>
                                                    <Text family="medium" size="semimedium" color={side == "buy" ? Colors.green : Colors.red} align="flex-start">{sideEnum[side]}</Text>
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
                                                            <Text family="medium" size="semimedium" align="flex-start">{capitalizeFirst(item.orderType)}</Text>
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
                        <View style={{ height: windowheight * 0.5, justifyContent: "center", alignItems: "center", }} >
                            <NoData title="No Fills" />
                        </View>
                    )}
                />
            </View>
        </View>
    )

}

export default Fills;