import React, { useCallback, useEffect, useState } from "react";
import { Clipboard, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import QRCode from "react-native-qrcode-svg";
import { useSelector } from "react-redux";

import Card from "../../../Components/Card";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { useDisabletwofaMutation, useEnabletwofaMutation, useLazyTwofactorauthsetupQuery } from "../../../Slices/auth";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'TwoFactor'>;

const TwoFactor: React.FC<Props> = () => {
    const { theme, navigation, failuretoast, successtoast } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);
    const [twofactorauthsetup, { data }] = useLazyTwofactorauthsetupQuery()
    const fetchtowfa = data?.result?.data ?? ""

    useFocusEffect(
        useCallback(() => {
            twofactorauthsetup(true)
        }, [])
    );

    useEffect(() => {
        console.log("fetchtowfa___", fetchtowfa, data?.result?.data)
    }, [fetchtowfa])

    const Copydata = (data: any) => {
        Clipboard?.setString(data);
        successtoast("Copied Successfully");
    };
    const [otp, setOtp] = useState("")
    const [ischeck, setCheck] = useState(false)

    const [enabletwofa, { data: enableres, isLoading: enableload, error: enableerror }] = useEnabletwofaMutation()
    const [disabletwofa, { data: disableres, isLoading: disableload, error: disableerror }] = useDisabletwofaMutation()

    useApiError(enableerror)
    useApiError(disableerror)

    const submit = async () => {
        const isEnabling = !fetchtowfa?.enable;
        if (isEnabling && !ischeck) {
            failuretoast("Failure!", "Please verify the secret code before continuing.")
        }
        else if (!otp) {
            failuretoast("Failure!", "Authentication code is requried")
        }

        else if (otp?.length < 6) {
            failuretoast("Failure!", "Enter valid Authentication code")
        }
        else {
            const payload = {
                secret: fetchtowfa?.secret,
                uri: fetchtowfa?.uri,
                checkValue: true,
                code: otp
            }
            let response
            response = !fetchtowfa?.enable ? await enabletwofa(payload).unwrap() : await disabletwofa(payload).unwrap()
            console.log("responseresponse_______", response)
            if (response?.success) {
                await triggeruserdetails();
                navigation?.goBack();
                successtoast("success!", `Google 2fa updated successfully`)
            }
        }
    }
    return (
        <Mainview
            isheader={true}
            headertitle={"2FA"}
            isscollable={true}
            scrollprops={{
                contentContainerStyle: {
                    flexGrow: 1
                }
            }}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <Button
                    title={fetchtowfa?.enable ? "Disable" : "Enable"}
                    buttonStyle={[{ backgroundColor: fetchtowfa?.enable ? Colors.red : Colors.green }]}
                    onPress={() => submit()}
                    loading={fetchtowfa?.enable ? disableload : enableload}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>

                <View style={style.qrContainer}>
                    <Card containerStyle={style.qr}>
                        <QRCode
                            value={fetchtowfa?.uri}
                            size={windowwidth * 0.50}
                        />
                    </Card>
                </View>

                <Input
                    label="Your 32 Digit Security Code"
                    value={fetchtowfa?.secret}
                    disabled={true}
                    rightContent={
                        <Pressable style={{ marginLeft: "2%" }} onPress={() => Copydata(fetchtowfa?.secret)}>
                            <VectorIcons
                                family="Ionicons"
                                name="copy-outline"
                                size={18}
                            />
                        </Pressable>
                    }
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />

                <Input
                    label="Enter Authentication Code"
                    placeHolder="Enter 6 digit authentication code"
                    value={otp}
                    onChange={(text) => setOtp(text)}
                    keyboardType="number-pad"
                    maxLength={6}
                    inputprops={{
                        maxLength: 6
                    }}
                    allowed={"number"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />

                {
                    fetchtowfa?.enable ? null :
                        <View style={{ marginTop: "5%" }}>
                            <Input
                                type="checkbox"
                                label="I Have Backed Up The Secret Code"
                                value={ischeck}
                                onChange={setCheck}
                                boxstyle={{
                                    borderWidth: 1,
                                    borderColor: theme.boderColor
                                }}

                            />
                        </View>
                }
            </View>
        </Mainview>
    )

}

export default TwoFactor;