import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Description from "../Description";
import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import { athuDataProps } from "../../../Actions/type";
import { Button, Input } from "../../../Components/Field";
import { setPhoneparams } from "../../../Slices/helper";
import useApiError from "../../../Actions/Hooks/errorhook";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { isValidOtp } from "../../../Validation";
import { maskPhoneNumber } from "../../../Utilities/helerfunction";
import { useSendOldMobileMutation, useVerifyNewMobileMutation, useVerifyOldMobileMutation } from "../../../Slices/auth";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'ChangeNumber'>;

const ChangeNumber: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, dispatch } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);

    const { mobileNumber, countryCode } = useSelector((state: any) => state.auth.userData);

    const initialUserData: athuDataProps = useMemo(() => ({
        otp: {
            value: "",
            rules: { required: true },
            messages: { required: 'OTP is required!' },
            isValid: true,
        },
        newotp: {
            value: "",
            rules: { required: true },
            messages: { required: 'OTP is required!' },
            isValid: true,
        }
    }), []);


    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [changeNumberSteps, setchangeNumberSteps] = useState<number>(1);


    const [sendOldMobile, { isLoading, error: getError }] = useSendOldMobileMutation();
    const [verifyOldMobile, { isLoading: isVerifyLoading, error: verifyError }] = useVerifyOldMobileMutation();
    const [verifyNewMobile, { isLoading: isNewVerifyLoading, error: newverifyError }] = useVerifyNewMobileMutation();
    useApiError(getError ?? verifyError ?? newverifyError ?? false);

    const getOldMobileOTP = async () => {
        try {
            let reqData = {
                mobileNumber: userData.mobileNumber?.value,
                countryCode: '91',
            }
            const response = await sendOldMobile(reqData).unwrap();
            if (response.success) {
                successtoast("Success", response.message);
                setchangeNumberSteps(2)
            } else {
                response?.message && failuretoast('Error', response.message);
            }
        } catch (e) {
            console.log("getOldMobileOTP_err", e);
        }
    };

    const handleVerifyOldMobile = async () => {
        const otpError = isValidOtp(userData.otp?.value);
        if (otpError) {
            failuretoast("Error", otpError);
            return;
        }
        const paylaod: any = {
            otp: userData.otp?.value,
        }
        const response = await verifyOldMobile(paylaod).unwrap()
        if (response.success) {
            successtoast("Success", response.message);
            setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: '' } }))
            // const payload: any = {
            //     type: "change",
            //     value: ""
            // }
            // dispatch(setPhoneparams(payload))
            // navigation.navigate("RegisterNumber")
            setchangeNumberSteps(3)
        } else {
            failuretoast("Error", response?.message);
        }
    }

    const handleVerifyNewMobile = async () => {
        const otpError = isValidOtp(userData.otp?.value);
        if (otpError) {
            failuretoast("Error", otpError);
            return;
        }
        const paylaod: any = {
            otp: userData.otp?.value,
        }
        const response = await verifyNewMobile(paylaod).unwrap()
        if (response.success) {
            await triggeruserdetails();
            successtoast("Success", response.message);
            setchangeNumberSteps(4)
        } else {
            failuretoast("Error", response?.message);
        }
    }

    const handleSubmit = async () => {
        try {
            setUserData(initialUserData)
            setchangeNumberSteps(1)
            navigation.goBack();
        } catch (err) {
            console.log(err, "handleSubmit___err")
        }
    }

    return (
        <Mainview
            isheader={true}
            headertitle={"Change Mobile number"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >

            {changeNumberSteps == 1 ?
                <View style={style.container}>
                    <Input
                        value={userData.mobileNumber?.value}
                        label="New Mobile Number"
                        keyboardType="phone-pad"
                        placeHolder=" Enter new mobile number"
                        leftContent={<Text>+91</Text>}
                        onChange={(text: any) => setUserData(prev => ({ ...prev, mobileNumber: { ...prev.mobileNumber, value: text } }))}
                        allowed={"number"}
                    />
                    <Description containerStyle={{ marginTop: "-5%" }}
                        content={`We have send a code to your current number +${countryCode} ${maskPhoneNumber(mobileNumber)} to verify it's you.`} />
                    <Button
                        title="Submit"
                        loading={isLoading}
                        onPress={() => getOldMobileOTP()}
                        buttonStyle={style.bottomButton}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View> :
                changeNumberSteps == 2 ?
                    <View style={style.container}>
                        <Description containerStyle={{ marginTop: "-5%" }}
                            content={`Verify current number code send to +${countryCode} ${maskPhoneNumber(mobileNumber)}.`} />
                        <Input
                            value={userData.otp?.value}
                            label="Enter OTP"
                            onChange={(text: any) => setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: text } }))}
                            keyboardType="numeric"
                            allowed={"number"}
                        />
                        <Button
                            title="Submit"
                            loading={isVerifyLoading}
                            onPress={() => handleVerifyOldMobile()}
                            buttonStyle={style.bottomButton}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                    </View> :
                    changeNumberSteps == 3 ?
                        <View style={style.container}>
                            <Description containerStyle={{ marginTop: "-5%" }}
                                content={`Verify new number code send to +${91} ${maskPhoneNumber(userData.mobileNumber?.value)}.`} />
                            <Input
                                value={userData.otp?.value}
                                label="Enter OTP"
                                onChange={(text: any) => setUserData(prev => ({ ...prev, otp: { ...prev.otp, value: text } }))}
                                keyboardType="numeric"
                                allowed={"number"}
                            />
                            <Button
                                title="Submit"
                                loading={isNewVerifyLoading}
                                onPress={() => handleVerifyNewMobile()}
                                buttonStyle={style.bottomButton}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </View> :
                        <View style={style.container}>

                            <Description containerStyle={{ marginTop: "-5%" }}
                                content={`Phone number updated +${91} ${userData.mobileNumber?.value} is now your verified number.`} />
                            <Button
                                title="Submit"
                                loading={isLoading}
                                onPress={() => handleSubmit()}
                                buttonStyle={style.bottomButton}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </View>

            }
        </Mainview>
    )

}

export default ChangeNumber;