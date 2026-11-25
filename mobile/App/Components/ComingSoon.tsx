import React from "react";
import { View } from "react-native";

import Text from "./text";
import { Button } from "./Field";
import { Colors } from "../Utilities/uiasset";
import VectorIcons from "../Utilities/vectoricons";
import { windowwidth } from "../Utilities/dimensions";
import useCustomHooks from "../Actions/Hooks/customhook";

interface ComingSoonProps {
    title?: string;
    message?: string;
    onGoBack?: () => void;
}

// Full-page "Coming Soon" placeholder - drop-in replacement for a screen's normal
// content while a feature (Options trading, Affiliate, Portfolio margin mode) is
// disabled for this release. Matches web's ComingSoon component (components/ComingSoon
// /ComingSoon.jsx): same purpose, adapted to this app's own screen/theme conventions.
const ComingSoon: React.FC<ComingSoonProps> = ({
    title = "Coming Soon",
    message = "This feature isn't available yet. Please check back later.",
    onGoBack,
}) => {
    const { theme, navigation } = useCustomHooks();

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: "8%" }}>
            <View
                style={{
                    width: windowwidth * 0.22,
                    height: windowwidth * 0.22,
                    borderRadius: windowwidth * 0.11,
                    backgroundColor: theme.theme === "dark" ? "#101A2C" : "#E8EFFC",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "6%",
                }}
            >
                <VectorIcons
                    family="Feather"
                    name="clock"
                    iconcolor={Colors.brand}
                    size={windowwidth * 0.10}
                />
            </View>
            <Text family="semiBold" size="large" style={{ textAlign: "center" }}>{title}</Text>
            <Text
                color={theme.secondarytext}
                style={{ marginTop: "3%", lineHeight: 20, textAlign: "center" }}
            >
                {message}
            </Text>
            {
                onGoBack && (
                    <Button
                        title="Go Back"
                        onPress={onGoBack}
                        buttonStyle={{ marginTop: "8%", width: windowwidth * 0.5 }}
                    />
                )
            }
        </View>
    );
};

export default ComingSoon;
