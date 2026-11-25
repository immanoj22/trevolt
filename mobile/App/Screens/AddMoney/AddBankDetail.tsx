import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Mainview from "../../Components/mainview";
import { helperSelector } from "../../Slices/helper";
import { authSelector } from "../../Slices/auth";
import { Button, Input } from "../../Components/Field";
import useApiError from "../../Actions/Hooks/errorhook";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";
import { useAddbankMutation, useUpdatebankMutation } from "../../Slices/wallet";
import { athuDataProps } from "../../Actions/type";
import LinearGradient from "../../Components/lineargradient";
import { borderradius } from "../../Utilities/dimensions";
import Text from "../../Components/text";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AddBankDetail'>;

const AddBankDetail: React.FC<Props> = () => {

    const { navigation, successtoast, failuretoast } = useCustomHooks();
    const { theme } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();

    const { bankparams } = useSelector(helperSelector)
    const { userData } = useSelector(authSelector)

    // Users may hold at most 3 bank accounts.
    const MAX_BANK_ACCOUNTS = 3

    const intialstate = {
        holderName: bankparams?.value?.holderName ?? "",
        bankName: bankparams?.value?.bankName ?? "",
        accountNo: bankparams?.value?.accountNo ?? "",
        bankcode: bankparams?.value?.bankcode ?? "",
        country: bankparams?.value?.country ?? "",
        city: bankparams?.value?.city ?? "",
        bankAddress: bankparams?.value?.bankAddress ?? ""
    }

    // const initialUserData: athuDataProps = useMemo(() => ({
    //     holderName: {
    //         value: bankparams?.value?.holderName || "",
    //         rules: { required: true },
    //         messages: { required: 'Holder Name is required!' },
    //         isValid: true,
    //     },
    //     bankName: {
    //         value: bankparams?.value?.bankName || "",
    //         rules: { required: true },
    //         messages: { required: 'Bank Name is required!' },
    //         isValid: true,
    //     },
    //     accountNo: {
    //         value: bankparams?.value?.accountNo || "",
    //         rules: { required: true, number: true },
    //         messages: { required: 'Account Number is required!', number: "Only numbers are allowed" },
    //         isValid: true,
    //     },
    //     bankcode: {
    //         value: bankparams?.value?.bankcode || "",
    //         rules: { required: true },
    //         messages: { required: 'Bank Code is required!' },
    //         isValid: true,
    //     },
    //     country: {
    //         value: bankparams?.value?.country || "",
    //         rules: { required: true },
    //         messages: { required: 'Country is required!' },
    //         isValid: true,
    //     },
    //     city: {
    //         value: bankparams?.value?.city || "",
    //         rules: { required: true },
    //         messages: { required: 'City is required!' },
    //         isValid: true,
    //     },
    //     bankAddress: {
    //         value: bankparams?.value?.bankAddress || "",
    //         rules: { required: true },
    //         messages: { required: 'Bank Address is required!' },
    //         isValid: true,
    //     },
    // }), []);



    const [formdata, setFormdata] = useState(intialstate)
    const [accountNoError, setAccountNoError] = useState("")
    const {
        holderName,
        bankName,
        accountNo,
        bankcode,
        country,
        city,
        bankAddress
    } = formdata

    const onchangedata = (key: string, value: string) => {
        if (key === "accountNo") setAccountNoError("")
        setFormdata((prevstate) => ({
            ...prevstate,
            [key]: value
        }))
    }

    const validateAccountNo = () => {
        if (!/^\d{9,18}$/.test(accountNo.trim())) {
            setAccountNoError("Account Number must be 9 to 18 digits")
            return false
        }
        setAccountNoError("")
        return true
    }
    const [addbank, { isLoading: add, error: adderror }] = useAddbankMutation()
    const [updatebank, { isLoading: edit, error: editerror }] = useUpdatebankMutation()

    useApiError(editerror || adderror)

    const submit = async () => {
        if (bankparams?.type == "add" && (userData?.bankAccounts?.length ?? 0) >= MAX_BANK_ACCOUNTS) {
            failuretoast("Limit reached", `You can add a maximum of ${MAX_BANK_ACCOUNTS} bank accounts`)
            navigation?.goBack()
            return
        }
        if (bankparams?.type == "add" && !validateAccountNo()) return
        const response = bankparams?.type == "add" ? await addbank(formdata).unwrap() : await updatebank(formdata).unwrap()
        if (response.success) {
            await triggeruserdetails()
            navigation?.goBack()
            if (bankparams?.type == "add") {
                successtoast("Added!", "Bank detail added successfully")
            } else {
                successtoast("Updated!", "Bank detail updated successfully")
            }
        }
    }
    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle={bankparams?.type == "add" ? "Add Bank Details" : "Edit Bank Details"}
            isscollable={true}
            bottomContent={
                <Pressable onPress={() => submit()} disabled={bankparams?.type == "add" ? add : edit} style={{ marginTop: "2%" }}>
                    <LinearGradient
                        colors={["#2563EB", "#2563EB"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ borderRadius: borderradius * 3, paddingVertical: "4%", alignItems: "center" }}
                    >
                        {(bankparams?.type == "add" ? add : edit) ? (
                            <ActivityIndicator color={theme.theme == 'dark' ? "#040a15" : "#ffff"} />
                        ) : (
                            <Text family="semiBold" color={theme.theme == 'dark' ? "#040a15" : "#ffff"}>{bankparams?.type == "add" ? "Add" : "Edit"}</Text>
                        )}
                    </LinearGradient>
                </Pressable>
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1, marginTop: 20 }}>
                <Input
                    label="Account Holder Name"
                    placeHolder="Enter Account Holder Name"
                    value={holderName}
                    onChange={(text) => onchangedata("holderName", text)}
                    allowed={"text"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label="Bank Name"
                    placeHolder="Enter Bank Name"
                    value={bankName}
                    onChange={(text) => onchangedata("bankName", text)}
                    allowed={"text"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label={bankparams?.type == "edit" ? "Account Number (can't edit)" : "Account Number"}
                    placeHolder="Enter Account Number"
                    value={accountNo}
                    onChange={(text) => onchangedata("accountNo", text)}
                    keyboardType="number-pad"
                    inputprops={{
                        maxLength: 18,
                        onBlur: () => { if (bankparams?.type == "add") validateAccountNo() },
                    }}
                    isValid={!accountNoError}
                    errorMessage={accountNoError}
                    disabled={bankparams?.type == "edit"}
                    allowed={"numbers"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label="IFSC"
                    placeHolder="Enter Code"
                    value={bankcode}
                    onChange={(text) => onchangedata("bankcode", text)}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label="Bank Country"
                    placeHolder="Enter Bank Country"
                    value={country}
                    onChange={(text) => onchangedata("country", text)}
                    allowed={"text"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label="Bank Address"
                    placeHolder="Enter Bank Address"
                    value={bankAddress}
                    onChange={(text) => onchangedata("bankAddress", text)}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Input
                    label="Bank City"
                    placeHolder="Enter Bank City"
                    value={city}
                    onChange={(text) => onchangedata("city", text)}
                    allowed={"text"}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
            </View>
        </Mainview>
    )

}

export default AddBankDetail;