import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import QRCode from "react-native-qrcode-svg";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import DialogBox from "../../../Components/DialogBox";
import { isValidOtp } from "../../../Validation";
import { Colors } from "../../../Utilities/uiasset";
import { helperSelector } from "../../../Slices/helper";
import VectorIcons from "../../../Utilities/vectoricons";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import { useLazyResendCodeQuery } from "../../../Slices/auth";
import { useEdithApiKeyMutation } from "../../../Slices/apikey";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { isEmpty, obfuscateEmailShort, truncateString, validateresendLoginCode } from "../../../Utilities/helerfunction";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'EditAPIKey'>;


const initialState: any = {
    ipRestriction: false,
    derivativesAndfutures: false,
    option: false,
    ipList: [],
    name: "",
    otp: ""
}

const EditAPIKey: React.FC<Props> = () => {
    const { theme, navigation, failuretoast, successtoast, copyData } = useCustomHooks();
    const style = styles(theme);

    const apiparams = useSelector(helperSelector).apiparams;
    const { email, tfaType } = useSelector((state: any) => state.auth.userData);

    const [ip, setIp] = useState('')
    const [errors, setErrors] = useState<any>({})
    const [formValue, setFormValue] = useState(initialState);

    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);
    const [showOtpField, setShowOtpField] = useState(false);

    const { triggerfetchApiKeyLists } = useApihooks();
    const [resend, { error: resendError, isLoading: loadingResend }] = useLazyResendCodeQuery();
    const [editApiKey, { isLoading, error, status }] = useEdithApiKeyMutation();

    useApiError(resendError ?? error)

    const isEditMode = apiparams?.type === "edit";

    useEffect(() => {
        if (!isEmpty(apiparams?.data)) {
            setFormValue({
                ipRestriction: apiparams?.data.ipRestriction,
                apiKey: apiparams?.data.apiKey,
                derivativesAndfutures: apiparams?.data.derivativesAndfutures,
                option: apiparams?.data.option,
                ipList: apiparams?.data.ipList,
                name: apiparams?.data.name,
                secretKey: apiparams?.data.secretKey,
                keyId: apiparams?.data._id,
                withdraw: apiparams?.data.withdraw
            })
        }
    }, [apiparams?.data])

    useEffect(() => {
        const messages = Object.values(errors).filter(Boolean);
        if (messages.length > 0) {
            failuretoast("Error", messages[0]);
        }
    }, [errors]);

    const EditApiKey = async () => {
        const wasOtpRequested = showOtpField;

        // Ticking "Restrict access to trusted IPs only" just flips `ipRestriction`
        // to true in state - it doesn't require actually adding an IP (that's a
        // separate "Confirm" button next to the IP input, unrelated to this Save
        // action). Nothing stopped Save from submitting `ipRestriction: true` with
        // an empty `ipList`, which would lock the key out from every IP.
        if (formValue.ipRestriction && (!formValue.ipList || formValue.ipList.length === 0)) {
            failuretoast("Error", "Please add at least one trusted IP address, or choose Unrestricted instead.");
            return;
        }

        if (wasOtpRequested) {
            // popup is already open, this call must be the actual "confirm" step
            const validationError = isValidOtp(formValue?.otp);
            if (validationError) {
                failuretoast("Error", validationError);
                return;
            }
        }

        const response = await editApiKey(formValue).unwrap();
        if (response.success) {
            if (!wasOtpRequested) {
                // first call only requests the OTP, it does not save the changes yet
                setShowOtpField(true);
                successtoast("OTP Sent", response.message);
            } else {
                triggerfetchApiKeyLists();
                setShowOtpField(false);
                successtoast("Success", response.message)
                if (apiparams?.type === "edit") {
                    navigation.goBack();
                }
            }
        } else {
            failuretoast("Error", response.message || "Something went wrong!");
        }
    }

    const resendCode = async () => {
        // let reqData = { email: email }
        // const { status, errors } = await validateresendLoginCode(reqData);
        // if (status) {
        //     failuretoast(errors);
        // } else {
        const resp = await resend(true);
        let result = resp?.data;
        if (result?.success) {
            successtoast('success', result?.message);
            setMinutes(5);
            setSeconds(0);
            setTimerExpired(false);
        } else {
            failuretoast('Error', (resp?.error as any)?.data?.message || result?.message || "Something went wrong!");
        }
        // }
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

    return (
        <Mainview
            isheader={true}
            isscollable={true}
            headertitle={apiparams?.type === "edit" ? "Edit API Key" : "API Key"}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                apiparams?.type === "edit" && (
                    <Button
                        title="Save"
                        onPress={() => EditApiKey()}
                        loading={isLoading || loadingResend}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                )
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Text size="tiny" style={{ color: Colors.warmgrey }}>Name</Text>
                <Text style={{ marginTop: "2%" }}>{apiparams?.data.name}</Text>
                <Text size="tiny" style={{ color: Colors.warmgrey, marginTop: "5%" }}>API Key</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: "2%" }}>
                    <Text>{truncateString(apiparams?.data.apiKey)}   </Text>
                    <Pressable onPress={() => copyData(apiparams?.data.apiKey)}>
                        <VectorIcons
                            family="Ionicons"
                            name="copy-outline"
                            size={18}
                        />
                    </Pressable>
                </View>
                <Text size="tiny" style={{ color: Colors.warmgrey, marginTop: "5%" }}>Secret Key</Text>
                {/* The backend never returns the real secret again after creation (matches
                    web's ApiManagementCard.jsx) - apiparams.data comes from the key list,
                    which never includes it, so this always rendered "undefined...undefined"
                    instead of a masked placeholder. */}
                <Text style={{ marginTop: "2%" }}>*************************</Text>
                <View style={{ marginTop: "5%", alignItems: "flex-start", justifyContent: "flex-start" }}>
                    <View style={{ backgroundColor: Colors.white, padding: 5 }}>
                        <QRCode
                            value={formValue?.secretKey}
                            size={windowwidth * 0.40}
                        />
                    </View>
                </View>
                <Text size="tiny" style={{ color: Colors.warmgrey, marginTop: "5%", marginBottom: "5%" }}>API restrictions</Text>
                <Input
                    type="checkbox"
                    label="Enable Readings"
                    initial={true}
                    activecheckbox={Colors.brand}
                    disabled={true}
                />
                <View style={{ marginVertical: "5%" }}>
                    <Input
                        type="checkbox"
                        label="Enable Future Trading"
                        initial={formValue.derivativesAndfutures}
                        activecheckbox={Colors.brand}
                        onChange={(e) => {
                            setFormValue((pervRecord: any) => {
                                return { ...pervRecord, 'derivativesAndfutures': e }
                            })
                        }}
                        disabled={!isEditMode}
                    />
                </View>
                <Input
                    type="checkbox"
                    label="Enable Option Trading"
                    initial={formValue.option}
                    activecheckbox={Colors.brand}
                    onChange={(e) => {
                        setFormValue((pervRecord: any) => {
                            return { ...pervRecord, 'option': e }
                        })
                    }}
                    disabled={!isEditMode}
                />
                <View style={{ marginVertical: "5%" }}>
                    <Input
                        type="checkbox"
                        label="Withdraw"
                        initial={formValue.withdraw}
                        activecheckbox={Colors.brand}
                        onChange={(e) => {
                            setFormValue((pervRecord: any) => {
                                return { ...pervRecord, 'withdraw': e }
                            })
                        }}
                        disabled={!isEditMode}
                    />
                </View>
                <Text size="tiny" style={{ color: Colors.warmgrey, marginVertical: "5%" }}>IP access restrictions</Text>
                <Input
                    type="checkbox"
                    label="Unrestricted (Less Secure) "
                    initial={'false' == formValue?.ipRestriction.toString()}
                    activecheckbox={Colors.brand}
                    onChange={() => {
                        setFormValue((pervRecord: any) => {
                            return { ...pervRecord, 'ipRestriction': false, 'ipList': [] }
                        })
                    }}
                    disabled={!isEditMode}
                />
                <View style={{ marginVertical: "5%" }}>
                    <Input
                        type="checkbox"
                        label="Restrict access to trusted IPs only (Recommended)"
                        initial={'true' == formValue?.ipRestriction.toString()}
                        activecheckbox={Colors.brand}
                        onChange={(e) => {
                            setFormValue((pervRecord: any) => {
                                return { ...pervRecord, 'ipRestriction': true }
                            })
                        }}
                        disabled={!isEditMode}
                    />
                </View>
                {
                    formValue.ipList && formValue.ipList.length > 0 ? (
                        formValue.ipList.map((value: any, i: any) => (
                            <View
                                key={i}
                                style={{
                                    opacity: formValue?.ipRestriction ? 1 : 0.5,
                                    backgroundColor: "#FFFFFF",
                                    borderRadius: 10,
                                    padding: 10,
                                    marginVertical: 5,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <Text style={{ fontSize: 14, color: "#333" }}>{value}</Text>
                                <Pressable
                                    disabled={!formValue?.ipRestriction}
                                    onPress={() => {
                                        setFormValue((prevRecord: any) => {
                                            const updatedList = [...prevRecord.ipList];
                                            updatedList.splice(i, 1);
                                            return { ...prevRecord, ipList: updatedList };
                                        });
                                    }}
                                >
                                    <VectorIcons
                                        family="Feather"
                                        name="close"
                                        size={20}
                                        iconcolor={formValue?.ipRestriction ? "#333" : "#aaa"}
                                    />
                                </Pressable>
                            </View>
                        ))
                    ) : ""
                }
                {
                    formValue?.ipRestriction &&
                    <>
                        <View>
                            <Input
                                value={ip}
                                label={'When entering more than one IP Address, please separate them with spaces'}
                                placeHolder="Enter IP Address"
                                readOnly={false}
                                multiline={true}
                                onChange={(val) => {
                                    setIp(val)
                                }}
                                disabled={!isEditMode}
                            />
                            <Button
                                title={"Confirm"}
                                buttonStyle={{ width: "30%" }}
                                onPress={() => {
                                    let IpRegx = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
                                    let error: any = { ...errors }
                                    let findIndex: any = formValue?.ipList?.findIndex((val: any) => (val == ip))
                                    if (isEmpty(ip)) {
                                        error['ip'] = 'Please enter trusted IP addresses.'
                                        setErrors(error)
                                        return false
                                    }
                                    if (!IpRegx.test(ip)) {
                                        error['ip'] = 'Invalid ip'
                                        setErrors(error)
                                        return false
                                    }
                                    if (findIndex != -1) {
                                        error['ip'] = 'Ip address already exists'
                                        setErrors(error)
                                        return false
                                    }
                                    setFormValue((prev: any) => ({
                                        ...prev,
                                        ipList: [...prev.ipList, ip],
                                    }));
                                    setErrors((pervRecord: any) => {
                                        return { ...pervRecord, 'ip': '' }
                                    })
                                    setIp('')
                                }}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </View>
                    </>
                }
            </View>
            {
                showOtpField && apiparams?.type === "edit" && (
                    <DialogBox
                        title="Verify to Save"
                        type="fade"
                        closeIcon={true}
                        onClose={() => {
                            setShowOtpField(false);
                            // clear any previously entered (possibly wrong) OTP so the next
                            // Save click starts a genuinely fresh OTP request, not a re-verify
                            setFormValue((prev: any) => ({ ...prev, otp: "" }));
                        }}
                        content={
                            <View style={{ paddingVertical: "3%", paddingHorizontal: "4%" }}>
                                <Input
                                    value={formValue?.otp}
                                    label={tfaType === "google2fa" ? "Enter 2FA Code" : "Enter OTP"}
                                    keyboardType="numeric"
                                    onChange={(text) => setFormValue((prev: any) => ({ ...prev, otp: text }))}
                                    allowed={"number"}
                                    labelStyle={{ color: theme.primarytext }}
                                    style={{ color: theme.theme == 'dark' ? Colors.white : Colors.black }}
                                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                                />
                                {
                                    tfaType === "email" && (
                                        <View style={{ flexDirection: "row", marginTop: "3%", width: "100%" }}>
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
                                                    <View style={{ width: "100%", alignItems: "center" }}>
                                                        <Text style={{ color: theme.primarytext, textAlign: "center" }}>
                                                            We have sent a code to {obfuscateEmailShort(email)}
                                                        </Text>
                                                        <Text style={{ color: theme.primarytext, textAlign: "center", marginTop: "2%" }}>
                                                            {minutes < 10 ? `0${minutes}m` : `${minutes}m`}:
                                                            {seconds < 10 ? `0${seconds}s` : `${seconds}s`}
                                                        </Text>
                                                    </View>
                                            }
                                        </View>
                                    )
                                }
                                <Button
                                    title="Confirm"
                                    buttonStyle={{ marginTop: "5%" }}
                                    onPress={() => EditApiKey()}
                                    loading={isLoading}
                                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                                />
                            </View>
                        }
                    />
                )
            }
        </Mainview>
    )

}

export default EditAPIKey;