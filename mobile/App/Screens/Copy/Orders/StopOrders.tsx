import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View, FlatList } from "react-native";
import { useSelector } from "react-redux";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Input } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import Head from "../../Portfolio/Components/Head";
import { orderTypeEnum } from "../../../Actions/type";
import Options from "../../Portfolio/Components/Options";
import VectorIcons from "../../../Utilities/vectoricons";
import useSocket from "../../../Actions/Socket/sockethook";
import { momentFormat } from "../../../Utilities/dateTime";
import useApiError from "../../../Actions/Hooks/errorhook";
import { useFocusEffect } from "@react-navigation/native";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import { useCopyStopOrdersMutation } from "../../../Slices/copy";
import UpdateOrders from "../../Portfolio/Components/UpdateOrders";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import useCustomHooks, { Commonalert } from "../../../Actions/Hooks/customhook";
import { setCancelOrders, useLazyCancelBracketQuery, useUpdateOrdersMutation } from "../../../Slices/future";

import { styles } from "../../Portfolio/styles";
import { socketService } from "../../../Actions/Socket/socketManager";

interface Orderprops {
    data?: any;
    userId?: any;
    accountId?: any;
    tradeMode?: any;
    futureId?: any;
    ref?: any;
    tab?: any;
    active?: any;
}

const StopOrder: React.FC<Orderprops> = ({
    data,
    accountId,
    futureId,
    tradeMode,
    tab,
    ref,
    active,
}) => {
    const { theme, successtoast, failuretoast, dispatch, closebottomsheet, openbottomsheet } = useCustomHooks();
    const style = styles(theme);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const cancelOrdersList = useSelector((state: any) => state.future.cancelOrdersList);
    const cancelType = useSelector((state: any) => state.future.cancelType);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const updateetref = useRef(null);
    const [orderType, setOrderType] = useState("")
    const [selectOrder, setSelectOrder] = useState<any>({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [count, setCount] = useState(0);
    const [nextPage, setnextPage] = useState(true);
    const [stopOrders, setStopOrders] = useState<any>([]);

    const [getstopOrders] = useCopyStopOrdersMutation();

    const fetchStopOrder = async (orderHistory: any, reqData: any) => {
        try {
            if (!isEmpty(futureId.current)) {
                const payload = {
                    strategyId: data.strategyId,
                    type: 'copier',
                    userId: data.copierId,
                    pairId: "all",
                    accountId: accountId,
                    page: reqData.page,
                    limit: reqData.limit
                }

                let result = await getstopOrders(payload).unwrap();
                if (result.success) {
                    setStopOrders([...orderHistory, ...result.result]);
                } else {
                    setStopOrders([]);
                }
            }
        } catch (err) {
            console.log(err, "fetchorderHistory__err");
        }
    };

    const loadMore = async () => {
        try {
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            let reqData = {
                page: Page,
                limit: pagination.limit,
            };
            fetchStopOrder([], reqData);
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const [cancelBracket, { error: canErr, isFetching: cancelingBracket }] = useLazyCancelBracketQuery();
    const [updateOrder, { isLoading, error: updateErr }] = useUpdateOrdersMutation();

    useApiError(canErr);

    const cancelBracketOrders = async (data: any) => {
        const response = await cancelBracket(data).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    const updateOrders = async () => {
        let payload: any = {}
        payload['orderId'] = selectOrder._id
        if (selectOrder.trailPrice) {
            payload['isTrailingOrder'] = selectOrder.isTrailingOrder
            payload['trailPrice'] = selectOrder.trailPrice
            payload['trailTypePrice'] = futureTradePair.marketPrice
        } else {
            payload['quantity'] = selectOrder.quantity
            payload['price'] = selectOrder.price
            payload['stopPrice'] = selectOrder.stopPrice
        }
        let response = await updateOrder(payload).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            setTimeout(() => {
                closebottomsheet(updateetref)
            }, 300)
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    };

    useEffect(() => {
        if (!isEmpty(futureTradePair) && futureId.current != futureTradePair._id && futureId.current !== 'all') {
            futureId.current = futureTradePair._id;
        }
    }, [futureTradePair]);

    useFocusEffect(
        useCallback(() => {
            fetchStopOrder([], {
                page: 1,
                limit: pagination.limit,
            });
        }, [futureId?.current, tradeMode])
    );

    const handelCancelOrder = (data: any) => {
        const isExist = cancelOrdersList.some((el: string) => el === data.orders);
        const updateOrder = isExist
            ? cancelOrdersList.filter((el: string) => el !== data.orders)
            : [...cancelOrdersList, data.orders];
        dispatch(
            setCancelOrders({
                cancelOrdersList: isEmpty(data.orders) ? [] : updateOrder,
                cancelType: updateOrder.length === stopOrders.length ? "all" : data.cancelType
            })
        );
    };

    const onChangeHandler = (name: any, value: any) => {
        let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;

        if (['price', 'quantity', 'stopPrice', 'trailPrice'].includes(name) && !numbers.test(value) && value !== "") {
            return false
        }
        setSelectOrder({ ...selectOrder, ...{ [name]: value } })
    }
    // const events: any = {
    //     "Futurestoporder": useCallback((data: any) => {
    //     }, [])
    // }

    const handleFuturestoporder = useCallback((data: any) => {
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("Futurestoporder", handleFuturestoporder);
        return () => {
            socketService.off('Futurestoporder', handleFuturestoporder)
        }
    }, [socketService])

    // useSocket({ events });

    return (
        <>
            {
                <View style={{ flex: 1 }}>
                    <Options
                        ref={ref}
                        tab={tab}
                        active={active}
                        containerStyle={{ paddingHorizontal: 0 }}
                    />
                    <FlatList
                        data={stopOrders}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ paddingBottom: 10 }}
                        showsVerticalScrollIndicator={false}
                        // ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                        onEndReached={() => {
                            if (stopOrders.length > 0 && count !== stopOrders.length && nextPage) {
                                loadMore();
                            }
                        }}
                        onEndReachedThreshold={0.3}
                        renderItem={({ item, index }) => {
                            const isExpanded = expandedIndex === index;
                            const buyorsell = String(item?.buyorsell ?? "").trim().toLowerCase();
                            return (
                                <Card containerStyle={[style.position]}>
                                    <Pressable style={{ width: "100%" }} onPress={() => handelCancelOrder({ orders: item._id, cancelType: "" })}>
                                        <Head pairname={item?.pairName}
                                            rightContent={
                                                <Input
                                                    type="checkbox"
                                                    initial={cancelType !== 'all' ? cancelOrdersList.some((el: any) => el === item._id) : true}
                                                    onChange={(e) => {
                                                        handelCancelOrder({
                                                            orders: item._id,
                                                            cancelType: ''
                                                        })
                                                    }}
                                                    boxstyle={{
                                                        borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
                                                        backgroundColor: theme.midblack,
                                                        borderWidth: 1.5
                                                    }}
                                                />
                                            }
                                        />
                                        <Card containerStyle={style.positionCard}>
                                            <View>
                                                <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                    <View style={{ width: "40%" }}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey}>Size</Text>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <Text family="medium" color={Colors.brand}>{parseFloat(item.quantity).toFixed(futureTradePair?.baseDecimal)} {item?.baseCurrency}  </Text>
                                                            <Pressable onPress={() => { openbottomsheet(updateetref), setSelectOrder(item), setOrderType("quantity") }} hitSlop={20}>
                                                                <VectorIcons
                                                                    family="FontAwesome5"
                                                                    name="pen"
                                                                    size={10}
                                                                />
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                    <View style={[style.center, { alignItems: "flex-start" }]}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Trigger Price</Text>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <Text family="medium" align="flex-start">{formatValue(parseFloat(item.stopPrice), (futureTradePair?.quoteDecimal))} {item?.isTrailingOrder ? `(${item?.trailPrice})` : ""}  </Text>
                                                            <Pressable onPress={() => { openbottomsheet(updateetref), setSelectOrder(item), setOrderType("trailPrice") }} hitSlop={20}>
                                                                <VectorIcons
                                                                    family="FontAwesome5"
                                                                    name="pen"
                                                                    size={10}
                                                                />
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                    <View style={[style.end]}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Notional</Text>
                                                        <Text family="medium" align="flex-start">{(parseFloat(item?.quantity || "0") * parseFloat(item?.price || "0"))
                                                            .toFixed(futureTradePair?.quoteDecimal ?? 2)}</Text>
                                                    </View>
                                                </Flexcomponent>
                                                {
                                                    isExpanded && (
                                                        <>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey}>Triggering Price</Text>
                                                                    <Text family="medium">{formatValue(parseFloat(futureTradePair?.marketPrice).toFixed(futureTradePair?.quoteDecimal))}</Text>
                                                                </View>
                                                                <View style={style.center}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Type</Text>
                                                                    <Text family="medium" align="flex-start">{orderTypeEnum[item?.orderType]}</Text>
                                                                </View>
                                                                <View style={style.end}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Order Type</Text>
                                                                    <Text family="medium" align="flex-start" color={buyorsell == "buy" ? Colors.green : Colors.red} >{buyorsell?.toUpperCase()}</Text>
                                                                </View>
                                                            </Flexcomponent>

                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey}>Limit Price</Text>
                                                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                                        <Text family="medium">{parseFloat(item.price).toFixed(futureTradePair?.quoteDecimal)}  </Text>
                                                                        <Pressable onPress={() => { openbottomsheet(updateetref), setSelectOrder(item), setOrderType("price") }} hitSlop={20}>
                                                                            <VectorIcons
                                                                                family="FontAwesome5"
                                                                                name="pen"
                                                                                size={10}
                                                                            />
                                                                        </Pressable>
                                                                    </View>
                                                                </View>
                                                                <View style={[style.center, { alignItems: "flex-start" }]}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Status</Text>
                                                                    <Text family="medium">{item?.status}</Text>
                                                                </View>
                                                                <View style={style.bal}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Reduce Only</Text>
                                                                    <Text family="medium" color={Colors.red} align="flex-start" style={{ paddingLeft: 20 }}>{item?.reduce_only ? <VectorIcons family="Feather" name="check" iconcolor={Colors.green} /> : <VectorIcons family="Feather" name="x" iconcolor={Colors.red} />}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Date/Time</Text>
                                                                    <Text family="medium">{momentFormat(item?.orderDate)}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                        </>
                                                    )
                                                }
                                            </View>
                                        </Card>
                                        <Flexcomponent style={style.bottom}>
                                            <View style={style.algin}>
                                                <Pressable
                                                    disabled={cancelingBracket}
                                                    onPress={() => Commonalert({
                                                    title: "Cancel Order",
                                                    des: "Are you sure want to cancel this order ?",
                                                    yes: () => cancelBracketOrders(item?._id),
                                                })} style={style.closeContainer}>
                                                    <Text family="semiBold" size="small" style={style.close}>Cancel</Text>
                                                </Pressable>
                                            </View>
                                            <Pressable onPress={() => setExpandedIndex(isExpanded ? null : index)} style={style.det} hitSlop={15}>
                                                <Text family="medium">Details</Text>
                                                <VectorIcons
                                                    family="Ionicons"
                                                    name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                                                    size={windowwidth * 0.045}
                                                    style={{ marginLeft: 10 }}
                                                />
                                            </Pressable>
                                        </Flexcomponent>
                                    </Pressable>
                                </Card>
                            )
                        }}
                        ListEmptyComponent={() => (
                            <View style={style.noData} >
                                <NoData title="No Stop Orders" />
                            </View>
                        )}
                    />
                    <UpdateOrders
                        ref={updateetref}
                        type={orderType}
                        data={selectOrder}
                        loading={isLoading}
                        changeHandler={onChangeHandler}
                        onPress={updateOrders}
                    />
                </View>
            }
        </>
    )
}

export default StopOrder;