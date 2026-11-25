import React from "react";
import { ImageBackground, Pressable, StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../Components/text";
import Mainview from "../../Components/mainview";
import { walletSelector } from "../../Slices/wallet";
import Images, { icons } from "../../Utilities/images";
import { windowheight } from "../../Utilities/dimensions";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { Colors, Fontfamily } from "../../Utilities/uiasset";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'AddMoneyHome'>;

const AddMoneyHome: React.FC<Props> = () => {

    const { theme, navigation, convert } = useCustomHooks();
    const { wallet } = useSelector(walletSelector);

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle="Add money"
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >
            <View style={{ height: windowheight * 0.84, width: "auto", justifyContent: "flex-start", backgroundColor: theme.background }}>
                <ImageBackground
                    source={icons.BalanceBg_Img}
                    borderRadius={28}
                    resizeMode="cover"
                    style={styles.imagebg}>
                    <View style={{ margin: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text family="medium" size={"semimedium"} style={{ color: Colors.black }}>Earn Asset</Text>
                            <Images
                                type="svg"
                                name="EyeIcon"
                                width={30}
                                height={30}
                            />
                        </View>
                        <Text family="bold" size={"large"} style={{ marginTop: 5, color: Colors.black }}>{convert(wallet?.tradingBalance)}</Text>
                    </View>
                </ImageBackground>
            </View>
            <View style={styles.bottomView}>
                <View style={{ alignItems: "center" }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Pressable onPress={() => { navigation.navigate('Deposit', { Page: "deposit" }) }} style={{ backgroundColor: Colors.btnBgGreen, alignItems: "center", borderRadius: 10, flex: 0.5, marginRight: 10, minHeight: 40, }}>
                            <Text style={styles.btntxtStyle}>Deposit</Text>
                        </Pressable>

                        <Pressable onPress={() => navigation.navigate('Deposit', { Page: "withdraw" })} style={{ backgroundColor: Colors.btnBgGray, alignItems: "center", borderRadius: 10, flex: 0.5, marginLeft: 10, minHeight: 40, }}>
                            <Text style={styles.btntxtStyle}>Withdraw</Text>
                        </Pressable>
                    </View>
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
    },
    bottomView: {
        height: windowheight * 0.060,
        bottom: 0,
        alignItems: "center",
        position: "absolute",
        width: "100%",
        justifyContent: "center",
    },
    btntxtStyle: {
        color: Colors.textWhite,
        fontFamily: Fontfamily.semiBold,
        padding: 12,

    },
    item: {
        padding: 6,
        marginVertical: 3,
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
    }
})

export default AddMoneyHome;