import React from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";

import useCustomHooks from "../Actions/Hooks/customhook";

interface CardProps {
    children?: React.ReactNode;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: number;
    containerStyle?: StyleProp<ViewStyle>;
}

const Card: React.FC<CardProps> = ({
    children,
    backgroundColor,
    borderColor,
    containerStyle,
}) => {

    const { theme } = useCustomHooks();
    const style = styles(theme, backgroundColor, borderColor)

    return (
        <View style={[theme.theme === "dark" ? style.card : style.cardLight, containerStyle]}>
            {children}
        </View>
    );
};

const styles = (theme: any, backgroundColor: any, borderColor: any) => StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: backgroundColor || theme.card,
        borderWidth: 1,
        borderColor: borderColor || "#1F2D4A",
        borderRadius: 18,
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 4,
    },
    cardLight: {
        backgroundColor: backgroundColor || theme.card,
        borderWidth: 1,
        borderColor: borderColor || "#E6ECF5",
        borderRadius: 18,
        shadowColor: "#0B1F3A",
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
    }
});

export default Card;
