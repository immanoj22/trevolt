import React from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import { authSelector } from "../../../Slices/auth";
import Mainview from "../../../Components/mainview";
import { Button, Input } from "../../../Components/Field";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'PanDetails'>;

const PanDetails: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);

    const { panDetails } = useSelector(authSelector);

    return (
        <Mainview
            isheader={true}
            headertitle={"PAN Details"}
            isscollable={true}
            onleftfn={() => navigation.navigate("Verification")}
            bottomContent={<Button title="Procced" onPress={() => navigation.navigate("Selfie")} textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }} />}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >
            <View style={style.container}>
                <Text size="medium">Verify your PAN Details</Text>
                <Text color={theme.secondarytext} style={{ marginBottom: "5%" }}>Please make sure details are correct</Text>
                <Input
                    label="Pan Number"
                    value={panDetails?.document_fields?.pan}
                />
                <Input
                    label="Full Name"
                    value={panDetails?.document_fields?.name}
                />
                <Input
                    label="Date of Birth"
                    value={panDetails?.document_fields?.dob}
                />
            </View>
        </Mainview>
    )

}

export default PanDetails;