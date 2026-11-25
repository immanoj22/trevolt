import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, View, TextInput, Alert } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { BottomSheetModal } from "@gorhom/bottom-sheet";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import CommisonHistory from "./CommisonHistory";
import Copyprofile from "../Components/Profile";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import Flexcomponent from "../../../Components/flexcomponent";

import OpenOrder from "../Orders/OpenOrder";
import CloseOrder from "../Orders/CloseOrder";
import OrderHistory from "../Orders/OrderHistory";

import Insights from "./insights";
import Configuration from "./Configuration";
import Images from "../../../Utilities/images";
import CopyTradeHistory from "./CopyTradeHistory";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { timeAgo, getProfileImageUrl } from "../../../Utilities/helerfunction";
import Logfilter from "../../Profile/TransactionLogs/filter";
import ConfigurationCopier from "../Copier/ConfigurationCopier";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";
import { copyTradeSelector, useGetCopierDetailsMutation, useInactiveStardegyMutation, useLazyGetFollowersDetailsQuery, useLazySetViewersQuery, useLazyStrategyDetailsQuery, useUpdateStrategyMutation } from "../../../Slices/copy";

import Fills from "../Orders/Fills";
import Positions from "../Orders/Position";
import StopOrder from "../Orders/StopOrders";
import { futureOption } from "../../../Utilities/filterOptions";
import { canUnfollow } from "../../../Utilities/dateTime";
import SelectItem from "../../Profile/Security/Helpers/SelectItem";

import { style } from "../styles";
import useApiError from "../../../Actions/Hooks/errorhook";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Tradedetail'>;

const Tradedetail: React.FC<Props> = ({ route }) => {
    const { type, data } = route?.params;
    const { myStrategy } = useSelector(copyTradeSelector);
    const { theme, navigation, failuretoast, successtoast, openbottomsheet, bottomsheetref, closebottomsheet } = useCustomHooks();
    const [activeindex, setActiveindex] = useState("")
    const [orderindex, setOrderIndex] = useState(0);
    const styles = style(theme);
    const { profileImage, userName, userId, accountId } = useSelector((state: any) => state.auth.userData);
    const [tradeMode, setTradeMode] = useState('all');
    const [selectedTab, setSelectedTab] = useState('all');
    const [copier, setCoiper] = useState<any>([]);
    const [strategy, setStrategy] = useState<any>();
    const [search, setSearch] = useState("")
    const FutureId = useRef("all");
    const optionsSheetRef = useRef<BottomSheetModal>(null);
    const futureTradePair = useSelector((state: any) => state.future.futureTradePair);

    const { mystrategyDetails } = useApihooks();
    const [copierDetails] = useGetCopierDetailsMutation();
    const [setViewers] = useLazySetViewersQuery();
    const [strategyDetails] = useLazyStrategyDetailsQuery();
    const [inactive, { isLoading: inactiveLoading }] = useInactiveStardegyMutation();
    const [updateStrategy, { error, isLoading: isUpdatingStrategy }] = useUpdateStrategyMutation();
    const [copierDetail, setCopierDetails] = useState<any>([]);

    useApiError(error);

    const handelCopierDetails = async (id: any) => {
        try {
            const payload = {
                strategyId: id
            }
            const response = await copierDetails(payload).unwrap();
            if (response.success) {
                setCoiper(response.result);
                setCopierDetails(response.result)
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (e) {
            console.log("Error", "Failed to load copier details.");
        }
    }

    const handelSetViewers = async (id: any) => {
        try {
            await setViewers(id);
        } catch (e) {
            console.log("Failed to set viewer count");
        }
    }

    const handleStrategyDetails = async (id: any) => {
        try {
            const response = await strategyDetails(id)
            setStrategy(response?.data?.result);
        } catch {
            console.log("Failed to load strategy details");
        }
    }

    const handleInactive = async (id: any) => {
        try {
            const payload = {
                id: id,
                status: "inactive"
            }
            const response = await inactive(payload).unwrap();
            if (response.success) {
                mystrategyDetails();
                successtoast("Success", response.message)
                navigation.navigate("Copytrade")
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch {
            console.log("Failed to inactive strategy");
        }
    }

    const handleUpdateStrategy = async () => {
        const isAllowedToUnfollow = canUnfollow(copierDetail?.followedAt);
        console.log("isAllowedToUnfollow______", isAllowedToUnfollow)
        if (!isAllowedToUnfollow) {
            failuretoast(
                "Locked",
                "You can’t unfollow this strategy until after the 7-day lock-in period."
            );
            return;
        }
        const payload = {
            _id: copierDetail._id,
            status: "inactive"
        }
        const response = await updateStrategy(payload).unwrap();
        if (response.success) {
            mystrategyDetails();
            successtoast("Success", response.message)
            navigation.navigate("Copytrade")
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    const details = useMemo(() => {
        if (type === "user") return strategy;
        if (type === "viewcoiper") return copier;
        if (type === "viewtrader") return data;
        if (type === "your") return strategy
        return myStrategy;
    }, [type, copier, myStrategy, strategy]);

    const tabs = useMemo(() => {
        switch (type) {
            case "your":
                return [
                    "Insights",
                    "Configuration",
                    "Commission History",
                    "Copy Trader History",
                ];
            case "copy":
                return ["Insights", "Copy History"];
            case "viewtrader":
                return ["Insights"];
            case "viewcoiper":
                return ["Insights", "Configuration", "Orders"];
            default:
                return ["Insights"];
        }
    }, [type]);

    useEffect(() => {
        if (type === "viewcoiper" && data?._id) {
            handelCopierDetails(data._id);
        }
        if (type === "viewtrader" && data?._id) {
            handelSetViewers(data._id);
        }
        if (type === "user" && data?._id) {
            handelSetViewers(data._id);
            handleStrategyDetails(data._id);
            handelCopierDetails(data._id);
        }
        if (type === "your") {
            handleStrategyDetails(myStrategy._id)
        }
        if (type === "viewtrader" && data?._id) {
            handelCopierDetails(data._id);
        }
    }, []);

    useEffect(() => {
        if (tabs.length > 0) {
            setActiveindex(tabs[0]);
        }
    }, [tabs]);

    const scrollRef = useRef<ScrollView>(null);
    const tabLayouts = useRef<Record<string, number>>({});


    const following = details?.copiersId?.find(
        (item: any) =>
            String(item.copiedId) === String(copierDetail?._id)
    );

    return (
        <Mainview
            headertitle={type === "viewcoiper" ? "Copier Details" : "Trader Details"}
            isscollable={false}
            onleftfn={() => navigation?.goBack()}
            ismainloading={!details?._id}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={styles.container}>
                <ScrollView
                    nestedScrollEnabled={true}
                    stickyHeaderIndices={[(activeindex === "Orders" || activeindex === "Commission History" || activeindex === "Copy Trader History") ? 2 : 1]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    overScrollMode="never"
                >
                    {
                        type !== "viewcoiper" && (
                            <View>
                                <Copyprofile type={type} data={details} onPress={() => handleUpdateStrategy()} following={following} isUpdating={isUpdatingStrategy} />
                                {
                                    type === "your" && (
                                        <Flexcomponent style={styles.userContainer}>
                                            <Button
                                                buttonStyle={styles.master}
                                                title="You are now master trader"
                                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            />
                                            <Button
                                                buttonStyle={{ width: "30%" }}
                                                title="Inactive"
                                                loading={inactiveLoading}
                                                onPress={() => {
                                                    Commonalert({
                                                        title: "Inactive",
                                                        des: "Are you sure want to Inactive master trader ?",
                                                        yes: () => handleInactive(details?._id)
                                                    });
                                                }}
                                            />
                                        </Flexcomponent>
                                    )
                                }
                                <Text size="medium" style={{ marginTop: "5%" }}>Description</Text>
                                <Text style={{ color: theme.secondarytext, marginBottom: "3%" }}>{details?.description}</Text>
                            </View>
                        )
                    }
                    {
                        type === "viewcoiper" && (
                            <>
                                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={styles.viewCopier}>
                                    <View style={styles.user}>
                                        {
                                            profileImage ?
                                                <Images
                                                    type="image"
                                                    source={{ uri: getProfileImageUrl(profileImage) }}
                                                    width={windowwidth * 0.15}
                                                    height={windowwidth * 0.15}
                                                    style={{ borderRadius: 100 }}
                                                    resizeMode="cover"
                                                />
                                                :
                                                <Images
                                                    type="svg"
                                                    name={theme.theme == "dark" ? "DarkUser" : "EmptyUser"}
                                                    width={windowwidth * 0.15}
                                                    height={windowwidth * 0.15}
                                                />
                                        }
                                        <View style={[styles.contentname, { width: "100%" }]}>
                                            <Text family="medium" numoflines={1} size="small">{userName}</Text>
                                            <Text top={"1%"} fontSize={RFvalue(11)} color="#9E9E9E" >Registered {timeAgo(details?.createdAt)}</Text>
                                            <Text color={copier?.roi > 0 ? Colors.green : Colors.red} >{(copier?.roi ?? 0).toFixed(4)}<Text> - ROI</Text></Text>
                                        </View>
                                    </View>
                                    {/* <Pressable style={styles.unFollow} onPress={() => handleUpdateStrategy(details._id, "inactive", details.followedAt)}>
                                        <Text color={Colors.white}>Unfollow</Text>
                                    </Pressable> */}
                                </Card>

                                <Text size="medium">Description</Text>
                                <Text style={{ color: theme.secondarytext, marginBottom: "3%" }}>{details?.description}</Text>
                            </>
                        )
                    }
                    <View style={styles.activetab}>
                        <ScrollView
                            nestedScrollEnabled={true}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            onStartShouldSetResponder={() => true}
                        >
                            {
                                tabs.map((e, i) => (
                                    <Pressable key={i} onTouchEnd={() => { setActiveindex(e) }} hitSlop={20} style={[styles.tab, { borderBottomWidth: activeindex === e ? 2 : 0, borderBottomColor: activeindex === e ? theme.tabactive : "transparent" }]}>
                                        <Text size="semimedium" color={activeindex === e ? theme.tabactive : "#797979"}>{e}</Text>
                                    </Pressable>))
                            }
                        </ScrollView>
                    </View>
                    {
                        activeindex === "Orders" && (
                            <View style={styles.tabContent}>
                                <ScrollView
                                    horizontal
                                    nestedScrollEnabled={true}
                                    showsHorizontalScrollIndicator={false}
                                >
                                    <View style={styles.header}>
                                        {
                                            (type === "your" ? ["Positions", "Open Order", "Stop Orders", "Close History", "Order History"] : ["Positions", "Open Order", "Stop Orders", "Close History", "Fills", "Order History"]).map((tab, i) => (
                                                <Pressable
                                                    key={i}
                                                    onLayout={(e) => { tabLayouts.current[tab] = e.nativeEvent.layout.x }}
                                                    onTouchEnd={() => {
                                                        scrollRef.current?.scrollTo({
                                                            x: tabLayouts.current[tab] || 0,
                                                            animated: true,
                                                        }),
                                                            setOrderIndex(i)
                                                    }} style={[styles.nav, { backgroundColor: orderindex === i ? Colors.brand : theme.card }]}>
                                                    <Text size="xsmall" color={orderindex === i ? Colors.white : theme.primarytext}>{tab}</Text>
                                                </Pressable>
                                            ))
                                        }
                                    </View>
                                </ScrollView>
                                <View style={styles.line} />
                            </View>
                        )
                    }
                    {
                        (activeindex === "Commission History" || activeindex === "Copy Trader History") && (
                            <View style={{ marginTop: "5%", backgroundColor: theme.background }}>
                                <View style={styles.searchHeader}>
                                    <View style={{ width: "90%" }}>
                                        <Flexcomponent paddingHorizontal={"5%"} style={styles.searchIcon} >
                                            <VectorIcons
                                                family="Feather"
                                                name={"search"}
                                                size={windowwidth * 0.045}
                                                style={{ marginLeft: 5, marginRight: 3 }}
                                            />
                                            <TextInput
                                                value={search}
                                                placeholder="Search here..."
                                                style={styles.searchHere}
                                                placeholderTextColor={theme.graytext}
                                                onChangeText={(text) => setSearch(text)}
                                            />
                                        </Flexcomponent>
                                    </View>
                                    {
                                        activeindex === "Commission History" && (
                                            <Pressable onPress={() => openbottomsheet(bottomsheetref)} hitSlop={10}>
                                                <VectorIcons
                                                    family="AntDesign"
                                                    name={"filter"}
                                                    size={windowwidth * 0.05}
                                                />
                                            </Pressable>
                                        )
                                    }

                                </View>
                                <View style={styles.line} />
                            </View>
                        )
                    }
                    {
                        activeindex == "Insights" && (
                            <Insights page={type} data={details} strategyId={type === "viewcoiper" ? details?.strategyId : details?._id} />
                        )
                    }
                    {
                        activeindex == "Configuration" && (
                            type === "your" ? <Configuration data={details} onRefech={() => handleStrategyDetails(myStrategy._id)} /> : <ConfigurationCopier data={details} />
                        )
                    }
                    {
                        activeindex == "Orders" && (
                            <>
                                {
                                    orderindex === 0 && (
                                        <Positions
                                            ref={optionsSheetRef}
                                            data={details}
                                            tab={orderindex}
                                            active={selectedTab}
                                            futureId={FutureId}
                                             tradeMode={tradeMode}
                                        />
                                    )
                                }

                                {
                                    orderindex === 1 && (
                                        <OpenOrder
                                            type={type}
                                            data={details}
                                            userId={userId}
                                            accountId={accountId}
                                            ref={optionsSheetRef}
                                            tab={orderindex}
                                            active={selectedTab}
                                            futureId={FutureId}
                                            tradeMode={tradeMode}
                                        />
                                    )
                                }

                                {
                                    orderindex === 2 && (
                                        <StopOrder
                                            data={details}
                                            userId={userId}
                                            accountId={accountId}
                                            ref={optionsSheetRef}
                                            tab={orderindex}
                                            active={selectedTab}
                                            futureId={FutureId}
                                            tradeMode={tradeMode}
                                        />
                                    )
                                }
                                {
                                    orderindex === 3 && (
                                        <CloseOrder
                                            data={details}
                                            userId={userId}
                                            accountId={accountId}
                                            ref={optionsSheetRef}
                                            tab={orderindex}
                                            active={selectedTab}
                                            futureId={FutureId}
                                            tradeMode={tradeMode}
                                        />
                                    )
                                }
                                {
                                    orderindex === 4 && (
                                        <Fills
                                            data={details}
                                            userId={userId}
                                            accountId={accountId}
                                            ref={optionsSheetRef}
                                            tab={orderindex}
                                            active={selectedTab}
                                            futureId={FutureId}
                                            tradeMode={tradeMode}
                                        />
                                    )
                                }
                                {
                                    orderindex === 5 && (
                                        <OrderHistory
                                            data={details}
                                            userId={userId}
                                            accountId={accountId}
                                            ref={optionsSheetRef}
                                            tab={orderindex}
                                            active={selectedTab}
                                            futureId={FutureId}
                                            tradeMode={tradeMode}
                                        />
                                    )
                                }
                                {/* {
                                    orderindex === 6 && (
                                        <AssetsHistroy
                                            data={details}
                                        />
                                    )
                                } */}
                            </>
                        )
                    }
                    {
                        activeindex == "Commission History" && (
                            <CommisonHistory search={search} />
                        )
                    }
                    {
                        activeindex == "Copy Trader History" && (
                            <CopyTradeHistory search={search} />
                        )
                    }
                </ScrollView>
                <Logfilter
                    sheetref={bottomsheetref}
                    snappoint={["35%"]}
                    assetHistory={"orderhistory"}
                    exportData={false}
                />
            </View>

            <SelectItem
                value={tradeMode}
                ref={optionsSheetRef}
                onSelect={(value) => {
                    if (value === "all") {
                        setTradeMode("all");
                        FutureId.current = "all";
                        setSelectedTab("All")
                    } else if (value === "currentContract") {
                        setTradeMode(futureTradePair.tradeMode);
                        FutureId.current = futureTradePair?._id;
                        setSelectedTab("Current Contract")
                    } else if (value === "options") {
                        setTradeMode("options");
                        setSelectedTab("Options")
                        FutureId.current = "all";
                    } else if (value === "futures") {
                        setTradeMode("future");
                        FutureId.current = "all";
                        setSelectedTab("Futures")
                    }
                }}
                cancel={() => closebottomsheet(optionsSheetRef)}
                data={futureOption}
            />
        </Mainview>
    )

}

export default Tradedetail;