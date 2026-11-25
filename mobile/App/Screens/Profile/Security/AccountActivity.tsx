import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Description from "../Description";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import NoData from "../../../Components/Nodata";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { formatDateTime } from "../../../Utilities/helerfunction";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { Commonalert } from "../../../Actions/Hooks/customhook";
import { useDeleteSessionMutation, useLazyAllsessionQuery } from "../../../Slices/auth";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AccountActivity'>;

const AccountActivity: React.FC<Props> = () => {
    const { theme, navigation, successtoast } = useCustomHooks();
    const style = styles(theme);
    const { loginHistory } = useSelector((state: any) => state.auth.userData);
    const [devices, setDevices] = useState<any>([])

    const [allSession] = useLazyAllsessionQuery();
    const [deleteSession, { error, isLoading: isDeletingSession }] = useDeleteSessionMutation();

    useApiError(error);

    const feachAllSesstion = async () => {
        const response = await allSession(0).unwrap();
        if (response.success) {
            console.log(response?.result.data, "feachAllSesstion")
            setDevices(response?.result.data)
        } else {
            console.log("error", "All session get")
        }
    }

    const handleDelete = async (id: any) => {
        const payload = {
            sessionId: id
        }
        const response = await deleteSession(payload).unwrap();
        if (response.success) {
            successtoast("Success", response.message)
            feachAllSesstion()
        } else {
            console.log("error", "session delete")
        }
    }

    useFocusEffect(
        useCallback(() => {
            feachAllSesstion()
        }, [])
    );

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle="Account Activity"
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{
                    padding: "4%",
                    marginBottom: 12,
                    backgroundColor: theme.theme === "dark" ? "#16181A" : theme.card,
                }}
                >
                    {/* regionName/countryName come from a GeoLite2 IP lookup that
                    fails (and is stored as the literal string "N/A") for private/
                    dev-network IPs - ipAddress is always populated (it's just
                    req.ip), so show that instead, matching web's Security.jsx. */}
                    <Text>{loginHistory.browserName}-{loginHistory.os} {loginHistory.ipAddress}</Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: "2%" }}>
                        <Text style={{ color: "#2e5aa3" }}>Last Accessed</Text>
                        <Text style={{ color: theme.secondarytext }}>{formatDateTime(loginHistory.startTime)}</Text>
                    </View>
                </Card>
                <Text style={[style.note, { marginTop: "2%" }]}>Note :</Text>
                <Description
                    content="withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email."
                />
                <Text size="medium" style={[{ marginTop: "5%", marginBottom: "5%" }]}>Manage Activity</Text>
                <FlatList
                    data={devices.filter((item: any) => item?.deviceName?.length > 0)}
                    keyExtractor={(item) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    renderItem={({ item }) => {
                        return (
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{
                                padding: "4%",
                                marginBottom: 12,
                            }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text>{item.deviceName}</Text>
                                    <Pressable disabled={isDeletingSession} onPress={() => {
                                        Commonalert({
                                            title: "Log Out",
                                            des: "Are you sure you want to log out?",
                                            yes: () => handleDelete(item._id),
                                        });
                                    }}>
                                        <VectorIcons
                                            family="Entypo"
                                            name={"log-out"}
                                            size={15}
                                        />
                                    </Pressable>

                                </View>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: "4%" }}>
                                    <Text size="xsmall" style={{ color: "#2e5aa3" }}>{item.city}, {item.subdivisions}, {item.registered_country}</Text>
                                    <Text style={{ color: theme.secondarytext }}>{formatDateTime(item.createdAt)}</Text>
                                </View>
                            </Card>
                        )
                    }}
                    ListEmptyComponent={
                        <View style={{ marginTop: "10%" }}>
                            <NoData title="No Activity" />
                        </View>
                    }
                />
            </View>
        </Mainview>
    )

}

export default AccountActivity;