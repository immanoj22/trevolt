import React, { useEffect, useState } from "react";
import { StyleSheet, View, Linking } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Card from "../../Components/Card";
import { Colors } from "../../Utilities/uiasset";
import Mainview from "../../Components/mainview";
import VectorIcons from "../../Utilities/vectoricons";
import useApiError from "../../Actions/Hooks/errorhook";
import { windowheight } from "../../Utilities/dimensions";
import Flexcomponent from "../../Components/flexcomponent";
import { fileToBase64Envelope } from "../../Utilities/fileToBase64";
import { subAccountSelector } from "../../Slices/subAccount";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";
import { Button, Dropdown, FileUpload, Input } from "../../Components/Field";
import { useInternalfiatMutation, walletSelector } from "../../Slices/wallet";
import { useRoute } from "@react-navigation/native";
import { Pressable } from "react-native";
import { authSelector } from "../../Slices/auth";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'DepositDetails'>;

const DepositDetails: React.FC<Props> = () => {

    const route = useRoute();
    const { pay_mode = 'BANK' }: any = route?.params;

    const { theme, navigation, failuretoast, successtoast, copyData } = useCustomHooks();
    const { triggeruserdetails, Fetchcurrencies } = useApihooks();

    const { getcurrencies } = useSelector(walletSelector);
    const { userData } = useSelector(authSelector)

    const firstCurrency = getcurrencies?.[0];

    const { subaccounts } = useSelector(subAccountSelector)

    // Currency limits (min/max deposit) are fetched once at app launch and
    // cached in redux - refetch on mount so admin-side limit changes show up
    // without needing to restart the app.
    useEffect(() => {
        Fetchcurrencies();
    }, []);

    const [frontImage, setFrontImage] = useState<any>(undefined);

    const renderItem = () => {
        return (
            <Card containerStyle={{ backgroundColor: theme.theme === "dark" ? "#101A2C" : "#E8EFFC", justifyContent: "center", alignItems: "center", paddingVertical: "20%", marginBottom: "5%", borderColor: "transparent" }}>
                <View style={{ alignItems: "center", backgroundColor: theme.theme === "dark" ? Colors.darkgray : theme.card, paddingHorizontal: "10%", flexDirection: "row", paddingVertical: "3%", borderRadius: 15 }}>
                    <VectorIcons
                        family="Entypo"
                        name={"upload-to-cloud"}
                    />
                    <Text size="semimedium">   Upload</Text>
                </View>
            </Card>
        )
    }

    const [internalfiat, { isLoading, error }] = useInternalfiatMutation()
    const [selectedaccount, setSelectedaccount] = useState<any>(subaccounts[0]?.accountId)
    const [transactionnumber, setTransactionnumber] = useState("")
    const [amount, setAmount] = useState("")

    useApiError(error)

    const continuefn = async () => {
        if (!selectedaccount) {
            failuretoast("Required!", "Preffered account  is required")
        }

        else if (!transactionnumber && pay_mode == 'BANK') {
            failuretoast("Required!", "Transaction number is required")
        }

        else if (!amount) {
            failuretoast("Required!", "Amount is required")
        }
        else if (!frontImage && pay_mode == 'BANK') {
            failuretoast("Failure!", "Receipt is requried")
        }

        else if (!firstCurrency?._id) {
            failuretoast("Failure!", "Preffered currency is requried")
        }
        else {
            // This endpoint moved off multipart/form-data - the backend now
            // decrypts the body and reconstructs req.files.attachment from a base64
            // envelope (see Slices/wallet.ts internalfiat + Utilities/fileToBase64).
            // Send a plain object; the RTK base query encrypts it.
            let attachmentEnvelope = null;
            if (frontImage) {
                try {
                    attachmentEnvelope = await fileToBase64Envelope(frontImage);
                } catch (e) {
                    console.log("fileToBase64Envelope__err", e);
                    failuretoast("Failure!", "Could not read the selected receipt. Please pick it again.");
                    return;
                }
            }

            const payload: any = {
                accountId: selectedaccount,
                amount,
                currencyId: firstCurrency?._id,
                transactionNumber: transactionnumber,
                pay_mode,
                upi_channel: 'INTENT',
                ...(attachmentEnvelope ? { attachment: attachmentEnvelope } : {}),
            };

            const res = await internalfiat(payload).unwrap()
            const { result } = res
            if (res?.success) {
                await triggeruserdetails()
                navigation?.pop(2)
                successtoast("Success!", "Your request has been successfully sent to Trevolt for review")
                if (pay_mode == 'UPI') {
                    await Linking.openURL(result?.intentURL);
                } else if (pay_mode == 'CARD') {
                    await Linking.openURL(result.paymentLink);
                }
            }
        }
    }

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle={"Deposit Account"}
            isscollable={true}
            bottomContent={
                <Button
                    loading={isLoading}
                    title="Continue" buttonStyle={{ marginTop: "2%" }} onPress={() => continuefn()}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1 }}>
                {pay_mode == 'SBI' &&
                    <>
                        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginVertical: 10, padding: "5%" }}>
                            {/* <View style={{flexDirection: "row"}}>
                                <Input
                                    label="Account Number"
                                    placeHolder="Enter Your Transaction Number"
                                    background={theme.theme === "dark" ? "#16181A" : Colors.white}
                                    onChange={setTransactionnumber}
                                    value={transactionnumber}
                                    keyboardType="number-pad"
                                    allowed={"number"}
                                />
                                <Pressable>
                                    <VectorIcons
                                        family="Ionicons"
                                        name="copy-outline"
                                        size={18}
                                    />
                                </Pressable>
                            </View> */}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: "5%", paddingTop: "8%" }}>
                                <Text style={{ color: theme.primarytext }}>Account Number</Text>
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", marginBottom: 10 }}>
                                    <Text style={{ marginRight: "8%" }}>{userData?.VANID}</Text>
                                    <Pressable onPress={() => copyData(userData.VANID)}>
                                        <VectorIcons
                                            family="Ionicons"
                                            name="copy-outline"
                                            size={18}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginVertical: 10, padding: "5%" }}>
                                <Text family="regular" size="medium" style={{ color: theme.primarytext }}>Notes</Text>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey, marginTop: 5, fontWeight: 600 }}>1. Open your bank app or internet banking</Text>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey, marginLeft: 15 }}>Works with any Indian bank — HDFC, ICICI, Axis, Kotak, and more.</Text>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey, marginTop: 5, fontWeight: 600 }}>2. Add a new beneficiary</Text>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey, marginLeft: 15 }}>Use your VAN as the account number. Bank name: State Bank of India (SBI). IFSC: confirm with support.</Text>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey, marginTop: 5, fontWeight: 600 }}>3. Transfer the amount</Text>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey, marginLeft: 15 }}>Send any amount via NEFT, RTGS, IMPS, or UPI.</Text>
                            </Card>
                        </Card>
                    </>
                }
                {pay_mode == 'BANK' &&
                    <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[styles.cardContainer, { marginTop: 0 }]}>
                        <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>Bank Details</Text>
                                <Text style={{ marginTop: 8 }}>{firstCurrency?.bankName}</Text>
                            </View>
                        </Flexcomponent>
                        <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>Account Number</Text>
                                <Text family="regular" style={{ marginTop: 8 }}>{firstCurrency?.accountNo}</Text>
                            </View>
                        </Flexcomponent>

                        <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text
                                    family="regular"
                                    size="semimedium"
                                    style={{ color: Colors.grey }}>IFSC</Text>

                                <Text
                                    family="regular"
                                    style={{ marginTop: 8 }}>{firstCurrency?.ifscCode}</Text>
                            </View>
                        </Flexcomponent>

                        <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text
                                    family="regular"
                                    style={{ color: Colors.grey }}>Bank Holder Name</Text>

                                <Text
                                    family="regular"
                                    style={{ marginTop: 8 }}>{firstCurrency?.holderName}</Text>
                            </View>

                        </Flexcomponent>
                    </Card>
                }
                {(pay_mode == 'BANK' || pay_mode == 'UPI') &&
                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ marginVertical: 10, padding: "5%" }}>
                    {(pay_mode == 'BANK' || pay_mode == 'UPI') && < Dropdown
                        list={subaccounts}
                        placeholder="Select"
                        label="Select Account"
                        labelField="accountName"
                        valueField="accountId"
                        value={selectedaccount}
                        onChange={(value) => {
                            setSelectedaccount(value?.accountId)
                        }}
                    />}

                    {pay_mode == 'BANK' && <Input
                        label="Transaction Number"
                        placeHolder="Enter Your Transaction Number"
                      
                        onChange={setTransactionnumber}
                        value={transactionnumber}
                        keyboardType="number-pad"
                        allowed={"numbers"}
                        background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                    />}

                    {(pay_mode == 'BANK' || pay_mode == 'UPI') &&
                        <>
                            <Input
                                label="Transaction Amount"
                                placeHolder={`Enter your transaction amount`}
                                onChange={setAmount}
                                value={amount}
                                keyboardType="numeric"
                                rightContent={
                                    <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                        <Text color={Colors.white} size="small">INR</Text>
                                    </View>
                                }
                                allowed={"number"}
                                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                            />
                            <Text color={Colors.grey} size="semismall" style={{ marginTop: "-4%", marginBottom: "5%" }}>Min: {firstCurrency?.minDeposit}, Max: {firstCurrency?.maxDeposit}</Text>
                        </>
                    }

                    {pay_mode == 'BANK' &&
                        <>
                            <Text style={{ marginBottom: "3%", color: theme.primarytext }}>Bank transfer receipt/Proof of the transaction</Text>
                            <FileUpload
                                source="sheet"
                                mediaData={frontImage}
                                component={renderItem()}
                                onChange={(data) => {
                                    setFrontImage(data);
                                }}
                                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"} />
                        </>}


                </Card>
                }
            </View>
        </Mainview>
    )
}

const styles = StyleSheet.create({

    imagebg: {
        width: "100%",
        height: windowheight * 0.16,
        justifyContent: "center"
    },
    cardContainer: {
        height: "auto",
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10,
        padding: "3%",
    }
})

export default DepositDetails;