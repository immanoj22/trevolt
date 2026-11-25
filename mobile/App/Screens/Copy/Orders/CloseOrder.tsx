import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import Head from "../../Portfolio/Components/Head";
import { Colors } from "../../../Utilities/uiasset";
import Options from "../../Portfolio/Components/Options";
import VectorIcons from "../../../Utilities/vectoricons";
import ShareModal from "../../Portfolio/Components/Share";
import { momentFormat } from "../../../Utilities/dateTime";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useCopyCloseOrdersMutation } from "../../../Slices/copy";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { getPorfitCalculation } from "../../../Actions/Hooks/usePriceConversion";

import { style } from "../styles";

interface Orderprops {
    data?: any;
    userId?: any;
    accountId?: any;
    ref?: any;
    tab?: any;
    active?: any;
    tradeMode?: any;
    futureId?: any;
}

const directionEnum: any = {
    'long': 'Long',
    'short': 'Short',
}

const CloseOrder: React.FC<Orderprops> = ({ data, userId, accountId, futureId, ref, tradeMode, tab, active }) => {
    const { theme, openbottomsheet, convert, convertSec } = useCustomHooks();
    const styles = style(theme);

    const [orderHistory, setorderHistory] = useState<any>([]);
    const [count, setCount] = useState(0);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [pnlCard, setPnlCard] = useState({})
    const shareRef = useRef(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [nextPage, setnextPage] = useState(true);

    const [closeorder] = useCopyCloseOrdersMutation();

    const fetchCloseOrder = async (orderHistory: any, reqData: any) => {
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
            setorderHistory([...orderHistory, ...response.result?.data]);
            setCount(response.data.result?.count || 0);
            setnextPage(response.data.result?.nextPage || 0);
        } else {
            console.log("Error", "Something is went wrong")
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
            fetchCloseOrder(orderHistory, reqData);
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
            fetchCloseOrder([], {
                page: 1,
                limit: pagination.limit,
            });
        }, [futureId.current, tradeMode])
    );

    const filteredOrderHistory = useMemo(() => {
        let filtered = [...orderHistory];
        if (!isEmpty(tradeMode) && tradeMode !== 'all') {
            filtered = filtered.filter((val: any) => val.tradeMode == tradeMode);
        }
        if (!isEmpty(futureId?.current) && futureId.current !== 'all') {
            filtered = filtered.filter((val: any) => val.pairId == futureId.current);
        }
        return filtered;
    }, [orderHistory, tradeMode, futureId?.current]);

    return (
        <View style={styles.container}>
            <Options
                ref={ref}
                tab={tab}
                active={active}
                containerStyle={{ paddingHorizontal: 0 }}
            />
            <FlatList
                data={filteredOrderHistory}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
                style={{ paddingBottom: 50 }}
                onEndReached={() => {
                    if (orderHistory?.length > 0 && count !== orderHistory?.length && nextPage) {
                        loadMore();
                    }
                }}
                onEndReachedThreshold={0.1}
                renderItem={({ item, index }) => {
                    const isExpanded = expandedIndex === index;
                    const closingDirection = String(item?.closing_direction ?? "").trim().toLowerCase();
                    let futureTradePair = futurePairData?.find((val: any) => (val?._id.toString() == item?.pairId.toString()));
                    return (
                        <Card containerStyle={{ marginTop: "2.5%", padding: 10, width: "100%" }}>
                            <View style={{ width: "100%", }}>
                                <Head ref={shareRef} pairname={item?.pairname} share={true} onClick={() => {
                                    let { percentage } = getPorfitCalculation(item.entryPrice, item.closePrice, item.quantity, item.closing_direction)
                                    setPnlCard({
                                        ...item,
                                        pnl: item.grossPandL,
                                        close_price: item.closePrice,
                                        positionSide: item.closing_direction,
                                        pnl_percen: percentage
                                    })
                                    openbottomsheet(shareRef)
                                }} />
                                <Card containerStyle={{ backgroundColor: theme.midblack, padding: 13, marginTop: 10 }}>
                                    <View>
                                        <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                            <View style={{ width: "40%" }}>
                                                <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Direction</Text>
                                                <Text family="medium" size="semimedium" color={closingDirection === "long" ? Colors.green : Colors.red} align="flex-start" >{directionEnum[closingDirection]}</Text>
                                            </View>
                                            <View style={{ width: "40%", alignItems: "center" }}>
                                                <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Entry price</Text>
                                                <Text family="medium" size="semimedium" align="flex-start">{isNaN(item?.entryPrice) ? 0 : formatValue(parseFloat(item?.entryPrice)?.toFixed(futureTradePair?.quoteDecimal))}
                                                </Text>
                                                <Text family="medium" size="semimedium" align="flex-start">{futureTradePair?.quoteCurrency}</Text>
                                            </View>
                                            <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Gross P/L</Text>
                                                <Text family="medium" size="semimedium" align="flex-start" color={item?.grossPandL > 0 ? Colors.green : Colors.red}>{convert(item?.grossPandL ?? 0, futureTradePair?.quoteDecimal)}
                                                </Text>
                                                <Text family="medium" size="semimedium" align="flex-start" color={item?.grossPandL > 0 ? Colors.green : Colors.red}>{convertSec(item?.grossPandL ?? 0, futureTradePair?.quoteDecimal)}
                                                </Text>
                                            </View>
                                        </Flexcomponent>
                                        {isExpanded && (
                                            <>
                                                <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                    <View style={{ width: "40%" }}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} >Closing price</Text>
                                                        <Text family="medium" size="semimedium" >{isNaN(item?.closePrice)
                                                            ? 0
                                                            : formatValue(parseFloat(item?.closePrice)?.toFixed(
                                                                futureTradePair?.quoteDecimal
                                                            ))}{" "}
                                                            {futureTradePair?.quoteCurrency}</Text>
                                                    </View>
                                                    <View style={{ width: "40%", alignItems: "center" }}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start" >Close quantity</Text>
                                                        <Text family="medium" size="semimedium" align="flex-start">{isNaN(item?.quantity)
                                                            ? 0
                                                            : formatValue(parseFloat(item?.quantity)?.toFixed(
                                                                futureTradePair?.baseDecimal
                                                            ))}{" "}
                                                            {futureTradePair?.baseCurrency}</Text>
                                                    </View>
                                                    <View style={{ width: "20%", alignItems: "flex-end" }}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey}>Date/Time</Text>
                                                        <Text family="medium" size="small" style={{ width: "115%" }}>{momentFormat(item?.createdAt)}</Text>
                                                    </View>
                                                </Flexcomponent>
                                                <Flexcomponent alignItems="flex-start" justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                    <View style={{ width: "40%" }}>
                                                        <Text family="regular" size="small" color={Colors.stormGrey} >Balance</Text>
                                                         <Text family="medium" size="semimedium">{convert(item?.afterBalance ?? 0, futureTradePair?.quoteDecimal)}
                                                        </Text>
                                                        <Text family="medium" size="semimedium">{convertSec(item?.afterBalance ?? 0, futureTradePair?.quoteDecimal)}</Text>
                                                    </View>
                                                </Flexcomponent>
                                            </>
                                        )}
                                    </View>
                                </Card>
                                <Flexcomponent style={{ justifyContent: "flex-end", marginTop: 10, width: "100%", }} ispress={true} onPress={() => setExpandedIndex(isExpanded ? null : index)} hit={15}>
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
                        <NoData title="No Close History" />
                    </View>
                )}
            />
            <ShareModal
                ref={shareRef}
                data={pnlCard}
            />
        </View>
    )
}

export default CloseOrder;