import React from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import LottieView from "lottie-react-native";

import Text from "../Components/text";
import Mainview from "../Components/mainview";
import { Lotties } from "../Utilities/images";
import { windowwidth } from "../Utilities/dimensions";
import useCustomHooks from "../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../Navigations/navigationtypes";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'NoInternet'>;

const NoInternet: React.FC<Props> = () => {
    const { theme } = useCustomHooks();
    return (
        <Mainview
            isheader={false}
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <LottieView
                    source={Lotties.internet}
                    style={{ width: windowwidth, height: windowwidth * 0.35, alignSelf: "center", marginBottom: "5%" }}
                    autoPlay
                />
                <Text align="center" size="semilarge">No Internet Connection</Text>
                <View style={{ width: "80%", alignItems: "center", justifyContent: "center", marginTop: "1%" }}>
                    <Text color={theme.secondarytext} style={{ textAlign: "center" }}>Your device is not connected to the Internet. Please check your Wi-Fi or mobile data and try again.</Text>
                </View>
            </View>
        </Mainview>
    )

}

export default NoInternet;