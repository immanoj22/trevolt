import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Description from "../Description";
import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import Sheet from "../../../Components/bottomsheet";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { borderradius, windowwidth } from "../../../Utilities/dimensions";
import { useLazyUpdateTwofaTypeQuery } from "../../../Slices/auth";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks from "../../../Actions/Hooks/customhook";

import { styles } from "../styles";
import LinearGradient from "../../../Components/lineargradient";
import Flexcomponent from "../../../Components/flexcomponent";

interface DescriptionProps {
    title?: string;
    content?: string;
    button?: string,
    onPress?: () => void;
    subContent?: any
}

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Security'>;

// useLazyUpdateTwofaTypeQuery's result can be served from RTK Query's cache on a
// fresh mount (default keepUnusedDataFor is 60s) - navigating away from this screen
// and back within that window re-delivers the same `data`/isSuccess=true the query
// already returned, and the useEffect below would fire the "Success" toast again
// purely from the remount, not a new update. Module-level so it survives the remount
// (a useRef here would just reset with it); WeakSet so it doesn't leak.
const shownTwofaSuccess = new WeakSet<object>();

const Security: React.FC<Props> = () => {
    const { theme, navigation, bottomsheetref, closebottomsheet, openbottomsheet, successtoast } = useCustomHooks();
    const style = styles(theme);

    const { mobileNumber, tfaType } = useSelector((state: any) => state.auth.userData);

    const DescriptionList: React.FC<DescriptionProps> = ({ title, content, onPress, button, subContent }) => (
        <View style={{ marginBottom: "5%" }}>
            <View style={{ paddingHorizontal: "6%" }}>
                <Description
                    title={title}
                    content={content}
                />
                {
                    subContent ? (
                        subContent
                    ) : (
                        <Button
                            title={button || "Manage"}
                            buttonStyle={style.mange}
                            onPress={onPress}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                    )
                }
            </View>
            <View style={{ borderBottomWidth: 1, borderColor: theme.boderColor }} />
        </View>
    )

    const [factor, setFactor] = useState("");
    const [updateTwofa, { data, error, isSuccess }] = useLazyUpdateTwofaTypeQuery();

    useApiError(error ?? false);

    useEffect(() => {
        if (factor) {
            updateTwofa({ type: factor });
        }
    }, [factor]);

    useEffect(() => {
        if (isSuccess && data?.message && !shownTwofaSuccess.has(data)) {
            shownTwofaSuccess.add(data);
            successtoast("Success", data.message);
        }
    }, [isSuccess, data]);

    const typeCheck = (type: any) => {
        if (type === "google2fa") {
            return "Google"
        }
        else if (type == "email") {
            return "Email"
        }
        else {
            return "Mobile"
        }
    }

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"Security"}
            isscollable={true}
            horizontalpadding={0}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                <DescriptionList
                    title="2FA"
                    // button="Setup"
                    content="To increase your account security, it is recommended that you enable 2FA."
                    onPress={() => navigation.navigate("TwoFactor")}
                />
                <DescriptionList
                    title="Email"
                    content="Use your email to protect your account and transactions."
                    onPress={() => navigation.navigate("Email")}
                />
                <DescriptionList
                    title={"Mobile Number"}
                    button={mobileNumber ? "Manage" : "Add"}
                    content="Use your mobile number to protect your account and transactions."
                    onPress={mobileNumber ? () => navigation.navigate("PhoneNumber") : () => navigation.navigate("RegisterNumber")}
                />

                <DescriptionList
                    title="Choose Authentication"
                    content="To increase your account security, it is recommended that you enable 2FA."
                    onPress={() => navigation.navigate("AccountActivity")}
                    subContent={
                        <View style={{}}>
                            <Pressable onPress={() => openbottomsheet(bottomsheetref)} style={{
                                backgroundColor: Colors.brand,
                                width: "30%",
                                alignItems: "center",
                                paddingVertical: "3%",
                                marginVertical: "7%",
                                borderRadius: 10, flexDirection: "row", justifyContent: "center"
                            }}>
                                <Text style={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}>{typeCheck(tfaType)}  </Text>
                                <VectorIcons
                                    name="chevron-down"
                                    family="Feather"
                                    iconcolor={theme.theme == 'dark' ? Colors.black : Colors.white}
                                />
                            </Pressable>
                        </View>
                    }
                />

                <DescriptionList
                    title="Devices and Activities"
                    content="Create and manage API keys to access your trading account programmatically."
                    onPress={() => navigation.navigate("AccountActivity")}
                    button="View"
                />
            </View>

            <Sheet
                sheetref={bottomsheetref}
                // custominterface={true}
                snappoint={["35%"]}
                headertitle="Choose Authentication"
                onClose={() => closebottomsheet(bottomsheetref)}
            >
                <View style={{ marginTop: "6%" }}>
                    <Pressable onPress={() => { setFactor("email"), closebottomsheet(bottomsheetref) }} style={style.between}>
                        <Text size="medium" style={{ color: theme.darktext }}>Email</Text>
                        <View style={[style.select, { backgroundColor: theme.theme === "dark" ? Colors.dune : tfaType === "email" ? Colors.brand : theme.card, }]}>
                            {
                                tfaType === "email" && (
                                    <VectorIcons
                                        family="Octicons"
                                        name="dot-fill"
                                        iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                        size={windowwidth * 0.055}
                                    />
                                )
                            }
                        </View>
                    </Pressable>
                    <Pressable onPress={() => { setFactor("google2fa"), closebottomsheet(bottomsheetref) }} style={[style.between, { paddingVertical: "4%" }]}>
                        <Text size="medium" style={{ color: theme.darktext, marginTop: "5%" }}>Google</Text>
                        <View style={[style.select, { backgroundColor: theme.theme === "dark" ? Colors.dune : tfaType === "google2fa" ? Colors.brand : theme.card, }]}>
                            {
                                tfaType === "google2fa" && (
                                    <VectorIcons
                                        family="Octicons"
                                        name="dot-fill"
                                        iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                        size={windowwidth * 0.055}
                                    />
                                )
                            }
                        </View>
                    </Pressable>
                    <Pressable onPress={() => { setFactor("mobile"), closebottomsheet(bottomsheetref) }} style={style.between}>
                        <Text size="medium" style={{ color: theme.darktext, marginTop: "5%" }}>Mobile</Text>
                        <View style={[style.select, { backgroundColor: theme.theme === "dark" ? Colors.dune : tfaType === "mobile" ? Colors.brand : theme.card, }]}>
                            {
                                tfaType === "mobile" && (
                                    <VectorIcons
                                        family="Octicons"
                                        name="dot-fill"
                                        iconcolor={theme.theme === "dark" ? Colors.brand : Colors.white}
                                        size={windowwidth * 0.055}
                                    />
                                )
                            }
                        </View>
                    </Pressable>
                </View>
            </Sheet>
        </Mainview>
    )

}

export default Security;