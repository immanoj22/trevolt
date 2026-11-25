import React, { useState } from "react";
import { ActivityIndicator, ImageBackground, Pressable, View } from "react-native";
import { useSelector } from "react-redux";
import { LinearGradient } from "../../Components/lineargradient";

import Text from "../../Components/text";
import Images, { image } from "../../Utilities/images";
import VectorIcons from "../../Utilities/vectoricons";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { getItem } from "../../Actions/Storage/localstorage";
import { borderradius, windowwidth } from "../../Utilities/dimensions";
import { Colors } from "../../Utilities/uiasset";

interface Cardprops {

}

const Homecard: React.FC<Cardprops> = () => {
    const { theme, navigation, convert, convertSec, failuretoast } = useCustomHooks()

    // convert()/convertSec() swap which currency is "primary" based on this
    // setting (USDT -> $ primary, ₹ secondary; INR -> ₹ primary, $ secondary) -
    // the masked "***" placeholders below must follow the same setting,
    // otherwise hiding the balance always shows ₹*** even when the revealed
    // amount is in USD.
    const isUsdPrimary = getItem("convertCurrency") === "USDT";
    const primarySymbol = isUsdPrimary ? "$" : "₹";
    const secondarySymbol = isUsdPrimary ? "₹" : "$";

    // Narrowed to specific fields - walletSelector/authSelector/futureSelector return
    // their whole slice, unmemoized, and wallet/future get live socket updates
    // (balance, position, price ticks) constantly - this card re-rendering on every
    // single one of those, right as it mounts after login, was the actual toast glitch.
    const wallet = useSelector((state: any) => state.wallet.wallet);
    const userData = useSelector((state: any) => state.auth.userData);
    const { kycStatus } = userData;
    const positionDetails = useSelector((state: any) => state.future.positionDetails);
    const openOrderDetails = useSelector((state: any) => state.future.openOrderDetails);
    const [showBalance, setShowbalance] = useState(false);

    const hasBankDetails = (userData?.bankAccounts?.length ?? 0) > 0;
    const hasDeposited = (wallet?.walletBalance ?? 0) > 0;

    const getOnboardingStep = () => {
        if (kycStatus !== 'approved') {
            return {
                title: "Verification Required",
                description: "Verify your identity to unlock all account features and continue setting up your trading account.",
                button: "Complete KYC",
                // Was pointing at the old, dead KYCVerification.tsx (a leftover
                // type/ID-proof dropdown flow that never connects to the real
                // Cashfree/Aadhaar/PAN/Selfie verification) instead of the actual
                // current KYC screen used everywhere else (Verification/index.tsx).
                onPress: () => navigation.navigate("Verification"),
            };
        }

        else if (!hasBankDetails) {
            return {
                title: "Add Bank Details",
                description: "Add your bank account details to enable secure deposits and withdrawals.",
                button: "Add Bank Details",
                onPress: () => navigation.navigate("BankDetails")
            };
        }

        else if (!hasDeposited) {
            return {
                title: "Make Your First Deposit",
                description: "Deposit funds into your account to complete the setup and start trading.",
                button: "Deposit Now",
                onPress: () => navigation.navigate("Deposit")
            }
        }
    }

    const isProfit = Number(wallet?.unRealizedPnL ?? 0) >= 0;

    const onboardingStep = getOnboardingStep();

    // Wait for userData to load before deciding which card to show - kycStatus is
    // undefined until then, and rendering the "approved" card for that brief window
    // makes it flash before flipping to the onboarding card.
    if (!kycStatus) {
        return (
            <ImageBackground
                source={theme.theme === "dark" ? image.card : image.cardLight}
                style={{ width: "100%", alignSelf: "center", marginTop: "2%", overflow: "hidden", borderRadius: borderradius, minHeight: windowwidth * 0.42 }}
                resizeMode="cover"
            >
                <View style={{ minHeight: windowwidth * 0.42, alignItems: "center", justifyContent: "center" }}>
                    <ActivityIndicator size="small" color={theme.tabactive} />
                </View>
            </ImageBackground>
        );
    }

    return (
        <>
            {kycStatus == 'approved' || !onboardingStep ?
                <ImageBackground
                    source={kycStatus !== 'approved' ? (theme.theme == "dark" ? image.EmptyCard : image.EmptyCardLight) : (theme.theme == "dark" ? image.card : image.cardLight)}
                    style={{ width: "100%", alignSelf: "center", marginTop: "2%", overflow: "hidden", borderRadius: borderradius, minHeight: windowwidth * 0.42 }}
                    resizeMode="cover"

                >
                    <View style={{ padding: "5%", }}>
                        <Flexcomponent justifyContent="space-between">
                            <Text size="medium" style={{ color: theme.darktext, fontSize: 12 }} >UPNL</Text>
                            <Pressable onPress={() => setShowbalance(!showBalance)}>
                                {!showBalance ?
                                    <Images
                                        type="svg"
                                        name={"Eye"}
                                        width={windowwidth * 0.06}
                                        height={windowwidth * 0.06}
                                    /> :
                                    <Images
                                        type="svg"
                                        name={"EyeCross"}
                                        width={windowwidth * 0.06}
                                        height={windowwidth * 0.06}
                                    />
                                }
                            </Pressable>
                        </Flexcomponent>
                        <Flexcomponent alignItems="center" justifyContent="flex-start" top={"1%"}>
                            {!showBalance ?
                                <Text style={{ color: isProfit ? Colors.green : Colors.red }} size="extralarge" family="extrabold" >
                                    {convert(wallet?.unRealizedPnL)}
                                </Text> :
                                <Text style={{ color: theme.darktext }} size="extralarge" family="extrabold" >
                                    {primarySymbol}***
                                </Text>
                            }
                            <View style={{ marginLeft: "1%", }} >
                                <Flexcomponent alignItems="flex-end" justifyContent="flex-start">
                                    {!showBalance &&
                                        <VectorIcons
                                            family="Ionicons"
                                            name={isProfit ? "caret-up" : "caret-down"}
                                            iconcolor={isProfit ? Colors.green : Colors.red}
                                            size={windowwidth * 0.05}
                                        />
                                    }
                                    {!showBalance ?
                                        <Text style={{ marginLeft: "5%" }} color={theme.mutedText} family="medium" size="small" >
                                            {convertSec(wallet?.unRealizedPnL)}
                                        </Text> :
                                        <Text style={{ marginLeft: "5%" }} color={theme.mutedText} family="medium" size="small" >
                                            {secondarySymbol}***
                                        </Text>
                                    }
                                </Flexcomponent>
                            </View>
                        </Flexcomponent>
                        <Flexcomponent alignItems="center" justifyContent="space-between" style={{flexWrap: "wrap"}} top={"1%"}>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
                                <Text style={{ color: theme.mutedText, fontSize: 11 }} >Current Balance › </Text>
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 1 }}>
                                {!showBalance ?
                                    <>
                                        <Text style={{ color: theme.darktext, fontSize: 12, }} family='extrabold' > {convert(wallet.tradingBalance)}</Text>
                                        <Text style={{ color: theme.darktext, fontSize: 9 }} >  {convertSec(wallet?.tradingBalance)}</Text>
                                    </> :
                                    <>
                                        <Text style={{ color: theme.darktext, fontSize: 12, }} family='extrabold' > {primarySymbol}***</Text>
                                        <Text style={{ color: theme.darktext, fontSize: 9 }} >  {secondarySymbol}***</Text>
                                    </>
                                }
                                </View>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start" }}>
                                <Text style={{ color: theme.mutedText, fontSize: 11 }} >Positions / Orders › </Text>
                                <Text style={{ color: theme.darktext, fontSize: 10 }} > {positionDetails?.length ?? 0}/{openOrderDetails?.length ?? 0} </Text>
                            </View>
                        </Flexcomponent>
                        <Flexcomponent alignItems="center" justifyContent="center" top={"2%"} style={{ gap: windowwidth * 0.04 }} >
                            <Pressable onPress={() => {
                                if (kycStatus !== 'approved') {
                                    failuretoast("Error!", "Please complete your KYC details")
                                } else {
                                    navigation.navigate('Deposit')
                                }
                            }}>
                                <LinearGradient
                                    colors={["#4F8DF7", "#2563EB", "#1D4ED8"]}
                                    start={{ x: 0.0504, y: 0.2812 }}
                                    end={{ x: 0.9496, y: 0.7188 }}
                                    style={{ width: windowwidth * 0.4, height: windowwidth * 0.11, borderRadius: borderradius * 3, alignItems: "center", justifyContent: "center" }}
                                >
                                    <Flexcomponent style={{ width: "auto" }}>
                                        <Images
                                            type="svg"
                                            name={"Deposit"}
                                            width={windowwidth * 0.06}
                                            height={windowwidth * 0.06}

                                        />
                                        <Text family="medium" style={{ marginLeft: "7%", fontSize: 11, color: "#FFFFFF" }} >Deposit</Text>
                                    </Flexcomponent>
                                </LinearGradient>
                            </Pressable>
                            <Pressable onPress={() => {
                                if (kycStatus !== 'approved') {
                                    failuretoast("Error!", "Please complete your KYC details")
                                } else {
                                    navigation.navigate('Withdraw')
                                }
                            }}>
                                <LinearGradient
                                    colors={theme.theme === "dark" ? ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.04)"] : ["#FFFFFF", "#F1F5FF"]}
                                    start={{ x: 0.0504, y: 0.2812 }}
                                    end={{ x: 0.9496, y: 0.7188 }}
                                    style={{ width: windowwidth * 0.4, height: windowwidth * 0.11, borderRadius: borderradius * 3, alignItems: "center", justifyContent: "center" }}
                                >
                                    <Flexcomponent style={{ width: "auto" }}>

                                        <Text family="medium" style={{ fontSize: 11 }} >Withdrawal</Text>
                                        <Images
                                            type="svg"
                                            name={"Withdrawal"}
                                            width={windowwidth * 0.06}
                                            height={windowwidth * 0.06}
                                             style={{ marginLeft: "7%" }}
                                        />
                                    </Flexcomponent>
                                </LinearGradient>
                            </Pressable>
                        </Flexcomponent>
                    </View>
                </ImageBackground> :
                onboardingStep && (
                    <ImageBackground
                        source={
                            theme.theme === "dark"
                                ? image.card
                                : image.cardLight
                        }
                        style={{
                            width: "100%",
                            alignSelf: "center",
                            marginTop: "2%",
                            overflow: "hidden",
                            borderRadius: borderradius,
                            minHeight: windowwidth * 0.42,
                        }}
                        resizeMode="cover"
                    >
                        <View
                            style={{
                                flex: 1,
                                alignItems: "center",
                                justifyContent: "space-between",
                                paddingHorizontal: "8%",
                                paddingVertical: "6%",
                            }}
                        >
                            <Text
                                size="medium"
                                style={{
                                    color: theme.theme == 'dark' ? Colors.tradegreen : "#32496c",
                                    textAlign: "center",
                                }}
                            >
                                {onboardingStep.title}
                            </Text>

                            <Text
                                size="small"
                                style={{
                                    color: theme.darktext,
                                    textAlign: "center",
                                    paddingHorizontal: "5%",
                                    fontSize: 10,
                                }}
                            >
                                {onboardingStep.description}
                            </Text>

                            <Pressable onPress={onboardingStep.onPress}>
                                <LinearGradient
                                    colors={
                                        theme.btnGradient ?? [
                                            "rgba(10, 22, 44, 0.5)",
                                            "rgba(29, 78, 216, 0.5)",
                                        ]
                                    }
                                    locations={[0.1092, 0.964]}
                                    start={{ x: 0.0504, y: 0.2812 }}
                                    end={{ x: 0.9496, y: 0.7188 }}
                                    style={{
                                        borderRadius: borderradius * 3,
                                        paddingVertical: "3%",
                                        paddingHorizontal: "10%",
                                    }}
                                >
                                    <Text
                                        family="medium"
                                        color={theme.darktext}
                                    >
                                        {onboardingStep.button}
                                    </Text>
                                </LinearGradient>
                            </Pressable>
                        </View>
                    </ImageBackground>
                )

            }
        </>

    )
}

export default Homecard;

// import React from "react";
// import { View, Pressable, ImageBackground } from "react-native";
// import { useSelector } from "react-redux";

// import Text from "../../Components/text";
// import { image } from "../../Utilities/images";
// import useCustomHooks from "../../Actions/Hooks/customhook";
// import { borderradius } from "../../Utilities/dimensions";

// interface Cardprops {

// }

// const Homecard: React.FC<Cardprops> = () => {
//     const { navigation } = useCustomHooks()
//     const { kycStatus } = useSelector((state: any) => state.auth.userData);

//     if (kycStatus === 'approved') return null;

//     return (
//         <ImageBackground
//             source={image.card}
//             style={{ width: "100%", aspectRatio: 324 / 115, marginTop: "2%", borderRadius: borderradius, overflow: "hidden", padding: "6%", justifyContent: "space-between" }}
//             resizeMode="cover"
//         >
//             <View>
//                 <Text size="semilarge" family="semiBold" color="#3B82F6" style={{ textAlign: "center" }}>Verification Required</Text>
//                 <Text size="small" color="rgba(255,255,255,0.7)" style={{ textAlign: "center", marginTop: 6, lineHeight: 16, width: "70%", alignSelf: "center" }}>
//                     Verify your identity to unlock all account features and enjoy a secure trading experience.
//                 </Text>
//             </View>

//             <Pressable
//                 onPress={() => navigation.navigate('Verification')}
//                 style={{ backgroundColor: "rgba(0,0,0,0.35)", borderRadius: borderradius * 5, alignSelf: "flex-start", paddingVertical: "2.5%", paddingHorizontal: "6%" }}
//             >
//                 <Text family="semiBold" color="#FFFFFF" size="small">Complete KYC</Text>
//             </Pressable>
//         </ImageBackground>
//     )
// }

// export default Homecard;