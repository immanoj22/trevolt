import React, { useCallback } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Images from "../../../Utilities/images";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import { capitalizeFirst, getProfileImageUrl } from "../../../Utilities/helerfunction";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useLazyCashfreestatusQuery } from "../../../Slices/auth";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'MyAccount'>;

const MyAccount: React.FC<Props> = () => {
    const { theme, navigation, copyData } = useCustomHooks();
    const style = styles(theme);

    const { email, referralCode, userId, profileImage, role, externalKycStatus, reason, userGreenId, firstName, lastName } = useSelector((state: any) => state.auth.userData);
    const maskedEmail = (() => {
        if (!email || typeof email !== "string" || !email.includes("@")) return email;
        const [local, domain] = email.split("@");
        return `${local.slice(0, 6)}.....@${domain}`;
    })();

    const [cashfreestatus] = useLazyCashfreestatusQuery()
    const kycStatus = externalKycStatus

    useFocusEffect(
        useCallback(() => {
            cashfreestatus(true)
        }, [])
    );

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            isscollable={true}
            headertitle={"My Account"}
            onleftfn={() => navigation.goBack()}
            isrefereshcontrol={true}
            onreload={() => {
                cashfreestatus(true)
            }}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={[style.container]}>
                <Text size={"medium"}>Accounts Details</Text>
                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginTop: '8%' }}>
                    <View style={[style.between, { paddingHorizontal: "5%", paddingVertical: "2.5%" }]}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
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
                            <View style={{ marginLeft: "10%" }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Text family="semiBold">{firstName} {lastName}  </Text>
                                    {
                                        (kycStatus === "notVerified" || kycStatus === "rejected" || kycStatus == "pending" || kycStatus === "expired") ?
                                            <VectorIcons
                                                family="MaterialDesignIcons"
                                                name="alert-decagram"
                                                size={20}
                                                iconcolor={Colors.red}
                                            /> :
                                            <VectorIcons
                                                family="MaterialIcons"
                                                name="verified"
                                                size={20}
                                                iconcolor={Colors.brand}
                                            />
                                    }
                                </View>
                                <Text style={{ color: theme.secondarytext }}>{role}</Text>
                            </View>
                        </View>
                        <Pressable onPress={() => navigation.navigate("AccountEdit")}>
                            {
                                theme.theme === "dark" ?
                                    <Images
                                        type="svg"
                                        name="Pen"
                                        width={windowwidth * 0.05}
                                    />
                                    :
                                    <Images
                                        type="svg"
                                        name="PenDark"
                                        width={windowwidth * 0.05}
                                    />
                            }
                        </Pressable>
                    </View>
                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.theme === "dark" ? Colors.dune : theme.boderColor }} />
                    <View style={[style.between, { paddingHorizontal: "5%", paddingTop: "8%" }]}>
                        <Text style={{ color: theme.secondarytext }}>User ID</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                            <Text style={{ marginRight: "8%" }}>{userGreenId}</Text>
                            <Pressable onPress={() => copyData(userId)}>
                                <VectorIcons
                                    family="Ionicons"
                                    name="copy-outline"
                                    size={18}
                                />
                            </Pressable>
                        </View>
                    </View>
                    <View style={[style.between, { paddingHorizontal: "5%", marginTop: '5%' }]}>
                        <Text style={{ color: theme.secondarytext }}>Email Id</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                            <Text style={{ marginRight: "6%" }}>{maskedEmail}</Text>
                            <Pressable onPress={() => copyData(email)}>
                                <VectorIcons
                                    family="Ionicons"
                                    name="copy-outline"
                                    size={18}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <View style={[style.between, { paddingHorizontal: "5%", marginTop: '5%' }]}>
                        <Text style={{ color: theme.secondarytext }}>Referral Code</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                            <Text style={{ marginRight: "8%" }}>{referralCode}</Text>
                            <Pressable onPress={() => copyData(referralCode)}>
                                <VectorIcons
                                    family="Ionicons"
                                    name="copy-outline"
                                    size={18}
                                />
                            </Pressable>
                        </View>
                    </View>

                    <View style={style.verifiedContainer}>
                        {kycStatus == "rejected" &&
                            <>
                                <Flexcomponent width={"100%"} justifyContent="space-between" >
                                    <Text color={theme.secondarytext} >KYC status</Text>
                                    <Text color={"red"} family="semiBold" >Rejected</Text>
                                </Flexcomponent>
                                <Flexcomponent style={{ marginBottom: "2.5%" }} width={"100%"} justifyContent="space-between" >
                                    <Text color={theme.secondarytext} >Reason</Text>
                                    <Text family="regular" style={{ flexShrink: 1, textAlign: "right", marginLeft: "10%" }}>{reason}</Text>
                                </Flexcomponent>
                            </>
                        }

                        {kycStatus == "pending" &&
                            <Flexcomponent style={{ marginBottom: "2.5%" }} width={"100%"} justifyContent="space-between" >
                                <Text color={theme.secondarytext} >KYC status</Text>
                                <Text color={theme.inversetext} family="semiBold" style={{ color: kycStatus == "pending" ? Colors.red : Colors.red }}>{capitalizeFirst(kycStatus)}</Text>
                            </Flexcomponent>
                        }
                        {(kycStatus == "notVerified" || kycStatus == "rejected" || kycStatus == "pending" || kycStatus === "expired") &&
                            <Button
                                title={(kycStatus == "rejected" || kycStatus == "pending") ? "Retry" : "Get Verified"}
                                // Used to call cashfreesubmit() directly, which jumps straight
                                // into the Cashfree/Aadhaar hosted flow regardless of phone/PAN/
                                // selfie/financial status. Routing through the staged Verification
                                // screen (same as Home/Profile) ensures phone verification etc.
                                // happen first via its handleVerifyNow chain.
                                onPress={() => navigation.navigate("Verification")}
                                buttonStyle={[style.verified, { marginTop: (kycStatus == "rejected" || kycStatus == "pending") ? "2.5%" : 0 }]}
                                rightContent={
                                    <View style={{ marginLeft: "8%", }}>
                                        <VectorIcons
                                            family="Ionicons"
                                            name="chevron-forward"
                                            iconcolor={theme.theme == 'dark' ? Colors.black : Colors.white}
                                            size={18}
                                        />
                                    </View>
                                }
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />

                        }
                    </View>
                </Card>
            </View>
        </Mainview>
    )

}

export default MyAccount;