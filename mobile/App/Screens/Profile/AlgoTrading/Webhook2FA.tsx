import React from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Mainview from "../../../Components/mainview";
import { Button, Input } from "../../../Components/Field";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Webhook2FA'>;

const Webhook2FA: React.FC<Props> = ({ route }) => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle={"Security Verification"}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Input
                    label="Enter Email Verification Code"
                    placeHolder="895623"
                />
                <Input
                    label="2FA Code"
                    placeHolder="895623"
                />
                <View style={style.bottomButton}>
                    <View style={style.between}>
                        <Button
                            title="Cancel"
                            style={[style.buttonContainer, { backgroundColor: "#2B2D32" }]}
                            onPress={() => navigation.goBack()}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                        <Button
                            title="Submit"
                            style={style.buttonContainer}
                            onPress={() => navigation.navigate("WebhookVerification")}
                            textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        />
                    </View>
                </View>
            </View>
        </Mainview>
    )

}

export default Webhook2FA;