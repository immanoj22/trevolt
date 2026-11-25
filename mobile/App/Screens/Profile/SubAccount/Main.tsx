import React from "react";
import { Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import { borderradius, windowheight } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { setSubAccountparams } from "../../../Slices/helper";
import LinearGradient from "../../../Components/lineargradient";

interface DescriptionProps {
    name?: any
    subAccounts?: any;
    accountId?: any;
    balance?: any;
    theme?: any
}

const Main: React.FC<DescriptionProps> = ({
    name,
    subAccounts,
    accountId,
    balance,
    theme
}) => {
    const { navigation, dispatch, failuretoast } = useCustomHooks();

    const payload: any = {
        type: "transfer",
        value: subAccounts
    }

    const { kycStatus } = useSelector((state: any) => state.auth.userData);

    return (
        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ padding: "5%", borderColor: theme.theme == "dark" ? Colors.dune : theme.boderColor }}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ width: "80%" }}>
                    <Text size="tiny" style={{ color: Colors.grey }} numoflines={1}>Account in Use <Text size="tiny" style={{ color: theme.darktext }}>{name}</Text></Text>
                </View>
            </View>
            <View style={[{ flexDirection: "row", marginTop: "5%" }]}>
                <View style={{ marginRight: "10%" }}>
                    <Text size="tiny" >Account ID</Text>
                    <Text size="tiny" style={{ color: Colors.grey, marginTop: "5%" }}>{accountId}</Text>
                </View>
                <View>
                    <Text size="tiny" >Account Value</Text>
                    <Text size="tiny" style={{ marginTop: "5%" }}>{balance}</Text>
                </View>
            </View>
            <Button
                title="Transfer funds"
                onPress={() => {
                    if (kycStatus !== 'approved') {
                        failuretoast("Error!", "Please complete your KYC details")
                    } else {
                        dispatch(setSubAccountparams(payload)), navigation.navigate("TransferFunds")
                    }
                }}
                buttonStyle={{ marginTop: "5%", width: "50%", height: windowheight * 0.045 }}
                textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
            />
        </Card>
    )
}

export default Main;