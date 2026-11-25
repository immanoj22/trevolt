import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View, FlatList } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Head from "../Components/Head";
import RiskView from "./RiskView";
import Footer from "../Components/Footer";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Options from "../Components/Options";
import ShareModal from "../Components/Share";
import NoData from "../../../Components/Nodata";
import ComingSoon from "../../../Components/ComingSoon";
import { OrderList } from "../../../Actions/type";
import { Input } from "../../../Components/Field";
import CloseOrders from "../Components/CloseOrders";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import ProfitLossModal from "../Components/ProfitLossModal ";
import Flexcomponent from "../../../Components/flexcomponent";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { formatValue, isEmpty } from "../../../Utilities/helerfunction";
import { setPairsList, useDeleteBracketMutation } from "../../../Slices/future";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";

import { styles } from "../styles";

interface Positionsprops {
    tradeMode?: any;
    futureId?: any;
    ref?: any;
    tab?: any;
    active?: any
    // Trade-page embedding (Future/Option chart screens) doesn't have the
    // All/Current Contract/Options/Futures scope bottomsheet wired up - passed
    // through to the internally-rendered Options header.
    showFilter?: boolean
    // Future's screen wraps everything (chart, trade panel, this list) in one
    // scrollable Mainview - nesting this FlatList's own scroll inside that outer
    // ScrollView is what throws the "VirtualizedLists should never be nested
    // inside plain ScrollViews" warning and breaks this list's virtualization.
    // Only Future needs this: Portfolio/Options render Positions inside a
    // non-scrollable Mainview, so their FlatList already owns the only scroll.
    nestedInScrollView?: boolean
}

// Risk View isn't available for this release yet - same ComingSoon gate as
// Options trading/Affiliate/Algo trading. Flip back to false to re-enable.
const RISK_VIEW_COMING_SOON = false;

const Positions: React.FC<Positionsprops> = ({
    tradeMode,
    futureId,
    ref,
    tab,
    active,
    showFilter = true,
    nestedInScrollView = false
}) => {
    const { theme, openbottomsheet, successtoast, failuretoast, dispatch, navigation } = useCustomHooks();
    const style = styles(theme);
    // Visual-polish tokens (Positions tab only, doesn't touch shared styles.tsx
    // used by OpenOrders/StopOrder): soft tinted icon buttons instead of a flat
    // solid box, a tinted red fill for the destructive "Close" pill instead of
    // border-only, and a subtle per-theme elevation so the card lifts slightly
    // off the screen background instead of relying solely on its border.
    const softTint = theme.theme === "dark" ? "#151a1786" : "#FFFFFF";
    const softBorder = theme.theme === "dark" ? "#1B2740" : "#E2E8F0";
    const iconButtonStyle = { backgroundColor: softTint, borderWidth: 1, borderColor: softBorder, borderRadius: 10 };
    const closeButtonStyle = { backgroundColor: "rgba(255,22,92,0.12)", borderColor: "rgba(255,22,92,0.4)" };
    const cardShadow = theme.theme === "dark"
        ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.4, shadowRadius: 3, elevation: 2 }
        : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 };
    const bracketref = useRef(null);
    const closeBracketref = useRef(null);

    const { marginMode } = useSelector((state: any) => state.auth.userData);
    const { wallet } = useSelector((state: any) => state.wallet);
    const positionDetails = useSelector((state: any) => state.future.positionDetails);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const pairsList = useSelector((state: any) => state.future.pairsList);
    const [positionOrder, setPositionOrder] = useState<OrderList[]>([]);
    const [selectOrder, setSelectOrder] = useState({});
    const [closeData, setCloseData] = useState({});
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [nextPage, setnextPage] = useState(true);
    const [count, setCount] = useState(0);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [pnlCard, setPnlCard] = useState({})
    const [viewMode, setViewMode] = useState<"standard" | "risk">("standard");
    const shareRef = useRef(null);

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
        try {
            if (!isEmpty(positionDetails) && positionDetails.length > 0) {
                let filterData: any = [...(positionDetails || [])]
                if (!isEmpty(tradeMode) && tradeMode != 'all') {
                    filterData = filterData.filter((val: any) => {
                        return val.tradeMode == tradeMode
                    })
                }
                if (!isEmpty(pairId) && pairId != 'all') {
                    filterData = filterData.filter((val: any) => {
                        return val.pairId == pairId
                    })
                }
                let count = filterData.length
                const start_index = (pagination.page - 1) * pagination.limit;
                const end_index = pagination.page * pagination.limit;
                setCount(count);
                filterData.slice(start_index, end_index);
                setPositionOrder(filterData)
                if (count > filterData.length) {
                    setnextPage(true)
                } else {
                    setnextPage(false)
                }
            } else {
                setPositionOrder([])
                setCount(0);
                setnextPage(false)
            }
            setIsLoadingMore(false);
        } catch (err) {
            console.log(err, "applyFilters__err")
        }
    }

    const [deleteBracket, { error, isLoading: removingBracket }] = useDeleteBracketMutation();
    const { triggerpositionOrders } = useApihooks();

    useApiError(error);

    // Positions never refetched on its own - it only ever redraws from
    // whatever's already in the `positionDetails` Redux slice (see the
    // ApplyFilters effect below). A TP/SL drag on the chart happens inside a
    // WebView running the web frontend's own isolated broker code (see
    // Chart/chart.tsx), which has no way to update this app's Redux state
    // directly - so without a refetch here, this list stayed stale until the
    // next full app restart (the only other place that calls
    // triggerpositionOrders() unconditionally). Mirrors OpenOrders.tsx's own
    // focus-refetch, which didn't have this gap.
    useFocusEffect(
        useCallback(() => {
            triggerpositionOrders();
        }, [futureId.current, tradeMode])
    );

    const removeBracketOrders = async (data: any) => {
        try {
            const response = await deleteBracket(data).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                triggerpositionOrders();
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (err: any) {
            failuretoast("Error", err?.data?.message || "Something went wrong!");
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

    useEffect(() => {
        ApplyFilters(tradeMode, futureId.current)
    }, [positionDetails, tradeMode, futureId.current])

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await triggerpositionOrders();
        } finally {
            setRefreshing(false);
        }
    };

    const handleCloseOrder = (data: any) => {
        const currentList = pairsList || [];
        const isExist = currentList.some((el: any) => el === data);
        const updateOrder = isExist
            ? currentList.filter((el: any) => el !== data)
            : [...currentList, data];

        dispatch(setPairsList({
            pairsList: updateOrder
        }));
    };

    return (
        <>
            <View style={[style.padding, { paddingBottom: 0, paddingTop: 14 }]}>
                {/* Standard View / Risk View toggle hidden for now - defaults to
                    (and stays on) Standard View since nothing else sets viewMode.
                <View
                    style={{
                        flexDirection: "row",
                        marginBottom: 16,
                        padding: 4,
                        gap: 4,
                        borderRadius: 10,
                        backgroundColor: theme.infoCardBg,
                        borderWidth: 1,
                        borderColor: theme.infoCardBorder
                    }}
                >
                    {(["standard", "risk"] as const).map((mode) => (
                        <Pressable
                            key={mode}
                            onPress={() => {
                                if (mode === viewMode) return;
                                // Selection semantics differ per view (bulk-close in Standard
                                // vs payoff-scoped in Risk), so carrying a stale pairsList
                                // across the switch reads as a UI glitch - clear it on toggle.
                                dispatch(setPairsList({ pairsList: [] }));
                                setViewMode(mode);
                            }}
                            style={({ pressed }) => ({
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 9,
                                borderRadius: 7,
                                opacity: pressed ? 0.8 : 1,
                                backgroundColor: viewMode === mode ? Colors.brand : "transparent"
                            })}
                        >
                            <Text
                                family={viewMode === mode ? "semiBold" : "regular"}
                                size="small"
                                color={viewMode === mode ? Colors.textWhite : theme.secondarytext}
                            >
                                {mode === "standard" ? "Standard View" : "Risk View"}
                            </Text>
                        </Pressable>
                    ))}
                </View> */}

                {/* Risk View has its own scoped dropdown/Payoff/Close per underlying card
                    (see RiskView.tsx), matching web where this bulk filter+Close bar only
                    renders for the Standard View tab (Position.jsx: currentTab === 'standard'). */}
                {viewMode === "standard" && (
                    <Options
                        ref={ref}
                        tab={tab}
                        active={active}
                        showFilter={showFilter}
                        containerStyle={{ marginTop: 0, marginBottom: "3%", paddingHorizontal: 0 }}
                    />
                )}

                {viewMode === "standard" && (
                    <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginBottom: 10 }}>
                        {
                            active !== "Options" && (
                                <Pressable style={{ flexDirection: "row", justifyContent: "flex-start" }} onPress={() => navigation.navigate("PnlAnalytics")}>
                                    <VectorIcons family="Lucide" name="sigma" size={windowwidth * 0.050} />
                                    <Text size="semimedium" family="medium"> Total UPNL <Text color={wallet?.unRealizedPnL > 0 ? Colors.green : Colors.red}>{(wallet?.unRealizedPnL)?.toFixed(2)} {formatDisplayPair("USDT")}</Text></Text>
                                </Pressable>
                            )
                        }
                        {
                            positionOrder.length > 0 && (
                                <Input
                                    type="checkbox"
                                    label="Select All"
                                    initial={positionOrder.length > 0 && pairsList.length === positionOrder.length}
                                    onChange={(e) => {
                                        if (e) {
                                            const pairId = positionOrder.map((el) => el.pairId)
                                            dispatch(setPairsList({
                                                pairsList: pairId
                                            }))
                                        } else {
                                            dispatch(setPairsList({
                                                pairsList: []
                                            }))
                                        }
                                    }}
                                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                                />
                            )
                        }
                    </Flexcomponent>
                )}

                {viewMode === "risk" && (
                    // Risk View isn't available for this release yet - same ComingSoon
                    // gate as Options trading/Affiliate/Algo trading. RiskView itself is
                    // otherwise untouched and ready to go - flip RISK_VIEW_COMING_SOON
                    // back to false to re-enable it.
                    RISK_VIEW_COMING_SOON
                        ? <View style={{ paddingTop: "20%" }}><ComingSoon message="Risk View isn't available yet. Please check back later." /></View>
                        : <RiskView />
                )}
                {viewMode === "standard" && (() => {
                    const renderPositionCard = (item: any, index: number) => {
                        const isExpanded = expandedIndex === index;
                        return (
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.position, cardShadow]}>
                                <View style={{ width: "100%" }}>
                                    <Head ref={shareRef} pairname={item?.pairName}
                                        rightContent={
                                            <Input
                                                type="checkbox"
                                                initial={pairsList.some((el: any) => el === item?.pairId)}
                                                onChange={() => {
                                                    handleCloseOrder(item?.pairId)
                                                }}
                                                boxstyle={{
                                                    borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
                                                    backgroundColor: theme.midblack,
                                                    borderWidth: 1.5
                                                }}

                                            />
                                        } />
                                    <Card containerStyle={[style.positionCard, { borderWidth: 0, backgroundColor: "transparent" }]}>
                                        <View>
                                            <Flexcomponent justifyContent="space-between" style={{ marginVertical: 10 }}>
                                                <View style={{ width: "40%" }}>
                                                    <Text family="regular" size="small" color={Colors.stormGrey}>Position Side</Text>
                                                    <Text color={item?.positionSide === "long" ? Colors.green : Colors.red} family="medium" size="semimedium" >{sideEnum[item?.positionSide]}</Text>
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
                                                            <Text family="regular" size="small" color={Colors.stormGrey} align="flex-start">Est.Price</Text>
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
                                                                item?.bracketOrders?.length > 0 ? (
                                                                    <>
                                                                        <View>
                                                                            <Text family="medium" style={{ fontSize: RFvalue(10) }}>TP ({formatDisplayPair(futureTradePair.quoteCurrency)}) :{item?.takeprofit?.stopPrice == null || item?.takeprofit?.stopPrice === '' ? "--" : item?.takeprofit?.stopPrice}</Text>
                                                                            <Text family="medium" size="semimedium" style={{ fontSize: RFvalue(10) }}>SL ({formatDisplayPair(futureTradePair.quoteCurrency)}) :{item?.takeprofit?.stopPrice == null || item?.takeprofit?.stopPrice === '' ? "--" : item?.stoploss?.stopPrice}</Text>
                                                                        </View>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Text family="medium" align="flex-start">--</Text>
                                                                    </>
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
                                            {item?.bracketOrders?.length > 0 ? (
                                                <>
                                                    <Pressable style={[style.action, iconButtonStyle]}
                                                        onPress={() => handleShowProfitLossModal(item)} >
                                                        <VectorIcons
                                                            name="edit"
                                                            family="Feather"
                                                            size={windowwidth * 0.04}
                                                            iconcolor={theme.activetab}
                                                        />
                                                    </Pressable>
                                                    <Pressable style={[style.remove, iconButtonStyle]}
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
                                                </>
                                            ) : (
                                                <Pressable style={[style.action, iconButtonStyle]}
                                                    onPress={() => handleShowProfitLossModal(item)} >
                                                    <VectorIcons
                                                        name="edit"
                                                        family="Feather"
                                                        size={windowwidth * 0.04}
                                                        iconcolor={theme.activetab}
                                                    />
                                                </Pressable>
                                            )}
                                            <Pressable onPress={() => handleCloseProfitLossModal(item)} style={[style.closeContainer, closeButtonStyle]}>
                                                <Text family="semiBold" size="small" style={style.close}>Close</Text>
                                            </Pressable>
                                            <Pressable onPress={() => {
                                                // marginMode tags along so Share.tsx knows whether
                                                // item.initialMargin is a meaningful ROE denominator
                                                // (cross/portfolio margin isn't scoped to one position).
                                                setPnlCard({ ...item, marginMode })
                                                openbottomsheet(shareRef)
                                            }} style={[style.action, iconButtonStyle]} hitSlop={10}>
                                                <VectorIcons
                                                    family="Fontisto"
                                                    name={"share-a"}
                                                    size={windowwidth * 0.04}
                                                />
                                            </Pressable>
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
                    };

                    // nestedInScrollView means the outer screen already owns a vertical
                    // ScrollView (see the prop comment above) - rendering a FlatList's
                    // VirtualizedList in there breaks its windowing and trips RN's "never
                    // nest VirtualizedLists in a ScrollView" warning, so render plain
                    // Views instead and let the outer ScrollView do the scrolling.
                    if (nestedInScrollView) {
                        return (
                            <View style={{ paddingBottom: 10 }}>
                                {positionOrder.length === 0 ? (
                                    <View style={style.noData}>
                                        <NoData title="No Position" />
                                    </View>
                                ) : (
                                    positionOrder.map((item, index) => (
                                        <View key={`${typeof item?._id === "string" ? item._id : index}-${index}`}>
                                            {renderPositionCard(item, index)}
                                        </View>
                                    ))
                                )}
                                <Footer isLoading={isLoadingMore} />
                            </View>
                        );
                    }

                    return (
                        <FlatList
                            data={positionOrder}
                            keyExtractor={(item, index) => `${typeof item?._id === "string" ? item._id : index}-${index}`}
                            contentContainerStyle={{ paddingBottom: 10 }}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={<Footer isLoading={isLoadingMore} />}
                            onEndReached={() => {
                                const dataLength = positionDetails?.length ?? 0;
                                if ((dataLength > 0 || count !== dataLength) && nextPage) {
                                    loadMore();
                                }
                            }}
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            onEndReachedThreshold={0.3}
                            renderItem={({ item, index }) => renderPositionCard(item, index)}
                            ListEmptyComponent={() => (
                                <View style={style.noData} >
                                    <NoData title="No Position" />
                                </View>
                            )}
                        />
                    );
                })()}

                <ProfitLossModal
                    ref={bracketref}
                    orderData={selectOrder}
                />

                <CloseOrders
                    ref={closeBracketref}
                    data={closeData}
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