import React, { useContext, useRef } from "react";
import { Pressable, TextStyle, ActivityIndicator, PressableProps, View } from "react-native";
import { Vibration } from "react-native";
import Sound from "react-native-sound";

import Text from "../../text";
import { LinearGradient } from "../../lineargradient";
import { Colors } from "../../../Utilities/uiasset";
import ThemeContext from "../../../Utilities/themecontext";

import { styles } from "../styles";

Sound.setCategory("Playback");

export const soundMap: Record<string, any> = {
    orderPlaced: "orderplaced.mp3",
};

export const playSound = (soundFile: any) => {
    const s = new Sound(soundFile, Sound.MAIN_BUNDLE, (error) => {
        if (error) {
            console.log("Sound load error:", error);
            return;
        }
        s.play(() => s.release());
    });
};

interface ButtonProps extends PressableProps {
    title: string;
    loading?: boolean;
    buttonStyle?: any;
    textStyle?: TextStyle;
    rightContent?: React.ReactNode,
    leftContent?: React.ReactNode,
    themes?: any
    vibration?: Boolean,
    onPress?: any,
    sound?:
    | "none"
    | "orderPlaced"
}

const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    buttonStyle,
    textStyle,
    rightContent,
    leftContent,
    themes,
    sound = "none",
    vibration = false,
    ...restProps
}) => {

    const theme = themes ?? useContext(ThemeContext)
    const style = styles(theme);

    // Guards against double-tap/double-submit even when a fast second tap fires
    // before the `disabled`/`loading` prop re-render lands (RN can batch two
    // touch events within the same frame).
    const isProcessingRef = useRef(false);

    const handlePress = async () => {
        if (isProcessingRef.current || disabled || loading) return;
        isProcessingRef.current = true;
        try {
            if (sound !== "none" && soundMap[sound]) {
                playSound(soundMap[sound]);
            }
            if (vibration) Vibration.vibrate(50);
            await onPress?.();
        } finally {
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 500);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled || loading}
            style={[
                style.button,
                !disabled && { shadowColor: "#2563EB", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6, overflow: "hidden" },
                disabled && style.disabledButton,
                buttonStyle,
            ]}
            {...restProps}
        >
            {!disabled && (
                <LinearGradient
                    colors={["#4F8DF7", "#2563EB", "#1D4ED8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                    pointerEvents="none"
                />
            )}
            {
                loading ? (
                    <ActivityIndicator color={Colors.white} />
                ) : (
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        {
                            leftContent && (
                                leftContent
                            )
                        }
                        <Text family="medium" size={"semimedium"} style={[{ color: Colors.white }, textStyle]}>{title}</Text>
                        {
                            rightContent && (
                                rightContent
                            )
                        }
                    </View>
                )
            }
        </Pressable>
    );
};

export default Button;