import React, { useContext } from "react";
import { Pressable, View } from "react-native";

import Text from "./text";
import VectorIcons from "../Utilities/vectoricons";
import ThemeContext from "../Utilities/themecontext";
import { windowwidth } from "../Utilities/dimensions";
import { Colors } from "../Utilities/uiasset";

const PASSWORD_RULES = [
    "At least 8 characters long.",
    "Mix of uppercase and lowercase letters, and at least one number.",
    "At least one special character (e.g. @, #, $, !).",
];

interface Props {
    label: string;
    themes?: any;
    // Controlled from the parent (rather than each label owning its own
    // open/closed state) so two hints stacked close together - e.g. Create
    // Password directly above Confirm Password - can never both be open at
    // once. With independent local state, opening the lower one's tooltip
    // visually covered the upper one's (same tooltip width, overlapping
    // vertical space, later sibling painting on top) - it read as the first
    // popup "closing" on its own even though it was still technically open
    // underneath. Only one active hint at a time removes that overlap
    // entirely instead of just reshuffling which one wins the z-order.
    visible: boolean;
    onToggle: () => void;
    onClose: () => void;
}

const PasswordHintLabel: React.FC<Props> = ({ label, themes, visible, onToggle, onClose }) => {
    const theme = themes ?? useContext(ThemeContext);

    return (
        <View style={{ marginBottom: "3%", zIndex: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: theme.secondarytext }}>{label}</Text>
                <View style={{ position: "relative", marginLeft: 6 }}>
                    <Pressable hitSlop={10} onPress={onToggle}>
                        <VectorIcons
                            family="Ionicons"
                            name="information-circle-outline"
                            iconcolor={theme.homegreen}
                            size={windowwidth * 0.045}
                        />
                    </Pressable>
                    {visible && (
                        <>
                            <Pressable
                                onPress={onClose}
                                style={{ position: "absolute", top: -1000, left: -1000, right: -1000, bottom: -1000 }}
                            />
                            <View
                                style={{
                                    position: "absolute",
                                    bottom: "130%",
                                    right: 0,
                                    width: windowwidth * 0.58,
                                    padding: 10,
                                    borderTopLeftRadius: 10,
                                    borderTopRightRadius: 10,
                                    borderBottomLeftRadius: 10,
                                    borderBottomRightRadius: 0,
                                    borderWidth: 1,
                                    backgroundColor: theme.theme == "dark" ? "#1B2740" : "#FFFFFF",
                                    borderColor: theme.theme == "dark" ? "#2A2D2F" : "#E2E8F0",
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 6,
                                    elevation: 6,
                                }}
                            >
                                <View
                                    style={{
                                        position: "absolute",
                                        bottom: -6,
                                        right: 1,
                                        width: 10,
                                        height: 10,
                                        transform: [{ rotate: "45deg" }],
                                        backgroundColor: theme.theme == "dark" ? "#1B2740" : "#FFFFFF",
                                        borderBottomWidth: 1,
                                        borderRightWidth: 1,
                                        borderColor: theme.theme == "dark" ? "#2A2D2F" : "#E2E8F0",
                                    }}
                                />
                                {PASSWORD_RULES.map((point, index) => (
                                    <View key={index} style={{ flexDirection: "row", marginTop: index === 0 ? 0 : 4 }}>
                                        <Text size="semismall" color={Colors.brand} style={{ marginRight: 6 }}>{"•"}</Text>
                                        <Text size="semismall" color={theme.secondarytext} style={{ flex: 1 }}>{point}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            </View>
        </View>
    );
};

export default PasswordHintLabel;
