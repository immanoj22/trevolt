import React from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import ListItem from "../ListItem";
import Mainview from "../../../Components/mainview";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Preference'>;

const Preference: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);
    return (
        <Mainview
            iskeyboardaware={false}
            isheader={true}
            headertitle={"Preference"}
            isscollable={true}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <ListItem title="Currency" onPress={() => navigation.navigate("Currency")} />
                <ListItem title="Push notification" onPress={() => navigation.navigate("Pushnotification")} />
            </View>
        </Mainview>
    )

}

export default Preference;