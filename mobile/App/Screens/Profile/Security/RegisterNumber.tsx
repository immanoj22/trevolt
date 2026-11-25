import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Description from "../Description";
import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import { athuDataProps } from "../../../Actions/type";
import { helperSelector } from "../../../Slices/helper";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowheight } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { isValidMobile, isValidOtp } from "../../../Validation";
import { useVerificationMobileMutation, useVerifyNewMobileMutation, useVerifyNumberMutation } from "../../../Slices/auth";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'RegisterNumber'>;

const RegisterNumber: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);

    const { phoneparams } = useSelector(helperSelector)

    const initialUserData: athuDataProps = useMemo(() => ({
        mobileNumber: {
            value: "",
            rules: { required: true },
            messages: { required: 'First name is required!' },
            isValid: true,
        },
        countryCode: {
            value: "91",
            rules: { required: true },
            messages: { required: 'Last name is required!' },
            isValid: true,
        },
        otp: {
            value: "",
            rules: { required: true },
            messages: { required: 'OTP is required!' },
            isValid: true,
        }
    }), []);

    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [isOtpSend, setIsOTPSend] = useState(false);

    const [verify, { error: verifyError, isLoading }] = useVerifyNumberMutation();
    const [getVerificationCode, { error: getCodeError, isLoading: getCodeLoading }] = useVerificationMobileMutation();
    // const [verifyNewMobile, { error: verifynewError, isLoading: verifyLoading }] = useVerifyNewMobileMutation();
    // const [register, { error: registerError, isLoading: regiserLoader }] = useRegisterNumberMutation();
    useApiError(verifyError ?? getCodeError ?? false);

    const handleSubmit = async () => {
        const mobileError = isValidMobile(userData.mobileNumber?.value);
        if (mobileError) {
            failuretoast("Error", mobileError);
            return;
        }
        const paylaod: any = {
            mobileNumber: userData.mobileNumber?.value,
            countryCode: userData.countryCode?.value
        }
        const response = await getVerificationCode(paylaod).unwrap()
        if (response.success) {
            setIsOTPSend(true)
            successtoast("Success", response.message);
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    const handleVerify = async () => {
        const otpError = isValidOtp(userData.otp?.value);
        if (otpError) {
            failuretoast("Error", otpError);
            return;
        }
        const paylaod: any = {
            mobileNumber: userData.mobileNumber?.value,
            countryCode: userData.countryCode?.value,
            otp: userData.otp?.value,
        }
        const response = await verify(paylaod).unwrap();
        if (response.success) {
            await triggeruserdetails();
            successtoast("Success", response.message);
            if (phoneparams?.type === "add") {
                navigation.goBack();
            } else {
                navigation.navigate("PhoneNumber");
            }

        } else {
            setIsOTPSend(false)
            failuretoast("Error", "Something went wrong!");
        }
    }

    // const handleChange = async () => {
    //     const mobileError = isValidMobile(userData.mobileNumber?.value);
    //     if (mobileError) {
    //         failuretoast("Error", mobileError);
    //         return;
    //     }
    //     const paylaod: any = {
    //         mobileNumber: userData.mobileNumber?.value,
    //         countryCode: userData.countryCode?.value
    //     }
    //     const response = await verifyNewMobile(paylaod).unwrap()
    //     if (response.success) {
    //         setIsOTPSend(true)
    //         successtoast("Success", response.message);
    //     } else {
    //         failuretoast("Error", "Something went wrong!");
    //     }
    // }

    const handleMethod = async () => {
        if (phoneparams?.type === "add") {
            await handleSubmit();
        }
        // else if (phoneparams?.type === "change") {
        //     await handleChange();
        // } else {
        //     failuretoast("Error", "Invalid request type.");
        // }
    };

    return (
        <Mainview
            isheader={true}
            headertitle={phoneparams?.type === "add" ? "Add Mobile Number" : "Phone Number"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                {
                    phoneparams?.type === "change" && (
                        <Description
                            title="Phone Number Change"
                        // content="Create and manage API keys to access your trading account programmatically."
                        />
                    )
                }
                <View style={{ marginTop: phoneparams?.type === "change" ? "7%" : "0%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View style={{ width: "65%" }}>
                        <Input
                            value={userData.mobileNumber?.value}
                            label="Mobile Number"
                            keyboardType="phone-pad"
                            placeHolder=" Enter mobile number"
                            leftContent={<Text>+91</Text>}
                            onChange={(text: any) => setUserData(prev => ({ ...prev, mobileNumber: { ...prev.mobileNumber, value: text } }))}
                            allowed={"number"}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                        />
                    </View>
                    <View style={{ width: "30%", marginTop: "8%", }}>
                        <Button
                            disabled={isOtpSend}
                            title="Get OTP"
                            onPress={handleMethod}
                            // buttonStyle={{ height: windowheight * 0.048 }}
                            textStyle={{ fontSize: Fontsize.small, color: theme.theme === "dark" ? Colors.black : Colors.white }}
                            loading={getCodeLoading}
                        />
                    </View>
                </View>
                <Input
                    value={userData.otp?.value}
                    label="Enter OTP"
                    onChange={(text: any) => setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: text } }))}
                    keyboardType="numeric"
                    placeHolder="Enter your OTP"
                    allowed={"number"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Button
                    title="Submit"
                    buttonStyle={style.bottomButton}
                    onPress={() => handleVerify()}
                    loading={isLoading}
                    textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                />
            </View>
        </Mainview>
    )

}

export default RegisterNumber;