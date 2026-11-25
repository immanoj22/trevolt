import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useSelector } from "react-redux";

import OptionList from "./List";
import OptionChart from "./chart";
import Header from "./Component/Header";
import Text from "../../Components/text";
import CallPutList from "./Component/CallPut";
import Mainview from "../../Components/mainview";
import ComingSoon from "../../Components/ComingSoon";
import Bookcomponent from "../FutureNew/book";
import Tradecomponent from "../FutureNew/tradecomponent";
import Positions from "../Portfolio/Sections/Positions";
import { Dropdown } from "../../Components/Field";
import { Colors } from "../../Utilities/uiasset";
import VectorIcons from "../../Utilities/vectoricons";
import { RFvalue, borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { formatExpiryLabel, getRemainingTimeFromDate } from "../../Utilities/dateTime";
import Loadercomponent from "../../Components/loadercomponent";
import { BottomTabParamList } from "../../Navigations/navigationtypes";
import { isEmpty } from "../../Utilities/helerfunction";
import { feeSelector } from "../../Slices/feeSettings";
import { optionTradeSelector, setCallslist, setOption, setOptionMakerFee, setOptionPremiumPercentage, setOptionTakerFee, setPairlist, setPutslist, useLazyGetAllContractQuery, useLazyGetContractsQuery } from "../../Slices/option";
import { useAddFavouritePairMutation } from "../../Slices/future";

import { styles } from "./Component/styles";
import { socketService } from "../../Actions/Socket/socketManager";
import { title } from "process";
import OptionTrade from "./OptionTrade";
import PriceTable from "./tShapeList/PriceTable";
import VolumeTable from "./tShapeList/VolumeTable";
import GreeksTable from "./tShapeList/GreeksTable";

type Props = NativeStackScreenProps<BottomTabParamList, 'Option'>;

const Option: React.FC<Props> = () => {
    const { theme, navigation, dispatch, openbottomsheet, convert, isFocused, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);

    const [activeindex, setActive] = useState(0);
    const expirySheetRef = useRef<BottomSheetModal>(null);
    const [underlyingPrice, setUnderlyingPrice] = useState([]);
    const { pairlist, putslist, callslist, options } = useSelector(optionTradeSelector);
    const { feeSettingsList } = useSelector(feeSelector);
    const { futureFav } = useSelector((state: any) => state.auth.userData);
    const [addFavourite] = useAddFavouritePairMutation();
    const [contract, setContracts] = useState("tshape");
    // One shared mutation trigger serves every star across the whole screen (per-strike
    // rows in the T-shape tables and the calls/puts list) - track WHICH contract id is
    // in flight so only that row's star disables, instead of a single screen-wide
    // isLoading flag that would disable every star on any single tap.
    const [favouriteLoadingId, setFavouriteLoadingId] = useState<string | null>(null);

    const matchedAsset = useMemo(() => {
        return pairlist?.find((p: any) => p.symbol === options);
    }, [pairlist, options]);

    const contracts = matchedAsset?.options ?? [];

    // The underlying-asset list is backend/environment driven (e.g. BNB in some
    // environments, BTC/ETH in others) — it must not be hardcoded. If the currently
    // selected symbol isn't one of the assets the backend actually returned, fall back
    // to the first available one.
    useEffect(() => {
        if (!pairlist?.length) return;
        const stillValid = pairlist.some((p: any) => p.symbol === options);
        if (!stillValid) {
            dispatch(setOption(pairlist[0].symbol));
        }
    }, [pairlist]);

    // triggerOptionLists() (fired once, app-wide, on login) is normally what populates
    // this — but if this screen is opened before that resolves (or it failed), don't
    // leave the screen stuck empty waiting for a manual currency tap: fetch it directly.
    // Gated on `isFocused` (not just mount) because the first time this tab is opened,
    // the bottom-tab navigator can finish mounting/focusing this screen slightly after
    // this effect would otherwise have already fired once and gone stale — which is
    // exactly what produced "nothing renders until I tap the tab again".
    const [getAllContract] = useLazyGetAllContractQuery();
    useEffect(() => {
        if (!isFocused || pairlist?.length) return;
        (async () => {
            const response = await getAllContract(true);
            // Only ever write a non-empty result — this races with the app-wide
            // triggerOptionLists() fetch, and a failed/slower response here must
            // never clobber data that call already populated.
            if (response?.data?.result?.length) {
                dispatch(setPairlist(response.data.result));
            }
        })();
    }, [isFocused]);

    const [selectedExpiry, setSelectedExpiry] = useState(contracts?.[0]?.expiryDateStr);
    const selectedContractMeta = useMemo(() => (
        contracts?.find((c: any) => c.expiryDateStr === selectedExpiry)
    ), [contracts, selectedExpiry]);
    // The REST fallback (matchedAsset.marketPrice) can come back as a raw, unparsed
    // exchange string with long trailing decimals (e.g. "584.60000000") before the first
    // live socket tick overwrites it with a clean parsed number — normalize both paths
    // through parseFloat so the displayed value always matches web's trimmed formatting,
    // instead of only lining up once the socket happens to have already fired.
    const rawSelectedPrice = options ? underlyingPrice[options.toLowerCase()] ?? matchedAsset?.marketPrice ?? 0 : 0;
    const selectedPrice = parseFloat(String(rawSelectedPrice)) || 0;

    const [getContract, { isFetching }] = useLazyGetContractsQuery();
    const contractRequestId = useRef(0);

    const handlegetContract = async () => {
        // `options` starts out as a hardcoded default ("BTC") before the pairlist has
        // loaded and corrected it to whatever asset the backend actually has (e.g. BNB
        // in this environment). Web never fires the contract-details request until it
        // already knows the right symbol — wait for `matchedAsset` (proof `options` is a
        // real, confirmed entry in pairlist) so mobile doesn't fire a wasted/wrong request
        // for "BTC" first.
        if (!options || !selectedExpiry || !matchedAsset) return;
        const requestId = ++contractRequestId.current;
        const params = {
            token: options,
            expiry: selectedExpiry
        }
        const response = await getContract(params);
        // Guard against rapid currency/expiry switching firing overlapping requests —
        // only the most recently-issued request is allowed to apply its result, so a
        // slow, now-stale response can't clobber the list with the wrong contract's data.
        if (requestId !== contractRequestId.current) return;
        const data = response?.data?.result?.data?.[0];
        dispatch(setCallslist(data?.callpair ?? []));
        dispatch(setPutslist(data?.putpair ?? []));
    }

    useEffect(() => {
        if (!isFocused) return;
        handlegetContract()
    }, [options, selectedExpiry, isFocused]);

    useEffect(() => {
        if (!contracts?.length) return;
        const stillValid = contracts.some((c: any) => c.expiryDateStr === selectedExpiry);
        if (!stillValid) {
            setSelectedExpiry(contracts[0].expiryDateStr);
        }
    }, [contracts]);

    // Same lookup pattern as futures' fee resolution in Market/market.tsx, but scoped to
    // tradeMode 'option' — this was entirely missing before, so option order screens were
    // silently reusing whatever futures fee values happened to be in redux (or 0).
    useEffect(() => {
        if (!feeSettingsList?.length) return;
        let makerFeeSetting: any = feeSettingsList.find((val: any) => (
            val.pairName == options && val.tradeMode == 'option' && val.status == 'active' && val.feeType == 'maker'
        ));
        let takerFeeSetting: any = feeSettingsList.find((val: any) => (
            val.pairName == options && val.tradeMode == 'option' && val.status == 'active' && val.feeType == 'taker'
        ));
        if (isEmpty(makerFeeSetting)) {
            makerFeeSetting = feeSettingsList.find((val: any) => (
                val.pairName == 'all' && val.tradeMode == 'option' && val.status == 'active' && val.feeType == 'maker'
            ));
        }
        if (isEmpty(takerFeeSetting)) {
            takerFeeSetting = feeSettingsList.find((val: any) => (
                val.pairName == 'all' && val.tradeMode == 'option' && val.status == 'active' && val.feeType == 'taker'
            ));
        }
        dispatch(setOptionMakerFee(makerFeeSetting?.feePercentage ?? 0));
        dispatch(setOptionTakerFee(takerFeeSetting?.feePercentage ?? 0));
        dispatch(setOptionPremiumPercentage(takerFeeSetting?.premiumPercentage ?? 0));
    }, [options, feeSettingsList]);

    const listData = useMemo(() => {
        if (contract === "puts") return putslist;
        return callslist;
    }, [callslist, putslist, contract]);

    // The ATM boundary only actually shifts when price crosses a strike — not on every
    // single sub-tick — so key the insertion index off that, not the raw live price.
    // Previously `tableData` depended directly on `selectedPrice`, rebuilding a brand-new
    // array (and forcing a full FlatList re-render) on every socket price tick even though
    // the marker's position hadn't moved — that constant background churn was competing
    // with the JS thread for tap/selection updates, making row selection feel slow.
    const atmIndex = useMemo(() => {
        if (!listData?.length || !selectedPrice) return -1;
        return listData.findIndex((item: any) => item.strikePrice >= selectedPrice);
    }, [listData, selectedPrice]);

    const tableData = useMemo(() => {
        if (atmIndex === -1) return listData;
        const newData = [...listData];
        // Matches web: the ATM divider sits below the current-price strike row, not
        // above it — insert right after the matched row, not before it.
        newData.splice(atmIndex + 1, 0, { isMarkPrice: true, strikePrice: selectedPrice });
        return newData;
    }, [listData, atmIndex]);

    // Chart/Order Book/Recent Trades/the persistent Buy-Sell bar all need one specific
    // contract to point at — default to the ATM (nearest-to-spot strike) contract in the
    // current calls/puts list, same instrument the table highlights, falling back to the
    // first contract. This matches web's behavior of always having a "current" contract,
    // even before the user taps anything.
    const atmContract = useMemo(() => {
        if (!listData?.length) return null;
        if (atmIndex === -1) return listData[0];
        return listData[atmIndex] ?? listData[0];
    }, [listData, atmIndex]);

    // Web updates the whole page (trade panel, chart, order book) in place when you click
    // a strike row, instead of navigating away — this tracks that same "currently
    // selected contract" concept so tapping a row visibly does something (highlights it,
    // and drives Chart/Order Book/Recent Trades/Buy-Sell) rather than only navigating.
    const [selectedContract, setSelectedContract] = useState<any>(null);
    const currentContract = selectedContract ?? atmContract;

    // A manual row-tap selection only makes sense for the specific currency/expiry/side
    // it was made on — reset back to the auto ATM pick whenever any of those change,
    // same as web resetting its selection when you navigate to a different pair.
    useEffect(() => {
        setSelectedContract(null);
    }, [options, selectedExpiry, contract]);

    // Tapping a strike swaps this screen's body to the contract detail dashboard
    // (chart/order book/positions/embedded buy-sell), same in-place-swap pattern Market
    // uses for <Future/> — the bottom tab bar stays visible since this isn't a stack
    // push. The persistent Buy/Sell bar is gone; Buy/Sell now lives on that screen.
    const [showTrade, setShowTrade] = useState(false);
    const handleSelectContract = useCallback((item: any) => {
        if (!item) return;
        setSelectedContract(item);
        setShowTrade(true);
    }, []);
    const handleCloseTrade = useCallback(() => setShowTrade(false), []);

    // Bottom-tab screens stay mounted across tab switches — without this, leaving the
    // Option tab while OptionTrade is showing and coming back would still be sitting on
    // OptionTrade instead of resetting to the list, since `showTrade` never actually
    // unmounted. Reset it on blur so returning to the tab always starts at the list.
    useEffect(() => {
        if (!isFocused) setShowTrade(false);
    }, [isFocused]);

    // Per-strike favourite toggle for the List rows - same generic addFavouritePair API,
    // just scoped to whichever contract's row the user actually tapped the star on
    // (matches web's per-strike star in CallPutTable.jsx), rather than only the header's
    // single "currently selected contract" star above.
    const handleToggleContractFavourite = async (item: any) => {
        if (!item?._id) return;
        setFavouriteLoadingId(item._id);
        try {
            const response: any = await addFavourite({ pairId: item._id, pairName: item.tickerRoot }).unwrap();
            if (response?.success) {
                successtoast("Success", response.message);
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (e) {
            failuretoast("Error", "Something went wrong!");
        } finally {
            setFavouriteLoadingId(null);
        }
    };

    // `renderItem` deliberately does NOT depend on `currentContract` — if it did, tapping
    // a row would recreate this function every time, which FlatList treats as "redraw
    // every mounted cell" just to flip one row's highlight (that full-list redraw is what
    // was showing up as a delay after tapping, not any API wait — selecting is pure local
    // state with nothing async in it). Instead the current selection is read through a
    // ref so `renderItem` stays stable, and `extraData` below tells FlatList to re-check
    // only the (small number of) rows whose `isSelected` actually changed.
    const currentContractRef = useRef(currentContract);
    useEffect(() => {
        currentContractRef.current = currentContract;
    }, [currentContract]);

    const selectedPriceRef = useRef(selectedPrice);
    useEffect(() => {
        selectedPriceRef.current = selectedPrice;
    }, [selectedPrice]);

    const renderCallPutItem = useCallback(({ item }: { item: any }) => (
        <CallPutList
            type={contract}
            item={item}
            underlyingPrice={selectedPriceRef.current}
            conv={convert}
            isSelected={!item.isMarkPrice && currentContractRef.current?._id === item?._id}
            onSelect={handleSelectContract}
            isFavourite={futureFav?.some((f: any) => f.pairName === item?.tickerRoot)}
            onToggleFavourite={() => handleToggleContractFavourite(item)}
            isTogglingFavourite={favouriteLoadingId === item?._id}
        />
    ), [contract, convert, futureFav, handleSelectContract, favouriteLoadingId]);

    const tabs = [
        { title: "List" },
        { title: "Chart" },
        { title: "Order Book" },
        { title: "Recent Trades" },
        { title: "Positions" },
    ];

    const tShapeTabs = [
        { title: "Price" },
        { title: "OI/Vol" },
        { title: "Greeks" }
    ]

    const [tabindex, setTabindex] = useState(0);
    const [tShapeIndex, setTShapeIndex] = useState("Price");
    // Embedded Positions tab shows every open option position, unfiltered by pair -
    // matches the same convention used on the Future trade screen's Positions tab.
    const embeddedFutureId = useRef("all");

    const handleUnderlyingPriceUpdate = useCallback((data: any) => {
        setUnderlyingPrice((prev: any) => ({
            ...prev,
            [data.underlyingAsset.toLowerCase()]: data.price
        }));
    }, [])

    // NOTE: "OptionPriceUpdate" is subscribed once, globally, in HelperComponent.tsx
    // (which also recomputes open-position PnL on the same event). socketService only
    // supports one handler per event name, so registering it again here would silently
    // no-op the subscription and, worse, its cleanup would tear down the global listener
    // when this screen unmounts. Only "UnderlyingPriceUpdate" (screen-local UI state,
    // not subscribed elsewhere) is registered here.
    useEffect(() => {
        if (!socketService) return;
        socketService.on("UnderlyingPriceUpdate", handleUnderlyingPriceUpdate);
        return () => {
            socketService.off("UnderlyingPriceUpdate", handleUnderlyingPriceUpdate);
        }
    }, [socketService])

    // The API returns calls and puts as separate lists. Pair them by the real
    // `strikePrice` field so the T-shape table always keeps the strike in the centre.
    const tshapeData = useMemo(() => {
        const callsByStrike = new Map<string, any>();
        const putsByStrike = new Map<string, any>();

        callslist.forEach((call: any) => callsByStrike.set(String(call.strikePrice), call));
        putslist.forEach((put: any) => putsByStrike.set(String(put.strikePrice), put));

        const rows: any[] = Array.from(new Set([...callsByStrike.keys(), ...putsByStrike.keys()]))
            .sort((left, right) => Number(left) - Number(right))
            .map((strikePrice) => ({
                strikePrice,
                call: callsByStrike.get(strikePrice),
                put: putsByStrike.get(strikePrice),
            }));

        const currentPriceIndex = rows.findIndex((row) => Number(row.strikePrice) >= selectedPrice);
        if (selectedPrice > 0 && currentPriceIndex !== -1) {
            rows.splice(currentPriceIndex + 1, 0, {
                isMarkPrice: true,
                strikePrice: selectedPrice,
            });
        }

        return rows;
    }, [callslist, putslist, selectedPrice]);

    // Options trading isn't available for this release yet - matches web's
    // ComingSoon gate on OptionsTrading.jsx. Kept below all hooks so this doesn't
    // change hook order/count. Flip this back to false to re-enable - everything
    // below (including the showTrade branch and the full trading UI) is otherwise
    // untouched and ready to go.
    const OPTIONS_COMING_SOON = false;
    if (OPTIONS_COMING_SOON) {
        return (
            <Mainview
                isheader={false}
                isscollable={false}
                horizontalpadding={0}
                isbottomtab={true}
                gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
                gradientLocations={[0, 0.45, 1]}
            >
                <ComingSoon message="Options trading isn't available yet. Please check back later." />
            </Mainview>
        );
    }

    if (showTrade && currentContract) {
        return <OptionTrade contract={currentContract} underlyingSymbol={options} onBack={handleCloseTrade} />;
    }

    return (
        <Mainview
            isheader={false}
            isscollable={false}
            horizontalpadding={0}
            isbottomtab={true}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1 }}>
                <Flexcomponent justifyContent="center" alignItems="center" style={{ paddingHorizontal: 20 }}>
                    <Text size="medium" family="medium">Options</Text>
                    {/* <Currencyswitch
                        index={getItem("convertCurrency") || "INR"}
                        onchangeindex={(currency: string) => {
                            setItem("convertCurrency", currency);
                            setActive(currency === "INR" ? 0 : 1);
                        }}
                    /> */}
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ paddingHorizontal: 20, marginTop: "3%" }}>
                    <View style={{ width: windowwidth * 0.23 }}>
                        <Dropdown
                            themes={theme}
                            placeholder=""
                            value={options}
                            height={windowheight * 0.055}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            inputStyle={{ elevation: 0, borderColor: theme.infoCardBorder, borderWidth: 1, borderRadius: 5, paddingHorizontal: 10 }}
                            list={pairlist?.map((p: any) => ({ label: p.symbol, value: p.symbol })) ?? []}
                            onChange={(value: any) => dispatch(setOption(value?.value))}
                            modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                        />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                width: windowwidth * 0.36,
                                height: windowheight * 0.045,
                                padding: 3,
                                gap: 3,
                                borderRadius: borderradius * 0.6,
                                backgroundColor: theme.theme == 'dark' ? "#111A2D" : "#E8EFFC",
                                borderWidth: 1,
                                borderColor: theme.infoCardBorder,
                            }}
                        >
                            {/* <Pressable
                            onPress={() => setContracts("calls")}
                            style={{
                                flex: 1,
                                borderRadius: borderradius * 0.4,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: contract === "calls" ? Colors.brand : "transparent",
                            }}
                        >
                            <Text
                                size="small"
                                family={contract === "calls" ? "semiBold" : "regular"}
                                color={contract === "calls" ? Colors.white : theme.secondarytext}
                            >
                                Calls
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setContracts("puts")}
                            style={{
                                flex: 1,
                                borderRadius: borderradius * 0.4,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: contract === "puts" ? Colors.red : "transparent",
                            }}
                        >
                            <Text
                                size="small"
                                family={contract === "puts" ? "semiBold" : "regular"}
                                color={contract === "puts" ? Colors.white : theme.secondarytext}
                            >
                                Puts
                            </Text>
                        </Pressable> */}
                            <Pressable onPress={() => navigation.navigate("StrategyBuilder")} style={{ flexDirection: "row", alignItems: "center", paddingLeft: 10 }}>
                                <Text size="small" color={theme.homegreen} family="medium">Strategy Builder</Text>
                                <VectorIcons family="Ionicons" name="chevron-forward" size={14} iconcolor={theme.homegreen} />
                            </Pressable>
                        </View>
                        <VectorIcons
                            family="Ionicons"
                            name="ellipsis-vertical"
                            iconcolor={"#6D7584"}
                            size={windowwidth * 0.05}
                        />
                    </View>

                </Flexcomponent>
                <View style={style.contracts}>
                    {
                        contracts.length > 0 ? (
                            <Pressable onPress={() => openbottomsheet(expirySheetRef)} style={style.date}>
                                <Text>{formatExpiryLabel(selectedExpiry)}</Text>
                                <VectorIcons
                                    family="Ionicons"
                                    name={"chevron-down"}
                                    iconcolor={theme.futuretext}
                                    size={windowwidth * 0.05}
                                />
                            </Pressable>
                        ) : (
                            <View style={{ width: "40%" }} />
                        )
                    }
                    {/* <Pressable onPress={() => navigation.navigate("StrategyBuilder")} style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text size="small" color={theme.homegreen} family="medium">Strategy Builder</Text>
                                <VectorIcons family="Ionicons" name="chevron-forward" size={14} iconcolor={theme.homegreen} />
                            </Pressable> */}
                    <View
                        style={{
                            flexDirection: "row",
                            width: windowwidth * 0.50,
                            height: windowheight * 0.050,
                            padding: 1,
                            gap: 3,
                            // borderRadius: borderradius * 0.6,
                            // backgroundColor: theme.infoCardBg,
                            // borderWidth: 1,
                            // borderColor: theme.infoCardBorder,
                        }}
                    >
                        <Pressable
                            onPress={() => setContracts("tshape")}
                            style={{
                                flex: 1,
                                borderRadius: borderradius * 0.4,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: contract === "tshape" ? Colors.brand : theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                                paddingHorizontal: 10,
                                borderWidth: 1,
                                borderColor: theme.theme == 'dark' ? "#2F2F2F" : "#E2E8F0",
                            }}
                        >
                            <Text
                                size="small"
                                // family={contract === "tshape" ? "semiBold" : "regular"}
                                color={contract === "tshape" ? Colors.white : theme.secondarytext}
                            >
                                T-Shape
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setContracts("calls")}
                            style={{
                                flex: 1,
                                borderRadius: borderradius * 0.4,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: contract === "calls" ? Colors.brand : theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                                borderWidth: 1,
                                borderColor: theme.theme == 'dark' ? "#2F2F2F" : "#E2E8F0",
                                width: windowwidth * 0.1
                            }}
                        >
                            <Text
                                size="small"
                                // family={contract === "calls" ? "semiBold" : "regular"}
                                color={contract === "calls" ? Colors.white : theme.secondarytext}
                            >
                                Calls
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setContracts("puts")}
                            style={{
                                flex: 1,
                                borderRadius: borderradius * 0.4,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: contract === "puts" ? Colors.brand : theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                                borderWidth: 1,
                                borderColor: theme.theme == 'dark' ? "#2F2F2F" : "#E2E8F0",
                            }}
                        >
                            <Text
                                size="small"
                                family={contract === "puts" ? "semiBold" : "regular"}
                                color={contract === "puts" ? Colors.white : theme.secondarytext}
                            >
                                Puts
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* <View style={style.expiry}>
                    <Text color={theme.secondarytext}>{options} <Text color={Colors.brand} family="bold">${selectedPrice}</Text> {selectedContractMeta?.expiryDate ? `Time to expiry ${getRemainingTimeFromDate(selectedContractMeta.expiryDate)}` : ''}</Text>
                </View> */}

                {/* Same live 24h-stats swiper pattern as Futures - here it's scoped to the
                currently selected contract (matches web's MarketSummary: percent24Change/
                last/markIV/volume), since options don't have an underlying-level 24h
                high/low the way a futures pair does. Fed by the same "OptionPriceUpdate"
                socket event already keeping callslist/putslist live (HelperComponent.tsx),
                so this isn't static/decorative - it updates in real time. */}
                {/* {currentContract && (
                    <View style={{ paddingHorizontal: "2%" }}>
                        <Flexcomponent
                            justifyContent="space-between"
                            style={{ marginTop: "2%", borderRadius: borderradius * 0.5, width: "100%", borderWidth: 1, borderColor: theme.infoCardBorder }}
                            paddingHorizontal={"2%"}
                            height={windowheight * 0.07}
                            bakgroundcolor={theme.infoCardBg}
                        >
                            <ScrollView
                                horizontal={true}
                                showsHorizontalScrollIndicator={false}
                                style={{ width: "100%" }}
                                contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
                            >
                                <View style={[style.statContainer, { width: windowwidth * 0.20 }]}>
                                    <Text fontSize={RFvalue(12.5)} family="medium" numoflines={1} color={Colors.brand}>{convert(currentContract?.marketPrice)}</Text>
                                    <Text fontSize={RFvalue(10.5)} numoflines={1} color={parseFloat(currentContract?.percent24Change) >= 0 ? theme.profit : Colors.red}>{currentContract?.percent24Change ?? 0}%</Text>
                                </View>
                                <View style={[style.statContainer, { width: windowwidth * 0.20 }]}>
                                    <Text fontSize={RFvalue(10.5)} numoflines={1} color={theme.secondarytext}>24h Change</Text>
                                    <Text fontSize={RFvalue(12.5)} family="medium" numoflines={1} color={parseFloat(currentContract?.percent24Change) >= 0 ? Colors.green : Colors.red}>{currentContract?.percent24Change ?? 0}%</Text>
                                </View>
                                <View style={[style.statContainer, { width: windowwidth * 0.20 }]}>
                                    <Text fontSize={RFvalue(10.5)} numoflines={1} color={theme.secondarytext}>24h High</Text>
                                    <Text fontSize={RFvalue(12.5)} family="medium" numoflines={1} color={theme.futuretext}>{convert(currentContract?.high)}</Text>
                                </View>
                                <View style={[style.statContainer, { width: windowwidth * 0.20 }]}>
                                    <Text fontSize={RFvalue(10.5)} numoflines={1} color={theme.secondarytext}>24h Low</Text>
                                    <Text fontSize={RFvalue(12.5)} family="medium" numoflines={1} color={theme.futuretext}>{convert(currentContract?.low)}</Text>
                                </View>
                                <View style={[style.statContainer, { width: windowwidth * 0.20 }]}>
                                    <Text fontSize={RFvalue(10.5)} numoflines={1} color={theme.secondarytext}>24h Vol ({currentContract?.baseCurrency ?? options})</Text>
                                    <Text fontSize={RFvalue(12.5)} family="medium" numoflines={1} color={theme.futuretext}>{convert(currentContract?.volume)}</Text>
                                </View>
                                <View style={[style.statContainer, { width: windowwidth * 0.20 }]}>
                                    <Text fontSize={RFvalue(10.5)} numoflines={1} color={theme.secondarytext}>24h Vol ({currentContract?.quoteCurrency ?? "USDT"})</Text>
                                    <Text fontSize={RFvalue(12.5)} family="medium" numoflines={1} color={theme.futuretext}>{convert(currentContract?.deal)}</Text>
                                </View>
                            </ScrollView>
                        </Flexcomponent>
                    </View>
                )} */}

                {/* <View
                    style={{
                        marginTop: "2%",
                        marginHorizontal: "2%",
                        borderRadius: borderradius * 0.6,
                        backgroundColor: theme.infoCardBg,
                        borderWidth: 1,
                        borderColor: theme.infoCardBorder,
                    }}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ height: windowheight * 0.06, flexGrow: 0 }}
                        contentContainerStyle={{ paddingHorizontal: 8, gap: 8, alignItems: "center" }}
                    >
                        {tabs.map((t, i) => (
                            <Pressable key={t.title} onPress={() => setTabindex(i)} style={[i === tabindex ? style.activetab : style.inactivetab, { width: "auto", paddingVertical: 8, paddingHorizontal: 16 }]}>
                                <Text fontSize={RFvalue(11)} family="medium" numoflines={1} color={i === tabindex ? Colors.white : theme.futuretext}>{t.title}</Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View> */}
                {contract == "tshape" &&
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginTop: "2%", paddingHorizontal: "3%"}}>
                        <View style={{ marginTop: "2%" }}>
                            <Text style={{fontSize: RFvalue(10)}} color={theme.primarytext}>Calls</Text>
                        </View>
                        <View
                            style={{
                                marginTop: "2%",
                                marginHorizontal: "2%",
                                borderRadius: borderradius * 0.6,
                                backgroundColor: theme.theme == 'dark' ? "#111A2D" : "#FFFFFF",
                                borderWidth: 1,
                                borderColor: theme.infoCardBorder,
                                width: "60%",
                            }}
                        >
                            <View
                                style={{
                                    height: windowheight * 0.06,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center", // center tabs
                                    paddingHorizontal: 15,
                                    gap: 5,
                                }}
                            >
                                {tShapeTabs.map((t, i) => (
                                    <Pressable
                                        key={t.title}
                                        onPress={() => setTShapeIndex(t.title)}
                                        style={[
                                            tShapeIndex === t.title ? style.activetab : style.tshapeInactiveTab,
                                            {
                                                paddingVertical: 7,
                                                paddingHorizontal: 3,
                                            },
                                        ]}
                                    >
                                        <Text
                                            fontSize={RFvalue(11)}
                                            family="medium"
                                            numoflines={1}
                                            color={tShapeIndex === t.title ? Colors.white : theme.futuretext}
                                        >
                                            {t.title}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                        <View style={{ marginTop: "2%" }}>
                            <Text style={{fontSize: RFvalue(10)}} color={theme.primarytext} > Puts</Text>
                        </View>
                    </View>
                }

                <View style={style.subcontainer}>
                    {
                        tabindex === 0 && (
                            isFetching ? (
                                <View style={style.loader}>
                                    <Loadercomponent />
                                </View>
                            ) : (
                                contract === "tshape" && tShapeIndex == "Price" ? (
                                    <PriceTable
                                        data={tshapeData}
                                        onSelect={handleSelectContract}
                                        selectedId={currentContract?._id}
                                        currentPrice={selectedPrice}
                                        underlyingSymbol={options}
                                        onStrikeHeaderPress={() => openbottomsheet(expirySheetRef)}
                                        isFavourite={(item: any) => futureFav?.some((f: any) => f.pairName === item?.tickerRoot)}
                                        onToggleFavourite={handleToggleContractFavourite}
                                        isTogglingFavourite={(item: any) => favouriteLoadingId === item?._id}
                                    />
                                ) :
                                (
                                contract === "tshape" && tShapeIndex == "OI/Vol" ? (
                                    <VolumeTable
                                        data={tshapeData}
                                        onSelect={handleSelectContract}
                                        selectedId={currentContract?._id}
                                        currentPrice={selectedPrice}
                                        underlyingSymbol={options}
                                        onStrikeHeaderPress={() => openbottomsheet(expirySheetRef)}
                                        isFavourite={(item: any) => futureFav?.some((f: any) => f.pairName === item?.tickerRoot)}
                                        onToggleFavourite={handleToggleContractFavourite}
                                        isTogglingFavourite={(item: any) => favouriteLoadingId === item?._id}
                                    />
                                ) :

                                (
                                contract === "tshape" && tShapeIndex == "Greeks" ? (
                                    <GreeksTable
                                        data={tshapeData}
                                        onSelect={handleSelectContract}
                                        selectedId={currentContract?._id}
                                        currentPrice={selectedPrice}
                                        underlyingSymbol={options}
                                        onStrikeHeaderPress={() => openbottomsheet(expirySheetRef)}
                                        isFavourite={(item: any) => futureFav?.some((f: any) => f.pairName === item?.tickerRoot)}
                                        onToggleFavourite={handleToggleContractFavourite}
                                        isTogglingFavourite={(item: any) => favouriteLoadingId === item?._id}
                                    />
                                ) : (
                                    <View style={{ flex: 1 }}>
                                        <ScrollView
                                            horizontal
                                            bounces={false}
                                            showsHorizontalScrollIndicator={false}
                                            overScrollMode="never"
                                        >
                                            <FlatList
                                                data={tableData}
                                                keyExtractor={(item: any, i) => item?._id ?? (item?.isMarkPrice ? 'atm-marker' : i.toString())}
                                                renderItem={renderCallPutItem}
                                                extraData={`${currentContract?._id ?? ""}-${atmIndex}`}
                                                ListHeaderComponent={<Header />}
                                                stickyHeaderIndices={[0]}
                                                showsVerticalScrollIndicator={false}
                                                scrollEventThrottle={18}
                                                bounces={false}
                                                overScrollMode="never"
                                                initialNumToRender={14}
                                                maxToRenderPerBatch={10}
                                                windowSize={7}
                                                updateCellsBatchingPeriod={50}
                                                removeClippedSubviews={true}
                                            />
                                        </ScrollView>
                                    </View>
                                )
                            )
                        )
                        )
                        )
                    }
                    {
                        tabindex === 1 && (
                            <OptionChart ticker={currentContract?.tickerRoot} />
                        )
                    }
                    {
                        tabindex === 2 && (
                            <Bookcomponent currentIndex={currentContract?._id} tickerRoot={currentContract?.tickerRoot} header={false} />
                        )
                    }
                    {
                        tabindex === 3 && (
                            <Tradecomponent pairId={currentContract?._id} tickerRoot={currentContract?.tickerRoot} />
                        )
                    }
                    {
                        tabindex === 4 && (
                            <Positions
                                tab="Positions"
                                active="Options"
                                futureId={embeddedFutureId}
                                tradeMode="option"
                                showFilter={false}
                            />
                        )
                    }
                </View>
            </View>
            {contract &&
                <OptionList
                    data={contracts}
                    title={"Expiry"}
                    ref={expirySheetRef}
                    onClose={() => expirySheetRef.current?.close()}
                    onSelect={(item: any) => setSelectedExpiry(item.expiryDateStr)}
                    selectedId={contracts?.find((d: any) => d.expiryDateStr === selectedExpiry)}
                />}
        </Mainview>
    )
}

export default Option;
