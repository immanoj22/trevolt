import React, { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Card from "../../Components/Card";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import VectorIcons from "../../Utilities/vectoricons";
import { Button, Input } from "../../Components/Field";
import useApiError from "../../Actions/Hooks/errorhook";
import { windowwidth } from "../../Utilities/dimensions";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { isValidMobile } from "../../Validation";
import { isEmpty } from "../../Utilities/helerfunction";
import { helperSelector, setOtpparams } from "../../Slices/helper";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import { useRecoveryUserMutation, useRecoveryUserOTPMutation } from "../../Slices/auth";

import styles from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, "TwoFactorAuth">;

const TwoFactorAuth: React.FC<Props> = () => {
    const { theme, successtoast, failuretoast, dispatch, navigation } = useCustomHooks();
    const style = styles(theme);
    const selectedTintColor = theme.theme === "dark" ? "rgba(37, 99, 235,0.12)" : "rgba(37, 99, 235,0.06)";
    const iconIdleBg = theme.theme === "dark" ? Colors.dune : "#e9eef7";

    const initialUserData: athuDataProps = useMemo(
        () => ({
            email: {
                value: "",
                rules: { required: true },
                messages: { required: "First name is required!" },
                isValid: true,
            },
            mobileNumber: {
                value: "",
                rules: { required: true },
                messages: { required: "Last name is required!" },
                isValid: true,
            },
        }),
        []
    );

    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [responseData, setResponseData] = useState<any>({ email: false, mobile: false });
    const [selectedMethod, setSelectedMethod] = useState("");
    const [option, selectOption] = useState(false);

    const [recoverUser, { isLoading, error }] = useRecoveryUserMutation();
    const [recoverOTP, { isLoading: recoverLoading, error: recoverErr }] = useRecoveryUserOTPMutation();


    const otpParams = useSelector(helperSelector).otpparams;

    useApiError(error ?? recoverErr ?? false);

    const getRecoverUser = async () => {
        const payload: any = {
            email: otpParams?.values?.email?.toString()
        };
        try {
            const response = await recoverUser(payload).unwrap();
            setResponseData(response?.result)
        } catch (err) {
            console.log("getRecoverUser__err", err);
        }
    };

    const handleSubmitOTP = async () => {
        if (selectedMethod === "email" && isEmpty(userData.email?.value)) {
            failuretoast("Error", "Email is required");
            return;
        }
        if (selectedMethod === "mobile") {
            const mobileError = isValidMobile(userData.mobileNumber?.value);
            if (mobileError) {
                failuretoast("Error", mobileError);
                return;
            }
        }
        const payload: any = {
            challengeId: otpParams.values?.challengeId,
            useremail: userData.email?.value?.toLowerCase()?.toString(),
            countryCode: "91",
            mobileNumber: userData.mobileNumber?.value,
            type: selectedMethod
        }
        try {
            const response = await recoverOTP(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                const payload = {
                    type: "recover",
                    values: {
                        type: selectedMethod,
                        useremail: otpParams?.values?.email,
                        recoveremail: userData.email?.value,
                        reovermobile: userData.mobileNumber?.value,
                        challengeId: otpParams.values?.challengeId
                    }
                }
                dispatch(setOtpparams(payload))
                navigation.navigate("OTP")

            } else {
                if (response?.message) {
                    failuretoast("Error", response.message)
                }
                if (response?.message == 'This login session has expired. Please log in again.') {
                    navigation.navigate("Login")
                }
            }
        } catch (err) {
            console.log("handleSubmitOTP__err", err);
        }
    };

    useEffect(() => {
        getRecoverUser()
    }, [])

    return (
        <Mainview
            headertitle="Two-factor Authentication"
            onleftfn={option === true ? () => selectOption(false) : () => navigation.goBack()}
            isscollable
            gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#000000", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            bottomContent={
                <>
                    {option === false ? (
                        <Button
                            title="Continue"
                            buttonStyle={style.buttonContainer}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            onPress={() => {
                                if (selectedMethod === "") {
                                    failuretoast("Error", "Please select a contact method")
                                    return
                                }
                                selectOption(true)
                            }}
                            loading={isLoading}
                        />
                    ) : (
                        <Button
                            title="Submit"
                            buttonStyle={style.buttonContainer}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            onPress={handleSubmitOTP}
                            loading={recoverLoading}
                        />
                    )
                    }
                </>
            }
        >
            <View style={style.container}>
                {option === false ? (
                    <>
                        <View style={{ alignItems: "center", marginTop: "6%", marginBottom: "9%" }}>
                            <View style={style.heroBadge}>
                                <VectorIcons family="Feather" name="shield" iconcolor={Colors.brand} size={windowwidth * 0.09} />
                            </View>
                            <Text family="bold" size="large" style={{ marginTop: "5%" }}>Verify it's you</Text>
                            <Text size="small" style={{ color: theme.secondarytext, textAlign: "center", marginTop: "2%", paddingHorizontal: "8%" }}>
                                Choose how you'd like to receive your verification code
                            </Text>
                        </View>
                        {
                            responseData.email && (
                                <Pressable onPress={() => setSelectedMethod("email")}>
                                    <Card containerStyle={[style.methodCard, {
                                        borderColor: selectedMethod === "email" ? Colors.brand : theme.boderColor,
                                        backgroundColor: selectedMethod === "email" ? selectedTintColor : theme.card
                                    }]}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <View style={[style.methodIcon, { backgroundColor: selectedMethod === "email" ? Colors.brand : iconIdleBg }]}>
                                                <VectorIcons
                                                    family="Feather"
                                                    name="mail"
                                                    iconcolor={selectedMethod === "email" ? Colors.white : Colors.brand}
                                                    size={windowwidth * 0.05}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text family="semiBold" size="medium">Email</Text>
                                                <Text size="small" style={{ color: theme.secondarytext, marginTop: 2 }}>
                                                    {typeof responseData.email === "string" && responseData.email ? responseData.email : "Send a code to your registered email"}
                                                </Text>
                                            </View>
                                            <View style={[style.select, { backgroundColor: selectedMethod === "email" ? Colors.brand : theme.theme === "dark" ? Colors.dune : Colors.white }]}>
                                                {selectedMethod === "email" && (
                                                    <VectorIcons
                                                        family="Octicons"
                                                        name="dot-fill"
                                                        iconcolor={Colors.white}
                                                        size={windowwidth * 0.055}
                                                    />
                                                )}
                                            </View>
                                        </View>
                                    </Card>
                                </Pressable>
                            )
                        }
                        {
                            responseData.mobile && (
                                <Pressable onPress={() => setSelectedMethod("mobile")}>
                                    <Card containerStyle={[style.methodCard, {
                                        marginTop: "5%",
                                        borderColor: selectedMethod === "mobile" ? Colors.brand : theme.boderColor,
                                        backgroundColor: selectedMethod === "mobile" ? selectedTintColor : theme.card
                                    }]}>
                                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                                            <View style={[style.methodIcon, { backgroundColor: selectedMethod === "mobile" ? Colors.brand : iconIdleBg }]}>
                                                <VectorIcons
                                                    family="Feather"
                                                    name="phone"
                                                    iconcolor={selectedMethod === "mobile" ? Colors.white : Colors.brand}
                                                    size={windowwidth * 0.05}
                                                />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text family="semiBold" size="medium">Mobile</Text>
                                                <Text size="small" style={{ color: theme.secondarytext, marginTop: 2 }}>
                                                    {typeof responseData.mobile === "string" && responseData.mobile ? responseData.mobile : "Send a code to your registered mobile"}
                                                </Text>
                                            </View>
                                            <View style={[style.select, {
                                                backgroundColor:
                                                    selectedMethod === "mobile"
                                                        ? Colors.brand
                                                        : theme.theme === "dark"
                                                            ? Colors.dune
                                                            : Colors.white
                                            }]}>
                                                {selectedMethod === "mobile" && (
                                                    <VectorIcons
                                                        family="Octicons"
                                                        name="dot-fill"
                                                        iconcolor={Colors.white}
                                                        size={windowwidth * 0.055}
                                                    />
                                                )}
                                            </View>
                                        </View>
                                    </Card>
                                </Pressable>
                            )
                        }
                    </>
                ) : (
                    <>
                        {
                            selectedMethod === "email" && (
                                <Input
                                    label="Email"
                                    placeHolder="Enter your email address"
                                    value={userData.email?.value}
                                    onChange={(text: string) =>
                                        setUserData((prev) => ({
                                            ...prev,
                                            email: { ...prev.email, value: text },
                                        }))
                                    }
                                    autoCapitalize="none"
                                    autoCorrect={false}

                                />
                            )
                        }
                        {
                            selectedMethod === "mobile" && (
                                <Input
                                    value={userData.mobileNumber?.value}
                                    label="Mobile Number"
                                    keyboardType="phone-pad"
                                    placeHolder="Enter your mobile number"
                                    leftContent={<Text>+91</Text>}
                                    onChange={(text: string) =>
                                        setUserData((prev) => ({
                                            ...prev,
                                            mobileNumber: { ...prev.mobileNumber, value: text },
                                        }))
                                    }
                                    allowed={"number"}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            )
                        }

                    </>
                )
                }
            </View>
        </Mainview>
    );
};

export default TwoFactorAuth;