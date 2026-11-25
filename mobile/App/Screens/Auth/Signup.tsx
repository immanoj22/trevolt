import React, { useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Clipboard from "@react-native-clipboard/clipboard";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import appleAuth from '@invertase/react-native-apple-authentication';

import Card from "../../Components/Card";
import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import VectorIcons from "../../Utilities/vectoricons";
import useApiError from "../../Actions/Hooks/errorhook";
import Flexcomponent from "../../Components/flexcomponent";
import Images, { icons, image } from "../../Utilities/images";
import { setItem } from "../../Actions/Storage/localstorage";
import { Button, Input, InputDateTime } from "../../Components/Field";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { setIsAuth, useRegisterMutation, useSignupWithGoogleMutation, useSingInWithAppleMutation } from "../../Slices/auth";

import styles from "./styles";
import { setOtpparams } from "../../Slices/helper";

GoogleSignin.configure({
    // webClientId: '849303224861-fvc2gjiek989ldc899sv4kfc6s9eobmv.apps.googleusercontent.com', // old (santham) Firebase project
    webClientId: '897274149490-ajtvt094s13t2f6ltpn1jfqoidoum9tr.apps.googleusercontent.com',
    iosClientId: '897274149490-3k4bmiodlugjf81ghdqic06emeic8bef.apps.googleusercontent.com'
});

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Signup'>;

const Signup: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();
    const style = styles(theme);

    const [contractAddress, setContractAddress] = useState("")
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    const [agree, setagree] = useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isAppleLoading, setIsAppleLoading] = useState(false);

    const fetchCopiedText = async () => {
        const text = await Clipboard.getString();
        setContractAddress(text)
    };

    const initialUserData: athuDataProps = useMemo(() => ({
        firstName: {
            value: '',
            rules: { required: true },
            messages: { required: 'First name is required!' },
            isValid: true,
        },
        lastName: {
            value: '',
            rules: { required: true },
            messages: { required: 'Last name is required!' },
            isValid: true,
        },
        email: {
            value: '',
            rules: { required: true, email: true },
            messages: {
                required: 'Email is required!',
                email: 'Invalid email address!!',
            },
            isValid: true,
        },
        password: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'Password is required!',
            },
            isValid: true,
        },
        confirmPassword: {
            value: '',
            rules: { required: true, equalTo: 'password' },
            messages: {
                required: 'Confirm password is required!', equalTo: 'Not matches with password',
            },
            isValid: true,
        },
        dob: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'Date of birth is required'
            },
            isValid: true,
        },
    }), []);

    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [continueWithGoogle, { error: golErr }] = useSignupWithGoogleMutation();
    const [register, { isLoading, error }] = useRegisterMutation();
    const [continueWithApple, { error: appleErr }] = useSingInWithAppleMutation();

    useApiError(error ?? golErr ?? appleErr);

    const handleSubmit = async () => {
        const payload: any = {
            firstName: userData.firstName?.value,
            lastName: userData.lastName?.value,
            email: userData.email?.value?.toString(),
            password: userData.password?.value,
            confirmPassword: userData.confirmPassword?.value,
            dob: userData.dob?.value,
            referenceCode: contractAddress,
        };
        try {
            const response = await register(payload).unwrap()
            if (response.success) {
                successtoast("Success", response.message);
                navigation.navigate("Login");
                setUserData(initialUserData)
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (err) {
            console.log("handleSubmit__err", err);
        }
    }

    const handlegoogle = async () => {
        setIsGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const userInfo: any = await GoogleSignin.signIn();
            const payload: any = {
                firstName: userInfo?.data.user.familyName,
                lastName: userInfo?.data.user.givenName,
                // gid: userInfo?.data.user.id,
                // email: userInfo?.data.user.email,
                idToken: userInfo?.data?.idToken,
                referenceCode: userData?.referral?.value,
                filter: 'mobile',
                platform: Platform.OS
            };

            const response = await continueWithGoogle(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                if (response?.result?.isLogged) {
                    setItem("token", response?.result?.token);
                    dispatch(setIsAuth(true));
                } else if (response.status == "mobile") {
                    const payload = {
                        type: "mobile",
                        values: {
                            email: userInfo?.data.user.email,
                            status: "mobile",
                            challengeId: response?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                } else if (response.status == "google") {
                    const payload = {
                        type: "2FA",
                        values: {
                            email: userInfo?.data.user.email,
                            status: "google",
                            challengeId: response?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                } else if (response.status == "email") {
                    const payload = {
                        type: "email",
                        values: {
                            email: userInfo?.data.user.email,
                            challengeId: response?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                }
                // navigation.navigate("Dashboard");
            }
            else {
                failuretoast("Error", response.message || "Something went wrong!");
            }
        } catch (error) {
            console.log("Google login error:", error);
            failuretoast("Error", "Google sign-in failed");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const onAppleButtonPress = async () => {
        setIsAppleLoading(true);
        try {
            if (!appleAuth.isSupported) {
                failuretoast("Error", "Apple Sign In is not supported on this device");
                return;
            }
            const response = await appleAuth.performRequest({
                requestedOperation: appleAuth.Operation.LOGIN,
                requestedScopes: [
                    appleAuth.Scope.EMAIL,
                    appleAuth.Scope.FULL_NAME,
                ],
            });
            const { user, email, fullName, identityToken } = response;
            if (!identityToken) {
                failuretoast("Error", "Apple Sign In failed");
                return;
            }
            const payload: any = {
                // firstName: ?.data.user.familyName,
                // lastName: userInfo?.data.user.givenName,
                // email: userInfo?.data.user.email,
                filter: "mobile",
                identityToken: identityToken,
                referenceCode: userData?.referral?.value,
                platform: Platform.OS
            };
            console.log("responses", payload, appleErr)
            const Responses = await continueWithApple(payload).unwrap();
            console.log("responses", Responses)
            if (Responses.success) {
                successtoast("Success", Responses.message);
                if (Responses?.result?.isLogged) {
                    setItem("token", Responses?.result?.token);
                    dispatch(setIsAuth(true));
                } else if (Responses.status == "mobile") {
                    const payload = {
                        type: "mobile",
                        values: {
                            email: email,
                            status: "mobile",
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                } else if (Responses.status == "google") {
                    const payload = {
                        type: "2FA",
                        values: {
                            email: email,
                            status: "google",
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                } else if (Responses.status == "email") {
                    const payload = {
                        type: "email",
                        values: {
                            email: email,
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                }
                // Fetchcurrencies();
            } else {
                failuretoast("Error", Responses.message || "Something went wrong!");
            }
        } catch (err) {
            console.log("APPLE ERROR:", err);
            failuretoast("Error", "Apple sign-in cancelled or failed");
        } finally {
            setIsAppleLoading(false);
        }
    };

    return (
        <Mainview
            isheader={false}
            isscollable={true}
            customheader={
                <View style={style.headerContainer} >
                    <Text style={style.header}>Signup</Text>
                    <Pressable style={style.rightContent} onPress={() => navigation.goBack()}>
                        <Text family={"medium"} style={{ color: Colors.orange }}>Login</Text>
                    </Pressable>
                </View>
            }
            bottomContent={
                <View style={{ marginTop: "-5%", alignItems: "center" }}>
                    <Button
                        title="Signup"
                        buttonStyle={style.buttonContainer}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        onPress={() => {
                            if (!agree) {
                                failuretoast("Error", "Please read the terms & condition.");
                                return;
                            }
                            handleSubmit();
                        }}
                        loading={isLoading}
                    />


                    <Flexcomponent ispress={true} onPress={handlegoogle} paddingHorizontal={"2.5%"} paddingVertical={"3.3%"} bakgroundcolor={theme.card} style={{ borderRadius: borderradius * 0.5, marginBottom: "5%" }} hit={10}>
                        <Images
                            type="image"
                            source={image.google}
                            width={windowwidth * 0.04}
                            height={windowwidth * 0.04}
                            style={{ right: "3%" }}
                        />
                        <Text family="medium" size="semimedium" >Continue With Google</Text>
                    </Flexcomponent>

                    {
                        Platform.OS === "ios" && (
                            <Flexcomponent ispress={true} onPress={onAppleButtonPress} paddingHorizontal={"2.5%"} paddingVertical={"3.3%"} bakgroundcolor={theme.card} style={{ borderRadius: borderradius * 0.5 }} bottom={"5%"}>
                                <Images
                                    type="image"
                                    source={theme.theme === "dark" ? icons.AppleLight : icons.AppleDark}
                                    width={windowwidth * 0.05}
                                    height={windowwidth * 0.05}
                                    style={{ right: "3%" }}
                                />
                                <Text family="medium" size="semimedium">Continue With Apple</Text>
                            </Flexcomponent>
                        )
                    }

                    <Input
                        value={agree}
                        type="checkbox"
                        label="By continuing, you agree to Trevolt’s"
                        onChange={(text) => setagree(text)}
                        activecheckbox={theme.darktext}
                        activecheckboxcolor={theme.background}

                    />
                    <Pressable style={{ marginBottom: "2%" }} onPress={() => navigation.navigate("Cmspage", { name: "Terms and Conditions" })}>
                        <Text color={Colors.brand}>Terms and Conditions</Text>
                    </Pressable>
                </View>
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Card containerStyle={{ padding: "4%", flexDirection: "row", alignItems: "center", marginBottom: "4%" }}>
                    <VectorIcons
                        family="MaterialDesignIcons"
                        name="email-alert-outline"
                        style={{ marginRight: 10 }}
                        size={windowwidth * 0.070}
                    />
                    <Text style={{ flexShrink: 1 }} size="xsmall">Please verify your email to activate your account. Check your inbox or spam folder for the activation link.</Text>
                </Card>
                <Input
                    label="First Name"
                    placeHolder="Enter your first name"
                    value={userData.firstName?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, firstName: { ...prev.firstName, value: text } }))}

                />

                <Input
                    label="Last Name"
                    placeHolder="Enter your last name"
                    value={userData.lastName?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, lastName: { ...prev.lastName, value: text } }))}
                />

                <InputDateTime
                    label="DOB"
                    placeHolder="dd/mm/yyyy"
                    inputType="date"
                    value={userData.dob?.value}
                    onConfirm={(text: any) => setUserData(prev => ({ ...prev, dob: { ...prev.dob, value: text } }))}
                    restrictFuture
                />

                <Input
                    label="Email"
                    placeHolder="Enter you Eamil Address"
                    value={userData.email?.value}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    onChange={(text: any) => setUserData(prev => ({ ...prev, email: { ...prev.email, value: text } }))}

                />

                <Input
                    label="Create Password"
                    placeHolder="Enter your Password"
                    value={userData.password?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, password: { ...prev.password, value: text } }))}
                    secureTextEntry={!showPassword}
                    inputprops={{ textContentType: "newPassword", autoComplete: "new-password" }}
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
                />

                <Input
                    label="Confirm Password"
                    placeHolder="Enter your Comfirm Password"
                    value={userData.confirmPassword?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, confirmPassword: { ...prev.confirmPassword, value: text } }))}
                    secureTextEntry={!showConfirmPass}
                    // secureTextEntry={false}
                    inputprops={{ textContentType: "newPassword", autoComplete: "new-password" }}
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
                />

                <Input
                    value={contractAddress}
                    label="Referral Code (Optional)"
                    placeholder="Enter or paste your referral codes"
                    onChange={setContractAddress}
                    rightContent={
                        <Pressable onPress={fetchCopiedText}>
                            <VectorIcons
                                family="MaterialIcons"
                                name="content-paste"
                                iconcolor={Colors.grey}
                                size={windowwidth * 0.050}
                            />
                        </Pressable>
                    }
                />
            </View>
        </Mainview>
    )

}

export default Signup;