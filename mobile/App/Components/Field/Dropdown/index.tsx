import React, { useContext } from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";
import { Dropdown } from "react-native-element-dropdown";

import Text from "../../text";
import VectorIcons from "../../../Utilities/vectoricons";
import ThemeContext from "../../../Utilities/themecontext";
import { windowheight } from "../../../Utilities/dimensions";
import { Fontsize, Fontfamily, Colors } from "../../../Utilities/uiasset";

import { styles } from "../styles";

// Must be a stable reference, not an inline literal in the data= prop below - the
// underlying library's Dropdown re-runs a useEffect keyed on [data] and calls
// setListData whenever that reference changes. An inline `[{...}]` literal is a new
// array every render, so on a screen that re-renders often (e.g. from live price
// ticks) this retriggered that effect on every single render, which was enough to
// trip React's "Maximum update depth exceeded" safety check.
const EMPTY_LIST_FALLBACK = [{ label: "No options", value: null }];

interface LayoutProps {
    label?: string,
    placeholder?: string;
    disabled?: boolean;
    list?: { label: string; value: string | number }[];
    value?: any;
    onChange?: (item: any) => void;
    dropdownColor?: string;
    position?: any,
    background?: any
    themes?: any,
    bottom?: any,
    conatinerstyle?: StyleProp<ViewStyle>,
    height?: any,
    labelField?: string,
    valueField?: string,
    inputStyle?: any,
    textStyle?: any,
    itemTextStyle?: any,
    modleSyle?: any
}

const Layout: React.FC<LayoutProps> = ({
    label = false,
    placeholder = "Select an option",
    list = [],
    value,
    onChange = () => { },
    disabled = false,
    position = "bottom",
    background,
    themes,
    bottom = "5%",
    conatinerstyle,
    height = windowheight * 0.06,
    labelField = "label",
    valueField = "value",
    inputStyle,
    textStyle,
    itemTextStyle,
    modleSyle
}) => {
    const theme = themes ?? useContext(ThemeContext)
    const style = styles(theme);
    // Shared defaults so every dropdown matches without repeating these at each call site.
    const fieldBg = background || (theme.theme === "dark" ? "#101A2C" : "#E8EFFC");
    const listBorderColor = theme.theme === "dark" ? "#1B2740" : "#E2E8F0";
    return (
        <View style={[{ marginBottom: bottom }, conatinerstyle]}>
            {
                label !== false && (
                    <View style={{ marginBottom: "3%" }}>
                        <Text style={{ color: theme.secondarytext }}>{label}</Text>
                    </View>
                )
            }
            <Dropdown
                style={[
                    theme.theme === "dark"
                        ? [
                            style.darkInput,
                            { backgroundColor: fieldBg }
                        ]
                        : [
                            style.lightInput,
                            { backgroundColor: fieldBg }
                        ],
                    , { height: height, borderRadius: 15, ...inputStyle }]}
                placeholderStyle={{
                    fontSize: Fontsize.semimedium, color: Colors.grey,
                    fontFamily: Fontfamily.regular,
                }}
                selectedTextStyle={[{
                    fontFamily: Fontfamily.regular,
                    fontSize: Fontsize.semimedium,
                    color: theme.darktext,
                    ...textStyle
                }]}
                renderItem={(item) => (
                    <View
                        style={{
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: Fontfamily.regular,
                                fontSize: Fontsize.small,
                                color: theme.darktext,
                                ...itemTextStyle,
                            }}
                        >
                            {item[labelField]}
                        </Text>
                    </View>
                )}
                containerStyle={[{
                    backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
                    marginTop: position === "top" ? 0 : Platform.OS === "ios" ? 2 : -25,
                    paddingVertical: 0,
                    marginBottom: 50,
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: listBorderColor,
                    ...modleSyle
                }]}
                activeColor={theme.theme === "dark" ? "#25272763" : "#dddddd"}
                data={list.length > 0 ? list : EMPTY_LIST_FALLBACK}
                search={false}
                maxHeight={windowheight * 0.4}
                labelField={labelField}
                valueField={valueField}
                placeholder={placeholder}
                value={list.length > 0 ? value : null}
                onChange={onChange}
                selectedTextProps={{ numberOfLines: 1 }}
                disable={disabled}
                dropdownPosition={position}
                flatListProps={{
                    contentContainerStyle: {
                        paddingTop: 0,
                        paddingBottom: 0,
                    },
                }}
                renderRightIcon={() => (
                    <VectorIcons
                        family={'Ionicons'}
                        name={'chevron-down-outline'}
                        iconcolor={theme.darktext}
                        size={15}
                    />
                )}
            />
        </View>

    );
};

export default Layout;