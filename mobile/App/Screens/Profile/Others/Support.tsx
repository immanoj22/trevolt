import React from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Support'>;

const Support: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle="Support"
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Text size="medium">Our Support Team</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}>Our 24/7 support team is here to help with your account, KYC verification, fiat deposits, withdrawals and trading questions.</Text>
                <View style={style.bottomButton}>
                    <Text family="semiBold" size="medium" style={{ color: Colors.brand }}>Get more info ?</Text>
                </View>
            </View>
        </Mainview>
    )

}

export default Support;