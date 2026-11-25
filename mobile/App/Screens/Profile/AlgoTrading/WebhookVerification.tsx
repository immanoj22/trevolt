import React from "react";
import { Clipboard, ScrollView, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import { Button, Input } from "../../../Components/Field";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'WebhookVerification'>;

const tradingViewMessage = `{
    "symbol":"{{ticker}}",
    "side":"{{strategy.order.action}}",
    "qty":{{strategy.order.contracts}},
    "price":"{{close}}"
    "trigger_time":"{{timenow}}"
  }`;

const WebhookVerification: React.FC<Props> = ({ route }) => {

    const { url } = route.params || {};

    const { theme, navigation, successtoast } = useCustomHooks();
    const style = styles(theme);

    const Copydata = (data: any) => {
        Clipboard?.setString(data);
        successtoast("Copied Successfully");

    };

    return (
        <Mainview
            isheader={true}
            isscollable={true}
            headertitle={"Security Verification"}
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <Button
                    title="Copy Webhook URL"
                    onPress={() => Copydata(url)}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Text size="medium">Webhook Created Sucessfully</Text>
                <Text style={style.setup}>Your webhook has been set up and is now active.</Text>
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: "-3%" }}>
                    <Text>-   </Text>
                    <Text>Select your strategy on TradingView.</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: "3%" }}>
                    <Text>-   </Text>
                    <Text>Open the strategy settings and enter your desired pre-order quantity.</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: "3%" }}>
                    <Text>-   </Text>
                    <Text>Create an alert for your strategy and paste the given text  into the message box.</Text>
                </View>
                <Text style={[{ color: theme.secondarytext, marginBottom: "5%", marginTop: '5%' }]}>Trading View Message</Text>
                <Card containerStyle={{ padding: "4%", height: "25%", marginBottom: '5%' }}>
                    <ScrollView>
                        <Text>{tradingViewMessage}</Text>
                    </ScrollView>
                </Card>

                <Input
                    label="Webhook URL"
                    disabled={true}
                    value={url}
                />
                <Card containerStyle={{ padding: "3%", borderWidth: 1, borderColor: Colors.red, marginTop: "3%" }}>
                    <Text color={Colors.red}>This webhook URL will not be available once you leave this page.</Text>
                    <Text color={Colors.red}>Don't share it with anyone.</Text>
                </Card>
            </View>
        </Mainview>
    )

}

export default WebhookVerification;