import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import VectorIcons from "../../Utilities/vectoricons";
import { helperSelector } from "../../Slices/helper";
import { Button, Input } from "../../Components/Field";
import useApiError from "../../Actions/Hooks/errorhook";
import { windowwidth } from "../../Utilities/dimensions";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { useChangeforgotPassMutation, useForgotPasswordMutation } from "../../Slices/auth";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";

import styles from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'ForgotPass'>;

const ForgotPass: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);
    const otpParams = useSelector(helperSelector).otpparams;
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (!timerExpired) {
            interval = setInterval(() => {
                if (seconds > 0) {
                    setSeconds((prev) => prev - 1);
                } else if (minutes > 0) {
                    setMinutes((prev) => prev - 1);
                    setSeconds(59);
                } else {
                    setTimerExpired(true);
                    clearInterval(interval);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [seconds, minutes, timerExpired]);

    const initialUserData: athuDataProps = useMemo(() => ({
        password: {
            value: '',
            rules: { required: true, email: true },
            messages: {
                required: 'Email is required!',
            },
            isValid: true,
        },
        confirmPassword: {
            value: '',
            rules: { required: true, email: true },
            messages: {
                required: 'Email is required!',
            },
            isValid: true,
        },
        otp: {
            value: '',
            rules: { required: true, email: true },
            messages: {
                required: 'Email is required!',
            },
            isValid: true,
        },
    }), []);

    const [changeforgotpass, { isLoading, error }] = useChangeforgotPassMutation()
    const [forgotPassword, { isLoading: resendLoading, error: resendError }] = useForgotPasswordMutation()
    const [userData, setUserData] = useState<athuDataProps>(initialUserData);

    useApiError(error ?? resendError ?? false);

    const handleResend = async () => {
        try {
            const response = await forgotPassword({ email: otpParams.values.email?.toString() }).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: '' } }));
                setMinutes(5);
                setSeconds(0);
                setTimerExpired(false);
            } else {
                failuretoast("Error", response?.message || "Something went wrong!");
            }
        } catch (err) {
            console.log("handleResend__err", err);
        }
    }

    const handleSubmit = async () => {
        const payload: any = {
            email: otpParams.values.email?.toString(),
            password: userData.password?.value,
            confirmPassword: userData.confirmPassword?.value,
            otp: userData.otp?.value

        };
        try {
            const response = await changeforgotpass(payload).unwrap()
            if (response.success) {
                successtoast("Success", response.message);
                navigation.navigate("Login");
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (err) {
            console.log("handleSubmit__err", err);
        }
    }
    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle="Forgot Password"
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <Button
                    title="Submit"
                    buttonStyle={{
                        backgroundColor: "#2563EB",
                        borderRadius: 30,
                        height: 54,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 20,
                    }}
                    textStyle={{
                        color: theme.theme == 'dark' ? "#000000" : "#fff",
                        fontSize: 16,
                        fontWeight: "700",
                    }}
                    onPress={() => handleSubmit()}
                    loading={isLoading}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#000000", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={[style.container, {marginTop: "20%"}]}>

                <Input
                    label={otpParams.type === "forgot2FA" ? "Enter 2FA code" : "Enter OTP"}
                    value={userData.otp?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: text } }))}
                    keyboardType="numeric"
                    placeHolder={otpParams.type === "forgot2FA" ? "Enter your code" : "Enter your OTP"}
                    allowed={"number"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />

                {otpParams.type !== "forgot2FA" && (
                    <View style={{ alignItems: "center", marginTop: "3%", marginBottom: "5%" }}>
                        {!timerExpired ? (
                            <Text style={{ color: theme.secondarytext }}>
                                Resend OTP in {minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                            </Text>
                        ) : (
                            <Pressable onPress={() => !resendLoading && handleResend()}>
                                <Text style={{ color: "#17BD84", fontWeight: "700" }}>
                                    {resendLoading ? "Sending..." : "Resend OTP"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}

                <Input
                    label="Password"
                    placeHolder="Enter your password"
                    value={userData.password?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, password: { ...prev.password, value: text } }))}
                    secureTextEntry={!showPassword}
                    rightContent={
                        <Pressable onPress={() => setShowPassword(prev => !prev)}>
                            {showPassword ? (
                                <VectorIcons
                                    family="Ionicons"
                                    name="eye"
                                    iconcolor={Colors.grey}
                                    size={windowwidth * 0.050}
                                />
                            ) : (
                                <VectorIcons
                                    family="Ionicons"
                                    name="eye-off"
                                    iconcolor={Colors.grey}
                                    size={windowwidth * 0.050}
                                />
                            )}
                        </Pressable>
                    }
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label="Confirm Password"
                    placeHolder="Enter your Confirm Password"
                    value={userData.confirmPassword?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, confirmPassword: { ...prev.confirmPassword, value: text } }))}
                    secureTextEntry={!showConfirmPass}
                    rightContent={
                        <Pressable onPress={() => setShowConfirmPass(prev => !prev)}>
                            {showConfirmPass ? (
                                <VectorIcons
                                    family="Ionicons"
                                    name="eye"
                                    iconcolor={Colors.grey}
                                    size={windowwidth * 0.050}
                                />
                            ) : (
                                <VectorIcons
                                    family="Ionicons"
                                    name="eye-off"
                                    iconcolor={Colors.grey}
                                    size={windowwidth * 0.050}
                                />
                            )}
                        </Pressable>
                    }
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
            </View>
        </Mainview>
    )

}

export default ForgotPass;