import React from "react";
import { View } from "react-native";

import Card from "../../Components/Card";
import Text from "../../Components/text";
import Images from "../../Utilities/images";
import useCustomHooks from "../../Actions/Hooks/customhook";

interface AnalyticsOptionprops {

}

const Analytics: React.FC<AnalyticsOptionprops> = () => {

    const { theme } = useCustomHooks()

    return (
        <View style={{ flex: 1, paddingHorizontal: "2.5%" }} >
            <Card containerStyle={{ padding: 10, borderWidth: 1, borderColor: theme.background, marginTop: "5%" }}>
                <View style={{ marginVertical: 5, backgroundColor: theme.card }}>
                    <Text color={theme.textNobel} family="regular" size="semimedium" >Open Interest :
                        <Text family="regular" size="semimedium"> $892.256 </Text>
                    </Text>
                    <Text color={theme.textNobel} family="regular" size="semimedium" style={{ marginTop: 10 }} >24 h Vol :
                        <Text family="regular" size="semimedium"> $892.256 </Text>
                    </Text>
                </View>
            </Card>
            <View style={{ width: "100%" }}>
                <Images
                    type="svg"
                    name="Graph"
                    resizeMode="contain"
                    width={"100%"}
                    height={"80%"}
                    style={{ bottom: "9%" }}
                />
            </View>
        </View>
    )
}

export default Analytics;