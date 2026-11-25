// import React, { useEffect, useMemo, useState } from "react";
// import { Platform, Pressable, View } from "react-native";
// import { NativeStackScreenProps } from "@react-navigation/native-stack";
// import { useSelector } from "react-redux";

// import Text from "../../Components/text";
// import Card from "../../Components/Card";
// import { Colors } from "../../Utilities/uiasset";
// import Mainview from "../../Components/mainview";
// import { athuDataProps } from "../../Actions/type";
// import { helperSelector } from "../../Slices/helper";
// import VectorIcons from "../../Utilities/vectoricons";
// import { Button, Input } from "../../Components/Field";
// import useApiError from "../../Actions/Hooks/errorhook";
// import { windowwidth } from "../../Utilities/dimensions";
// import { setItem } from "../../Actions/Storage/localstorage";
// import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
// import useCustomHooks from "../../Actions/Hooks/customhook";
// import { isValidOtp } from "../../Validation";
// import { maskPhoneNumber, obfuscateEmailShort } from "../../Utilities/helerfunction";
// import { setIsAuth, useLoginVerifyMutation, useResendLoginCodeMutation } from "../../Slices/auth";

// import styles from "./styles";

// type Props = NativeStackScreenProps<Stacknavigationtypes, 'OTP'>;

// const OTP: React.FC<Props> = () => {
//     const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();
//     const style = styles(theme);
//     const otpParams = useSelector(helperSelector).otpparams;
//     const [minutes, setMinutes] = useState(5);
//     const [seconds, setSeconds] = useState(0);
//     const [timerExpired, setTimerExpired] = useState(false);

//     const initialUserData: athuDataProps = useMemo(() => ({
//         email: {
//             value: '',
//             rules: { required: true, email: true },
//             messages: {
//                 required: 'Email is required!',
//                 email: 'Invalid email address!!',
//             },
//             isValid: true,
//         },
//         password: {
//             value: '',
//             rules: { required: true },
//             messages: {
//                 required: 'Password is required!',
//             },
//             isValid: true,
//         },
//         otp: {
//             value: '',
//             rules: { required: true },
//             messages: {
//                 required: 'OTP required!',
//             },
//             isValid: true,
//         }
//     }), []);

//     useEffect(() => {
//         let interval: ReturnType<typeof setInterval>;

//         if (!timerExpired) {
//             interval = setInterval(() => {
//                 if (seconds > 0) {
//                     setSeconds((prev) => prev - 1);
//                 } else if (minutes > 0) {
//                     setMinutes((prev) => prev - 1);
//                     setSeconds(59);
//                 } else {
//                     setTimerExpired(true);
//                     clearInterval(interval);
//                 }
//             }, 1000);
//         }

//         return () => clearInterval(interval);
//     }, [seconds, minutes, timerExpired]);


//     const [OTP, { error, isLoading }] = useLoginVerifyMutation();
//     const [resendLoginCode, { error: resendError, isLoading: loadingResend }] = useResendLoginCodeMutation();
//     const [userData, setUserData] = useState<athuDataProps>(initialUserData);

//     useApiError(error || resendError);

//     const handleSubmitOTP = async () => {
//         const otpError = isValidOtp(userData.otp?.value);
//         if (otpError) {
//             failuretoast("Error", otpError);
//             return;
//         }
//         const payload: any = {
//             // email: otpParams.values?.email,
//             // password: otpParams.values?.password,
//             challengeId: otpParams.values?.challengeId,
//             otp: userData.otp?.value,
//             platform: Platform.OS,
//         };
//         const response = await OTP(payload).unwrap();
//         setItem("token", response.result)
//         if (response.success) {
//             successtoast("Success", response.message);
//             // let the toast's entrance animation play before the app/auth stack
//             // swap forces a full remount of the navigation tree
//             setTimeout(() => dispatch(setIsAuth(true)), 500);
//             // navigation.navigate("Dashboard");
//         } else {
//             if (response?.message) {
//                 failuretoast("Error", response.message)
//             }
//             if (response?.message == 'This login session has expired. Please log in again.') {
//                 navigation.navigate("Login")
//             } else if (response?.message == "Too many failed attempts. Please log in again.") {
//                 navigation.navigate("Login")
//             }
//         }
//     }

//     const handleResend = async () => {
//         // const payload: any = {
//         //     email: otpParams.values?.email || otpParams.values?.recoveremail,
//         // };

//         const payload: any = {
//             challengeId:
//                 otpParams.values?.challengeId
//         };
//         const response = await resendLoginCode(payload).unwrap();
//         if (response.success) {
//             successtoast("Success", response.message);
//             setMinutes(5);
//             setSeconds(0);
//             setTimerExpired(false);
//         } else {
//             if (response?.message) {
//                 failuretoast("Error", response.message)
//             }
//             if (response?.message == 'This login session has expired. Please log in again.') {
//                 navigation.navigate("Login")
//             }
//         }
//     }

//     const handleSubmit = (type: any) => {
//         // if (type === "recover") {
//         //     handleSubmitRecover()
//         // } else {
//         //     handleSubmitOTP()
//         // }

//         handleSubmitOTP()
//     }

//     const headerTitle = (type: any) => {
//         if (type === "mobile") {
//             return "Mobile Verification";
//         }
//         if (type === "2FA") {
//             return "Verification Code";
//         }
//         return "Email Verification";
//     };

//     console.log(!minutes && !seconds && otpParams.values?.type === "email", "Resend__otp", otpParams.values)
//     return (
//         <Mainview
//             headertitle={headerTitle(otpParams.type)}
//             isheader={true}
//             isscollable={true}
//             onleftfn={otpParams?.type === "recover" ? () => navigation.navigate("Login") : () => navigation.goBack()}
//             bottomContent={
//                 <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: 'center' }}>
//                     <Pressable onPress={() => navigation.navigate("TwoFactorAuth")}>
//                         <Text style={{ color: Colors.orange }}>Try another way</Text>
//                     </Pressable>
//                     {
//                         !minutes && !seconds && otpParams?.type === "email" ? (
//                             <Button
//                                 title="Resend OTP"
//                                 buttonStyle={{ width: "40%", paddingVertical: "2%" }}
//                                 onPress={() => handleResend()}
//                                 loading={loadingResend}
//                             />
//                         ) : (
//                             <Button
//                                 title="Submit"
//                                 buttonStyle={{ width: "40%", paddingVertical: "2%" }}
//                                 onPress={() => handleSubmit(otpParams.type)}
//                                 loading={isLoading}
//                             />
//                         )
//                     }
//                 </View>
//             }
//         >
//             <View style={style.container}>
//                 <Input
//                     label={otpParams.type === "2FA" ? "Enter 2FA code" : "Entert OTP"}
//                     value={userData.otp?.value}
//                     placeholder="Enter verification code"
//                     onChange={(text: any) => setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: text } }))}
//                     keyboardType="numeric"
//                 />
//                 {
//                     (otpParams.type === "2FA" || otpParams.type === "mobile") ? (
//                         <Text>{otpParams.values?.status === "mobile" ?
//                             `We have sent a code to your mobile` :
//                             "Enter the code from your Authenticator App"}
//                         </Text>
//                     ) : otpParams.type === "recover" ? (
//                         <>
//                             {
//                                 otpParams.values?.type === "email" ? (
//                                     <>
//                                         {
//                                             !minutes && !seconds ? (
//                                                 <Text>We have sent a code to {obfuscateEmailShort(otpParams.values?.recoveremail)}</Text>
//                                             ) : (
//                                                 <Text>
//                                                     <Text>We have sent a code to {obfuscateEmailShort(otpParams.values?.recoveremail)} </Text>
//                                                     <Text style={{ fontVariant: ['tabular-nums'] }}>
//                                                         {minutes < 10 ? `0${minutes}m` : `${minutes}m`}:
//                                                         {seconds < 10 ? `0${seconds}s` : `${seconds}s`}
//                                                     </Text>
//                                                 </Text>
//                                             )
//                                         }
//                                     </>
//                                 ) : (
//                                     <Text>We sent the code to your mobile +91 {maskPhoneNumber(otpParams.values?.reovermobile)}</Text>
//                                 )
//                             }

//                         </>
//                     ) : (
//                         <View style={{ flexDirection: "row" }}>
//                             {!minutes && !seconds ? (
//                                 <Text>We have sent a code to {obfuscateEmailShort(otpParams.values.email)}</Text>
//                             ) : (
//                                 <Text>
//                                     <Text>We have sent a code to {obfuscateEmailShort(otpParams.values.email)} </Text>
//                                     <Text style={{ fontVariant: ['tabular-nums'] }}>
//                                         {minutes < 10 ? `0${minutes}m` : `${minutes}m`}:
//                                         {seconds < 10 ? `0${seconds}s` : `${seconds}s`}
//                                     </Text>
//                                 </Text>
//                             )}
//                         </View>
//                     )
//                 }
//                 {
//                     !(otpParams.type === "2FA" || otpParams.type === "mobile") && (
//                         <Card containerStyle={{ padding: "4%", flexDirection: "row", alignItems: "center", marginTop: "5%", borderColor: Colors.red, borderWidth: 1 }}>
//                             <VectorIcons
//                                 family="MaterialDesignIcons"
//                                 name="email-alert-outline"
//                                 style={{ marginRight: 10 }}
//                                 size={windowwidth * 0.070}
//                                 iconcolor={Colors.red}
//                             />
//                             <Text style={{ flexShrink: 1 }} size="xsmall" color={Colors.red}>Not received email code? Please check spam folder. Also mark the email as 'Not spam'</Text>
//                         </Card>
//                     )
//                 }
//             </View>
//         </Mainview>
//     )
// }

// export default OTP;


import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Card from "../../Components/Card";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import { athuDataProps } from "../../Actions/type";
import { helperSelector } from "../../Slices/helper";
import VectorIcons from "../../Utilities/vectoricons";
import { Button } from "../../Components/Field";
import useApiError from "../../Actions/Hooks/errorhook";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import { setItem } from "../../Actions/Storage/localstorage";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { isValidOtp } from "../../Validation";
import { maskPhoneNumber, obfuscateEmailShort } from "../../Utilities/helerfunction";
import { setIsAuth, useLoginVerifyMutation, useResendLoginCodeMutation } from "../../Slices/auth";
import DeviceInfo from "react-native-device-info";

import styles from "./styles";
import LinearGradient from "../../Components/lineargradient";

const OTP_LENGTH = 6;

type Props = NativeStackScreenProps<Stacknavigationtypes, 'OTP'>;

const OTP: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();
    const style = styles(theme);
    const otpParams = useSelector(helperSelector).otpparams;
    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);

    // individual digits for the 6-box OTP input
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const inputRefs = useRef<Array<TextInput | null>>([]);

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
        otp: {
            value: '',
            rules: { required: true },
            messages: {
                required: 'OTP required!',
            },
            isValid: true,
        }
    }), []);

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

    const [OTP, { error, isLoading }] = useLoginVerifyMutation();
    const [resendLoginCode, { error: resendError, isLoading: loadingResend }] = useResendLoginCodeMutation();
    const [userData, setUserData] = useState<athuDataProps>(initialUserData);

    useApiError(error || resendError);

    // ---- OTP box handlers ----
    const handleDigitChange = (text: string, index: number) => {
        // only accept a single numeric character per box
        const clean = text.replace(/[^0-9]/g, "");
        if (!clean) {
            const next = [...digits];
            next[index] = "";
            setDigits(next);
            return;
        }

        const next = [...digits];
        // handle pasted multi-digit strings by filling forward from this index
        const chars = clean.split("");
        chars.forEach((char, offset) => {
            if (index + offset < OTP_LENGTH) {
                next[index + offset] = char;
            }
        });
        setDigits(next);

        const lastFilledIndex = Math.min(index + chars.length, OTP_LENGTH - 1);
        if (index + chars.length < OTP_LENGTH) {
            inputRefs.current[index + chars.length]?.focus();
        } else {
            inputRefs.current[lastFilledIndex]?.blur();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
            const next = [...digits];
            next[index - 1] = "";
            setDigits(next);
            inputRefs.current[index - 1]?.focus();
        }
    };

    useEffect(() => {
        setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: digits.join("") } }));
    }, [digits]);

    const resetOtpBoxes = () => {
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
    };

    const handleSubmitOTP = async () => {
        const otpError = isValidOtp(userData.otp?.value);
        if (otpError) {
            failuretoast("Error", otpError);
            return;
        }
        const payload: any = {
            challengeId: otpParams.values?.challengeId,
            otp: userData.otp?.value,
            platform: Platform.OS,
            // Same purpose as on the Login screen: lets the backend scope the
            // new-device login alert to the user's OTHER devices.
            deviceId: await DeviceInfo.getUniqueId(),
        };
        try {
            const response = await OTP(payload).unwrap();
            if (response.success) {
                setItem("token", response.result)
                successtoast("Success", response.message);
                // let the toast's entrance animation play before the app/auth stack
                // swap forces a full remount of the navigation tree
                setTimeout(() => dispatch(setIsAuth(true)), 500);
            } else {
                if (response?.message) {
                    failuretoast("Error", response.message)
                }
                if (response?.message == 'This login session has expired. Please log in again.') {
                    navigation.navigate("Login")
                } else if (response?.message == "Too many failed attempts. Please log in again.") {
                    navigation.navigate("Login")
                }
            }
        } catch (err) {
            console.log("handleSubmitOTP__err", err);
        }
    }

    const handleResend = async () => {
        const payload: any = {
            challengeId: otpParams.values?.challengeId
        };
        try {
            const response = await resendLoginCode(payload).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                setMinutes(5);
                setSeconds(0);
                setTimerExpired(false);
                resetOtpBoxes();
            } else {
                if (response?.message) {
                    failuretoast("Error", response.message)
                }
                if (response?.message == 'This login session has expired. Please log in again.') {
                    navigation.navigate("Login")
                }
            }
        } catch (err) {
            console.log("handleResend__err", err);
        }
    }

    const handleSubmit = (type: any) => {
        handleSubmitOTP()
    }

    // The code channel isn't always encoded in otpParams.type alone - "recover" (Try
    // another way) carries it in the nested values.type instead ("email" vs anything
    // else meaning mobile). Every place that branches on "is this a mobile code"
    // needs to account for both shapes, or a mobile-sent recovery code still shows
    // email-specific copy (header, Resend Email, spam-folder warning).
    const isMobileChannel = otpParams.type === "mobile"
        || (otpParams.type === "recover" && otpParams.values?.type !== "email");

    const headerTitle = (type: any) => {
        if (isMobileChannel) {
            return "Mobile Verification";
        }
        if (type === "2FA") {
            return "Verification Code";
        }
        return "Verify Your Email";
    };

    const subtitleEmail = otpParams?.type === "recover"
        ? otpParams.values?.type === "email"
            ? obfuscateEmailShort(otpParams.values?.recoveremail)
            : null
        : obfuscateEmailShort(otpParams.values?.email);

    return (
        <Mainview
            headertitle={headerTitle(otpParams.type)}
            isheader={true}
            isscollable={true}
            onleftfn={otpParams?.type === "recover" ? () => navigation.navigate("Login") : () => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0F2F5E", "#000000", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            bottomContent={
                <View style={{ width: "100%" }}>
                    <Pressable onPress={() => handleSubmit(otpParams.type)} disabled={isLoading} style={{ marginTop: "6%" }}>
                        <LinearGradient
                            colors={["#2563EB", "#2563EB"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ borderRadius: borderradius * 3, paddingVertical: "4%", alignItems: "center" }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={theme.theme == 'dark' ? "#000000" : "#fff"} />
                            ) : (
                                <Text family="semiBold" color={theme.theme == 'dark' ? "#000000" : "#fff"} >Verify</Text>
                            )}
                        </LinearGradient>
                    </Pressable>
                    <Pressable
                        onPress={() => navigation.navigate("TwoFactorAuth")}
                        style={{ alignItems: "center", marginTop: "4%" }}
                    >
                        <Text style={{ color: theme.primarytext, fontSize: 12 }}>Try another way</Text>
                    </Pressable>
                </View>
            }
        >
            <View style={style.container}>
                {/* headline + subtitle */}
                <View style={{ alignItems: "center", marginBottom: "6%" }}>
                    <Text style={{ textAlign: "center" }}>
                        {(otpParams.type === "2FA" || otpParams.type === "mobile")
                            ? (otpParams.values?.status === "mobile"
                                ? "We've sent a code to your mobile"
                                : "Enter the code from your Authenticator App")
                            : otpParams.type === "recover"
                                ? (otpParams.values?.type === "email"
                                    ? <>We've sent a verification code to{"\n"}<Text style={{ color: "#17BD84" }}>{subtitleEmail}</Text></>
                                    : `We sent the code to your mobile +91 ${maskPhoneNumber(otpParams.values?.reovermobile)}`)
                                : <>We've sent a verification code to{"\n"}<Text style={{ color: "#17BD84" }}>{subtitleEmail}</Text></>
                        }
                    </Text>
                </View>

                {/* 6-box OTP input */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: "6%" }}>
                    {digits.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => { inputRefs.current[index] = ref; }}
                            value={digit}
                            onChangeText={(text) => handleDigitChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="numeric"
                            maxLength={1}
                            selectTextOnFocus
                            style={{
                                width: windowwidth * 0.12,
                                height: windowwidth * 0.14,
                                backgroundColor: theme.theme == 'dark' ? theme.card : "#E8EFFC",
                                borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
                                borderWidth: 1,
                                borderRadius: 10,
                                textAlign: "center",
                                fontSize: 20,
                                color: theme.theme == 'dark' ? Colors.white : Colors.black,
                            }}
                        />
                    ))}
                </View>

                {/* resend row - only relevant when the code was actually emailed, not for
                    Google Authenticator (2FA) or mobile-SMS codes, which can't be "resent" this way */}
                {
                    !(otpParams.type === "2FA" || isMobileChannel) && (
                        <View style={{ alignItems: "center" }}>
                            <Text style={{ color: theme.secondarytext, fontSize: 13 }}>
                                Don't Receive the Email?{"  "}
                            </Text>
                            {!minutes && !seconds ? (
                                <Pressable onPress={handleResend} disabled={loadingResend}>
                                    <Text style={{ color: "#17BD84", fontWeight: "600" }}>
                                        {loadingResend ? "Resending..." : "Resend Code"}
                                    </Text>
                                </Pressable>
                            ) : (
                                <Text style={{ color: "#17BD84", fontWeight: "600", fontVariant: ['tabular-nums'] }}>
                                    Resend Code ({minutes < 10 ? `0${minutes}` : minutes}:{seconds < 10 ? `0${seconds}` : seconds})
                                </Text>
                            )}
                        </View>
                    )
                }

                {
                    !(otpParams.type === "2FA" || isMobileChannel) && (
                        <Card containerStyle={{ padding: "4%", flexDirection: "row", alignItems: "center", marginTop: "8%", borderColor: Colors.red, borderWidth: 1 }}>
                            <VectorIcons
                                family="MaterialDesignIcons"
                                name="email-alert-outline"
                                style={{ marginRight: 10 }}
                                size={windowwidth * 0.070}
                                iconcolor={Colors.red}
                            />
                            <Text style={{ flexShrink: 1 }} size="xsmall" color={Colors.red}>Not received email code? Please check spam folder. Also mark the email as 'Not spam'</Text>
                        </Card>
                    )
                }
            </View>
        </Mainview>
    )
}

export default OTP;