import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";

import Text from "../../Components/text";
import Card from "../../Components/Card";
import { Button } from "../../Components/Field";
import Mainview from "../../Components/mainview";
import { Colors } from "../../Utilities/uiasset";
import { walletSelector } from "../../Slices/wallet";
import Images, { icons, image } from "../../Utilities/images";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import LinearGradient from "../../Components/lineargradient";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Deposit'>;

const Deposit: React.FC<Props> = ({ route }) => {

    const { theme, navigation, convert } = useCustomHooks()

    const [selected, setSelected] = useState<string>("BANK");

    const handleSelect = (method: string) => {
        setSelected(method)
        console.log(method)
    };

    const { wallet } = useSelector(walletSelector)
    const [type, setType] = useState("Deposit");

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle={type}
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#143818d7", "#1438183a", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ height: windowheight * 0.9, width: "auto", justifyContent: "flex-start" }}>
                <ImageBackground
                    // source={icons.BalanceBg_Img}
                    source={
                        theme.theme === "dark"
                            ? image.card
                            : image.cardLight
                    }
                    borderRadius={28}
                    resizeMode="cover"
                    style={styles.imagebg}>
                    <View style={{ margin: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text family="medium" size={"semimedium"} style={{ color: theme.primarytext }}>Current Balance</Text>
                        </View>
                        <Text family="bold" size={"large"} style={{ marginTop: 5, color: theme.primarytext }}>{convert(wallet?.tradingBalance)}</Text>
                    </View>
                </ImageBackground>

                <View style={{ marginTop: 20 }}>
                    <Text family="medium" size={"medium"}>Select Types</Text>
                    <Flexcomponent justifyContent="space-between" alignItems="center" top={"5%"}>
                        <Pressable
                            onPress={() => setType("Deposit")}
                            style={{
                                width: "48%",
                                borderRadius: 15,
                                overflow: "hidden",
                            }}
                        >
                            <LinearGradient
                                colors={
                                    type === "Deposit"
                                        ? theme.btnGradient ?? theme.theme == 'dark' ? [
                                            "rgba(10, 22, 44, 0.5)",
                                            "rgba(29, 78, 216, 0.5)",
                                        ] : ["#E8EFFC", "#E8EFFC"]
                                        : theme.theme == 'dark' ? ["#101A2C", "#101A2C"] : ["#FFFFFF", "#FFFFFF"]
                                }
                                locations={[0.1092, 0.964]}
                                start={{ x: 0.0504, y: 0.2812 }}
                                end={{ x: 0.9496, y: 0.7188 }}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 10,
                                    alignItems: "center",
                                    paddingVertical: "6%",
                                    paddingHorizontal: "11%",
                                    borderRadius: 15,
                                    borderWidth: 1,
                                    borderColor:
                                        theme.theme === "dark"
                                            ? "#081730"
                                            : "#E8EFFC"
                                }}
                            >
                                <Images
                                    type="svg"
                                    name={
                                        type === "Deposit"
                                            ? "GetWhite"
                                            : theme.theme === "dark"
                                                ? "GetWhite"
                                                : "GetBlack"
                                    }
                                    width={windowwidth * 0.080}
                                    height={windowheight * 0.028}
                                />

                                <Text
                                    size="tiny"
                                    family="medium"
                                    color={
                                        type === "Deposit"
                                            ? Colors.white
                                            : theme.primarytext
                                    }
                                >
                                    Deposit
                                </Text>
                            </LinearGradient>
                        </Pressable>
                        <Pressable
                            onPress={() => setType("Withdraw")}
                            style={{
                                width: "48%",
                                borderRadius: 15,
                                overflow: "hidden",
                            }}
                        >
                            <LinearGradient
                                colors={
                                    type === "Withdraw"
                                        ? theme.btnGradient ?? theme.theme == 'dark' ? [
                                            "rgba(10, 22, 44, 0.5)",
                                            "rgba(29, 78, 216, 0.5)",
                                        ] : ["#E8EFFC", "#E8EFFC"]
                                        : theme.theme == 'dark' ? ["#101A2C", "#101A2C"] : ["#FFFFFF", "#FFFFFF"]
                                }
                                locations={[0.1092, 0.964]}
                                start={{ x: 0.0504, y: 0.2812 }}
                                end={{ x: 0.9496, y: 0.7188 }}
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 10,
                                    alignItems: "center",
                                    paddingVertical: "6%",
                                    paddingHorizontal: "11%",
                                    borderRadius: 15,
                                    borderWidth: 1,
                                    borderColor:
                                        theme.theme === "dark"
                                            ? "#081730"
                                            : "#E8EFFC"
                                }}
                            >
                                <Images
                                    type="svg"
                                    name={
                                        type === "Withdraw"
                                            ? "AddWhite"
                                            : theme.theme === "dark"
                                                ? "AddWhite"
                                                : "AddBlack"
                                    }
                                    width={windowwidth * 0.090}
                                    height={windowheight * 0.028}
                                />

                                <Text
                                    size="tiny"
                                    family="medium"
                                    color={
                                        type === "Withdraw"
                                            ? Colors.white
                                            : theme.primarytext
                                    }
                                >
                                    Withdraw
                                </Text>
                            </LinearGradient>
                        </Pressable>
                    </Flexcomponent>
                    <Text family="medium" size={"medium"} top={"5%"} >Select Payment Method</Text>
                    <View style={{ marginTop: 10, flexDirection: "row", }}>
                        <Pressable onPress={() => handleSelect("BANK")} style={{ borderRadius: 13, margin: 5, height: 120, }}>
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[{ width: 110, height: 120, justifyContent: "center", alignItems: "center" }, selected === "BANK" && { borderColor: Colors.brand, borderWidth: 1 }]}>
                                <Images
                                    type="image"
                                    name="Bank"
                                    source={icons.Bank}
                                    width={windowwidth * 0.075}
                                    height={windowwidth * 0.075}
                                />
                                <Text family="medium" size={"small"} style={{ marginTop: 10 }}>Bank</Text>
                            </Card>
                        </Pressable>
                        <Pressable onPress={() => handleSelect("SBI")} style={{ borderRadius: 13, margin: 5, height: 120, }}>
                            <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[{ width: 110, height: 120, justifyContent: "center", alignItems: "center" }, selected === "SBI" && { borderColor: Colors.brand, borderWidth: 1 }]}>
                                <Images
                                    type="image"
                                    name="SBI"
                                    source={icons.SBI}
                                    width={windowwidth * 0.075}
                                    height={windowwidth * 0.075}
                                />
                                <Text family="medium" size={"small"} style={{ marginTop: 10 }}>SBI</Text>
                            </Card>
                        </Pressable>
                        {type === "Deposit" &&
                            <Pressable onPress={() => handleSelect("UPI")} style={{ borderRadius: 13, margin: 5, height: 120, }}>
                                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[{ width: 110, height: 120, justifyContent: "center", alignItems: "center" }, selected === "UPI" && { borderColor: Colors.brand, borderWidth: 1 }]}>
                                    <Images
                                        type="image"
                                        name="UpiPay"
                                        source={icons.UpiPay}
                                        width={windowwidth * 0.075}
                                        height={windowwidth * 0.075}
                                    />
                                    <Text family="medium" size={"small"} style={{ marginTop: 10 }}>UPI</Text>
                                </Card>
                            </Pressable>
                        }
                    </View>
                </View>
            </View>
            <Button
                title="Continue"
                buttonStyle={{ position: "absolute", bottom: "1%" }}
                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                onPress={type == "Deposit" ? () => navigation.navigate('DepositDetails', { pay_mode: selected }) : () => navigation.navigate('Withdraw', { pay_mode: selected })}
            />
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

export default Deposit;