import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import { OrderList } from "../../../Actions/type";
import Head from "../../Portfolio/Components/Head";
import { Colors } from "../../../Utilities/uiasset";
import Footer from "../../Portfolio/Components/Footer";
import Options from "../../Portfolio/Components/Options";
import VectorIcons from "../../../Utilities/vectoricons";
import ShareModal from "../../Portfolio/Components/Share";
import useApiError from "../../../Actions/Hooks/errorhook";
import Flexcomponent from "../../../Components/flexcomponent";
import CloseOrders from "../../Portfolio/Components/CloseOrders";
import { useDeleteBracketMutation } from "../../../Slices/future";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import ProfitLossModal from "../../Portfolio/Components/ProfitLossModal ";
import { useLazyGetfuturePositionOrdersQuery } from "../../../Slices/copy";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";

import useSocket from "../../../Actions/Socket/sockethook";

import { styles } from "../../Portfolio/styles";

interface Orderprops {
    data?: any;
    userId?: any;
    accountId?: any;
    ref?: any,
    active?: any,
    tab?: any,
    futureId?: any,
    tradeMode?: any,
    copyFuturesPositionOrder?: any;
}

const Positions: React.FC<Orderprops> = ({
    data,
    ref,
    tab,
    active,
    futureId,
    tradeMode
}) => {
    const { theme, openbottomsheet, successtoast, failuretoast, dispatch, navigation } = useCustomHooks();
    const style = styles(theme);
    const bracketref = useRef(null);
    const closeBracketref = useRef(null);
    const { marginMode } = useSelector((state: any) => state.auth.userData);
    const { wallet } = useSelector((state: any) => state.wallet);
    const positionDetails = useSelector((state: any) => state.future.positionDetails);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const pairsList = useSelector((state: any) => state.future.pairsList);
    // const [positionOrder, setPositionOrder] = useState<OrderList[]>([]);
    const [positionOrder, setPositionOrder] = useState<any[]>([]);
    const [selectOrder, setSelectOrder] = useState({});
    const [closeData, setCloseData] = useState({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [nextPage, setnextPage] = useState(true);
    const [count, setCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [pnlCard, setPnlCard] = useState({})
    const shareRef = useRef(null);

    const totalUPNL = positionOrder.reduce(
        (sum, item) => sum + Number(item?.pnl || 0),
        0
    );

    const [deleteBracket, { error, isLoading: removingBracket }] = useDeleteBracketMutation();
    const { triggerpositionOrders } = useApihooks();

    useApiError(error);

    const sideEnum: any = {
        "long": "Long",
        "short": "Short",
    }

    const handleShowProfitLossModal = (data: any) => {
        setSelectOrder({ ...data, ...{ quantity: data.positionFilled } })
        openbottomsheet(bracketref)
    }

    const handleCloseProfitLossModal = (data: any) => {
        setCloseData(data)
        openbottomsheet(closeBracketref)
    }

    const ApplyFilters = (tradeMode = 'all', pairId = 'all') => {
        // try {
        //     if (!isEmpty(positionDetails) && positionDetails.length > 0) {
        //         let filterData: any = [...(positionDetails || [])]
        //         if (!isEmpty(tradeMode) && tradeMode != 'all') {
        //             filterData = filterData.filter((val: any) => {
        //                 return val.tradeMode == tradeMode
        //             })
        //         }
        //         if (!isEmpty(pairId) && pairId != 'all') {
        //             filterData = filterData.filter((val: any) => {
        //                 return val.pairId == pairId
        //             })
        //         }
        //         let count = filterData.length
        //         const start_index = (pagination.page - 1) * pagination.limit;
        //         const end_index = pagination.page * pagination.limit;
        //         setCount(count);
        //         filterData.slice(start_index, end_index);

        //         // setPositionOrder(filterData)
        //         if (count > filterData.length) {
        //             setnextPage(true)
        //         } else {
        //             setnextPage(false)
        //         }
        //     } else {
        //         setPositionOrder([])
        //         setCount(0);
        //         setnextPage(false)
        //     }
        //     setIsLoadingMore(false);
        // } catch (err) {
        //     console.log(err, "applyFilters__err")
        // }
    }

    const removeBracketOrders = async (data: any) => {

        const response = await deleteBracket(data).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            triggerpositionOrders();
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    useEffect(() => {
        if (!isEmpty(futureTradePair) && futureId.current != futureTradePair._id && futureId.current !== 'all') {
            futureId.current = futureTradePair._id;
        }
    }, [futureTradePair]);

    const loadMore = async () => {
        try {
            setIsLoadingMore(true);
            let Page = pagination.page + 1;
            setPagination({ ...pagination, ...{ page: Page } })
            ApplyFilters(tradeMode, futureId.current);
        } catch (err) {
            console.log(err, "LoadMore___err");
        }
    };

    const [getfuturePositionOrders] = useLazyGetfuturePositionOrdersQuery()

    const getPoaitionOrder = async () => {
        try {
            const payload = {
                tradeMode: tradeMode || 'all',
                pairId: futureId?.current || 'all',
                traderId: data.traderId,
                traderAccountId: data.traderAccountId,
            }
            const response = await getfuturePositionOrders(payload).unwrap();
            console.log("getPoaitionOrder___", response)
            if (response.success) {
                setPositionOrder(response?.result?.data)
            }
        } catch (error) {
            console.log("getPoaitionOrder_err", error)
        }
    }

    // useEffect(() => {
    //     ApplyFilters(tradeMode, futureId.current)
    // }, [positionDetails, tradeMode, futureId.current])


    useSocket({
        events: {
            copyFuturesPositionOrder: (result: any) => {
                console.log("copyFuturesPositionOrder", result);

                if (result?.data) {
                    setPositionOrder(result.data);
                    setCount(result.data.length);
                }
            },
        },
    });

    useFocusEffect(
        useCallback(() => {
            getPoaitionOrder();
        }, [tradeMode, futureId?.current])
    );

    console.log("positionOrder", positionOrder)
    return (
        <>
            <Options
                ref={ref}
                tab={tab}
                active={active}
                containerStyle={{ paddingHorizontal: 0, }}
                title={<Pressable style={{ flexDirection: "row", justifyContent: "flex-start" }} onPress={() => navigation.navigate("PnlAnalytics")}>
                    <VectorIcons family="Lucide" name="sigma" size={windowwidth * 0.050} />

                    <Text
                        color={totalUPNL >= 0 ? Colors.green : Colors.red}
                    >
                        {totalUPNL.toFixed(2)} {formatDisplayPair("USDT")}
                    </Text>

                    {/* <Text size="semimedium" family="medium"> Total UPNL <Text color={wallet?.unRealizedPnL > 0 ? Colors.green : Colors.red}>{(wallet?.unRealizedPnL)?.toFixed(2)} USDT</Text></Text> */}

                </Pressable>}
            />
            <View style={{ flex: 1 }}>
                <FlatList
                    data={positionOrder}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ paddingBottom: 10 }}
                    showsVerticalScrollIndicator={false}
                    // ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                    onEndReached={() => {
                        // const dataLength = positionDetails?.length ?? 0;
                        const dataLength = positionOrder.length;
                        if ((dataLength > 0 || count !== dataLength) && nextPage) {
                            loadMore();
                        }
                    }}
                    onEndReachedThreshold={0.3}
                    renderItem={({ item, index }) => {
                        const isExpanded = expandedIndex === index;
                        const positionSide = String(item?.positionSide ?? "").trim().toLowerCase();
                        return (
                            <Card containerStyle={[style.position]}>
                                <View style={{ width: "100%" }}>
                                    <Head ref={shareRef} pairname={item?.pairName}
                                    // rightContent={
                                    //     <Input
                                    //         type="checkbox"
                                    //         initial={pairsList.some((el: any) => el === item?.pairId)}
                                    //         onChange={() => {
                                    //             handleCloseOrder(item?.pairId)
                                    //         }}
                                    //         boxstyle={{
                                    //             borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
                                    //             backgroundColor: theme.midblack,
                                    //             borderWidth: 1.5
                                    //         }}

                                    //     />
                                    // } 
                                    />
                                    <Card containerStyle={style.positionCard}>
                                        <View>
                                            <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                <View style={{ width: "40%" }}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey}>Position Side</Text>
                                                    <Text color={positionSide === "long" ? Colors.green : Colors.red} family="medium" size="semimedium" >{sideEnum[positionSide]}</Text>
                                                </View>
                                                <View style={style.center}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Size</Text>
                                                    <Text family="medium" size="semimedium" color={Colors.stormGrey} align="flex-start">{formatValue(parseFloat(item?.positionFilled).toFixed(item?.pairData?.baseDecimal))}</Text>
                                                </View>
                                                <View style={style.end}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">UPNL</Text>
                                                    <Text family="medium" size="semimedium" color={item.pnl > 0 ? Colors.green : Colors.red} align="flex-start">{parseFloat(item?.pnl).toFixed(item?.pairData?.quoteDecimal)}</Text>
                                                </View>
                                            </Flexcomponent>
                                            {isExpanded && (
                                                <>
                                                    <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                        <View style={{ width: "40%" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} >Entry Price</Text>
                                                            <Text family="medium" size="semimedium" >{formatValue(parseFloat(item?.entryPrice).toFixed(item?.pairData?.quoteDecimal))}</Text>
                                                        </View>
                                                        <View style={style.center}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Mark Price</Text>
                                                            <Text family="medium" size="semimedium" color={Colors.stormGrey} align="flex-start">{formatValue(item?.close_price, (item?.pairData?.quoteDecimal))}</Text>
                                                        </View>
                                                        <View style={style.end}>
                                                             <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Est. Liq. Price</Text>
                                                            <Text family="medium" size="semimedium" color={Colors.red} align="flex-start">{marginMode == 'portfolio' ? "--" : (formatValue(parseFloat(item?.liquidityPrice) ?? 0, (item?.pairData?.quoteDecimal) ?? 0))}</Text>
                                                        </View>
                                                    </Flexcomponent>
                                                    <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                        <View style={{ width: "40%" }}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} >Margin</Text>
                                                            <Text family="medium" size="semimedium">{marginMode == 'portfolio' ? "--" : (formatValue(parseFloat(item?.initialMargin), item?.pairData?.quoteDecimal) ?? 0)}</Text>
                                                        </View>
                                                        <View style={style.center}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Notional</Text>
                                                            <Text family="medium" size="semimedium" color={Colors.stormGrey} align="flex-start">{formatValue(parseFloat(item?.positionFilled) * parseFloat(item?.entryPrice), (item?.pairData?.quoteDecimal))}</Text>
                                                        </View>
                                                        <View style={style.bal}>
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">TP / SL</Text>
                                                            {
                                                                item?.bracketOrders.length > 0 ? (
                                                                    <>
                                                                        <View>
                                                                            <Text family="medium" style={{ fontSize: RFvalue(10) }}>TP ({formatDisplayPair(futureTradePair.quoteCurrency)}) :{item?.takeprofit?.stopPrice == null || item?.takeprofit?.stopPrice === '' ? "--" : item?.takeprofit?.stopPrice}</Text>
                                                                            <Text family="medium" size="semimedium" style={{ fontSize: RFvalue(10) }}>SL ({formatDisplayPair(futureTradePair.quoteCurrency)}) :{item?.takeprofit?.stopPrice == null || item?.takeprofit?.stopPrice === '' ? "--" : item?.stoploss?.stopPrice}</Text>
                                                                        </View>
                                                                    </>
                                                                ) : (
                                                                    <Text family="medium" align="flex-start">--</Text>
                                                                )
                                                            }
                                                        </View>
                                                    </Flexcomponent>
                                                </>
                                            )}
                                        </View>
                                    </Card>
                                    <Flexcomponent style={style.bottom}>
                                        <View style={style.algin}>
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                                                            disabled={removingBracket}
                                                            onPress={() => {
                                                                Commonalert({
                                                                    title: "Remove Bracket Orders",
                                                                    des: "Are you sure want to remove bracket orders of this order ?",
                                                                    yes: () => removeBracketOrders({
                                                                        pairId: item?.pairId,
                                                                        positionSide: item?.positionSide
                                                                    }),
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
                                                <Pressable onPress={() => handleCloseProfitLossModal(item)} style={style.closeContainer}>
                                                    <Text family="semiBold" size="small" style={style.close}>Close</Text>
                                                </Pressable>

                                                <Pressable onPress={() => {
                                                    setPnlCard(item)
                                                    openbottomsheet(shareRef)
                                                }} hitSlop={10}>
                                                    <VectorIcons
                                                        family="Fontisto"
                                                        name={"share-a"}
                                                        size={windowwidth * 0.04}
                                                        style={{ marginLeft: 20 }}
                                                    />
                                                </Pressable>
                                            </View>
                                        </View>
                                        <Pressable onPress={() => setExpandedIndex(isExpanded ? null : index)} style={style.det} hitSlop={15}>
                                            <Text family="medium" size="semimedium">Details</Text>
                                            <VectorIcons
                                                family="Ionicons"
                                                name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
                                                size={windowwidth * 0.045}
                                                style={{ marginLeft: 10 }}
                                            />
                                        </Pressable>
                                    </Flexcomponent>
                                </View>
                            </Card>
                        )
                    }}
                    ListEmptyComponent={() => (
                        <View style={style.noData} >
                            <NoData title="No Position" />
                        </View>
                    )}
                />

                <ProfitLossModal
                    ref={bracketref}
                    orderData={selectOrder}
                />

                <CloseOrders
                    ref={closeBracketref}
                    data={closeData}
                    strategyData={data}
                />

                <ShareModal
                    ref={shareRef}
                    data={pnlCard}
                />
            </View>
        </>
    )
}

export default Positions;