import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import { Button } from "../../../Components/Field";
import CallPutList from "../Component/CallPut";
import Header from "../Component/Header";
import OptionList from "../List";
import VectorIcons from "../../../Utilities/vectoricons";
import { Colors } from "../../../Utilities/uiasset";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import {
    optionTradeSelector,
    addStrategyContract,
    clearStrategyContracts,
    setCallslist,
    setPutslist,
    useLazyGetContractsQuery,
} from "../../../Slices/option";
import { buildStrategyLegPayload } from "../../../Utilities/strategyLeg";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'StrategyAddContracts'>;

const StrategyAddContracts: React.FC<Props> = ({ navigation }) => {
    const { theme } = useCustomHooks();
    const style = styles(theme);
    const dispatch = useDispatch();
    const expirySheetRef = useRef<BottomSheetModal>(null);

    const { callslist, putslist, options, pairlist } = useSelector(optionTradeSelector);
    const matchedAsset = pairlist?.find((p: any) => p.symbol === options);
    const currentPrice = parseFloat(matchedAsset?.marketPrice) || 0;
    const expiryList = useMemo(() => matchedAsset?.options ?? [], [matchedAsset]);

    // The main Options screen's selected expiry is local state there, not redux - it isn't
    // known here directly, so infer it from whichever contract the already-loaded
    // callslist/putslist actually belong to (same tickerRoot expiry segment convention).
    const inferredExpiry = useMemo(() => {
        const sample = callslist?.[0] ?? putslist?.[0];
        return sample?.tickerRoot?.split("-")?.[1];
    }, []);

    const [selectedExpiry, setSelectedExpiry] = useState<string | undefined>(inferredExpiry ?? expiryList?.[0]?.expiryDateStr);
    const [side, setSide] = useState<"calls" | "puts">("calls");
    const [addedCount, setAddedCount] = useState(0);

    const [getContract, { isFetching }] = useLazyGetContractsQuery();

    const handleSelectExpiry = useCallback(async (expiryDateStr: string) => {
        if (expiryDateStr === selectedExpiry) return;
        setSelectedExpiry(expiryDateStr);
        const response = await getContract({ token: options, expiry: expiryDateStr });
        const data = response?.data?.result?.data?.[0];
        dispatch(setCallslist(data?.callpair ?? []));
        dispatch(setPutslist(data?.putpair ?? []));
    }, [dispatch, getContract, options, selectedExpiry]);

    useEffect(() => {
        if (!expiryList.length) return;
        const stillValid = expiryList.some((c: any) => c.expiryDateStr === selectedExpiry);
        if (!stillValid) {
            setSelectedExpiry(expiryList[0].expiryDateStr);
        }
    }, [expiryList, selectedExpiry]);

    const listData = side === "puts" ? putslist : callslist;
    const atmIndex = useMemo(() => {
        if (!listData?.length || !currentPrice) return -1;
        return listData.findIndex((item: any) => item.strikePrice >= currentPrice);
    }, [listData, currentPrice]);

    const tableData = useMemo(() => {
        if (atmIndex === -1) return listData;
        const newData = [...listData];
        newData.splice(atmIndex + 1, 0, { isMarkPrice: true, strikePrice: currentPrice });
        return newData;
    }, [listData, atmIndex, currentPrice]);

    const currentPriceRef = useRef(currentPrice);
    useEffect(() => {
        currentPriceRef.current = currentPrice;
    }, [currentPrice]);

    // Stable across renders (useCallback) so CallPutList's React.memo actually holds -
    // an inline/recreated handler here would force every row in the chain to re-render
    // on every add, which is exactly what made this screen feel slow.
    const handleAddLeg = useCallback((item: any, buyOrSell: boolean, qty: string) => {
        dispatch(addStrategyContract(buildStrategyLegPayload(item, buyOrSell, qty)));
        setAddedCount((n) => n + 1);
    }, [dispatch]);

    const renderCallPutItem = useCallback(({ item }: { item: any }) => (
        <CallPutList
            item={item}
            type={side}
            underlyingPrice={currentPriceRef.current}
            pickerMode
            onAddLeg={handleAddLeg}
        />
    ), [side, handleAddLeg]);

    const listHeader = useMemo(() => <Header />, []);

    return (
        <Mainview isheader={false} isscollable={false} horizontalpadding={0} isbottomtab={false} gradientColors={theme.heroGradient} gradientLocations={[0, 0.22, 0.42]}>
            <View style={style.topBar}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
                    <VectorIcons family="Ionicons" name="chevron-back" size={22} iconcolor={theme.primarytext} />
                </Pressable>
                <Text family="medium">{options} OPTIONS</Text>
                <View style={{ width: 22 }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 }}>
                {expiryList.length > 0 ? (
                    <Pressable
                        onPress={() => expirySheetRef.current?.present()}
                        style={{
                            width: windowwidth * 0.36,
                            height: windowheight * 0.055,
                            borderRadius: 6,
                            backgroundColor: theme.card,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 12,
                        }}
                    >
                        <Text>{selectedExpiry}</Text>
                        <VectorIcons
                            family="Ionicons"
                            name="chevron-down"
                            iconcolor={theme.futuretext}
                            size={windowwidth * 0.05}
                        />
                    </Pressable>
                ) : (
                    <View style={{ width: windowwidth * 0.36 }} />
                )}
                <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable onPress={() => setSide("calls")} style={[style.tabBtn, side === "calls" && style.tabBtnActive]}>
                        <Text size="small" family={side === "calls" ? "bold" : "regular"}>Calls</Text>
                    </Pressable>
                    <Pressable onPress={() => setSide("puts")} style={[style.tabBtn, side === "puts" && style.tabBtnActive]}>
                        <Text size="small" family={side === "puts" ? "bold" : "regular"}>Puts</Text>
                    </Pressable>
                </View>
            </View>

            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text size="small" color={Colors.brand}>${currentPrice}</Text>
            </View>

            <View style={{ flex: 1 }}>
                <ScrollView
                    horizontal
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    overScrollMode="never"
                    nestedScrollEnabled={true}
                >
                    <FlatList
                        data={isFetching ? [] : tableData}
                        keyExtractor={(item: any, i) => item?._id ?? (item?.isMarkPrice ? "atm-marker" : i.toString())}
                        renderItem={renderCallPutItem}
                        ListHeaderComponent={listHeader}
                        stickyHeaderIndices={[0]}
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={16}
                        bounces={false}
                        overScrollMode="never"
                        initialNumToRender={14}
                        maxToRenderPerBatch={8}
                        windowSize={9}
                        updateCellsBatchingPeriod={24}
                        removeClippedSubviews={true}
                    />
                </ScrollView>
            </View>

            <View style={style.footer}>
                <View style={style.footerRow}>
                    <Text size="small" color={theme.secondarytext}>{addedCount} Contract{addedCount === 1 ? "" : "s"} Added</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                    <Button
                        title="Clear All"
                        buttonStyle={[style.outlineButton, { flex: 1 }]}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        onPress={() => {
                            dispatch(clearStrategyContracts());
                            setAddedCount(0);
                        }}
                    />
                    <Button
                        title="Done"
                        buttonStyle={{ flex: 1, opacity: addedCount === 0 ? 0.5 : 1 }}
                        disabled={addedCount === 0}
                        onPress={() => navigation.goBack()}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>
            </View>
            <OptionList
                data={expiryList}
                title="Expiry"
                ref={expirySheetRef}
                onClose={() => expirySheetRef.current?.close()}
                onSelect={(item: any) => handleSelectExpiry(item.expiryDateStr)}
                selectedId={expiryList?.find((d: any) => d.expiryDateStr === selectedExpiry)}
            />
        </Mainview>
    );
};

export default StrategyAddContracts;
