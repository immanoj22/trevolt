import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import Text from "../../Components/text";
import { Colors } from "../../Utilities/uiasset";
import { RFvalue } from "../../Utilities/dimensions";
import useCustomHooks from "../../Actions/Hooks/customhook";

import styles from "./styles";
import LinearGradient from "../../Components/lineargradient";

interface StatCardProps {
    label?: React.ReactNode;
    value?: any;
    backgroundColor?: string;
    containerStyle?: StyleProp<ViewStyle>;
    icon?: any,
    onClick?: any
    subTitle?: any
}

const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    backgroundColor = "#4A6FCD",
    containerStyle,
    icon,
    subTitle
}) => {

    const { theme } = useCustomHooks();
    const style = styles(theme);
    return (
        // <View style={[style.card, { backgroundColor: backgroundColor }, containerStyle]}>
        //     <Text size="medium" style={{ color: Colors.white }}>{value}{subTitle && <Text style={{ fontSize: RFvalue(10), color: Colors.white }}> {subTitle}</Text>}</Text>
        //     <Text size="small" style={{ color: Colors.white }}>{label}</Text>
        //     {
        //         icon && (
        //             icon
        //         )
        //     }
        // </View>
        <LinearGradient
            colors={
                theme.theme === "dark"
                    ? ["rgba(15, 47, 94, 0.5)", "rgba(0, 0, 0, 0.5)"]
                    : ["#d9d9d985", "#d9d9d97e"]
            }
            locations={[0.1092, 0.964]}
            start={{ x: 0.0504, y: 0.2812 }}
            end={{ x: 0.9496, y: 0.7188 }}
            style={[style.card, containerStyle]}
        >
            <Text size="medium" style={{ color: theme.primarytext }}>
                {value}

                {subTitle && (
                    <Text
                        style={{
                            fontSize: RFvalue(10),
                            color: theme.primarytext,
                        }}
                    >
                        {" "}
                        {subTitle}
                    </Text>
                )}
            </Text>

            <Text size="small" style={{ color: theme.primarytext }}>
                {label}
            </Text>

            {icon && icon}
        </LinearGradient>
    )
}

export default StatCard;