import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import ComingSoon from "../../../Components/ComingSoon";
import VectorIcons from "../../../Utilities/vectoricons";
import Images, { icons } from "../../../Utilities/images";
import useApiError from "../../../Actions/Hooks/errorhook";
import { useLazyResendCodeQuery } from "../../../Slices/auth";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import { subAccountSelector } from "../../../Slices/subAccount";
import { useCreateWebhookMutation } from "../../../Slices/apikey";
import { Button, Dropdown, Input } from "../../../Components/Field";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { isEmpty, obfuscateEmailShort } from "../../../Utilities/helerfunction";
import useCustomHooks from "../../../Actions/Hooks/customhook";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'CreateWebhook'>;

const initialState: any = {
    name: "",
    source: "",
    accountId: "",
    otp: ""
}

// Hoisted so the Dropdown below gets a stable list= reference - an inline array
// literal there would be a new array every render, which the Dropdown's internal
// effect (keyed on that reference) reads as new data and re-syncs on.
const SOURCE_OPTIONS = [{ label: "Trading View", value: "tradingView" }];

const tradingViewMessage = `{
    "symbol":"{{ticker}}",
    "side":"{{strategy.order.action}}",
    "qty":{{strategy.order.contracts}},
    "price":"{{close}}"
    "trigger_time":"{{timenow}}"
  }`;

const CreateWebhook: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);

    const { apiList } = useSelector((state: any) => state.apiAction);
    const { subaccounts } = useSelector(subAccountSelector)
    const { tfaStatus, tfaType, email, algoWebHook, google2fa } = useSelector((state: any) => state.auth.userData);

    const [formData, setFormData] = useState(initialState)

    const [errors, setErrors] = useState({})
    const [subOptions, setsubOptions] = useState([]);

    const [webhookUrl, setWebhookUrl] = useState("");
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);

    const [createWebHook, { isLoading, error, status }] = useCreateWebhookMutation();
    const [resend, { error: resendError, isLoading: loadingResend }] = useLazyResendCodeQuery();

    useApiError(error ?? resendError)

    const validation = async () => {
        let error: any = {};

        if (!formData.name) error.name = 'Webhook Name is required';
        if (!formData.source) error.source = 'Source is required';
        if (!formData.accountId) error.accountId = 'Account is required';

        if (!tfaStatus && !formData.otp) {
            error.otp = 'OTP is required';
        }

        setErrors(error);
        return Object.keys(error).length > 0;
    };

    const createAlgo = async () => {
        try {
            const isValid = await validation();
            if (isValid) return;
            const response = await createWebHook(formData).unwrap();
            if (response?.success) {
                setWebhookUrl(response?.result?.data);
                successtoast("Success", response?.message);
                navigation.navigate("WebhookVerification", { url: response?.result?.data });
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (e) {
            failuretoast("Error", "Failed to create algorithm");
        }
    };

    const resendCode = async () => {
        // let reqData = { email: email }
        // const resp = await resend(reqData);
        const resp = await resend(true);

        let result = resp?.data;
        if (result?.success) {
            successtoast('success', result?.message);
            setMinutes(5);
            setSeconds(0);
            setTimerExpired(false);
        } else {
            failuretoast("Error", "Something went wrong!");
        }

    }

    useEffect(() => {
        if (!isEmpty(subaccounts)) {
            let mainAccount = subaccounts.find((val: any) => (val.isPrimary == true))
            if (!isEmpty(mainAccount)) {
            }
            let option: any = subaccounts.reduce((Options: any = [], val: any) => {
                let obj: any = {
                    label: val.accountName,
                    value: val._id,
                }
                Options.push(obj)
                return Options
            }, [])
            setsubOptions(option)
        }
    }, [subaccounts])

    useEffect(() => {
        const messages = Object.values(errors).filter(Boolean);
        if (messages.length > 0) {
            failuretoast("Error", messages[0]);
        }
    }, [errors]);


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
        if (!formData.name) {
            failuretoast("Error", "Webhook Name is required");
            return;
        }
        if (!formData.accountId) {
            failuretoast("Error", "Account is required");
            return;
        }
        if (!formData.source) {
            failuretoast("Error", "Source is required");
            return;
        }
        if (tfaType === "email" || tfaType === "mobile") {
            createAlgo();
            setShowOtpField(true);
            return;
        }
        if (!showOtpField) {
            setShowOtpField(true);
        } else {
            createAlgo();
        }
    };

    // Algo Trade isn't available for this release yet - same ComingSoon gate already
    // used for Options trading (Option/index.tsx) and Affiliate. Kept below all hooks
    // so this doesn't change hook order/count. Flip this back to false to re-enable -
    // everything below (the whole webhook creation flow) is otherwise untouched and
    // ready to go.
    const ALGO_TRADE_COMING_SOON = true;
    if (ALGO_TRADE_COMING_SOON) {
        return (
            <Mainview
                isheader={false}
                isscollable={false}
                gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
                gradientLocations={[0, 0.20, 1]}
            >
                <ComingSoon message="Algo trading isn't available yet. Please check back later." />
            </Mainview>
        );
    }

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle={"Create Webhook"}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                {
                    algoWebHook ?
                        <View style={{ width: '100%' }}>
                            <View style={{ marginBottom: "5%" }}>
                                <Images
                                    type="image"
                                    source={icons.WebHook}
                                    width={"100%"}
                                    height={windowwidth * 0.35}
                                />
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: "3%" }}>
                                <View style={{ width: 30 }}>
                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
                                        <Text size="small" style={{ color: "#000", fontWeight: "600" }}>1</Text>
                                    </View>
                                </View>
                                <View >
                                    <Text size="medium" style={{ flex: 1 }}>Select your strategy on TradingView.</Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: "3%" }}>
                                <View style={{ width: 30 }}>
                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
                                        <Text size="small" style={{ color: "#000", fontWeight: "600" }}>2</Text>
                                    </View>
                                </View>
                                <Text style={{ flexShrink: 1 }} size="medium">Open the strategy settings and enter your desired pre-order quantity.</Text>
                            </View>


                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: "3%" }}>
                                <View style={{ width: 30 }}>
                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginBottom: 2 }}>
                                        <Text size="small" style={{ color: "#000", fontWeight: "600" }}>3</Text>
                                    </View>
                                </View>
                                <Text size="medium" style={{ flexShrink: 1 }}>Create an alert for your strategy and paste the given text into the message box.</Text>
                            </View>
                            <Text style={[{ color: theme.secondarytext, marginBottom: "5%", marginTop: "5%" }]}>Trading View Message</Text>
                            <Card containerStyle={{ padding: "4%", height: windowheight * 0.20 }}>
                                <ScrollView>
                                    <Text>{tradingViewMessage}</Text>
                                </ScrollView>
                            </Card>
                        </View>
                        :
                        <>
                            {
                                apiList.length === 0 && google2fa === true && (
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.webhooks, { marginTop: -"10%", marginBottom: "5%" }]}>
                                        <View style={style.row}>
                                            <VectorIcons
                                                family="Feather"
                                                name="alert-circle"
                                                size={18}
                                            />
                                            <Text size="small" style={style.webhooksText}>  Api-key is mandatory to create Webhooks</Text>
                                        </View>
                                        <Button
                                            title="Create"
                                            buttonStyle={[style.submitButton, { height: windowheight * 0.034, width: "20%", backgroundColor: Colors.brand }]}
                                            textStyle={{ letterSpacing: 1.2, fontSize: Fontsize.semismall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            onPress={() => navigation.navigate("APIKeys")}
                                        />
                                    </Card>
                                )
                            }
                            <Input
                                label="Webhook Name"
                                placeHolder="Enter Webhook Name"
                                value={formData?.name}
                                onChange={(e) => {
                                    setFormData((prev: any) => ({ ...prev, name: e }))
                                }}
                                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            />
                            <Dropdown
                                list={subOptions}
                                label="Account Name"
                                placeholder="Select Account Name"
                                value={formData.accountId}
                                onChange={(item) => {
                                    setFormData((prev: any) => ({ ...prev, accountId: item.value }));
                                }}
                                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            />
                            <Dropdown
                                list={SOURCE_OPTIONS}
                                label="Source"
                                value={formData.source}
                                onChange={(e) => {
                                    setFormData((prev: any) => ({ ...prev, source: e.value }))
                                }}
                                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            />
                            {
                                google2fa === false && (
                                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.webhooks, { marginTop: "5%", marginBottom: "5%" }]}>
                                        <View style={style.row}>
                                            <VectorIcons
                                                family="Feather"
                                                name="alert-circle"
                                                size={18}
                                                iconcolor={Colors.red}
                                            />
                                            <Text size="small" style={style.webhooksText}>  2FA is mandatory to create Webhooks</Text>
                                        </View>
                                        <Button
                                            title="Setup 2FA"
                                            buttonStyle={[style.submitButton, { height: windowheight * 0.035 }]}
                                            textStyle={{ letterSpacing: 1.2, fontSize: Fontsize.semismall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            onPress={() => navigation.navigate("Security")}
                                        />
                                    </Card>
                                )
                            }

                            {
                                apiList.length !== 0 && (
                                    <>
                                        {
                                            showOtpField && (
                                                <>
                                                    <Input
                                                        value={formData?.otp}
                                                        label={tfaType === "google2fa" ? "Enter 2FA Code" : "Enter OTP"}
                                                        keyboardType="numeric"
                                                        placeHolder={tfaType === "google2fa" ? "Enter your Code" : "Enter your OTP"}
                                                        onChange={(text) => setFormData((prev: any) => ({ ...prev, otp: text }))}
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
                                                                            title={tfaType === "google2fa" ? "Enter 2FA Code" : "Enter OTP"}
                                                                            onPress={() => { resendCode() }}
                                                                            buttonStyle={{ width: "35%" }}
                                                                            loading={loadingResend}
                                                                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                                                        />
                                                                        :
                                                                        <View style={{ flexDirection: "row" }}>
                                                                            <Text style={{ marginBottom: "3%" }}>We have sent a code to {obfuscateEmailShort(email)} </Text>
                                                                            <Text>
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
                                        <View style={style.bottomButton}>
                                            <View style={{ alignItems: "center", marginBottom: "5%" }}>
                                            </View>
                                            <Button
                                                title="Create Webhook"
                                                loading={isLoading}
                                                onPress={handleNext}
                                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                            />
                                        </View>
                                    </>
                                )
                            }
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.webhooks, { marginTop: -"10%", marginBottom: "5%", alignItems: "center" }]}>
                                <VectorIcons
                                    family="Feather"
                                    name="alert-circle"
                                    size={18}
                                    iconcolor={Colors.red}
                                />
                                <Text size="small" style={[style.webhooksText, { flexShrink: 1, width: "90%" }]}>Trevolt does not bear liability for any losses incurred through signal trading. Please be aware that trade executions may experience delays or be skipped entirely due to reliance on signals from third-party platforms.</Text>
                            </Card>
                        </>
                }
            </View>
        </Mainview>
    )
}

export default CreateWebhook;