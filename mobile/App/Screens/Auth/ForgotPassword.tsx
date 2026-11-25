import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import { setOtpparams } from "../../Slices/helper";
import { Button, Input } from "../../Components/Field";
import useApiError from "../../Actions/Hooks/errorhook";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { useForgotPasswordMutation } from "../../Slices/auth";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'ForgotPassword'>;

const ForgotPassword: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();

    const initialUserData: athuDataProps = useMemo(() => ({
        email: {
            value: '',
            rules: { required: true, email: true },
            messages: {
                required: 'Email is required!',
                email: 'Invalid email address!!',
            },
            isValid: true,
        },

    }), []);

    const [forgot, { isLoading, error }] = useForgotPasswordMutation()
    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [codeSentTo, setCodeSentTo] = useState('');

    useApiError(error ?? false);

    useEffect(() => {
        const err: any = error
        if (err?.data?.status == "google") {
            successtoast("Sucess!", err.data.message);
            const payload = {
                type: "forgot2FA",
                values: {
                    email: userData.email?.value,
                }
            }
            dispatch(setOtpparams(payload));
            navigation.navigate("ForgotPass");
        }
    }, [error])

    const handleSubmit = async () => {
        const payload: any = {
            email: userData.email?.value?.toString(),
        };
        try {
            const response = await forgot(payload).unwrap()
            if (response.success) {
                successtoast("Success", response.message);
                setCodeSentTo(userData.email?.value?.toString() ?? '');
                const payload = {
                    type: "forgot",
                    values: {
                        email: userData.email?.value,
                    }
                }
                dispatch(setOtpparams(payload));
                navigation.navigate("ForgotPass");
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
            <View style={{ paddingTop: 40 }}>

                <Input
                    label="Enter Your Email"
                    placeHolder="Enter your mail address"
                    value={userData.email?.value}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                    onChange={(text: any) => {
                        setUserData(prev => ({ ...prev, email: { ...prev.email, value: text } }));
                        setCodeSentTo('');
                    }}
                />

                {!!codeSentTo && (
                <Text
                    style={{
                        color: theme.theme == 'dark' ? "#FFFFFF" : "#000",
                        fontSize: 14,
                        textAlign: "center",
                        marginTop: 20,
                        lineHeight: 20,
                    }}
                >
                    We've sent a verification code to{"\n"}
                    <Text style={{ color: "#17BD84", fontWeight: "700" }}>
                        {codeSentTo}
                    </Text>
                </Text>
                )}
            </View>
        </Mainview>
    )

}

export default ForgotPassword;