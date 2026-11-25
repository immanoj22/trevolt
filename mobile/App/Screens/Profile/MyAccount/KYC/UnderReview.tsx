import React from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Card from "../../../../Components/Card";
import Text from "../../../../Components/text";
import { Colors } from "../../../../Utilities/uiasset";
import Mainview from "../../../../Components/mainview";
import useCustomHooks from "../../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../../Navigations/navigationtypes";

import { styles } from "../../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'UnderReview'>;

const UnderReview: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);

    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            isscollable={true}
            headertitle={"My Account"}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={[style.container]}>
                <Text style={{ color: theme.secondarytext }}>Document Is Under Review:</Text>
                <Card containerStyle={{ paddingVertical: "5%", paddingHorizontal: "5%", marginTop: "5%" }}>
                    <Text style={{ color: theme.darktext }}>Your document is under review by the admin. Once approived, your dashboard will be create automatically</Text>
                    <Pressable style={{ width: "45%", backgroundColor: Colors.darkgray, alignItems: "center", paddingVertical: "3%", borderRadius: 10, marginTop: "8%" }}>
                        <Text style={{ color: Colors.white }}>Status : <Text style={{ color: Colors.red }}>Pending</Text></Text>
                    </Pressable>
                </Card>
            </View>
        </Mainview>
    )

}

export default UnderReview;