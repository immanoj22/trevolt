import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View, FlatList } from "react-native";
import { useSelector } from "react-redux";

import Head from "../Components/Head";
import Footer from "../Components/Footer";
import usePaginatedFetch from "../helpers";
import Options from "../Components/Options";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { Input } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import { orderTypeEnum } from "../../../Actions/type";
import UpdateOrders from "../Components/UpdateOrders";
import VectorIcons from "../../../Utilities/vectoricons";
import { momentFormat } from "../../../Utilities/dateTime";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import useSocket from "../../../Actions/Socket/sockethook";
import Flexcomponent from "../../../Components/flexcomponent";
import Loadercomponent from "../../../Components/loadercomponent";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import useCustomHooks, { Commonalert } from "../../../Actions/Hooks/customhook";
import { setCancelOrders, useLazyCancelBracketQuery, useLazyStopOrdersQuery, useUpdateOrdersMutation } from "../../../Slices/future";

import { styles } from "../styles";
import { socketService } from "../../../Actions/Socket/socketManager";

interface StopHistorysprops {
    tradeMode?: any;
    futureId?: any;
    ref?: any;
    tab?: any;
    active?: any
}

const StopOrder: React.FC<StopHistorysprops> = ({
    tradeMode,
    futureId,
    ref,
    tab,
    active
}) => {
    const { theme, successtoast, failuretoast, dispatch, closebottomsheet, openbottomsheet } = useCustomHooks();
    const style = styles(theme);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const cancelOrdersList = useSelector((state: any) => state.future.cancelOrdersList);
    const cancelType = useSelector((state: any) => state.future.cancelType);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [stopOrders, { isFetching }] = useLazyStopOrdersQuery();
    const updateetref = useRef(null);
    const [orderType, setOrderType] = useState("")
    const [selectOrder, setSelectOrder] = useState<any>({});
    const [orderList, setorderList] = useState<any>([]);

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
        apiFunc: stopOrders,
        futureId,
        tradeMode,
    });

    console.log(filledOrders, count, "StopOrder")
    useEffect(() => {
        // ApplyFilters(tradeMode, futureId.current, filledOrders)
        setorderList(filledOrders)
    }, [filledOrders])

    const [cancelBracket, { error: canErr, isFetching: cancelingBracket }] = useLazyCancelBracketQuery();
    const [updateOrder, { isLoading, error: updateErr }] = useUpdateOrdersMutation();

    useApiError(canErr);
    useApiError(updateErr);

    const cancelBracketOrders = async (data: any) => {
        try {
            const response = await cancelBracket(data).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                refetch()
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (error) {
            console.log('cancelBracketOrders__err', error);
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
        try {
            let response = await updateOrder(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                setTimeout(() => {
                    closebottomsheet(updateetref)
                }, 300)
                refetch()
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (error) {
            console.log('updateOrders__err', error);
        }
    };

    // useEffect(() => {
    //     if (!isEmpty(futureTradePair) && futureId.current != futureTradePair._id && futureId.current !== 'all') {
    //         futureId.current = futureTradePair._id;
    //     }
    // }, [futureTradePair]);

    const handelCancelOrder = (data: any) => {
        const isExist = cancelOrdersList.some((el: string) => el === data.orders);
        const updateOrder = isExist
            ? cancelOrdersList.filter((el: string) => el !== data.orders)
            : [...cancelOrdersList, data.orders];
        dispatch(
            setCancelOrders({
                cancelOrdersList: isEmpty(data.orders) ? [] : updateOrder,
                cancelType: updateOrder.length === orderList.length ? "all" : data.cancelType
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
    const events: any = {
        "Futurestoporder": useCallback((data: any) => {
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

    const handleFuturestoporder = useCallback((result: any) => {
        ApplyFilters(tradeMode, futureId.current, result.data)
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("Futurestoporder", handleFuturestoporder);
        return () => {
            socketService.off("Futurestoporder", handleFuturestoporder);
        }
    }, [socketService])

    return (
        <>
            <Options
                ref={ref}
                tab={tab}
                active={active}
                onFetch={refetch}
            />
            {
                isFetching === true && !isLoadingMore ?
                    <Loadercomponent />
                    : <View style={style.padding}>
                        {
                            orderList.length > 0 && (
                                <Input
                                    type="checkbox"
                                    label="Select All"
                                    initial={cancelType === 'all' ? true : false}
                                    onChange={(e) => {
                                        handelCancelOrder({
                                            orders: "",
                                            cancelType: e ? 'all' : ''
                                        })
                                    }}
                                    checkboxstyle={{ marginBottom: 10 }}
                                />
                            )
                        }
                        <FlatList
                            data={orderList}
                            keyExtractor={(item, index) => item?._id?.toString() ?? index.toString()}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                            onEndReached={() => {
                                if (orderList.length > 0 && count !== orderList.length && nextPage) {
                                    loadMore();
                                }
                            }}
                            onEndReachedThreshold={0.3}
                            renderItem={({ item, index }) => {
                                const isExpanded = expandedIndex === index;
                                return (
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.position]}>
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
                                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={style.positionCard}>
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
                                                                        <Text family="medium" align="flex-start" color={item?.buyorsell == "buy" ? Colors.green : Colors.red} >{item?.buyorsell?.toUpperCase()}</Text>
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
                                                    <Pressable disabled={cancelingBracket} onPress={() => Commonalert({
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
                                !isFetching ? (
                                    <View style={style.noData} >
                                        <NoData title="No Stop Orders" />
                                    </View>
                                ) : null
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