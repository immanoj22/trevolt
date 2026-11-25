import React, { useContext, useEffect, useState } from "react";
import { TextInput, TextInputProps, View } from "react-native";

import FormGroup from "../FormGroup";
import { FieldInputProps } from "../inputType";
import ThemeContext from "../../../Utilities/themecontext";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { cleanInput } from "../../../Utilities/helerfunction";
import { Colors, Fontfamily, Fontsize } from "../../../Utilities/uiasset";
import Text from "../../text";

const Input: React.FC<FieldInputProps> = (props) => {
    const {
        value,
        label,
        disabled,
        placeHolder,
        placeholder,
        placeholderTextColor,
        onChange,
        secureTextEntry,
        rightContent,
        labelStyle,
        keyboardType,
        style,
        background,
        containerprops,
        themes,
        bottom,
        leftContent,
        errorMessage,
        isValid = false,
        inputprops,
        allowed = "default",
        errorTextStyle,
        errorTextContainerStyle

    } = props;

    const theme = themes ?? useContext(ThemeContext)
    const resolvedPlaceholder = placeholder ?? placeHolder;

    // App-wide default look for every <Input> - callers can still override via
    // `background` / `containerprops`.
    const resolvedBackground = background ?? (theme.theme === "dark" ? "#101A2C" : "#E8EFFC");
    const resolvedContainerProps = [
        { borderRadius: 15, borderWidth: 1, borderColor: theme.theme === "dark" ? "#1B2740" : "#E2E8F0" },
        containerprops,
    ];


    const [values, setValues] = useState<any>(cleanInput(value));

    const filterText = (text: string) => {
        // ?? only guards null/undefined - a caller passing a non-string value (e.g. a
        // number) still reached text.replace() below with no such method, crashing the
        // whole screen ("text.replace is not a function").
        text = text === null || text === undefined ? "" : String(text);
        switch (allowed) {
            case "text":
                return text.replace(/[^A-Za-z' -]/g, "");

            case "numbers":
                return text.replace(/[^0-9]/g, "");

            case "number": {
                // Strip anything that isn't a digit, leading '+', or decimal point,
                // one keystroke at a time — a whole-string regex reject (the old
                // approach) leaves the invalid character visible on screen until
                // some unrelated re-render happens to correct it.
                let cleaned = text.replace(/[^0-9.+]/g, "");
                cleaned = cleaned.charAt(0) === "+"
                    ? "+" + cleaned.slice(1).replace(/\+/g, "")
                    : cleaned.replace(/\+/g, "");
                const dotIndex = cleaned.indexOf(".");
                if (dotIndex !== -1) {
                    cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, "");
                }
                return cleaned;
            }

            case "special":
                return text.replace(/[A-Za-z0-9]/g, "");

            case "url":
                return text.replace(/[^A-Za-z0-9/:.?&=_-]/g, "");

            default:
                return cleanInput(text);
        }
    };

    const handleOnChange = (text: any) => {
        const newValue = filterText(text);
        setValues(newValue);
        onChange?.(newValue);
    };

    useEffect(() => {
        const filtered = filterText(value);
        setValues((prev: any) => (prev === filtered ? prev : filtered));
    }, [value]);

    return (
        <>
            <FormGroup
                label={label}
                disabled={disabled}
                labelStyle={labelStyle}
                rightContent={rightContent}
                leftContent={leftContent}
                background={resolvedBackground}
                containerprops={resolvedContainerProps}
                themes={themes}
                bottom={bottom}
            >
                {
                    leftContent && (
                        <View style={{ alignItems: "flex-start", justifyContent: "flex-end", position: "absolute", left: "7%" }}>
                            {leftContent}
                        </View>
                    )
                }
                <TextInput
                    value={values}
                    editable={!disabled}
                    placeholder={resolvedPlaceholder}
                    onChangeText={handleOnChange}
                    secureTextEntry={secureTextEntry}
                    underlineColorAndroid="transparent"
                    placeholderTextColor={placeholderTextColor || Colors.grey}
                    keyboardType={keyboardType as TextInputProps["keyboardType"]}
                    style={[{ fontSize: Fontsize.semimedium, color: theme.textinput, height: windowheight * 0.06, fontFamily: Fontfamily.regular }, style]}
                    {...inputprops}
                />
            </FormGroup>
            {(!isValid && errorMessage) && (
                <View style={[{ marginTop: 5, marginHorizontal: windowwidth * 0.02 }, errorTextContainerStyle]}>
                    <Text style={[{ fontFamily: Fontfamily.regular, fontSize: Fontsize.medium, color: Colors.red }, errorTextStyle]} >
                        {errorMessage}
                    </Text>
                </View>
            )}
        </>
    );
};

export default Input;