import React, { useCallback, useEffect, useRef, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, BackHandler, InteractionManager, Pressable, ToastAndroid, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Trade from "./trade";
import Explore from "./explore";
import Homecard from "./homecard";
import Homeheader from "./homeheader";
import StaticMarketTable from "./StaticMarketTable";
import Text from "../../Components/text";
import Card from "../../Components/Card";
import Announcments from "./Announcments";
import Images, { image } from "../../Utilities/images";
import Mainview from "../../Components/mainview";
import { Colors } from "../../Utilities/uiasset";
import VectorIcons from "../../Utilities/vectoricons";
import useSocket from "../../Actions/Socket/sockethook";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import WebviewModal from "../../Components/DialogBox/Web";
import Flexcomponent from "../../Components/flexcomponent";
import { getItem, setItem } from "../../Actions/Storage/localstorage";
import { BottomTabParamList } from "../../Navigations/navigationtypes";
import useCustomHooks, { failuretoast } from "../../Actions/Hooks/customhook";
import { setFutureTicker, setTradePairData, useAddFavouritePairMutation } from "../../Slices/future";
import { setAnnouncement, setPopular, setTradePairs, setTrendTrade, SetFutureparams } from "../../Slices/helper";
import { setOption, setPairlist, useLazyGetAllContractQuery } from "../../Slices/option";
import { authSelector, setIsAuth, setUserData, useGetverifyQRMutation, useLazyAnnouncementQuery, useLazyTradePairsQuery, useLazyTrendingPopularQuery, useLazyTrendingTradeQuery, useVerifyQRMutation } from "../../Slices/auth";
import { socketService } from "../../Actions/Socket/socketManager";
import Market from "../Market/market";
import LinearGradient from "../../Components/lineargradient";

type Props = NativeStackScreenProps<BottomTabParamList, 'Home'>;

const Home: React.FC<Props> = () => {
    const { navigation, dispatch, successtoast, theme } = useCustomHooks();

    // Narrowed to specific fields - futureSelector/optionTradeSelector return their
    // whole slice, unmemoized, and both get live socket price updates many times a
    // second, which was re-rendering this whole screen (charts, lists, etc.) on every
    // tick even for fields this screen doesn't read.
    const userData = useSelector((state: any) => state.auth.userData);
    const { kycStatus, futureFav } = userData;
    // helperSelector also returns its whole slice, unmemoized. This screen fires 4
    // API calls on mount (below), each landing at a different time and each writing
    // into this slice - with the broad selector, every single one of those 4
    // responses forced a full re-render of this entire screen in the first couple
    // seconds after opening it (i.e. right after login), one after another.
    const scanres = useSelector((state: any) => state.helper.scanres);
    const announcements = useSelector((state: any) => state.helper.announcements);
    const tradePair = useSelector((state: any) => state.helper.tradePair);
    const trendTrade = useSelector((state: any) => state.helper.trendTrade);
    const popular = useSelector((state: any) => state.helper.popular);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const pairlist = useSelector((state: any) => state.optionTrade.pairlist);

    const [verifed] = useVerifyQRMutation();
    const [getverifyQR] = useGetverifyQRMutation();
    const [tradePairs] = useLazyTradePairsQuery();
    const [announcement] = useLazyAnnouncementQuery();
    const [trendingTrade] = useLazyTrendingTradeQuery();
    const [trendingPopular] = useLazyTrendingPopularQuery();
    const [addFavourite] = useAddFavouritePairMutation();
    const [getAllOptionContracts] = useLazyGetAllContractQuery();

    const backPressCount = useRef(0);
    const [demo, setDemo] = useState(false);
    const [showKYC, setShowKYC] = useState(false);
    const [isVerifyCall, setIsVerifyCall] = useState(false);
    // Multiple StaticMarketTable rows share this single mutation, so track which
    // row's pairId is in-flight rather than a single boolean.
    const [favouriteLoadingId, setFavouriteLoadingId] = useState<string | null>(null);

    const getAnnouncements = async () => {
        const payload = {
            page: 1,
            limit: 10,
        };
        try {
            const reponse = await announcement(payload).unwrap();
            if (reponse.success) {
                dispatch(setAnnouncement(reponse.result))
            } else {
                console.log("Announcement erros")
            }
        } catch (err) {
            console.log("getAnnouncements__err", err);
        }
    }

    const fetchverifiedQR = async () => {
        try {
            if (!scanres.payload) return false;
            setIsVerifyCall(true)
            const response = await getverifyQR(scanres.payload).unwrap();
            if (response.success) {
                const { result: { device: { browser, browserVersion, os, osVersion, deviceType, city, country } } } = response;
                // Browser + version
                const browserPart = browser
                    ? `${browser}${browserVersion ? ` ${browserVersion.split('.')[0]}` : ''}`
                    : 'a browser';

                // OS + version
                const osPart = os
                    ? `${os}${osVersion ? ` ${osVersion}` : ''}`
                    : 'an unknown device';

                // Location
                const locationPart = city && country
                    ? `${city}, ${country}`
                    : country || null;

                let message = `Login requested from ${browserPart} on ${osPart}`;
                if (locationPart) message += ` · ${locationPart}`;
                Alert.alert(
                    `Please confirm is this you `,
                    `${message}`,
                    [
                        {
                            text: "Cancel",
                            style: "cancel",
                            onPress: () => {
                                setIsVerifyCall(false)
                            }
                        },
                        {
                            text: "Confirm",
                            onPress: () => verifedQR(scanres.payload),
                        },
                    ]
                );
            } else {
                console.log("Error QR Login");
                failuretoast("Error", response?.message);
            }
        } catch (err) {
            console.log(err, "fetchverifiedQR__err")
        }
    }

    const verifedQR = async (token: string) => {
        if (!token) return false;
        // setIsVerifyCall(true)
        const payload = {
            token: token
        }
        try {
            const response = await verifed(payload).unwrap();
            setIsVerifyCall(false)
            if (response.success) {
                successtoast("Success", response.message);
            } else {
                console.log("Error QR Login")
            }
        } catch (err) {
            setIsVerifyCall(false)
            console.log("verifedQR__err", err);
        }
    }

    const getTrendingTrade = async () => {
        try {
            const response = await trendingTrade(0).unwrap();
            // A malformed/missing response envelope here dispatched `undefined` into
            // Redux (initial state is `[]`) - the next render's unguarded
            // `trendTrade.length` below then crashed with "Cannot read property
            // 'length' of undefined".
            dispatch(setTrendTrade(response?.result?.data ?? []));
        } catch (err) {
            console.log("getTrendingTrade__err", err);
        }
    }

    const getPopularTrade = async () => {
        try {
            const response = await trendingPopular(0).unwrap();
            dispatch(setPopular(response?.result?.data))
        } catch (err) {
            console.log("getPopularTrade__err", err);
        }
    }

    const getTradePairs = async () => {
        try {
            const response = await tradePairs(0).unwrap();
            dispatch(setTradePairs(response?.result?.data));
        } catch (err) {
            console.log("getTradePairs__err", err);
        }
    }

    const handelDemo = () => {
        setDemo(true)
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowKYC(true);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (backPressCount.current === 0) {
                    backPressCount.current += 1;
                    ToastAndroid.show(
                        'Press back again to exit',
                        ToastAndroid.SHORT
                    );
                    setTimeout(() => (backPressCount.current = 0), 2000);
                    return true;
                }
                BackHandler.exitApp();
                return true;
            };
            const sub = BackHandler.addEventListener(
                'hardwareBackPress',
                onBackPress
            );
            return () => sub.remove();
        }, [])
    );

    useEffect(() => {
        if (scanres && !isVerifyCall) {
            fetchverifiedQR();
        }
    }, [scanres])

    // futurePairData ticks many times a second - closing over it directly would give
    // handlePairChange (and everything built on it) a new identity on every tick,
    // which would defeat memoizing StaticMarketTable below since its onSelectFuture
    // prop would never stay referentially stable. Read the latest value from a ref
    // instead so this callback's identity stays fixed across ticks.
    const futurePairDataRef = useRef(futurePairData);
    useEffect(() => {
        futurePairDataRef.current = futurePairData;
    }, [futurePairData]);

    const handlePairChange = useCallback((pair: any) => {
        try {
            let pairDetail = futurePairDataRef.current.find((val: any) => val.tickerRoot === pair);
            if (!pairDetail) {
                pairDetail = futurePairDataRef.current[0];
            }
            setItem("futurespair", pairDetail?.tickerRoot)
            dispatch(setTradePairData(pairDetail));
            dispatch(setFutureTicker(pairDetail));
            // navigation.goBack()
        } catch (error) {
            failuretoast("Error", "Something went wrong!");
        }
    }, [dispatch]);

    const handleSelectFuture = useCallback((tickerRoot: string) => {
        dispatch(SetFutureparams("trade"));
        handlePairChange(tickerRoot);
        navigation.navigate('Dashboard', { screen: 'Market' });
    }, [dispatch, handlePairChange, navigation]);

    const handleSelectOption = useCallback((symbol: string) => {
        dispatch(setOption(symbol));
        navigation.navigate("Option");
    }, [dispatch, navigation]);

    const handleToggleFavourite = useCallback(async (id: any, name: any) => {
        const payload: any = {
            pairId: id,
            pairName: name,
        };
        setFavouriteLoadingId(id);
        try {
            const response = await addFavourite(payload).unwrap();
            if (response.success) {
                const isCurrentlyFav = (futureFav ?? []).some((fav: any) => fav.pairName === name);
                const updatedFav = isCurrentlyFav
                    ? (futureFav ?? []).filter((fav: any) => fav.pairName !== name)
                    : [...(futureFav ?? []), { pairId: id, pairName: name }];
                dispatch(setUserData({ ...userData, futureFav: updatedFav }));
                successtoast("Success", response.message);
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (error) {
            console.log('handleToggleFavourite__err', error);
            failuretoast("Error", "Something went wrong!");
        } finally {
            setFavouriteLoadingId(null);
        }
    }, [addFavourite, dispatch, futureFav, userData, successtoast]);

    useEffect(() => {
        const fetchData = async () => {
            await Promise.all([
                getAnnouncements(),
                getPopularTrade(),
                getTradePairs(),
                getTrendingTrade(),
            ]);
        };

        // Deferred until the current navigation/animation (e.g. the post-login stack
        // swap + success toast) finishes, instead of firing 4 requests immediately on
        // mount whose responses land one after another during that exact window and
        // each force a re-render of this screen - same reasoning as
        // HelperComponent.tsx's fetchUserData deferral.
        const task = InteractionManager.runAfterInteractions(() => {
            fetchData();
        });
        return () => task.cancel();
    }, []);

    // const events: any = {
    //     "allTimeTrend": useCallback((data: any) => {
    //         console.log("allTimeTrend", data)
    //     }, []),

    //     "popularPairs": useCallback((data: any) => {
    //         console.log("allTimeTrend", data)
    //     }, []),

    //     "24hrsTrendingPairs": useCallback((data: any) => {
    //         console.log("allTimeTrend", data)
    //     }, []),
    // };

    // useSocket({ events });

    const handleallTimeTrend = useCallback((data: any) => {
    }, [])
    const handlpopularPairs = useCallback((data: any) => {
    }, [])

    const handl24hrsTrendingPairs = useCallback((data: any) => {
    }, [])

    useEffect(() => {
        if (!socketService) return;
        socketService.on("allTimeTrend", handleallTimeTrend);
        socketService.on("popularPairs", handlpopularPairs);
        socketService.on("24hrsTrendingPairs", handl24hrsTrendingPairs);
        return () => {
            socketService.off("allTimeTrend", handleallTimeTrend);
            socketService.off("popularPairs", handlpopularPairs);
            socketService.off("24hrsTrendingPairs", handl24hrsTrendingPairs);
        }
    }, [socketService])

    // pairlist is normally populated app-wide on login (triggerOptionLists in
    // HelperComponent), but if Home's Option tab is opened before that resolves,
    // fetch it directly instead of showing an empty list (same fallback as
    // Market/market.tsx and Option/index.tsx).
    useEffect(() => {
        if (pairlist?.length) return;
        (async () => {
            const response = await getAllOptionContracts(true);
            // Only ever write a non-empty result — this races with the app-wide
            // triggerOptionLists() fetch, and a failed/slower response here must
            // never clobber data that call already populated.
            if (response?.data?.result?.length) {
                dispatch(setPairlist(response.data.result));
            }
        })();
    }, [pairlist?.length])

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={false}
            isscollable={true}
            customheader={<Homeheader />}
            horizontalpadding={"4%"}
            isbottomtab={true}
            isrefereshcontrol={true}
            gradientColors={theme.heroGradient}
            gradientLocations={[0, 0.45, 1]}
        >
            <Homecard />
            {/* {
                showKYC && kycStatus !== "approved" && (
                    <Card backgroundColor={theme.theme == 'dark' ? "#151a17ae" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ paddingVertical: "3%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 15, alignItems: "center", marginTop: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: windowwidth * 0.02 }}>
                            <VectorIcons
                                family="Octicons"
                                name="x-circle-fill"
                                size={windowwidth * 0.05}
                                iconcolor={"rgba(219, 83, 83, 1)"}
                            />
                            <Text family="medium">Please Verify KYC</Text>
                        </View>
                        <Pressable onPress={() => navigation.navigate("Verification")}>
                            <LinearGradient
                                colors={theme.actionGradient ?? ["rgba(10, 22, 44, 0.5)", "rgba(0, 0, 0, 0.5)"]}
                                start={{ x: 0.0504, y: 0.2812 }}
                                end={{ x: 0.9496, y: 0.7188 }}
                                style={{ width: windowwidth * 0.3, height: windowwidth * 0.10, borderRadius: borderradius * 3, alignItems: "center", justifyContent: "center" }}
                            >
                                <Text>Verify</Text>
                            </LinearGradient>
                        </Pressable>
                    </Card>
                )
            } */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: "5%",
                    width: "100%",
                }}
            >
                <View
                    style={{
                        width: "22%",
                        height: 1,
                        backgroundColor: "#8C8686CC",
                    }}
                />

                <Text
                    size="medium"
                    family="medium"
                    style={{
                        marginLeft: 10,
                        marginRight: 10,
                        fontSize: 16,
                        color: theme.darktext,
                        fontWeight: "600",
                    }}
                >
                    Explore More
                </Text>

                <View
                    style={{
                        width: "22%",
                        height: 1,
                        backgroundColor: "#8C8686CC",
                    }}
                />
            </View>
            <Explore setDemo={handelDemo} onSelect={handlePairChange} />
            {/* {
                announcements.length > 0 && ( */}
            <Announcments data={announcements} />
            {/* )
            } */}
            {
                trendTrade?.length > 0 && (
                    <>
                        <Flexcomponent justifyContent="space-between" top={"5%"}>
                            <Text style={{ fontSize: 16, fontWeight: "600" }} color={theme.darktext}>Most Traded On Trevolt</Text>
                            {
                                trendTrade?.length > 4 && (
                                    <Pressable onPress={() => navigation.navigate("Seeall", { type: "trendTrade", data: trendTrade })}>
                                        <Text color={theme.mutedTextt} size="small">See all</Text>


                                    </Pressable>
                                )
                            }
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" style={{ flexWrap: "wrap", marginTop: "2%" }} >
                            {trendTrade?.slice(0, 4)?.map((e: any, i: number) => (
                                <Trade
                                    key={e?._id ?? i}
                                    type="normal"
                                    image={image.Normaltrade}
                                    price={e?.price}
                                    change={e?.totalTrades}
                                    change_percentage={e?.totalTrades}
                                    title={e?.baseCurrency}
                                    subtitle={e?.quoteCurrency}
                                    onSelect={handlePairChange}
                                    token={e?._id}
                                    tradeMode={e?.tradeMode}
                                />
                            ))}
                        </Flexcomponent>
                    </>
                )
            }
            {/* {
                popular.length > 0 && (
                    <>
                        <Flexcomponent justifyContent="space-between" top={"5%"}>
                            <Text size="medium" family="medium">Popular Traded</Text>
                            {
                                popular.length > 4 && (
                                    <Pressable onPress={() => navigation.navigate("Seeall", { type: "popular", data: popular })}>
                                        <Text color={theme.mutedText} size="small">See all</Text>
                                    </Pressable>
                                )
                            }
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" style={{ flexWrap: "wrap", marginTop: "2%", }}>
                            {popular?.slice(0, 4)?.map((e: any, i: number) => (
                                <Trade
                                    key={e?.tickerRoot ?? i}
                                    pair={e}
                                    type="popular"
                                    image={e?.image}
                                    price={e?.price}
                                    change={e?.change}
                                    change_percentage={e?.change_percentage}
                                    title={e?.baseCurrency}
                                    des={e?.tickerRoot}
                                    status={e?.status}
                                    onSelect={handlePairChange}
                                    token={e?.tickerRoot}
                                />
                            ))}
                        </Flexcomponent>
                    </>
                )
            } */}
            {/* {
                tradePair.length > 0 && (
                    <>
                        <Flexcomponent justifyContent="space-between" top={"5%"}>
                            <Text size="medium" family="medium">Top Movers Today</Text>
                            {
                                tradePair.length > 4 && (
                                    <Pressable onPress={() => navigation.navigate("Seeall", { type: "mosttrade", data: tradePair })} >
                                        <Text color={theme.mutedText} size="small" >See all</Text>
                                    </Pressable>
                                )
                            }
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" style={{ flexWrap: "wrap", marginTop: "2%" }}>
                            {
                                tradePair?.slice(0, 4)?.map((e: any, i: number) => (
                                    <Trade
                                        key={e?.pairName ?? i}
                                        head={e?.pairName}
                                        type="normal"
                                        subtitle={e?.lastClosePrice}
                                        image={image.Normaltrade}
                                        price={e?.baseEntryPrice}
                                        change={e?.totalTrades}
                                        onSelect={handlePairChange}
                                        token={e?.pairName}
                                    />
                                ))}
                        </Flexcomponent>
                    </>
                )
            } */}
            <StaticMarketTable
                futureData={futurePairData}
                optionData={pairlist}
                favourites={futureFav}
                onSelectFuture={handleSelectFuture}
                onSelectOption={handleSelectOption}
                onToggleFavourite={handleToggleFavourite}
                favouriteLoadingId={favouriteLoadingId}
            />

            <View style={{ width: "100%", marginTop: "5%", marginBottom: "10%" }}>

                {(() => {
                    const noFeesContent = (
                        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 6 }}>
                            <View style={{ flexShrink: 1, paddingRight: 8 }}>
                                <Flexcomponent style={{ justifyContent: 'flex-start' }}>
                                    <Text color={theme.homegreen} size="medium" style={{ marginRight: "2%", fontSize: 14, fontWeight: "600" }} family="medium">
                                        No Fees.
                                    </Text>
                                    <Text color={theme.darktext} size="medium" style={{ fontSize: 14, fontWeight: "600" }} family="medium">
                                        Deep Order Book.
                                    </Text>
                                </Flexcomponent>
                                <Flexcomponent style={{ justifyContent: 'flex-start' }}>
                                    <Text color={theme.darktext} size="medium" style={{ fontSize: 14, fontWeight: "600" }} family="medium">
                                        Cold-Storage Custody & 24/7 Support.
                                    </Text>
                                </Flexcomponent>
                                <Flexcomponent style={{ marginTop: 10, justifyContent: "flex-start" }}>
                                    <Pressable
                                        onPress={() => {
                                            dispatch(SetFutureparams("trade"));
                                            navigation.navigate('Dashboard', { screen: 'Market' });
                                        }}
                                        style={{ justifyContent: "flex-start" }}
                                    >
                                        <LinearGradient
                                            colors={["#001210", "#3B82F6"]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={{ borderRadius: 8, paddingVertical: "3%", paddingHorizontal: "8%" }}
                                        >
                                            <Text family="medium" color="#FFFFFF" style={{ textAlign: "center" }}>Trade Now</Text>
                                        </LinearGradient>
                                    </Pressable>
                                </Flexcomponent>
                            </View>

                            <View style={{ alignSelf: "flex-end", marginBottom: -5, marginRight: -6 }}>
                                <Images
                                    type="svg"
                                    name={"NoFees"}
                                    width={windowwidth * 0.25}
                                    height={windowwidth * 0.25}
                                />
                            </View>
                        </View>
                    );

                    return (
                        <LinearGradient
                            colors={["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.02)"]}
                            locations={[0.0585, 0.9401]}
                            start={{ x: 0.0315, y: 0.3255 }}
                            end={{ x: 0.9685, y: 0.6745 }}
                            style={{ borderRadius: borderradius * 1, padding: 1, marginTop: "3%" }}
                        >
                            <LinearGradient
                                colors={theme.theme == 'dark' ? ["rgba(15, 47, 94, 0.5)", "rgba(0, 0, 0, 0.5)"] : ["#d9d9d985", "#d9d9d97e"]}
                                locations={[0.1092, 0.964]}
                                start={{ x: 0.0504, y: 0.2812 }}
                                end={{ x: 0.9496, y: 0.7188 }}
                                style={{ borderRadius: borderradius * 1, padding: "5%", overflow: "visible" }}
                            >
                                {noFeesContent}
                            </LinearGradient>
                        </LinearGradient>
                    );
                })()}
            </View>
            {
                demo &&
                <WebviewModal
                    title="Demo Trade"
                    url={"https://stagedemo.trevolt.example/"}
                    onCloseHandler={() => setDemo(false)}
                />
            }
        </Mainview>
    )

}

export default Home;