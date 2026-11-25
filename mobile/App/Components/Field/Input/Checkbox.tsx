import React, { useState, useEffect, useContext } from "react";
import { View, Pressable, Text } from "react-native";

import { FieldInputProps } from "../inputType";
import VectorIcons from "../../../Utilities/vectoricons";
import ThemeContext from "../../../Utilities/themecontext";
import { windowwidth } from "../../../Utilities/dimensions";
import { Colors, Fontfamily, Fontsize } from "../../../Utilities/uiasset";

import { styles } from "../styles";

const Checkbox: React.FC<FieldInputProps> = ({
    onChange,
    label = "",
    disabled = false,
    initial = false,
    activecheckboxcolor,
    activecheckbox,
    checkboxstyle,
    boxstyle,
    labelStyle,
    themes,
    custom
}) => {
    const theme = themes ?? useContext(ThemeContext)

    const style = styles(theme);
    const [checked, setChecked] = useState<boolean>(initial);

    useEffect(() => {
        setChecked(initial);
    }, [initial]);

    const toggleValue = () => {
        if (!disabled) {
            const newValue = !checked;
            setChecked(newValue);
            onChange?.(newValue);
        }
    };

    return (
        <Pressable onPress={toggleValue}>
            <View style={[{ flexDirection: "row", alignItems: "center", }, disabled && { opacity: 0.4 }, checkboxstyle]}>
                {
                    !custom && (
                        <View style={[style.check, boxstyle, checked && { backgroundColor: activecheckbox }]}>
                            {
                                checked && (
                                    <VectorIcons
                                        family="Octicons"
                                        name="check"
                                        iconcolor={activecheckboxcolor ?? (theme.theme === "dark" ? Colors.white : "#202020")}
                                        size={windowwidth * 0.04}
                                    />
                                )
                            }
                        </View>
                    )
                }
                {
                    !custom && label ? (
                        <Text style={[{ flexShrink: 1, color: disabled ? Colors.warmgrey : theme.theme === "dark" ? "#E1E1E2" : "#202020", fontFamily: Fontfamily.regular, fontSize: Fontsize.semimedium }, labelStyle]}>{label}</Text>
                    ) : null
                }
                {
                    custom && (
                        <Text style={[{ color: checked ? theme.theme === "dark" ? "#E1E1E2" : "#202020" : Colors.warmgrey, fontFamily: Fontfamily.regular, fontSize: Fontsize.semimedium }, labelStyle]}>{label}</Text>
                    )
                }
                {
                    custom && (
                        <View style={{ justifyContent: "flex-end", alignItems: "flex-end", flex: 1, marginVertical: 15 }}>
                            <VectorIcons
                                family="Feather"
                                name="check"
                                iconcolor={checked ? Colors.brand : Colors.warmgrey}
                                size={18}
                            />
                        </View>
                    )
                }
            </View>
        </Pressable>
    );
};

export default Checkbox;