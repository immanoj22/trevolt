import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import { isValidOtp } from "../../../Validation";
import { Colors } from "../../../Utilities/uiasset";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import { useLazyResendCodeQuery } from "../../../Slices/auth";
import { useCreateApiKeyMutation } from "../../../Slices/apikey";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { obfuscateEmailShort, validateresendLoginCode } from "../../../Utilities/helerfunction";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'CreateAPIKey'>;

const initialState = {
    otp: "",
    name: "",
}

const CreateAPIKey: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);

    const { tfaType, email } = useSelector((state: any) => state.auth.userData);
    const apiList = useSelector((state: any) => state.apiAction.apiList);

    const [formValue, setFormValue] = useState(initialState);
    const [minutes, setMinutes] = useState(1);
    const [seconds, setSeconds] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);

    const [createApiKey, { isLoading, error }] = useCreateApiKeyMutation();
    const [resend, { error: resendError, isLoading: loadingResend }] = useLazyResendCodeQuery();
    const { triggerfetchApiKeyLists } = useApihooks();
    const [showOtpField, setShowOtpField] = useState(false);

    useApiError(error ?? resendError);

    useFocusEffect(
        useCallback(() => {
            triggerfetchApiKeyLists();
        }, [])
    );

    const onChangeHandler = (value: any, name: any) => {
        try {
            const numbers = /^[+]?([0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/;
            const textNum = /^[A-Za-z0-9]{0,8}$/
            if (['tradingExperience', 'followersCount'].includes(name) && (value !== "" && !numbers.test(value))) {
                return false;
            } if (['referralCode'].includes(name) && (value !== "" && !textNum.test(value))) {
                return false;
            }
            setFormValue(prev => ({ ...prev, [name]: value }));
        } catch (e) {
            console.error("onChangeHandler_err", e);
        }
    };

    const createKey = async () => {
        const wasOtpRequested = showOtpField;

        if (wasOtpRequested) {
            // popup/field is already shown, this call must be the actual "confirm" step
            const validationError = isValidOtp(formValue.otp);
            if (validationError) {
                failuretoast("Error", validationError);
                return;
            }
        }

        const response = await createApiKey(formValue).unwrap();
        if (response.success) {
            if (!wasOtpRequested) {
                // first call only requests the OTP, it does not create the key yet
                setShowOtpField(true);
                successtoast("OTP Sent", response.message);
            } else {
                successtoast("Success", response.message)
                navigation.navigate("APIKeys")
                triggerfetchApiKeyLists()
            }
        } else {
            failuretoast("Error", response.message || "Something went wrong!");
        }
    }

    const resendCode = async () => {
        try {
            // let reqData = { email: email }
            // const { status, errors } = await validateresendLoginCode(reqData);
            // if (status) {
            //     failuretoast(errors);
            // } else {
            // const resp = await resend(reqData);
            const resp = await resend(true);
            let result = resp?.data;
            if (result?.success) {
                successtoast('success', result?.message);
                setMinutes(1);
                setSeconds(0);
                setTimerExpired(false);
            } else {
                failuretoast("Error", (resp?.error as any)?.data?.message || result?.message || "Error resending OTP. Please try again after some time.");
            }
            // }
        } catch (error) {
            console.log("resendCode___err", error)
        }
    }

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


    const handleNext = () => {
        if ((apiList ?? []).length >= 5) {
            failuretoast("Error!", "You have reached the limit of API key creation.");
            return;
        }
        if (!formValue.name) {
            failuretoast("Error!", "Name is required");
            return;
        }
        const isDuplicateName = (apiList ?? []).some(
            (item: any) => item?.name?.trim().toLowerCase() === formValue.name.trim().toLowerCase()
        );
        if (isDuplicateName) {
            failuretoast("Error!", "API key name already exists. Please use a different name.");
            return;
        }
        if (tfaType === "email" || tfaType === "mobile") {
            createKey();
            setShowOtpField(true);
            return;
        }
        if (!showOtpField) {
            setShowOtpField(true);
        } else {
            createKey();
        }
    };

    return (
        <Mainview
            isheader={true}
            isscollable={true}
            headertitle={"Create API Key"}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <Button
                    title={showOtpField ? "Submit" : "Next"}
                    // buttonStyle={style.bottomButton}
                    onPress={handleNext}
                    loading={isLoading || loadingResend}
                    textStyle={{color: theme.theme == 'dark' ? "#000" : "#ffff"}}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Text size="medium">API Key</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%", marginBottom: "5%" }}>Create and manage API keys to access your trading account programmatically.</Text>
                <Input
                    value={formValue.name}
                    label="Label API Key to proceed"
                    placeHolder="Enter the API key name"
                    onChange={(text) => onChangeHandler(text, "name")}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <>
                    {
                        showOtpField && (
                            <>
                                <Input
                                    value={formValue?.otp}
                                    label={tfaType === "google2fa" ? "Enter 2FA Code" : "Enter OTP"}
                                    placeHolder={tfaType === "google2fa" ? "Enter your code" : "Enter your OTP"}
                                    keyboardType="numeric"
                                    onChange={(text) => onChangeHandler(text, "otp")}
                                    allowed={"number"}
                                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                                />
                                {
                                    tfaType === "email" && (
                                        <View style={{ flexDirection: "row" }}>
                                            {
                                                !minutes && !seconds ?
                                                    <Button
                                                        title={"Resend OTP"}
                                                        onPress={() => { resendCode() }}
                                                        loading={loadingResend}
                                                        buttonStyle={{ alignSelf: "flex-start", width: undefined }}
                                                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                                    />
                                                    :
                                                    <View style={{ alignItems: "center", rowGap: 6, width: "100%" }}>
                                                        <Text style={{ color: theme.primarytext, textAlign: "center" }}>
                                                            We have sent a code to {obfuscateEmailShort(email)}
                                                        </Text>
                                                        <Text style={{ color: theme.primarytext, textAlign: "center" }}>
                                                            {minutes < 10 ? `0${minutes}m` : `${minutes}m`}:
                                                            {seconds < 10 ? `0${seconds}s` : `${seconds}s`}
                                                        </Text>
                                                    </View>
                                            }
                                        </View>
                                    )
                                }
                            </>
                        )
                    }
                </>
            </View>
        </Mainview>
    )

}

export default CreateAPIKey;