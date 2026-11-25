import React from "react";
import { View, Pressable, Text } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
 
import Mainview from "../../../Components/mainview";
import useCurrency from "../../../Actions/Hooks/useCurrency";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { Colors } from "../../../Utilities/uiasset";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { styles } from "../styles";
 
type Props = NativeStackScreenProps<Stacknavigationtypes, 'Currency'>;
 
const Currency: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);
    const { currency, setCurrency } = useCurrency();
 
    const RadioOption = ({ label, value }: { label: string; value: string }) => {
        const selected = currency === value;
        return (
            <Pressable
                onPress={() => setCurrency(value)}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: 'space-between',
                    width: "100%",
                    marginBottom: 16,
                }}
            >
                <Text style={{ color: theme.primarytext, fontSize: 15 }}>{label}</Text>
 
                <View
                    style={{
                        height: 20,
                        width: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: Colors.brand,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {selected && (
                        <View
                            style={{
                                height: 10,
                                width: 10,
                                 borderRadius: 5,
                                 backgroundColor: Colors.brand,
                            }}
                        />
                    )}
                </View>
            </Pressable>
        );
    };
 
    return (
        <Mainview
            isheader={true}
            headertitle={"Currency"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <RadioOption label="INR" value="INR" />
                <RadioOption label={formatDisplayPair("USDT")} value="USDT" />
            </View>
        </Mainview>
    )
 
}
 
export default Currency;
 