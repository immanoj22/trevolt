
import Mainview from "../../Components/mainview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { windowheight } from "../../Utilities/dimensions";
import { Alert, ImageBackground, Pressable, StyleSheet, View } from "react-native";
import Images, { icons } from "../../Utilities/images";
import { Colors, Fontfamily } from "../../Utilities/uiasset";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import React, { useEffect, useState } from "react";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";

import { Button, Dropdown, Input } from "../../Components/Field";
import Text from "../../Components/text";
import Card from "../../Components/Card";
import { colors } from "react-native-keyboard-controller/lib/typescript/components/KeyboardToolbar/colors";
import { useLazyGetcurrencyQuery, useLazyWithdrawcodeQuery, useWithdrawfiatMutation, walletSelector } from "../../Slices/wallet";
import { subAccountSelector, useLazySubAccountQuery } from "../../Slices/subAccount";
import { useSelector } from "react-redux";
import { authSelector } from "../../Slices/auth";
import useApiError from "../../Actions/Hooks/errorhook";
import { useRoute } from "@react-navigation/native";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Withdraw'>;

const bankOption = [
    {
        label: 'SBI',
        value: 'DCR',
    },
    {
        label: 'Other Banks',
        value: 'NEFT',
    }
]


const Withdraw: React.FC<Props> = () => {

    const route = useRoute();
    const { pay_mode = 'BANK' }: any = route?.params || {};

    const { theme, navigation, successtoast, convert, convertSec, convertTo, failuretoast } = useCustomHooks()
    const { triggeruserdetails, Fetchcurrencies } = useApihooks()

    // Currency limits (min/max withdraw) are fetched once at app launch and
    // cached in redux - refetch on mount so admin-side limit changes show up
    // without needing to restart the app.
    useEffect(() => {
        Fetchcurrencies();
    }, []);

    const { subaccounts } = useSelector(subAccountSelector)

    const [selectedaccount, setSelectedaccount] = useState<any>(subaccounts[0]?.accountId ?? "")
    const { getcurrencies } = useSelector(walletSelector);

    const firstCurrency = getcurrencies?.[0];

    const [acc, setAcc] = useState<any>(subaccounts[0])
    // const [fiat, setFiat] = useState<any>(getcurrencies[0])

    const { userData } = useSelector(authSelector)
    const accounts = userData?.bankAccounts
    const [selectedbank, setSelcetedbank] = useState("")
    const [currencyIn, setCurrencyIn] = useState('INR');

    const [amount, setAmount] = useState("")
    const [feeamount, setFeeamount] = useState("")
    const [accountNo, setAccountNo] = useState("")
    const [withdrawcode, { isLoading: getcode, error: errorgetcode }] = useLazyWithdrawcodeQuery()

    const [minutes, setMinutes] = useState(5);
    const [seconds, setSeconds] = useState(0);
    const [timerExpired, setTimerExpired] = useState(false);
    const [otp, setOtp] = useState("")
    const [isSubmit, setIsSubmit] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState("");

    const sentcode = async () => {

        const response: any = await withdrawcode(selectedaccount)
        if (response?.data?.success) {
            successtoast("Success!", response?.data?.message)
            if (userData?.google2fa) {
                return '';
            }
            setTimerExpired(false);
            setIsSubmit(true);
            setOtp("")
            setMinutes(5);
            setSeconds(0);
        }
    }

    const [withdrawfiat, { isLoading: final, error: errorwithdraw }] = useWithdrawfiatMutation()
    useApiError(errorgetcode ?? errorwithdraw)

    const submit = async () => {
        // The Amount field's onChange only rejects a value while actively typing -
        // it was never re-checked at submit time, and the Withdraw button's
        // `disabled` only looks at OTP length. That let an empty/invalid amount
        // (e.g. OTP requested and entered without ever typing a valid amount)
        // reach the API every time, relying entirely on the backend's validation
        // to reject it instead of catching it here first.
        const numericAmount = Number(amount);
        const minWithdraw = Number(firstCurrency?.minWithdraw);
        const maxWithdraw = Number(firstCurrency?.maxWithdraw);
        if (!amount || !isFinite(numericAmount) || numericAmount <= 0) {
            failuretoast("Error!", "Please enter a withdrawal amount.");
            return;
        }
        if (isFinite(minWithdraw) && numericAmount < minWithdraw) {
            failuretoast("Error!", `Minimum withdrawal amount is ${firstCurrency?.minWithdraw}.`);
            return;
        }
        if (isFinite(maxWithdraw) && numericAmount > maxWithdraw) {
            failuretoast("Error!", `Maximum withdrawal amount is ${firstCurrency?.maxWithdraw}.`);
            return;
        }

        const payload = {
            accountId: selectedaccount,
            amount: amount,
            currencyId: firstCurrency?._id,
            bankId: selectedbank,
            otp: otp,
            pay_mode: pay_mode,
            paymentMethod: paymentMethod
        }
        console.log("Withdraw_payload", payload)

        try {
            const response = await withdrawfiat(payload).unwrap()
            if (response?.success) {
                await triggeruserdetails()
                successtoast("Success!", response?.message)
                navigation?.pop(2)
            } else {
                // A 200 response with `success: false` (e.g. invalid/expired OTP)
                // resolves normally here - `.unwrap()` only throws on an actual
                // HTTP-level failure, which useApiError above already covers. Without
                // this branch, tapping submit fired the request and then did nothing
                // visible at all on this very common business-logic-failure path.
                failuretoast("Error!", response?.message || "Withdrawal failed. Please try again.");
            }
        } catch (error: any) {
            // Belt-and-braces for a rejected `.unwrap()` - useApiError(errorwithdraw)
            // handles this today, but that relies on the mutation's error state
            // updating in time; this guarantees feedback even if that timing ever
            // misses.
            failuretoast("Error!", error?.data?.message || "Withdrawal failed. Please try again.");
        }
    }

    useEffect(() => {
        if (timerExpired) return;

        const interval = setInterval(() => {
            setSeconds((prevSeconds) => {
                if (prevSeconds > 0) return prevSeconds - 1;

                setMinutes((prevMinutes) => {
                    if (prevMinutes > 0) return prevMinutes - 1;
                    setTimerExpired(true);
                    return 0;
                });

                return 59;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timerExpired]);

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle={"Withdraw"}
            isscollable={true}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >

            <View style={{ flex: 1, marginBottom: 20 }}>

                {/* <Dropdown
                    list={dropdownData}
                    placeholder="Select"
                /> */}


                <Dropdown
                    list={subaccounts}
                    placeholder="Select"
                    label="Select Account"
                    // background={theme.theme === "dark" ? "#16181A" : Colors.white}
                    labelField="accountName"
                    valueField="accountId"
                    value={selectedaccount}
                    onChange={(value) => {
                        console.log(value, "Withdraw_subaccount")
                        setSelectedaccount(value?.accountId)
                        setAcc(value)
                    }}
                />


                {/* <Dropdown
                    list={getcurrencies}
                    placeholder="Select"
                    label="Select Currency"
                    background={theme.theme === "dark" ? "#16181A" : Colors.white}
                    labelField="currencySymbol"
                    valueField="_id"
                    value={currencyId}
                    onChange={(value) => {
                        setCurrencyid(value?._id)
                        setFiat(value)
                    }}
                /> */}


                {pay_mode != "BANK" ? ""
                    :
                    (accounts?.length > 0) ?
                        <Dropdown
                            list={accounts}
                            placeholder="Select your Bank"
                            label="Select Bank"
                            // background={theme.theme === "dark" ? "#16181A" : Colors.white}
                            labelField="bankName"
                            valueField="_id"
                            value={selectedbank}
                            onChange={(value) => {
                                setSelcetedbank(value?._id)
                            }}
                        /> :
                        <>
                            <Text color={theme.secondarytext} >Select bank</Text>
                            <Button
                                title="Add Bank"
                                buttonStyle={{ height: windowheight * 0.05, width: "30%", marginVertical: "2.5%" }}
                                onPress={() => navigation?.navigate("AddBankDetail")}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </>
                }


                {pay_mode == 'SBI' &&
                    <>
                        <Input
                            label="Account No"
                            placeholder={`Enter Account No to withdraw`}
                            value={accountNo}
                            onChange={(text) => {
                                let numbers = /^[A-Z0-9]+$/;
                                console.log("e?.target?.value", text, !numbers.test(text));
                                if (!numbers.test(text) && text !== "") {
                                    return false
                                }
                                setAccountNo(text)
                            }}
                            keyboardType="numeric"
                            rightContent={
                                <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                                    <Text color={Colors.white} size="small">INR</Text>
                                </View>
                            }
                            allowed={"number"}
                        />
                        <Dropdown
                            list={bankOption}
                            placeholder="Select"
                            label="Select Bank"
                            // background={theme.theme === "dark" ? "#16181A" : Colors.white}
                            labelField="label"
                            valueField="value"
                            value={paymentMethod}
                            onChange={(value) => {
                                console.log(value, "Select_Bank")
                                setPaymentMethod(value?.value)
                            }}
                        />
                    </>
                }

                <Input
                    label="Amount"
                    placeholder={`Enter your amount`}
                    value={amount}
                    onChange={(text) => {
                        const limit = currencyIn === 'INR' ? convertTo(acc?.balance, 'USD', currencyIn) : acc?.balance;
                        const amount = Number(text);
                        const max = Number(limit);
                        if (amount > max) {
                            setAmount("")
                            setFeeamount("")
                            failuretoast("Error!", "Withdrawal amount exceeds available balance.");
                            return;
                        }
                        setAmount(text)
                        // Was only ever deducting withdrawalFee, silently ignoring gstFee and
                        // tdsFee - the currency record carries all three (confirmed live:
                        // withdrawalFee 0%, gstFee 18%, tdsFee 1% on this account), so this
                        // field always showed the entered amount back unchanged regardless of
                        // the real, mandatory GST/TDS deduction. Matches the web reference's
                        // feeManagment(amount, currency, true) exactly: totalFee = gst + fee + tds.
                        const numericText = Number(text);
                        const gst = numericText * (Number(firstCurrency?.gstFee) / 100);
                        const fee = numericText * (Number(firstCurrency?.withdrawalFee) / 100);
                        const tds = numericText * (Number(firstCurrency?.tdsFee) / 100);
                        const totalFee = gst + fee + tds;
                        const calculatefee = numericText - totalFee;
                        setFeeamount(JSON.stringify(calculatefee))
                    }}
                    keyboardType="numeric"
                    rightContent={
                        <View style={{ backgroundColor: theme.theme === "dark" ? Colors.darkgray : Colors.dustygrey, padding: 5, borderRadius: 5, paddingHorizontal: 8 }}>
                            <Text color={Colors.white} size="small">INR</Text>
                        </View>
                    }
                    allowed={"number"}
                />
                <Text color={Colors.grey} size="semismall" style={{ marginTop: "-4%", marginBottom: "5%" }}>Min: {firstCurrency?.minWithdraw}, Max: {firstCurrency?.maxWithdraw}</Text>

                <Pressable style={{ width: "100%", backgroundColor: theme.card, paddingVertical: "5%", borderRadius: 10, justifyContent: "center", alignItems: "center" }}>
                    <Text>Account balance : <Text style={{ color: Colors.brand }}>{convert(acc?.availableBalance) ?? 0.00} </Text><Text style={{ color: Colors.brand }} size="semismall">{convertSec(acc?.availableBalance) ?? 0.00}</Text></Text>
                </Pressable>


                <View style={{ marginTop: "10%" }}>
                    <Input
                        label="Withdraw Amount With Fee"
                        placeholder="0"
                        disabled={true}
                        value={feeamount}

                    />
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ width: "60%" }}>
                        <Input
                            label="OTP"
                            placeholder="0"
                            onChange={setOtp}
                            keyboardType="number-pad"
                            inputprops={{
                                maxLength: 6
                            }}
                            maxLength={6}
                            value={otp}
                        />
                    </View>
                    {
                        isSubmit && !timerExpired ? (
                            <Text>
                                {minutes < 10 ? `0${minutes}m` : `${minutes}m`}:
                                {seconds < 10 ? `0${seconds}s` : `${seconds}s`}
                            </Text>
                        ) :
                            <Button
                                loading={getcode}
                                onPress={() => sentcode()}
                                title={isSubmit ? "Resend OTP" : "Get OTP"}
                                buttonStyle={{ width: "35%", marginTop: "5%" }}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                    }

                </View>

                <Button
                    title="Withdraw"
                    buttonStyle={{ marginTop: "10%", backgroundColor: (otp?.length != 6 || !amount) ? Colors.brand : Colors.brand }}
                    disabled={otp?.length != 6 || !amount}
                    onPress={() => submit()}
                    loading={final}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />

                <View style={{ marginTop: "10%" }}>
                    <Text size="medium" family="semiBold" style={{ color: Colors.btnBgGreen }}>Notes</Text>
                    <Text style={{ marginTop: "2%" }}>1. Maximum withdraw limit {firstCurrency?.maxWithdraw} INR</Text>
                    <Text style={{ marginTop: "2%" }}>2. Minimum withdraw limit {firstCurrency?.minWithdraw} INR</Text>
                    <Text style={{ marginTop: "2%" }}>3. On submit of withdrawal check mail sent to registered email id for OTP</Text>
                    <Text style={{ marginTop: "2%" }}>4. Your withdrawal request placed will be in pending state and processed after admin's approval</Text>
                    <Text style={{ marginTop: "2%" }}>5. Withdrawal amount with Fee will be the total transaction amount. So please ensure the amount entered doesn't exceed the maximum limit</Text>
                </View>
            </View>
        </Mainview>
    )
}

const styles = StyleSheet.create({

    imagebg: {
        width: "100%",
        height: windowheight * 0.16,
        justifyContent: "center"

    }
})

export default Withdraw;