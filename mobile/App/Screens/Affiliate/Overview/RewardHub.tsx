import React, { useEffect, useCallback, useState } from "react";
import { ScrollView, View, Text as NormalText, Pressable, FlatList } from "react-native";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";

import Countdown from "./CountDown";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Images from "../../../Utilities/images";
import NoData from "../../../Components/Nodata";
import { setAffiliateData } from "../../../Slices/auth";
import useApiError from "../../../Actions/Hooks/errorhook";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { PROFILEURL } from "../../../Actions/Constant/constant";
import Loadercomponent from "../../../Components/loadercomponent";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { Colors, Fontfamily } from "../../../Utilities/uiasset";
import { useLazyAffiliateClaimRewardQuery, useLazyAffiliateCommissionQuery, useLazyAffiliateDetailsQuery } from "../../../Slices/affiliate";

import styles from "../styles";

interface RewardsHubprops {

}

const typeEnum: any = {
    'deposit': 'Deposit', 'withdraw': 'Withdraw', 'internaltransfer': "Internaltransfer", 'trade': 'Trade', 'referral': 'Referral', 'welcomeBonus': 'WelcomeBonus', 'claim': 'Claim'
}

const RewardsHub: React.FC<RewardsHubprops> = ({

}) => {
    const { theme, successtoast, dispatch, convert, convertSec } = useCustomHooks();
    const style = styles(theme)

    const { lastClaimDate, rewardGenerated, claimed, toClaim, totalCommission } = useSelector((state: any) => state.auth.affiliateData);
    const { profileImage } = useSelector((state: any) => state.auth.userData);

    const [tableData, setTableData] = useState<any>([{ id: 1 }]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, search: "" });
    const [count, setCount] = useState(0);
    const [targetTime, setTargetTime] = useState<number | null>(null);
    const [date, setDate] = useState("1W")

    const [affiliateCommission] = useLazyAffiliateCommissionQuery();
    const [claimRewardCommission, { data: claimData, error: claimErr, isLoading }] = useLazyAffiliateClaimRewardQuery();
    const [affiliateDetails] = useLazyAffiliateDetailsQuery();

    useApiError(claimErr)   


    const { triggeraffiliate } = useApihooks();

    const dropdownData = [
        { label: "1 W", value: "1W", id: "weekFilter" },
        { label: "1 M", value: "1M", id: "1monthFilter" },
        { label: "3 M", value: "3M", id: "3monthFilter" },
        { label: "6 M", value: "6M", id: "6monthFilter" },
        { label: "1 Y", value: "1Y", id: "1YearFilter" },
    ];

    const getCommissionDetails = async (reqData: any) => {
        const response = await affiliateCommission(reqData).unwrap();
        if (response.success) {
            setTableData(response?.result.data);
            setCount(response?.result.count)
        }
        else {
            console.log("Error")
        }
    }

    const getAffiliate = async (range: any) => {
        const res = await affiliateDetails({ range: range })
        dispatch(setAffiliateData(res?.data?.result))
    }

    const claim = async () => {
        const response = await claimRewardCommission(true).unwrap();
        if (response.success) {
            triggeraffiliate();
            affiliateCommission(true)
            successtoast('success', claimData.message)
        }
        else {
            console.log("Eroor")
        }
    }

    useFocusEffect(
        useCallback(() => {
            getCommissionDetails(pagination)
            getAffiliate(date)
        }, [date])
    );

    useEffect(() => {
        const futureDate = new Date(new Date(lastClaimDate).getTime() + rewardGenerated * 24 * 60 * 60 * 1000).getTime()
        setTargetTime(futureDate)
        setIsCompleted(false)
    }, [lastClaimDate, rewardGenerated]);

    console.log("totalCommission", totalCommission)

    return (
        <View style={style.dashboard}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={style.filterRow}>
                    {
                        dropdownData.map((item) => (
                            <Pressable
                                key={item.id}
                                onPress={() => setDate(item.value)}
                                style={[style.filterButton, date === item.value && style.filterButtonActive]}
                            >
                                <Text size="small" style={[style.filterText, date === item.value && style.filterTextActive]}>{item.label}</Text>
                            </Pressable>
                        ))
                    }
                </View>
                <View style={style.between}>
                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ width: "48%", height: 120, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 16, flexDirection: "row"}}>
                        {
                            profileImage ?
                                <Images
                                    type="image"
                                    source={{ uri: `${PROFILEURL}${profileImage}` }}
                                    width={windowwidth * 0.13}
                                    height={windowwidth * 0.13}
                                    style={{ borderRadius: 100 }}
                                    resizeMode="cover"
                                />
                                :
                                <Images
                                    type="svg"
                                    name={theme.theme == "dark" ? "DarkUser" : "EmptyUser"}
                                    width={windowwidth * 0.13}
                                    height={windowwidth * 0.13}
                                />
                        }
                        <View style={{ marginLeft: 15, width: 70 }}>
                            <Text size="small" style={{ marginBottom: "15%", color: theme.theme === "dark" ? Colors.warmgrey : Colors.black }}>Total Earning</Text>
                            <Text size="medium" numoflines={1} style={{ color: theme.primarytext }}>{convert((parseFloat(claimed || 0) + parseFloat(toClaim || 0)))}</Text>
                            <Text size="small" numoflines={1} style={{ color: Colors.brand, fontFamily: Fontfamily.bold }}>{convertSec((parseFloat(claimed || 0) + parseFloat(toClaim || 0)))}</Text>
                        </View>
                    </Card>

                    
                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ width: "48%", height: 120, borderRadius: 12, justifyContent: "flex-start", alignItems: "flex-end", marginBottom: 16, flexDirection: "row"}}>
                        <View style={{ position: 'absolute', top: 5, left: 10, flexDirection: "row", alignItems: "center" }}>
                            <Images
                                type="svg"
                                name="Earning"
                                width={"60%"}
                            />
                            <Text size="small" style={{ color: theme.primarytext }}>Earning</Text>
                        </View>
                        <View style={{ justifyContent: "flex-end", marginLeft: 15, marginBottom: 15 }}>
                            <Text size="medium" style={{ color: theme.primarytext }}>{convert(parseFloat(claimed || 0))}  |  <Text size="small" style={{ color: Colors.brand, fontFamily: Fontfamily.bold }}>{convertSec(parseFloat(claimed || 0))}</Text></Text>
                        </View>
                    </Card>
                </View>
                <View style={[style.between]}>
                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ width: "48%", height: 120, borderRadius: 12, justifyContent: "flex-start", alignItems: "flex-end", marginBottom: 16, flexDirection: "row"}}>
                        <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: "row", alignItems: "center" }}>
                            <Images
                                type="svg"
                                name="TimerIcon"
                                width={"35%"}
                            />
                            <Text size="small" color={theme.primarytext}>   Pending Claims</Text>
                        </View>
                        <View style={{ justifyContent: "flex-end", marginLeft: 15, marginBottom: 15 }}>
                            <Text size="medium" style={{ color: theme.primarytext }}>{convert(parseFloat(toClaim || 0))}  |  <Text size="small" style={{ color: Colors.brand, fontFamily: Fontfamily.bold }}>{convertSec(parseFloat(toClaim || 0))}</Text></Text>
                        </View>
                    </Card>

                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ width: "48%", height: 120, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 16, flexDirection: "row"}}>
                        <View style={{ justifyContent: "center", paddingHorizontal: 10 }}>
                            <Text size="tiny" family="bold" align="center" color={theme.primarytext}>Next Payout</Text>
                            <Text size="semismall" align="center" color={theme.primarytext}>Come back now and </Text>
                            <Text size="semismall" align="center" color={theme.primarytext}>claim bonus!</Text>
                            {
                                (lastClaimDate === null || isCompleted) ?
                                    <Pressable onPress={claim} disabled={totalCommission === 0 || (lastClaimDate === null && isCompleted) || isLoading} style={[{
                                        marginTop: "3%", paddingHorizontal: "8%", alignItems: "center", paddingVertical: "3%", borderRadius: 20,
                                        backgroundColor:
                                            totalCommission === 0 || (lastClaimDate === null && isCompleted)
                                                ? Colors.grey : "#DFDFDF"
                                    },]}>
                                        {
                                            isLoading ?
                                                <Loadercomponent containerstyle={{ paddingVertical: RFvalue(9) }} activityindicatorprops={{ color: Colors.black }} />
                                                : <Text size="small" style={{ color: theme.theme === "dark" ? "#121212" : Colors.black }}>Claim Rewards</Text>
                                        }
                                    </Pressable>
                                    :
                                    <View>
                                        {
                                            targetTime && (targetTime !== null || targetTime != 0) ?
                                                <Countdown date={targetTime} onComplete={() => setIsCompleted(true)} /> :
                                                <Loadercomponent />
                                        }
                                    </View>
                            }
                        </View>
                    </Card>
                </View>


                <View>
                    <Text size="medium">Rewards History</Text>
                </View>
                {
                    tableData.length > 0 ?
                        <FlatList
                            data={tableData}
                            keyExtractor={(item, index) => index.toString()}
                            showsVerticalScrollIndicator={false}
                            style={{ marginTop: 5 }}
                            renderItem={({ item }) => (
                                <Card containerStyle={{ padding: 15, marginBottom: 10, backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF", marginTop: "3%" }}>
                                    <Flexcomponent justifyContent="space-between" alignItems="center" >
                                        <View style={{ flex: 0.5, }}>
                                            <Text family="regular" size="semimedium" color={theme.graytext}>Amount </Text>
                                            <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{convert(item.fee)}  <Text family="medium" size="small" color={theme.graytext}>{convertSec(item.fee)}</Text></Text>
                                        </View>
                                        <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                            <Text family="regular" size="semimedium" color={theme.graytext} >Transfer Type</Text>
                                            <Text family="medium" size="semimedium" style={{ marginTop: 3 }}>{item?.transferType ? item.transferType.toUpperCase() : "N/A"}</Text>
                                        </View>
                                    </Flexcomponent>


                                    <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                        <View style={{ flex: 0.5, }}>
                                            <Text family="regular" size="semimedium" color={theme.graytext} >Date</Text>
                                            <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</Text>
                                        </View>
                                        <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                            <Text family="regular" size="semimedium" color={theme.graytext} >Claimed Date</Text>
                                            <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{item?.claimedAt ? new Date(item.claimedAt).toLocaleDateString() : "-"}</Text>
                                        </View>
                                    </Flexcomponent>



                                    <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginTop: 10 }} >
                                        <View style={{ flex: 0.5, }}>
                                            <Text family="regular" size="semimedium" color={theme.graytext} >Commision</Text>
                                            <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{convert(item.commission)}  <Text family="medium" size="small" color={theme.graytext}>{convertSec(item.commission)}</Text></Text>
                                        </View>
                                        {/* <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                            <Text family="regular" size="semimedium" color={theme.graytext} >Order Type</Text>
                                            <Text family="medium" size="semimedium" style={{ marginTop: 3 }}> { }</Text>
                                            <Text family="medium" size="small">{convertSec(item?.commission)}</Text>
                                        </View> */}
                                    </Flexcomponent>


                                    {/* <Flexcomponent top={"5%"} justifyContent="space-between" >
                                        <Card backgroundColor={theme.background} containerStyle={{ padding: "2.5%", width: "45%", alignItems: "center" }} >
                                            <Text family="medium" size="semimedium"  >{new Date(item.date).toDateString()}</Text>
                                        </Card>

                                        <View style={{ width: "50%", alignItems: "flex-end" }}>
                                        </View>
                                    </Flexcomponent> */}
                                </Card>
                            )}
                        />
                        :
                        <View style={{ marginTop: '20%' }}>
                            <NoData title="No data found" />
                        </View>

                }
            </ScrollView>
        </View>
    )
}

export default RewardsHub;