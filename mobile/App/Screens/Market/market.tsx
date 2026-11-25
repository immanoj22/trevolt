// import React, { useEffect, useMemo, useState } from "react";
// import { Pressable, TextInput, View } from "react-native";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import { useSelector } from "react-redux";

// import Marketfuture from "./future";
// import Future from "../FutureNew/future"; // the chart/trade screen
// import Mainview from "../../Components/mainview";
// import VectorIcons from "../../Utilities/vectoricons";
// import useApiError from "../../Actions/Hooks/errorhook";
// import { isEmpty } from "../../Utilities/helerfunction";
// import Flexcomponent from "../../Components/flexcomponent";
// import { setItem } from "../../Actions/Storage/localstorage";
// import { Colors, Fontfamily, Fontsize } from "../../Utilities/uiasset";
// import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
// import useCustomHooks from "../../Actions/Hooks/customhook";
// import { borderradius, RFvalue, windowheight, windowwidth } from "../../Utilities/dimensions";
// import { MakerFee, setFutureTicker, setTradePairData, TakerFee, useAddFavouritePairMutation, useUpdateTabMutation } from "../../Slices/future";
// import { setUserData } from "../../Slices/auth";
// import { styles } from "../Portfolio/styles";
// import Text from "../../Components/text";

// interface PairData {
//     _id: string;
//     baseCurrency: string;
//     quoteCurrency: string;
//     tickerRoot: string;
//     marketPrice: number;
//     last: number;
//     change: number;
//     volume: number;
// }

// type Props = NativeStackScreenProps<Stacknavigationtypes, 'Market'>;

// const tabs = ['Watchlist', 'Futures', 'Options'];

// const Market: React.FC<Props> = ({ navigation }) => {

//     const { theme, dispatch, successtoast, failuretoast } = useCustomHooks();
//     const style = styles(theme);
//     const { futurePairData, futureTradePair } = useSelector((state: any) => state.future);
//     const { futureFav } = useSelector((state: any) => state.auth.userData);
//     const { userData } = useSelector((state: any) => state.auth);
//     const { feeSettingsList } = useSelector((state: any) => state.fee);

//     const [activeindex, setActiveindex] = useState(0);
//     const [pairSearch, setPairSearch] = useState<string>('');
//     const [pairData, setPairData] = useState<PairData[]>([]);

//     // NEW: component-swap state instead of navigation.navigate("Future")
//     const [showFuture, setShowFuture] = useState(false);

//     const [addFavourite, { error }] = useAddFavouritePairMutation();
//     const [UpdateTab, { isLoading }] = useUpdateTabMutation();

//     useApiError(error);

//     const handleAddFavourite = async (id: any, name: any) => {
//         const payload: any = {
//             pairId: id,
//             pairName: name,
//         };
//         const response = await addFavourite(payload).unwrap();
//         if (response.success) {
//             const isCurrentlyFav = (futureFav ?? []).some((fav: any) => fav.pairName === name);
//             const updatedFav = isCurrentlyFav
//                 ? (futureFav ?? []).filter((fav: any) => fav.pairName !== name)
//                 : [...(futureFav ?? []), { pairId: id, pairName: name }];
//             dispatch(setUserData({ ...userData, futureFav: updatedFav }));
//             successtoast("Success", response.message);
//         } else {
//             failuretoast("Error", "Something went wrong!");
//         }
//     };

//     const handlePairSearch = (text: string) => {
//         setPairSearch(text);
//     };

//     // Called from Marketfuture when a pair is tapped.
//     // Swaps this screen's body to show <Future/> instead of navigating away,
//     // so we never leave the Market tab and the bottom tab bar stays visible.
//     const handleOpenFuture = (tickerRoot: string) => {
//         try {
//             const pairDetail = futurePairData.find((val: any) => val.tickerRoot === tickerRoot);
//             setItem("futurespair", tickerRoot);
//             dispatch(setTradePairData(pairDetail));
//             dispatch(setFutureTicker(pairDetail));
//             setShowFuture(true);
//         } catch (error) {
//             console.log('handleOpenFuture__err', error);
//         }
//     };

//     const handleCloseFuture = () => {
//         setShowFuture(false);
//     };

//     const updateCurrentTab = async (pairId: any, tradeMode: any, selectedTab: any) => {
//         try {
//             const payload = {
//                 pairId: pairId,
//                 tradeMode: tradeMode,
//                 filterType: selectedTab
//             };
//             const result = await UpdateTab(payload);
//         } catch (error) {
//             console.log("updateCurrentTab_err", error);
//         }
//     };

//     useMemo(() => {
//         if (userData?.filterType == 'currentContract' && userData?.pairId?.toString() != futureTradePair?._id?.toString()) {
//             updateCurrentTab(futureTradePair?._id, futureTradePair?.tradeMode, 'currentContract');
//         }
//     }, [userData, futureTradePair]);

//     useEffect(() => {
//         if (futureTradePair && feeSettingsList) {
//             let makerFee = feeSettingsList?.find((val: any) => {
//                 return (val.pairName == futureTradePair?.tikerRoot &&
//                     val.tradeMode == 'future' &&
//                     val.status == 'active' &&
//                     val.feeType == 'maker'
//                 );
//             });
//             let takerFee = feeSettingsList?.find((val: any) => {
//                 return (val.pairName == futureTradePair?.tikerRoot &&
//                     val.tradeMode == 'future' &&
//                     val.status == 'active' &&
//                     val.feeType == 'taker'
//                 );
//             });
//             if (isEmpty(makerFee)) {
//                 makerFee = feeSettingsList?.find((val: any) => {
//                     return (val.pairName == 'all' &&
//                         val.tradeMode == 'future' &&
//                         val.status == 'active' &&
//                         val.feeType == 'maker'
//                     );
//                 });
//             }
//             if (isEmpty(takerFee)) {
//                 takerFee = feeSettingsList?.find((val: any) => {
//                     return (val.pairName == 'all' &&
//                         val.tradeMode == 'future' &&
//                         val.status == 'active' &&
//                         val.feeType == 'taker'
//                     );
//                 });
//             }
//             dispatch(MakerFee({ makerFee: makerFee?.feePercentage }));
//             dispatch(TakerFee({ takerFee: takerFee?.feePercentage }));
//         }
//     }, [futureTradePair, feeSettingsList]);

//     useEffect(() => {
//         if (!isEmpty(futurePairData)) {
//             if (!isEmpty(pairSearch)) {
//                 let regx = new RegExp(pairSearch, "i");
//                 let FilterData = futurePairData.filter((val: any) => {
//                     let pairName = val.baseCurrency + "/" + val.quoteCurrency;
//                     return pairName.match(regx);
//                 });
//                 setPairData(FilterData);
//             } else {
//                 setPairData(futurePairData);
//             }
//         }
//     }, [futurePairData, pairSearch]);

//     // If Future is being shown, render it in place of the list/tabs.
//     // Still the same screen mounted inside the Market tab — tab bar unaffected.
//     if (showFuture) {
//         return <Future onBack={handleCloseFuture} />;
//     }

//     return (
//         <Mainview
//             isheader={false}
//             isscollable={false}
//             horizontalpadding={"2%"}
//             gradientColors={theme.theme === "dark" ? ["#143818d7", "#143818cc", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
//             gradientLocations={[0, 0.45, 1]}
//         >
//             <View style={{ flex: 1, paddingTop: "2.5%" }}>
//                 <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
//                     <Pressable onPress={() => navigation.goBack()} style={{ width: "10%", alignItems: "center", justifyContent: "center", position: "absolute", left: 0 }}>
//                         <VectorIcons family="FontAwesome" name="angle-left" size={30} />
//                     </Pressable>
//                     <Text style={{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: RFvalue(16) }}>Market Page</Text>
//                 </View>
//                 <Flexcomponent paddingHorizontal={"5%"} justifyContent="flex-start" style={{ width: "95%", height: windowheight * 0.06, backgroundColor: theme.theme == 'dark' ? "#151a1759" : "#FFFFFF", borderRadius: 15, marginTop: "2.5%", alignSelf: "center", borderWidth: 1, borderColor: "#1e202259" }}>
//                     <VectorIcons
//                         family="Feather"
//                         name={"search"}
//                         size={windowwidth * 0.045}
//                         iconcolor={theme.theme == 'dark' ? "#EBEBF599" : "#32496c"}
//                     />
//                     <TextInput
//                         value={pairSearch}
//                         placeholder="Search contracts"
//                         style={{ flex: 1, paddingHorizontal: "2.5%", color: theme.secondarytext, fontFamily: Fontfamily.regular, fontSize: Fontsize.semimedium }}
//                         placeholderTextColor={theme.graytext}
//                         onChangeText={handlePairSearch}
//                     />
//                 </Flexcomponent>

//                 <Flexcomponent justifyContent="flex-start" width={windowwidth} height={windowheight * 0.05} style={{ borderBottomWidth: 0.8, borderBottomColor: "#8c868642", alignSelf: "center" }} top={"2.5%"}>
//                     {tabs?.map((tab: string, i: number) => (
//                         <Pressable
//                             key={tab ?? i}
//                             onPress={() => setActiveindex(i)}
//                             style={style.tab}
//                         >
//                             <Text
//                                 size="medium"
//                                 family="medium"
//                                 style={[{ color: activeindex === i ? theme.darktext : Colors.grey }]}
//                             >
//                                 {tab}
//                             </Text>
//                             {activeindex === i && <View style={style.tabContent} />}
//                         </Pressable>
//                     ))}
//                 </Flexcomponent>

//                 <View style={{ flex: 1 }}>
//                     {
//                         (activeindex == 1 || activeindex == 0) && (
//                             <Marketfuture
//                                 pairData={activeindex == 0 ? pairData.filter((item: any) => {
//                                     return futureFav?.some((val: any) => val.pairName === item.tickerRoot);
//                                 }) : pairData}
//                                 addFavourite={handleAddFavourite}
//                                 favourite={futureFav}
//                                 onOpenFuture={handleOpenFuture}
//                             />
//                         )
//                     }
//                 </View>
//             </View>
//         </Mainview>
//     );
// };

// export default Market;

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Marketfuture from "./future";
import Future from "../FutureNew/future";
import Option from "../Option";
import Mainview from "../../Components/mainview";
import VectorIcons from "../../Utilities/vectoricons";
import useApiError from "../../Actions/Hooks/errorhook";
import { escapeRegExp, isEmpty } from "../../Utilities/helerfunction";
import Flexcomponent from "../../Components/flexcomponent";
import { setItem } from "../../Actions/Storage/localstorage";
import { Colors, Fontfamily, Fontsize } from "../../Utilities/uiasset";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { borderradius, RFvalue, windowheight, windowwidth } from "../../Utilities/dimensions";
import { MakerFee, setFutureTicker, setTradePairData, TakerFee, useAddFavouritePairMutation, useUpdateTabMutation } from "../../Slices/future";
import { optionTradeSelector, setOption, setPairlist, useLazyGetAllContractQuery } from "../../Slices/option";
import { helperSelector, SetFutureparams } from "../../Slices/helper";
import MarketOptionList from "./optionlist";
import { setUserData } from "../../Slices/auth";
import { styles } from "../Portfolio/styles";
import Text from "../../Components/text";
import { formatDisplayPair } from "../../Utilities/formatPair";

interface PairData {
    _id: string;
    baseCurrency: string;
    quoteCurrency: string;
    tickerRoot: string;
    marketPrice: number;
    last: number;
    change: number;
    volume: number;
}

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Market'>;

const tabs = ['Watchlist', 'Futures', 'Options'];

const Market: React.FC<Props> = ({ navigation, route }) => {

    const { theme, dispatch, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    // Latest values held in refs so the row callbacks passed to the (now memoized)
    // <Marketfuture> can be stable useCallback([]) - otherwise they'd be recreated
    // on every price flush and reconcile the whole list.
    const futurePairDataRef = useRef<any>(futurePairData);
    futurePairDataRef.current = futurePairData;
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);
    const { futureparams } = useSelector(helperSelector);
    const { futureFav } = useSelector((state: any) => state.auth.userData);
    const { userData } = useSelector((state: any) => state.auth);
    const favStateRef = useRef<any>({ futureFav, userData });
    favStateRef.current = { futureFav, userData };
    const { feeSettingsList } = useSelector((state: any) => state.fee);
    const { pairlist: optionPairlist } = useSelector(optionTradeSelector);

    // The option underlying-asset list only carries symbol/marketPrice (no 24h change
    // or volume) - but option underlyings are the same base currencies already tracked
    // for futures (ETH, BTC, ...), which DO carry that data. Enrich by symbol instead of
    // waiting on a backend change, so the Options list shows the same columns as Futures.
    const optionPairData = useMemo(() => {
        return (optionPairlist ?? []).map((item: any) => {
            const futureMatch = futurePairData?.find((f: any) => f.baseCurrency === item.symbol);
            return {
                ...item,
                tickerRoot: futureMatch?.tickerRoot ?? `${item.symbol}USDT`,
                last: futureMatch?.last ?? item.marketPrice,
                change: futureMatch?.change ?? 0,
                volume: futureMatch?.volume ?? 0,
                FirstcurrencyData: futureMatch?.FirstcurrencyData,
            };
        });
    }, [optionPairlist, futurePairData]);

    const [activeindex, setActiveindex] = useState(0);
    const [pairSearch, setPairSearch] = useState<string>('');
    const [pairData, setPairData] = useState<PairData[]>([]);

    const [showFuture, setShowFuture] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    // handleAddFavourite is shared across every row's star icon (Marketfuture's
    // FlatList), so track which pairId is currently in-flight rather than a
    // single boolean.
    const [favouriteLoadingId, setFavouriteLoadingId] = useState<string | null>(null);

    const [addFavourite, { error }] = useAddFavouritePairMutation();
    const [UpdateTab, { isLoading }] = useUpdateTabMutation();

    useApiError(error);

    // Reset to list view whenever the Market tab loses focus
    // (e.g. user switches to Portfolio/Home/Option/Orders).
    // Guarantees the tab always opens fresh on the list, not Future.
    // Also clears returnToFuture/returnToChart here, not on every pair pick -
    // those flags need to survive a pair pick made *while still on this same
    // list* (e.g. left Chart via its pair-name tap, list shows, pick a different
    // pair - that pick should still open straight into Chart), but must not
    // leak into a genuinely fresh visit to this tab later (leaving to another
    // tab and coming back should always land on the plain trade page).
    useFocusEffect(
        useCallback(() => {
            return () => {
                setShowFuture(false);
                setShowOptions(false);
                setReturnToFuture(false);
                setReturnToChart(false);
                setPendingChartOpen(false);
                setOpenedFromExternal(false);
            };
        }, [])
    );

    // Handle re-tapping the Market tab icon while already focused —
    // standard tab behavior: tapping the active tab resets to its root.
    useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress' as any, () => {
            if (showFuture) {
                setShowFuture(false);
                setReturnToFuture(false);
                setReturnToChart(false);
                setOpenedFromExternal(false);
            }
            setPendingChartOpen(false);
            if (showOptions) {
                setShowOptions(false);
            }
        });
        return unsubscribe;
    }, [navigation, showFuture, showOptions]);

    // Screens outside Market (Home's trade cards, "Trade Now", quick-access tiles)
    // can't reach this component's own local `showFuture` state directly, since it
    // isn't theirs to set - they signal intent via the shared `futureparams` flag
    // instead (set alongside the pair data in redux) and rely on the Market tab
    // itself to pick it up here. Without this, those entry points fell back to
    // `navigation.navigate("Future")`, a top-level stack route that sits outside
    // the bottom tab navigator entirely - which is why the tab bar disappeared
    // for every path except tapping a pair from inside this screen's own list.
    useFocusEffect(
        useCallback(() => {
            if (futureparams === "trade") {
                setShowFuture(true);
                setOpenedFromExternal(true);
                dispatch(SetFutureparams(""));
            }
            // "chart" (chart.tsx's standalone pair-selector, no onSelectPair/onBack
            // wiring) doesn't open Future immediately - it lands on this list, and
            // whichever pair gets tapped next opens straight into Chart instead of
            // the plain trade screen. See `pendingChartOpen` above.
            if (futureparams === "chart") {
                setPendingChartOpen(true);
                dispatch(SetFutureparams(""));
            }
        }, [futureparams])
    );

    // Home's "View more" list button navigates here with a `tab` param
    // (Future/Option/Watchlist) so the correct tab opens instead of always Watchlist.
    // Cleared immediately after consuming it so re-focusing the tab (or tapping its
    // icon again) doesn't keep forcing the same tab.
    useFocusEffect(
        useCallback(() => {
            const requestedTab = route.params?.tab;
            if (requestedTab) {
                const index = tabs.indexOf(requestedTab);
                if (index !== -1) {
                    setActiveindex(index);
                }
                navigation.setParams({ tab: undefined });
            }
        }, [route.params?.tab])
    );

    const handleAddFavourite = useCallback(async (id: any, name: any) => {
        const payload: any = {
            pairId: id,
            pairName: name,
        };
        // Snapshot the pre-tap state so the toggle direction is decided once, at
        // the moment of the tap - not after the await, when a faster USER_DETAILS
        // socket push (the backend emits it before the HTTP response is even
        // sent, see addFavouritePair) may have already applied this exact change
        // to favStateRef.current. Re-deriving "is it currently a favourite" from
        // the post-await ref caused this handler to see its own change as
        // already-applied and immediately toggle it back off.
        const wantFav = !(favStateRef.current.futureFav ?? []).some((f: any) => f.pairName === name);
        setFavouriteLoadingId(id);
        try {
            const response = await addFavourite(payload).unwrap();
            if (response.success) {
                const { futureFav: fav, userData: ud } = favStateRef.current;
                const isPresent = (fav ?? []).some((f: any) => f.pairName === name);
                // Merge idempotently against whatever the array looks like *now*
                // (it may already match, via the socket) instead of blindly
                // toggling - that keeps this converging on the intended end
                // state regardless of which update lands first.
                const updatedFav = wantFav
                    ? (isPresent ? fav : [...(fav ?? []), { pairId: id, pairName: name }])
                    : (isPresent ? (fav ?? []).filter((f: any) => f.pairName !== name) : fav);
                dispatch(setUserData({ ...ud, futureFav: updatedFav }));
                successtoast("Success", response.message);
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } finally {
            setFavouriteLoadingId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addFavourite, dispatch]);

    const handlePairSearch = (text: string) => {
        setPairSearch(text);
    };

    // The list's own back button (below) used to always navigate.goBack(), which
    // exits the Market tab entirely (e.g. back to Home) - fine when the user opened
    // Market directly, but wrong when they got to this list by backing out of a
    // pair's Future/Chart view (via the pair-name tap in chart.tsx/future.tsx):
    // that back button should return them to the trade view they just left, not
    // kick them out of Market altogether. Track which way this list was reached.
    const [returnToFuture, setReturnToFuture] = useState(false);
    // True when the future/chart pair was left specifically via a tap inside the
    // full-screen Chart view (two swap levels deep) - reopen Chart itself, not
    // just the plain Future screen underneath it, when returning.
    const [returnToChart, setReturnToChart] = useState(false);
    // Set when Chart's standalone pair-selector tap (chart.tsx, no onSelectPair/
    // onBack wiring - reached via Home's "Chart" shortcut or the FullViewChart
    // stack route) sends the user here to pick a pair, via the shared
    // `futureparams` flag (see that useFocusEffect below). Unlike "trade", this
    // doesn't open Future immediately - the user still has to pick a pair from
    // the list - it just remembers that whichever pair they do pick should open
    // straight into Chart, not the plain trade screen.
    const [pendingChartOpen, setPendingChartOpen] = useState(false);
    const pendingChartOpenRef = useRef(pendingChartOpen);
    pendingChartOpenRef.current = pendingChartOpen;
    // True when Future was opened via the cross-tab `futureparams` signal (Home's
    // trade cards/tiles) rather than by tapping a pair in this screen's own list -
    // the user never saw this list, so Future's back button should return them to
    // where they actually came from (tab history), not strand them here.
    const [openedFromExternal, setOpenedFromExternal] = useState(false);

    const handleOpenFuture = useCallback((tickerRoot: string) => {
        try {
            const pairDetail = (futurePairDataRef.current ?? []).find((val: any) => val.tickerRoot === tickerRoot);
            setItem("futurespair", tickerRoot);
            dispatch(setTradePairData(pairDetail));
            dispatch(setFutureTicker(pairDetail));
            if (pendingChartOpenRef.current) {
                setPendingChartOpen(false);
                setReturnToChart(true);
            }
            setOpenedFromExternal(false);
            setShowFuture(true);
        } catch (error) {
            console.log('handleOpenFuture__err', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleCloseFuture = () => {
        // Opened from Home (etc.), never saw this list - return to the tab the
        // user actually came from instead of dropping them on this list.
        if (openedFromExternal) {
            setOpenedFromExternal(false);
            navigation.goBack();
            return;
        }
        setShowFuture(false);
        setReturnToFuture(true);
        setReturnToChart(false);
    };

    const handleCloseFutureFromChart = () => {
        setShowFuture(false);
        setReturnToFuture(true);
        setReturnToChart(true);
    };

    // Same fallback as Option/index.tsx's own mount effect: pairlist is normally
    // populated app-wide on login (triggerOptionLists in HelperComponent), but if this
    // list is opened before that resolves, fetch it directly instead of showing empty.
    const [getAllOptionContracts] = useLazyGetAllContractQuery();
    useEffect(() => {
        if (activeindex !== 2 || optionPairlist?.length) return;
        (async () => {
            const response = await getAllOptionContracts(true);
            // Only ever write a non-empty result — this races with the app-wide
            // triggerOptionLists() fetch, and a failed/slower response here must
            // never clobber data that call already populated.
            if (response?.data?.result?.length) {
                dispatch(setPairlist(response.data.result));
            }
        })();
    }, [activeindex, optionPairlist?.length]);

    const handleOpenOption = (symbol: string) => {
        dispatch(setOption(symbol));
        setShowOptions(true);
    };

    const updateCurrentTab = async (pairId: any, tradeMode: any, selectedTab: any) => {
        try {
            const payload = {
                pairId: pairId,
                tradeMode: tradeMode,
                filterType: selectedTab
            };
            const result = await UpdateTab(payload);
        } catch (error) {
            console.log("updateCurrentTab_err", error);
        }
    };

    useMemo(() => {
        if (userData?.filterType == 'currentContract' && userData?.pairId?.toString() != futureTradePair?._id?.toString()) {
            updateCurrentTab(futureTradePair?._id, futureTradePair?.tradeMode, 'currentContract');
        }
    }, [userData, futureTradePair]);

    useEffect(() => {
        if (futureTradePair && feeSettingsList) {
            let makerFee = feeSettingsList?.find((val: any) => {
                return (val.pairName == futureTradePair?.tikerRoot &&
                    val.tradeMode == 'future' &&
                    val.status == 'active' &&
                    val.feeType == 'maker'
                );
            });
            let takerFee = feeSettingsList?.find((val: any) => {
                return (val.pairName == futureTradePair?.tikerRoot &&
                    val.tradeMode == 'future' &&
                    val.status == 'active' &&
                    val.feeType == 'taker'
                );
            });
            if (isEmpty(makerFee)) {
                makerFee = feeSettingsList?.find((val: any) => {
                    return (val.pairName == 'all' &&
                        val.tradeMode == 'future' &&
                        val.status == 'active' &&
                        val.feeType == 'maker'
                    );
                });
            }
            if (isEmpty(takerFee)) {
                takerFee = feeSettingsList?.find((val: any) => {
                    return (val.pairName == 'all' &&
                        val.tradeMode == 'future' &&
                        val.status == 'active' &&
                        val.feeType == 'taker'
                    );
                });
            }
            dispatch(MakerFee({ makerFee: makerFee?.feePercentage }));
            dispatch(TakerFee({ takerFee: takerFee?.feePercentage }));
        }
    }, [futureTradePair, feeSettingsList]);

    // `futurePairData`'s reference changes on every price flush, but the rows now
    // read live prices from state.future.livePrices (per-row), so `pairData` only
    // needs to change when the pair SET or the search changes - not on price ticks.
    // Skipping the price-only churn keeps the FlatList's `data` prop stable, so it
    // never reconciles the whole list; only the row whose price moved re-renders.
    const pairListSigRef = useRef("");
    useEffect(() => {
        if (isEmpty(futurePairData)) return;
        let source: any[] = futurePairData;
        if (!isEmpty(pairSearch)) {
            let regx = new RegExp(escapeRegExp(pairSearch), "i");
            source = futurePairData.filter((val: any) => {
                let pairName = val.baseCurrency + "/" + val.quoteCurrency;
                // Labels shown to the user are display-mapped (USDT -> USD), so also
                // match against that form - otherwise typing the displayed "BTC/USD"
                // wouldn't find "BTC/USDT" pairs.
                let displayPairName = val.baseCurrency + "/" + formatDisplayPair(val.quoteCurrency);
                return pairName.match(regx) || displayPairName.match(regx);
            });
        }
        const sig = `${pairSearch}|${source.length}|${source[0]?._id ?? ""}|${source[source.length - 1]?._id ?? ""}`;
        if (sig === pairListSigRef.current) return;
        pairListSigRef.current = sig;
        setPairData(source);
    }, [futurePairData, pairSearch]);

    // Favourites tab list - memoized so it's a stable reference (an inline
    // `pairData.filter(...)` in JSX was a fresh array every render, defeating the
    // memo on <Marketfuture> and reconciling the whole list on every price flush).
    const favouritePairData = useMemo(
        () => (pairData ?? []).filter((item: any) => futureFav?.some((val: any) => val.pairName === item.tickerRoot)),
        [pairData, futureFav],
    );

    const filteredOptionPairData = useMemo(() => {
        if (isEmpty(pairSearch)) return optionPairData;
        let regx = new RegExp(escapeRegExp(pairSearch), "i");
        return optionPairData.filter((val: any) => {
            return val.symbol?.match(regx) || val.tickerRoot?.match(regx);
        });
    }, [optionPairData, pairSearch]);

    if (showFuture) {
        return (
            <Future
                onBack={handleCloseFuture}
                onSelectPairFromChart={handleCloseFutureFromChart}
                autoOpenChart={returnToChart}
            />
        );
    }

    if (showOptions) {
        // Option's declared Props require navigation/route (it's registered as its own
        // bottom-tab screen), but the component never actually reads them - it gets
        // navigation from useCustomHooks() internally - so it's safe to render standalone.
        const OptionScreen = Option as React.FC<{}>;
        return <OptionScreen />;
    }

    return (
        <Mainview
            isheader={false}
            isscollable={false}
            horizontalpadding={"2%"}
            gradientColors={theme.theme === "dark" ? ["#143818d7", "#143818cc", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1, paddingTop: "2.5%" }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                    <Pressable
                        onPress={() => {
                            // Came here by backing out of a Future/Chart view - go back
                            // to that same trade view instead of leaving Market.
                            if (returnToFuture) {
                                setReturnToFuture(false);
                                setShowFuture(true);
                                return;
                            }
                            navigation.goBack();
                        }}
                        style={{ width: "10%", alignItems: "center", justifyContent: "center", position: "absolute", left: 0 }}
                    >
                        <VectorIcons family="FontAwesome" name="angle-left" size={30} />
                    </Pressable>
                    <Text style={{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: RFvalue(16) }}>Market Page</Text>
                </View>
                <Flexcomponent paddingHorizontal={"5%"} justifyContent="flex-start" style={{ width: "95%", height: windowheight * 0.06, backgroundColor: theme.theme == 'dark' ? "#151a1759" : "#FFFFFF", borderRadius: 15, marginTop: "2.5%", alignSelf: "center", borderWidth: 1, borderColor: "#1e202259" }}>
                    <VectorIcons
                        family="Feather"
                        name={"search"}
                        size={windowwidth * 0.045}
                        iconcolor={theme.theme == 'dark' ? "#EBEBF599" : "#32496c"}
                    />
                    <TextInput
                        value={pairSearch}
                        placeholder="Search contracts"
                        style={{ flex: 1, paddingHorizontal: "2.5%", color: theme.secondarytext, fontFamily: Fontfamily.regular, fontSize: Fontsize.semimedium }}
                        placeholderTextColor={theme.graytext}
                        onChangeText={handlePairSearch}
                    />
                </Flexcomponent>

                <Flexcomponent justifyContent="flex-start" width={windowwidth} height={windowheight * 0.05} style={{ borderBottomWidth: 0.8, borderBottomColor: "#8c868642", alignSelf: "center" }} top={"2.5%"}>
                    {tabs?.map((tab: string, i: number) => (
                        <Pressable
                            key={tab ?? i}
                            onPress={() => setActiveindex(i)}
                            style={style.tab}
                        >
                            <Text
                                size="medium"
                                family="medium"
                                style={[{ color: activeindex === i ? theme.darktext : Colors.grey }]}
                            >
                                {tab}
                            </Text>
                            {activeindex === i && <View style={style.tabContent} />}
                        </Pressable>
                    ))}
                </Flexcomponent>

                <View style={{ flex: 1 }}>
                    {
                        (activeindex == 1 || activeindex == 0) && (
                            <Marketfuture
                                 pairData={activeindex == 0 ? favouritePairData : pairData}
                                addFavourite={handleAddFavourite}
                                 favourite={futureFav}
                                onOpenFuture={handleOpenFuture}
                                favouriteLoadingId={favouriteLoadingId}
                            />
                        )
                    }
                    {/* {
                        activeindex == 2 && (
                            <MarketOptionList
                                pairData={filteredOptionPairData}
                                onOpenOption={handleOpenOption}
                            />
                        )
                    } */}
                    {
                        activeindex == 2 && (
                            <View style={{ alignItems: "center", paddingVertical: "10%" }}>
                                <View style={{ width: windowwidth * 0.14, height: windowwidth * 0.14, borderRadius: windowwidth * 0.07, backgroundColor: theme.theme === "dark" ? "#101A2C" : "#E8EFFC", alignItems: "center", justifyContent: "center", marginBottom: "6%" }}>
                                    <VectorIcons family="Feather" name="clock" iconcolor={Colors.brand} size={windowwidth * 0.06} />
                                </View>
                                <Text family="semiBold" size="small" style={{ textAlign: "center" }}>Coming Soon</Text>
                                <Text color={theme.secondarytext} style={{ marginTop: "3%", lineHeight: 20, textAlign: "center" }}>This feature isn't available yet. Please check back later.</Text>
                            </View>
                        )
                    }
                </View>
            </View>
        </Mainview>
    );
};

export default Market;