import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, BackHandler, Linking, Platform, Pressable, ToastAndroid, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useFocusEffect } from "@react-navigation/native";
import appleAuth from '@invertase/react-native-apple-authentication';
import { LinearGradient } from "../../Components/lineargradient";
import Clipboard from "@react-native-clipboard/clipboard";
import DeviceInfo from "react-native-device-info";

import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import { setOtpparams } from "../../Slices/helper";
import VectorIcons from "../../Utilities/vectoricons";
import PasswordHintLabel from "../../Components/PasswordHintLabel";
import { Input, InputDateTime } from "../../Components/Field";
import useApiError from "../../Actions/Hooks/errorhook";
import Flexcomponent from "../../Components/flexcomponent";
import { setItem } from "../../Actions/Storage/localstorage";
import Images, { icons, image } from "../../Utilities/images";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { setIsAuth, useLoginMutation, useRegisterMutation, useSignupWithGoogleMutation, useSingInWithAppleMutation } from "../../Slices/auth";

GoogleSignin.configure({
    // webClientId: '849303224861-fvc2gjiek989ldc899sv4kfc6s9eobmv.apps.googleusercontent.com', // old (santham) Firebase project
    webClientId: '897274149490-ajtvt094s13t2f6ltpn1jfqoidoum9tr.apps.googleusercontent.com',
    iosClientId: '897274149490-3k4bmiodlugjf81ghdqic06emeic8bef.apps.googleusercontent.com'
});

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Login'>;

const Login: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [show, setShow] = useState(false);
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [referralCode, setReferralCode] = useState("");
    // Terms of Service / Privacy Policy consent - gates the Signup button.
    const [agree, setAgree] = useState(false);
    // Which password-rules tooltip (if any) is open - shared so opening one
    // always closes the other instead of the two overlapping on screen.
    const [activeHint, setActiveHint] = useState<'password' | 'confirmPassword' | null>(null);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isAppleLoading, setIsAppleLoading] = useState(false);
    const backPressCount = useRef(0);

    const fetchCopiedReferralCode = async () => {
        const text = await Clipboard.getString();
        setReferralCode(text);
    };

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
        password: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'Password is required!',
            },
            isValid: true,
        },

    }), []);

    const initialSignupData: athuDataProps = useMemo(() => ({
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
        dob: {
            value: '',
            rules: { required: true },
            messages: { required: 'Date of birth is required' },
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
                required: 'Confirm password is required!',
                equalTo: 'Not matches with password',
            },
            isValid: true,
        },
    }), []);

    const [login, { isLoading, error }] = useLoginMutation();
    const [register, { isLoading: isSigningUp, error: registerErr }] = useRegisterMutation();
    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [signupData, setSignupData] = useState<athuDataProps>(initialSignupData);
    const [continueWithGoogle, { error: golErr }] = useSignupWithGoogleMutation();
    const [continueWithApple, { error: appleErr }] = useSingInWithAppleMutation();

    useApiError(error ?? golErr ?? appleErr ?? registerErr);

    const handleSignup = async () => {
        if (!signupData.password?.value) {
            failuretoast("Error", "Password is required!");
            return;
        }
        if (!signupData.confirmPassword?.value) {
            failuretoast("Error", "Confirm password is required!");
            return;
        }
        if (signupData.password?.value !== signupData.confirmPassword?.value) {
            failuretoast("Error", "Confirm password does not match with password.");
            return;
        }
        if (!agree) {
            failuretoast("Error", "Please accept the Terms of Service and Privacy Policy.");
            return;
        }
        const payload: any = {
            firstName: signupData.firstName?.value,
            lastName: signupData.lastName?.value,
            email: signupData.email?.value?.toString(),
            password: signupData.password?.value,
            confirmPassword: signupData.confirmPassword?.value,
            dob: signupData.dob?.value,
            referenceCode: referralCode,
        };
        try {
            const response = await register(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                setSignupData(initialSignupData);
                setReferralCode("");
                setAgree(false);
                setActiveHint(null);
                setActiveTab('login');
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (err) {
            console.log("handleSignup__err", err);
        }
    }

    const handleSubmit = async () => {
        const payload: any = {
            email: userData.email?.value?.toString(),
            password: userData.password?.value,
            platform: Platform.OS,
            // Lets the backend tell "a second device signed in" apart from "this
            // same device signed in again", so the new-device security alert is
            // only pushed to the user's OTHER devices. Same id Deviceinfo()
            // registers the FCM token under.
            deviceId: await DeviceInfo.getUniqueId(),
        };
        const emailRegx = /^(?=.{5,50}$)(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/
        if (!emailRegx.test(payload.email)) {
            failuretoast("Error!", 'Invalid email address');
            return false;
        }
        try {
            const response = await login(payload).unwrap();
            if (response.success) {

                successtoast("Success", response.message);
                if (response?.result?.isLogged) {
                    setItem("token", response?.result?.token);
                    dispatch(setIsAuth(true));
                    // navigation.navigate("Dashboard");
                } else if (response.status == "mobile") {
                    const payload = {
                        type: "mobile",
                        values: {
                            email: userData.email?.value,
                            password: userData.password?.value,
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
                            email: userData.email?.value,
                            password: userData.password?.value,
                            status: "google",
                            challengeId: response?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                } else {
                    const payload = {
                        type: "email",
                        values: {
                            email: userData.email?.value,
                            password: userData.password?.value,
                            challengeId: response?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                }
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
                idToken: userInfo?.data?.idToken,
                filter: 'mobile',
                platform: Platform.OS,
                deviceId: await DeviceInfo.getUniqueId(),
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
                            password: userData.password?.value,
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
                            password: userData.password?.value,
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
                            password: userData.password?.value,
                            challengeId: response?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                }
            } else {
                failuretoast("Error", response.message || "Something went wrong!");
            }
        } catch (error) {
            console.log(error, "handlegoogle___err")
            failuretoast("Error", "Google sign-in failed");
        } finally {
            setIsGoogleLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                if (backPressCount.current === 0) {
                    backPressCount.current += 1;
                    ToastAndroid.show(
                        'Press back again to exit',
                        ToastAndroid.SHORT
                    );
                    setTimeout(() => (backPressCount.current = 0), 2000);
                    return true;
                }
                BackHandler.exitApp();
                return true;
            };
            const sub = BackHandler.addEventListener(
                'hardwareBackPress',
                onBackPress
            );
            return () => sub.remove();
        }, [])
    );

    // ---- Apple Sign-In (Android) ----
    // Android has no native Apple SDK, so we fall back to Apple's web OAuth
    // flow: open the system browser to Apple's authorize endpoint, and let the
    // backend's APPLE_REDIRECT_URI bounce back into the app via the
    // `greenex://apple-signin` deep link (registered in AndroidManifest.xml)
    // carrying the authorization `code`.
    const APPLE_SERVICES_ID = 'com.greenex.trade.service'; // must match backend APPLE_SERVICES_ID
    const APPLE_REDIRECT_URI = 'https://stage.trevolt.example/login'; // must match backend APPLE_REDIRECT_URI
    const APPLE_APP_CALLBACK_SCHEME = 'greenex://apple-signin';

    const finishAppleSignIn = useCallback(async (payload: any) => {
        try {
            const Responses = await continueWithApple(payload).unwrap();
            if (Responses.success) {
                successtoast("Success", Responses.message);
                if (Responses?.result?.isLogged) {
                    setItem("token", Responses.result?.token);
                    dispatch(setIsAuth(true));
                } else if (Responses.status == "mobile") {
                    const otpPayload = {
                        type: "mobile",
                        values: {
                            email: payload?.email,
                            password: userData.password?.value,
                            status: "mobile",
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(otpPayload));
                    navigation.navigate("OTP");
                } else if (Responses.status == "google") {
                    const otpPayload = {
                        type: "2FA",
                        values: {
                            email: payload?.email,
                            password: userData.password?.value,
                            status: "google",
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(otpPayload));
                    navigation.navigate("OTP");
                } else if (Responses.status == "email") {
                    const otpPayload = {
                        type: "email",
                        values: {
                            email: payload?.email,
                            password: userData.password?.value,
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(otpPayload));
                    navigation.navigate("OTP");
                }
            } else {
                failuretoast("Error", Responses.message || "Something went wrong!");
            }
        } catch (err) {
            console.log("APPLE WEB SIGN-IN ERROR:", err);
            failuretoast("Error", "Apple sign-in cancelled or failed");
        }
    }, [continueWithApple, userData.password?.value]);

    // Handle the deep link Apple/backend redirects to once the user
    // authorizes on the web (greenex://apple-signin?code=...).
    useEffect(() => {
        if (Platform.OS !== "android") return;

        const handleUrl = (url: string) => {
            if (!url || !url.startsWith(APPLE_APP_CALLBACK_SCHEME)) return;
            try {
                const query = url.split("?")[1] ?? "";
                const params = new URLSearchParams(query);
                const code = params.get("code");
                const errorParam = params.get("error");
                if (errorParam) {
                    failuretoast("Error", "Apple sign-in cancelled or failed");
                    return;
                }
                if (!code) return;
                finishAppleSignIn({
                    filter: "web",
                    code,
                    platform: Platform.OS,
                });
            } catch (e) {
                console.log("APPLE deep link parse error:", e);
            }
        };

        const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
        Linking.getInitialURL().then((url) => {
            if (url) handleUrl(url);
        });
        return () => sub.remove();
    }, [finishAppleSignIn]);

    const onAppleButtonPressAndroid = async () => {
        try {
            const authorizeUrl =
                `https://appleid.apple.com/auth/authorize` +
                `?client_id=${encodeURIComponent(APPLE_SERVICES_ID)}` +
                `&redirect_uri=${encodeURIComponent(APPLE_REDIRECT_URI)}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent("name email")}` +
                `&response_mode=form_post`;

            const supported = await Linking.canOpenURL(authorizeUrl);
            if (!supported) {
                failuretoast("Error", "Unable to open Apple sign-in page");
                return;
            }
            await Linking.openURL(authorizeUrl);
        } catch (err) {
            console.log("APPLE ANDROID SIGN-IN ERROR:", err);
            failuretoast("Error", "Apple sign-in failed to start");
        }
    };

    const onAppleButtonPress = async () => {
        setIsAppleLoading(true);
        try {
            if (Platform.OS === "android") {
                return await onAppleButtonPressAndroid();
            }
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
            const { email, identityToken } = response;
            if (!identityToken) {
                failuretoast("Error", "Apple Sign In failed");
                return;
            }
            const payload: any = {
                filter: "mobile",
                identityToken: identityToken,
                platform: Platform.OS,
                deviceId: await DeviceInfo.getUniqueId(),
            };
            const Responses = await continueWithApple(payload).unwrap();
            if (Responses.success) {
                successtoast("Success", Responses.message);
                if (Responses?.result?.isLogged) {
                    setItem("token", Responses.result?.token);
                    dispatch(setIsAuth(true));
                } else if (Responses.status == "mobile") {
                    const payload = {
                        type: "mobile",
                        values: {
                            email: email,
                            password: userData.password?.value,
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
                            password: userData.password?.value,
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
                            password: userData.password?.value,
                            challengeId: Responses?.result?.challengeId
                        }
                    }
                    dispatch(setOtpparams(payload));
                    navigation.navigate("OTP");
                }
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
            horizontalpadding={"6%"}
            gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#000000", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ marginTop: "10%" }}>
                {activeTab === 'login' ? (
                    <>
                        <Text size="semilarge" family="semiBold" color={theme.primarytext} style={{ textAlign: "center" }}>
                            Get started with your{"\n"}trade journey
                        </Text>
                        <Text size="small" color={theme.secondarytext} style={{ textAlign: "center", marginTop: "2%" }}>
                            Sign in to your account
                        </Text>
                    </>
                ) : (
                    <>
                        <Text size="semilarge" family="semiBold" color={theme.primarytext} style={{ textAlign: "center" }}>
                            Create an account
                        </Text>
                        <Pressable onPress={() => setActiveTab('login')}>
                            <Text size="small" color={theme.secondarytext} style={{ textAlign: "center", marginTop: "2%" }}>
                                Already have an account? <Text size="small" color={theme.homegreen}>Login</Text>
                            </Text>
                        </Pressable>
                    </>
                )}
            </View>

            <LinearGradient
                colors={["#ffffff28", "#ffffff0e"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: borderradius * 3, marginTop: "8%", width: "70%", alignSelf: "center", padding: 1 }}
            >
                <LinearGradient
                    colors={theme.theme === "dark" ? ["#081730", "#000000"] : ["#E8EFFC", "#E8EFFC"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flexDirection: "row", borderRadius: borderradius * 3 - 1 }}
                >
                    <Pressable
                        style={[{ flex: 1, borderRadius: borderradius * 3, paddingVertical: "3%", alignItems: "center" }, activeTab === 'login' && { backgroundColor: "#2563EB" }]}
                        onPress={() => setActiveTab('login')}
                    >
                        <Text family="semiBold" color={activeTab === 'login' ? "#FFFFFF" : theme.theme == 'dark' ? "#FFFFFF" : "#000000"}>Login</Text>
                    </Pressable>
                    <Pressable
                        style={[{ flex: 1, borderRadius: borderradius * 3, paddingVertical: "3%", alignItems: "center" }, activeTab === 'signup' && { backgroundColor: "#2563EB" }]}
                        onPress={() => setActiveTab('signup')}
                    >
                        <Text family="semiBold" color={activeTab === 'signup' ? "#FFFFFF" : theme.theme == 'dark' ? "#FFFFFF" : "#000000"}>Signup</Text>
                    </Pressable>
                </LinearGradient>
            </LinearGradient>

            <View style={{ marginTop: "8%" }}>
                {activeTab === 'login' ? (
                    <>
                        <Input
                            label="Email"
                            placeHolder="Enter Your Mail Address"
                            value={userData.email?.value}
                            keyboardType="email-address"
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: string) => {
                                setUserData(prev => ({
                                    ...prev,
                                    email: { ...prev.email, value: text }
                                }));
                            }}
                        />
                        <PasswordHintLabel
                            label="Password"
                            themes={theme}
                            visible={activeHint === 'password'}
                            onToggle={() => setActiveHint(prev => (prev === 'password' ? null : 'password'))}
                            onClose={() => setActiveHint(null)}
                        />
                        <Input
                            placeHolder="Enter Your Password"
                            secureTextEntry={!show}
                            value={userData.password?.value}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setUserData(prev => ({ ...prev, password: { ...prev.password, value: text } }))}
                            inputprops={{ textContentType: "password", autoComplete: "current-password" }}
                            rightContent={
                                <Pressable onPress={() => setShow(prev => !prev)}>
                                    {
                                        show ? (
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
                                        )
                                    }
                                </Pressable>
                            }
                        />
                        {(error as any)?.data?.errors?.passwordNotSet && (
                            <Text style={{ color: "red", marginTop: 4 }}>
                                Password is not set. Log in directly using your Google / Apple account or{" "}
                                <Text
                                    color={Colors.brand}
                                    textProps={{ onPress: () => navigation.navigate("ForgotPassword") }}
                                >
                                    click here to set password
                                </Text>
                            </Text>
                        )}
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginTop: 8 }}>
                            <Pressable style={{ alignItems: "flex-end" }} onPress={() => navigation.navigate("ForgotPassword")}>
                                <Text color={theme.homegreen} size="small">Forgot Password?</Text>
                            </Pressable>
                        </View>

                        <Pressable onPress={() => handleSubmit()} disabled={isLoading} style={{ marginTop: "6%" }}>
                            <LinearGradient
                                colors={["#2563EB", "#2563EB"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: borderradius * 3, paddingVertical: "4%", alignItems: "center" }}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color={theme.theme == 'dark' ? "#040a15" : "#ffff"} />
                                ) : (
                                    <Text family="semiBold" color={theme.theme == 'dark' ? "#040a15" : "#ffff"}>Login</Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Input
                            label="First Name"
                            placeHolder="Enter your first name"
                            value={signupData.firstName?.value}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setSignupData(prev => ({ ...prev, firstName: { ...prev.firstName, value: text } }))}
                        />
                        <Input
                            label="Last Name"
                            placeHolder="Enter your last name"
                            value={signupData.lastName?.value}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setSignupData(prev => ({ ...prev, lastName: { ...prev.lastName, value: text } }))}
                        />
                        <InputDateTime
                            label="DOB"
                            placeHolder="dd/mm/yyyy"
                            inputType="date"
                            value={signupData.dob?.value}
                            containerstyle={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0", backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC" }}
                            onConfirm={(text: any) => setSignupData(prev => ({ ...prev, dob: { ...prev.dob, value: text } }))}
                            restrictFuture
                        />
                        <Input
                            label="Email Address"
                            placeHolder="Enter Your Mail Address"
                            value={signupData.email?.value}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="email-address"
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setSignupData(prev => ({ ...prev, email: { ...prev.email, value: text } }))}
                        />
                        <PasswordHintLabel
                            label="Create Password"
                            themes={theme}
                            visible={activeHint === 'password'}
                            onToggle={() => setActiveHint(prev => (prev === 'password' ? null : 'password'))}
                            onClose={() => setActiveHint(null)}
                        />
                        <Input
                            placeHolder="Enter your Password"
                            value={signupData.password?.value}
                            secureTextEntry={!showSignupPassword}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setSignupData(prev => ({ ...prev, password: { ...prev.password, value: text } }))}
                            inputprops={{ textContentType: "newPassword", autoComplete: "new-password" }}
                            rightContent={
                                <Pressable onPress={() => setShowSignupPassword(prev => !prev)}>
                                    {
                                        showSignupPassword ? (
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
                                        )
                                    }
                                </Pressable>
                            }
                        />
                        <PasswordHintLabel
                            label="Confirm Password"
                            themes={theme}
                            visible={activeHint === 'confirmPassword'}
                            onToggle={() => setActiveHint(prev => (prev === 'confirmPassword' ? null : 'confirmPassword'))}
                            onClose={() => setActiveHint(null)}
                        />
                        <Input
                            placeHolder="Enter your Confirm Password"
                            value={signupData.confirmPassword?.value}
                            secureTextEntry={!showConfirmPassword}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setSignupData(prev => ({ ...prev, confirmPassword: { ...prev.confirmPassword, value: text } }))}
                            inputprops={{ textContentType: "newPassword", autoComplete: "new-password" }}
                            rightContent={
                                <Pressable onPress={() => setShowConfirmPassword(prev => !prev)}>
                                    {
                                        showConfirmPassword ? (
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
                                        )
                                    }
                                </Pressable>
                            }
                        />
                        <Input
                            label="Referral Code (Optional)"
                            placeHolder="Enter or paste your referral code"
                            value={referralCode}
                            background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            onChange={(text: any) => setReferralCode(text)}
                            rightContent={
                                <Pressable onPress={fetchCopiedReferralCode}>
                                    <VectorIcons
                                        family="MaterialIcons"
                                        name="content-paste"
                                        iconcolor={Colors.grey}
                                        size={windowwidth * 0.050}
                                    />
                                </Pressable>
                            }
                        />

                        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                            <Input
                                type="checkbox"
                                label=""
                                boxstyle={{ width: 20, height: 20, borderRadius: 4, marginTop: 5 }}
                                // Checkbox is uncontrolled - it seeds its own state from `initial`,
                                // so this is what keeps the box in sync after a reset.
                                initial={agree}
                                activecheckbox={Colors.brand}
                                onChange={(checked: any) => setAgree(!!checked)}
                            />
                            <Text size="small" color={theme.secondarytext} style={{ flex: 1, marginLeft: 3, lineHeight: 18 }}>
                                By continuing, you agree to Trevolt's <Text size="xsmall" color={theme.homegreen} textProps={{ onPress: () => navigation.navigate("Cmspage", { name: "Terms and Conditions" }) }}>Terms of Service</Text> and <Text size="xsmall" color={theme.homegreen} textProps={{ onPress: () => navigation.navigate("Cmspage", { name: "Privacy Policy" }) }}>Privacy Policy</Text>
                            </Text>
                        </View>

                        <Pressable onPress={() => handleSignup()} disabled={isSigningUp} style={{ marginTop: "6%" }}>
                            <LinearGradient
                                colors={["#2563EB", "#2563EB"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ borderRadius: borderradius * 3, paddingVertical: "4%", alignItems: "center" }}
                            >
                                {isSigningUp ? (
                                    <ActivityIndicator color={theme.theme == 'dark' ? "#040a15" : "#ffff"} />
                                ) : (
                                    <Text family="semiBold" color={theme.theme == 'dark' ? "#040a15" : "#ffff"}>Signup</Text>
                                )}
                            </LinearGradient>
                        </Pressable>
                    </>
                )}

                <Flexcomponent ispress={!isGoogleLoading} onPress={handlegoogle} paddingHorizontal={"2.5%"} paddingVertical={"3.3%"} bakgroundcolor={theme.card} style={{ borderRadius: borderradius * 0.5 }} top={"6%"}>
                    {isGoogleLoading ? (
                        <ActivityIndicator color={theme.primarytext} />
                    ) : (
                        <>
                            <Images
                                type="image"
                                source={image.google}
                                width={windowwidth * 0.04}
                                height={windowwidth * 0.04}
                                style={{ right: "3%" }}
                            />
                            <Text family="medium" size="semimedium">Continue With Google</Text>
                        </>
                    )}
                </Flexcomponent>
                {/* Hidden until the iOS entitlement/provisioning fix for Sign In with
                    Apple is fully rolled out (missing com.apple.developer.applesignin
                    capability on the App ID). Uncomment once verified.
                {Platform.OS === "ios" && (
                    <Flexcomponent ispress={!isAppleLoading} onPress={onAppleButtonPress} paddingHorizontal={"2.5%"} paddingVertical={"3.3%"} bakgroundcolor={theme.card} style={{ borderRadius: borderradius * 0.5 }} top={"5%"}>
                        {isAppleLoading ? (
                            <ActivityIndicator color={theme.primarytext} />
                        ) : (
                            <>
                                <Images
                                    type="image"
                                    source={theme.theme === "dark" ? icons.AppleLight : icons.AppleDark}
                                    width={windowwidth * 0.05}
                                    height={windowwidth * 0.05}
                                    style={{ right: "3%" }}
                                />
                                <Text family="medium" size="semimedium">Continue With Apple</Text>
                            </>
                        )}
                    </Flexcomponent>
                )} */}

            </View>
        </Mainview>
    )
}

export default Login;