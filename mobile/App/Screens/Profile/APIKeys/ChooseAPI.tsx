import React from "react";
import { View } from "react-native";

import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import useCustomHooks from "../../../Actions/Hooks/customhook";
interface ConfirmProps {
    ref?: any;
}

const ChooseApi: React.FC<ConfirmProps> = ({ ref }) => {
    const { theme, closebottomsheet, navigation } = useCustomHooks();
    return (
        <Sheet
            sheetref={ref}
            snappoint={["35%"]}
            headertitle="Choose API Key type"
        >
            <View style={{ paddingTop: "5%" }}>
                <Text size="medium" style={{ color: theme.darktext }}>System generated</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%", lineHeight: 20 }}>works using HMAC symmetric encryption. An API Key and Secret Key will be Provided to you. Please keep these keys secure and treat it like your password. do not share the keys with any third parties.</Text>
                <View style={{ alignItems: "flex-end", marginTop: "2%" }}>
                    <Button
                        title="Next"
                        buttonStyle={{ width: "30%" }}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                        onPress={() => {
                            navigation.navigate("CreateAPIKey"),
                                closebottomsheet(ref)
                        }}
                    />
                </View>
            </View>
        </Sheet>
    );
};

export default ChooseApi;