import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleProp, TextInput, View, ViewStyle } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import { InputDateTime } from "../../../Components/Field";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Loadercomponent from "../../../Components/loadercomponent";
import { Colors, Fontfamily, limit } from "../../../Utilities/uiasset";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { useLazyReferaldetailsQuery, useLazyReferalhistoryQuery } from "../../../Slices/auth";
import { borderradius, RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";
import NoData from "../../../Components/Nodata";
import LinearGradient from "../../../Components/lineargradient";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Referaldashboard'>;
const Referaldashboard: React.FC<Props> = () => {
    const { theme, navigation, convert } = useCustomHooks()

    interface boxprops {
        title: string,
        count: string | number,
        bg?: string,
        conatinerstyle?: StyleProp<ViewStyle>
    }
    const Boxcomponent = ({
        title,
        count,
        bg = "#8450E7",
        conatinerstyle
    }: boxprops) => {
        return (
            // <View style={[{ width: "47.5%", paddingVertical: "7.5%", borderRadius: borderradius * 0.5, backgroundColor: bg, alignItems: "center", justifyContent: "center" }, conatinerstyle]} >
            //     <Text size="medium" color={theme.theme === "dark" ? theme.activetab : Colors.white} >{count}</Text>
            //     <Text size="semimedium" top={"2.5%"} color={theme.theme === "dark" ? theme.secondarytext : Colors.white} > {title}</Text>
            // </View >
            <LinearGradient
                colors={[
                    "rgba(255, 255, 255, 0.12)",
                    "rgba(255, 255, 255, 0.02)"
                ]}
                locations={[0.0585, 0.9401]}
                start={{ x: 0.0315, y: 0.3255 }}
                end={{ x: 0.9685, y: 0.6745 }}
                style={[
                    {
                        width: "47.5%",
                        borderRadius: borderradius * 0.5,
                        padding: 1,
                    },
                    conatinerstyle
                ]}
            >
                <LinearGradient
                    colors={
                        theme.theme === "dark"
                            ? ["rgba(15, 47, 94, 0.5)", "rgba(0, 0, 0, 0.5)"]
                            : ["#d9d9d985", "#d9d9d97e"]
                    }
                    locations={[0.1092, 0.964]}
                    start={{ x: 0.0504, y: 0.2812 }}
                    end={{ x: 0.9496, y: 0.7188 }}
                    style={{
                        paddingVertical: "7.5%",
                        borderRadius: borderradius * 0.5,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Text
                        size="medium"
                        color={
                            theme.theme === "dark"
                                ? theme.activetab
                                : Colors.black
                        }
                    >
                        {count}
                    </Text>

                    <Text
                        size="semimedium"
                        top={"2.5%"}
                        color={
                            theme.theme === "dark"
                                ? theme.secondarytext
                                : Colors.black
                        }
                    >
                        {title}
                    </Text>
                </LinearGradient>
            </LinearGradient>
        )
    }

    const [referaldetails, { data, isLoading }] = useLazyReferaldetailsQuery()

    const [transactiondata, setTransactiondata] = useState<any[]>([])

    useFocusEffect(
        useCallback(() => {
            referaldetails(true)
        }, [])
    );

    const refferaldata = data?.result?.data?.[0] ?? ""

    const [startdate, setStartdate] = useState<any>("")
    const [enddate, setEnddate] = useState<any>("")
    const [referalhistory] = useLazyReferalhistoryQuery()
    const [queryparams, setQureyparams] = useState<any>("")
    const [page, setPage] = useState(1)

    const [maxreached, setMaxreached] = useState(false)

    // The date picker seeds itself with the current moment and only lets the
    // user change the day/month/year, so the Date it returns carries whatever
    // time-of-day the picker happened to be opened at - not midnight. Left
    // as-is, picking the same day for both Start and End collapses the query
    // range to the few seconds between the two taps instead of the full day.
    const toStartOfDay = (date: any) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };

    const toEndOfDay = (date: any) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d.getTime();
    };

    const fetchData = useCallback(async () => {
        const res = await referalhistory({
            page: page,
            limit: limit.recent_tranaction,
            startDate: startdate ? toStartOfDay(startdate) : "",
            endDate: enddate ? toEndOfDay(enddate) : "",
            search: queryparams

        })
        const result = res?.data?.result?.data
        if (page == 1) {
            setTransactiondata(result)
        }
        else {
            setTransactiondata((prevstate) => [...prevstate, ...(result ?? [])])
        }

        if (res?.data?.result.count < limit.recent_tranaction) {
            setMaxreached(true)
        }
    }, [startdate, enddate, queryparams, isLoading, maxreached, page])


    useEffect(() => {
        const delay = setTimeout(() => {
            setPage(1);
            setMaxreached(false);
            setTransactiondata([])
        }, 500);

        return () => clearTimeout(delay);
    }, [startdate, enddate, queryparams])

    useFocusEffect(
        useCallback(() => {
            fetchData()
        }, [page, fetchData])
    );

    return (
        <Mainview
            headertitle="Referral Dashboard"
            onleftfn={() => navigation?.goBack()}
            isscollable={false}
            righticon={
                <Pressable onPress={() => navigation?.navigate("Reference")}>
                    <VectorIcons
                        family="Ionicons"
                        name="share-social-outline"
                        iconcolor={theme.darktext}
                        size={windowwidth * 0.05}
                    />
                </Pressable>
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <>
                <Flexcomponent style={{ flexWrap: "wrap" }} justifyContent="space-between" >
                    <Boxcomponent title="Qualified referrals" count={refferaldata?.refferQualifiedCount}
                        // bg="#002b82" 
                        bg={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    />
                    <Boxcomponent conatinerstyle={{ marginTop: "10%" }} title="Referral Count" count={refferaldata?.refferCount}
                        // bg="#6265FF" 
                        bg={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    />
                    <Boxcomponent conatinerstyle={{}} title="Total Rewards" count={convert(refferaldata?.amount)}
                        // bg="#003786" 
                        bg={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    />
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" height={windowheight * 0.055} style={{ marginTop: "4%" }} >
                    <Text size="medium" >Referral History</Text>
                    <View style={{ width: "47.5%", height: windowheight * 0.055, borderRadius: borderradius * 0.5, flexDirection: "row", alignItems: "center", backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC" }} >
                        <View style={{ width: "20%", justifyContent: "center", alignItems: "center" }} >
                            <VectorIcons
                                family="Feather"
                                name={"search"}
                                size={windowwidth * 0.045}
                                iconcolor={theme.secondarytext}
                            />
                        </View>
                        <TextInput
                            style={{ paddingHorizontal: "5%", color: theme.textinput, fontFamily: Fontfamily.regular, fontSize: RFvalue(12), flex: 1 }}
                            placeholder="Search..."
                            placeholderTextColor={theme.secondarytext}
                            value={queryparams}
                            onChangeText={(text) => setQureyparams(text)}
                        />
                    </View>
                </Flexcomponent>
                <Flexcomponent alignItems="flex-end" justifyContent="space-between" style={{ marginTop: "4%" }} >
                    <View style={{ width: "40%", alignItems: "center" }} >
                        <Flexcomponent
                            height={windowheight * 0.055}
                            style={{
                                borderRadius: borderradius * 0.5,
                                borderWidth: 1,
                                borderColor: theme.theme === "dark" ? theme.boderlight : "#d7dce5",
                                backgroundColor: theme.theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.55)",
                                paddingLeft: "5%",
                                paddingRight: "2.5%"
                            }}
                            justifyContent="space-between"
                            width={"100%"}
                        >
                            <InputDateTime
                                placeHolder="Start date"
                                inputType="date"
                                value={startdate}
                                onConfirm={(text: any) => {
                                    setStartdate(text)
                                }}
                                containerstyle={{
                                    height: "100%",
                                    top: 3,
                                    paddingHorizontal: 0,
                                    backgroundColor: "transparent",
                                    shadowColor: "transparent",
                                    shadowOpacity: 0,
                                    elevation: 0
                                }}

                                datePickerProps={{
                                    maximumDate: new Date()
                                }}
                                themes={theme}
                                rightIcon={
                                    <VectorIcons
                                        name={"calendar"}
                                        family="Feather"
                                        iconcolor={theme.secondarytext}
                                        size={windowwidth * 0.045}
                                    />
                                }
                            />
                        </Flexcomponent>
                    </View>
                    <View style={{ width: "40%", alignItems: "center" }} >
                        <Flexcomponent height={windowheight * 0.055}
                            style={{
                                borderRadius: borderradius * 0.5,
                                borderWidth: 1,
                                borderColor: theme.theme === "dark" ? theme.boderlight : "#d7dce5",
                                backgroundColor: theme.theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.55)",
                                paddingLeft: "5%",
                                paddingRight: "2.5%"
                            }}
                            justifyContent="space-between"
                            width={"100%"}
                            top={"5%"}
                        >
                            <InputDateTime
                                placeHolder="End date"
                                inputType="date"
                                value={enddate}
                                onConfirm={(text: any) => {
                                    setEnddate(text)
                                }}
                                containerstyle={{
                                    height: "100%",
                                    top: 3,
                                    backgroundColor: "transparent",
                                    shadowColor: "transparent",
                                    shadowOpacity: 0,
                                    elevation: 0
                                }}
                                datePickerProps={{
                                    maximumDate: new Date()
                                }}
                                themes={theme}
                                rightIcon={
                                    <VectorIcons
                                        name={"calendar"}
                                        family="Feather"
                                        iconcolor={theme.secondarytext}
                                        size={windowwidth * 0.045}
                                    />
                                }
                            />
                        </Flexcomponent>
                    </View>
                    <Pressable onPress={() => {
                        setStartdate("")
                        setEnddate("")
                        setQureyparams("")
                    }} style={{ width: "12.5%", height: windowheight * 0.055, backgroundColor: Colors.brand, borderRadius: borderradius * 0.5, justifyContent: "center", alignItems: "center" }} >
                        <VectorIcons
                            family="MaterialDesignIcons"
                            name="reload"
                            iconcolor={theme.theme == 'dark' ? Colors.black : Colors.white}
                            size={18}
                        />
                    </Pressable>
                </Flexcomponent>
            </>
            <View style={{ flex: 1, paddingTop: "3%" }} >
                <FlatList
                    data={transactiondata}
                    renderItem={({ item, index }) => (
                        <Card containerStyle={{ padding: "5%", marginVertical: "2.5%" }} >
                            <Flexcomponent justifyContent="space-between" alignItems="center" >
                                <View style={{ flex: 0.5, }}>
                                    <Text family="regular" size="semimedium" color={theme.graytext} >Refferal Username</Text>
                                    <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{item?.childUserName}</Text>
                                </View>
                                <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                    <Text family="regular" size="semimedium" color={theme.graytext} >Type</Text>
                                    <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{item?.transferType}</Text>
                                </View>
                            </Flexcomponent>
                            <Flexcomponent top={"5%"} justifyContent="space-between" alignItems="center" >
                                <View style={{ flex: 0.5, }}>
                                    <Text family="regular" size="semimedium" color={theme.graytext} >Currency</Text>
                                    <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >INR</Text>
                                </View>
                                <View style={{ flex: 0.5, alignItems: "flex-end" }}>
                                    <Text family="regular" size="semimedium" color={theme.graytext} >Your Commission</Text>
                                    <Text family="medium" size="semimedium" style={{ marginTop: 3 }} >{convert(item?.amount)}</Text>
                                </View>
                            </Flexcomponent>
                            <Flexcomponent top={"5%"} justifyContent="space-between" >
                                <Card backgroundColor={theme.background} containerStyle={{ padding: "2.5%", width: "45%", alignItems: "center" }} >
                                    <Text family="medium" size="semimedium"  >{(new Date(item?.createdAt)).toDateString()}</Text>
                                </Card>
                                <View style={{ width: "50%", alignItems: "flex-end" }} >
                                    <Text color={item?.status == "completed" ? Colors.green : (item?.status == "rejected") ? Colors.red : theme.activetab} family="medium" size="semimedium"  >{item?.status}</Text>
                                </View>
                            </Flexcomponent>

                        </Card>
                    )}
                    ListFooterComponent={(page > 1 && isLoading) ?
                        <Loadercomponent containerstyle={{ height: windowheight * 0.05 }} /> : null
                    }
                    ListEmptyComponent={
                        <NoData />
                    }
                />


            </View>
        </Mainview>
    )

}


export default Referaldashboard;