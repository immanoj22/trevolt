import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Pressable, View, FlatList } from "react-native";
import { useSelector } from "react-redux";

import Head from "../Components/Head";
import Footer from "../Components/Footer";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Options from "../Components/Options";
import NoData from "../../../Components/Nodata";
import { Input } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import UpdateOrders from "../Components/UpdateOrders";
import VectorIcons from "../../../Utilities/vectoricons";
import OpenPandLModel from "../Components/OpenPandLModel";
import useApiError from "../../../Actions/Hooks/errorhook";
import { momentFormat } from "../../../Utilities/dateTime";
import useSocket from "../../../Actions/Socket/sockethook";
import Flexcomponent from "../../../Components/flexcomponent";
import { orderTypeEnum, sideEnum } from "../../../Actions/type";
import Loadercomponent from "../../../Components/loadercomponent";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";
import { setCancelOrders, useLazyCancelBracketQuery, useLazyFutureOpenOrdersQuery, useLazyRemoveBracketQuery, useUpdateOrdersMutation } from "../../../Slices/future";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { styles } from "../styles";
import { socketService } from "../../../Actions/Socket/socketManager";

interface OpenOrdersprops {
    tradeMode?: any;
    futureId?: any;
    ref?: any;
    tab?: any;
    active?: any
}

const OpenOrders: React.FC<OpenOrdersprops> = ({
    tradeMode,
    futureId,
    ref,
    tab,
    active,
}) => {
    const { theme, openbottomsheet, successtoast, failuretoast, dispatch, closebottomsheet } = useCustomHooks();
    const style = styles(theme);
    const bracketref = useRef(null);
    const updateetref = useRef(null);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const cancelOrdersList = useSelector((state: any) => state.future.cancelOrdersList);
    const cancelType = useSelector((state: any) => state.future.cancelType);
    const openOrderDetails = useSelector((state: any) => state.future.openOrderDetails);
    const { marginMode } = useSelector((state: any) => state.auth.userData);
    const { userData } = useSelector((state: any) => state.auth);
    const [selectOrder, setSelectOrder] = useState<any>({});
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [orderType, setOrderType] = useState("");

    const [counts, setCount] = useState(0);
    const [nextPages, setNextPage] = useState(true);
    const [openOrder, setOpenOrder] = useState<any>([]);
    const [pagination, setPagination] = useState<any>({ page: 1, limit: 10 });
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [futureOpenOrders, { isLoading: openLoader, isFetching }] = useLazyFutureOpenOrdersQuery();

    const { triggerOpendOrders } = useApihooks();

    const fetchOpenOrder = async (openOrder: any, reqData: any) => {
        try {
            const params = {
                pairId: futureId.current,
                tradeMode,
                page: reqData.page,
                limit: reqData.limit,
            };
            let response = await futureOpenOrders(params).unwrap();
            if (response.success) {
                setOpenOrder([...openOrder, ...response?.result?.data]);
                setCount(response?.result?.count);
                setNextPage(response?.result?.nextPage);
            } else {
                setOpenOrder([]);
            }
        } catch (err) {
            console.log("Pagination fetch error:", err);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const loadMore = async () => {
        if (isLoadingMore || !nextPages) return;
        try {
            setIsLoadingMore(true)
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            if (marginMode == 'portfolio') {
                ApplyFilters(tradeMode, futureId.current, openOrderDetails);
            } else {
                fetchOpenOrder(openOrder, {
                    page: Page,
                    limit: pagination.limit,
                });
            }

        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

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
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(0, end_index);
                setOpenOrder(filterData)
                if (count > filterData.length) {
                    setNextPage(true)
                } else {
                    setNextPage(false)
                }

            } else {
                setOpenOrder([])
                setCount(0);
                setNextPage(false)
            }
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    useFocusEffect(
        useCallback(() => {
            if (marginMode == 'portfolio') {
                triggerOpendOrders();
            } else {
                fetchOpenOrder([], { page: 1, limit: pagination.limit });
            }
        }, [futureId.current, tradeMode])
    );

    useEffect(() => {
        if (marginMode == 'portfolio') {
            ApplyFilters(tradeMode, futureId.current, openOrderDetails)
        }
    }, [futureId.current, tradeMode, openOrderDetails]);

    const handleShowProfitLossModal = (data: any) => {
        setSelectOrder(data)
        openbottomsheet(bracketref)
    }

    const [removeBracket, { error, isFetching: removingBracket }] = useLazyRemoveBracketQuery();
    const [cancelBracket, { error: canErr, isFetching: cancelingBracket }] = useLazyCancelBracketQuery();
    const [updateOrder, { isLoading, error: updateErr }] = useUpdateOrdersMutation();

    useApiError(error ?? canErr ?? updateErr);

    const removeBracketOrders = async (data: any) => {
        try {
            const response = await removeBracket(data).unwrap();
            if (response.success) {
                fetchOpenOrder([], { page: 1, limit: pagination.limit });
                successtoast("Success", response.message);
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (error) {
            console.log('removeBracketOrders__err', error);
        }
    }

    const cancelBracketOrders = async (data: any) => {
        try {
            const response = await cancelBracket(data).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                fetchOpenOrder([], { page: 1, limit: pagination.limit });
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (error) {
            console.log('cancelBracketOrders__err', error);
        }
    }

    const updateOrders = async () => {
        const payload: any = {
            orderId: selectOrder._id,
            quantity: selectOrder.quantity,
            price: selectOrder.price
        }
        try {
            let response = await updateOrder(payload).unwrap();
            if (response.success) {
                fetchOpenOrder([], { page: 1, limit: pagination.limit });
                successtoast("Success", response.message);
                setTimeout(() => {
                    closebottomsheet(updateetref)
                }, 300)
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
                cancelType: updateOrder.length === openOrder.length ? "all" : data.cancelType,
            })
        );
    };

    const onChangeHandler = (name: any, value: any) => {
        let numbers = /^[+]?([0-9]+(?:[\.][0-9]*)?|\.[0-9]+)$/;
        if (['price', 'quantity', 'stopPrice', 'orderType'].includes(name) && !numbers.test(value) && value !== "") {
            return false
        }
        setSelectOrder({ ...selectOrder, ...{ [name]: value } })
    }

    const events: any = {
        "FuturesopenOrder": useCallback((result: any) => {
            ApplyFilters(tradeMode, futureId.current, result.data)
        }, [])
    }

    // useSocket({ events });

    const handleFuturesopenOrder = useCallback((result: any) => {
        ApplyFilters(tradeMode, futureId.current, result.data)
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("FuturesopenOrder", handleFuturesopenOrder);
        return () => {
            socketService.off("FuturesopenOrder", handleFuturesopenOrder);
        }
    }, [socketService])

    const onFetchHandler = useCallback(() => {
        fetchOpenOrder([], { page: 1, limit: pagination.limit });
    }, [pagination.limit]);

    return (
        <>
            <Options
                ref={ref}
                tab={tab}
                active={active}
                onFetch={onFetchHandler}
            />
            {
                isFetching === true && !isLoadingMore ?
                    <Loadercomponent /> :
                    <View style={style.padding}>
                        {
                            openOrder.length > 0 && (
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
                            data={openOrder}
                            keyExtractor={(item, index) => item?._id?.toString() ?? index.toString()}
                            contentContainerStyle={{ paddingBottom: 20 }}
                              showsVerticalScrollIndicator={false}
                            ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                            onEndReached={() => {
                                if (openOrder.length > 0 && counts !== openOrder.length && nextPages) {
                                    loadMore();
                                }
                            }}
                            onEndReachedThreshold={0.3}
                            renderItem={({ item, index }) => {
                                const isExpanded = expandedIndex === index;
                                let Remaining = item?.quantity - item?.filledQuantity;
                                return (
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.position]}>
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
                                                        <Text family="regular" size="small" color={Colors.stormGrey}>Quantity</Text>
                                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                            <Text family="medium"> {formatValue(parseFloat(item.quantity), parseFloat(futureTradePair.baseDecimal))} {item?.baseCurrency}  </Text>
                                                            <Pressable onPress={() => { openbottomsheet(updateetref), setSelectOrder(item), setOrderType("quantity") }} hitSlop={20}>
                                                                <VectorIcons
                                                                    family="FontAwesome5"
                                                                    name="pen"
                                                                    size={10}
                                                                />
                                                            </Pressable>
                                                        </View>
                                                    </View>
                                                    <View style={style.center}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Filled/Remaining</Text>
                                                        <Text family="medium" align="flex-start">{`${formatValue(item.filledQuantity, (futureTradePair?.baseDecimal))} / ${formatValue(Remaining, (futureTradePair?.baseDecimal))}`} <Text color={Colors.stormGrey}>{item?.baseCurrency}</Text></Text>
                                                    </View>
                                                    <View style={style.end}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Notional</Text>
                                                        <Text family="medium" align="flex-start">{formatValue(parseFloat(item?.orderValue).toFixed(futureTradePair.quoteDecimal))}</Text>
                                                    </View>
                                                </Flexcomponent>
                                                {
                                                    isExpanded && (
                                                        <>
                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey}>Order type</Text>
                                                                    <Text family="medium" color={item?.buyorsell == "buy" ? Colors.green : Colors.red}>{sideEnum[item?.buyorsell]}</Text>
                                                                </View>
                                                                <View style={style.center}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Reduce Only</Text>
                                                                    <Text family="medium" color={Colors.red} align="flex-start" style={{ paddingLeft: 20 }}> {item?.reduce_only ? <VectorIcons family="Feather" name="check" iconcolor={Colors.green} /> : <VectorIcons family="Feather" name="x" iconcolor={Colors.red} />}</Text>
                                                                </View>
                                                                <View style={style.end}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Type</Text>
                                                                    <Text family="medium" align="flex-start">{orderTypeEnum[item?.orderType]}</Text>
                                                                </View>
                                                            </Flexcomponent>

                                                            <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                                <View style={{ width: "40%" }}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} >Limit Price</Text>
                                                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                                        <Text family="medium">{formatValue(parseFloat(item.price)?.toFixed(futureTradePair.quoteDecimal))}  </Text>
                                                                        <Pressable onPress={() => { openbottomsheet(updateetref), setSelectOrder(item), setOrderType("price") }} hitSlop={20}>
                                                                            <VectorIcons
                                                                                family="FontAwesome5"
                                                                                name="pen"
                                                                                size={10}
                                                                            />
                                                                        </Pressable>
                                                                    </View>
                                                                </View>
                                                                <View style={style.center}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">TP / SL</Text>
                                                                    {
                                                                        item?.bracketOrders.length > 0 ? (
                                                                            <>
                                                                                <Text style={{ fontSize: RFvalue(10) }} align="flex-start">TP ({formatDisplayPair(futureTradePair.quoteCurrency)}) :</Text>
                                                                                <Text style={{ fontSize: RFvalue(10) }} align="flex-start">{item?.takeprofit?.stopPrice == null || item?.takeprofit?.stopPrice === '' ? "--" : item?.takeprofit?.stopPrice}</Text>
                                                                                <Text style={{ fontSize: RFvalue(10) }} align="flex-start">SL ({formatDisplayPair(futureTradePair.quoteCurrency)}) :</Text>
                                                                                <Text style={{ fontSize: RFvalue(10) }} align="flex-start">{item?.takeprofit?.stopPrice == null || item?.takeprofit?.stopPrice === '' ? "--" : item?.stoploss?.stopPrice}</Text>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Text family="medium" align="flex-start">--</Text>
                                                                            </>
                                                                        )
                                                                    }
                                                                </View>
                                                                <View style={style.bal}>
                                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Date/Time</Text>
                                                                    <Text family="medium" style={{ fontSize: RFvalue(10) }} >{momentFormat(item?.orderDate)}</Text>
                                                                </View>
                                                            </Flexcomponent>
                                                        </>
                                                    )
                                                }
                                            </View>
                                        </Card>
                                        <Flexcomponent style={style.bottom}>
                                            <View style={style.algin}>
                                                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                                                    {item?.bracketOrders.length > 0 ? (
                                                        <View style={style.between}>
                                                            <Pressable style={style.action}
                                                                onPress={() => handleShowProfitLossModal(item)} >
                                                                <VectorIcons
                                                                    name="edit"
                                                                    family="Feather"
                                                                    size={windowwidth * 0.04}
                                                                    iconcolor={theme.activetab}
                                                                />
                                                            </Pressable>
                                                            <Pressable style={style.remove}
                                                                disabled={removingBracket || cancelingBracket}
                                                                onPress={() => {
                                                                    Commonalert({
                                                                        title: "Remove Bracket Orders",
                                                                        des: "Are you sure want to remove bracket orders of this order ?",
                                                                        yes: () => removeBracketOrders(item?._id),
                                                                    });
                                                                }}>
                                                                <VectorIcons
                                                                    name="trash-2"
                                                                    family="Feather"
                                                                    size={windowwidth * 0.04}
                                                                    iconcolor={"red"}
                                                                />
                                                            </Pressable>
                                                        </View>
                                                    ) : (
                                                        <Pressable style={style.addText} onPress={() => handleShowProfitLossModal(item)} >
                                                            <Text family="semiBold" size="small" style={style.added}> Add </Text>
                                                        </Pressable>
                                                    )}
                                                    <Pressable disabled={removingBracket || cancelingBracket} onPress={() => Commonalert({
                                                        title: "Cancel Order",
                                                        des: "Are you sure want to cancel this order ?",
                                                        yes: () => cancelBracketOrders(item?._id),
                                                    })} style={style.closeContainer}>
                                                        <Text family="semiBold" size="small" style={style.close}>Cancel</Text>
                                                    </Pressable>
                                                </View>
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
                                    </Card>
                                )
                            }}
                            ListEmptyComponent={() => (
                                !isFetching ? (
                                    <View style={style.noData}>
                                        <NoData title="No Open Orders" />
                                    </View>
                                ) : null
                            )}
                        />

                        <OpenPandLModel
                            ref={bracketref}
                            orderData={selectOrder}
                            refetch={() => triggerOpendOrders()}
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

export default OpenOrders;