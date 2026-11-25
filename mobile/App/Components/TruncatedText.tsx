import React from "react";
import { Menu, MenuOptions, MenuTrigger } from "react-native-popup-menu";

import Text from "./text";
import useCustomHooks from "../Actions/Hooks/customhook";

interface Props {
    text?: any;
    // Characters to keep at the start / end. Truncates to `head…tail` only when that
    // is actually shorter than the full value.
    head?: number;
    tail?: number;
    family?: any;
    size?: any;
    align?: any;
    color?: string;
    style?: any;
}

// Long value in a cramped column -> show `head` chars + "..." + `tail` chars; tap it
// to pop a small tooltip above with the full text (react-native-popup-menu, same
// pattern as the inline tooltips in buysell.tsx). Short values render as a plain <Text>.
const TruncatedText: React.FC<Props> = ({
    text = "",
    head = 4,
    tail = 3,
    family = "medium",
    size = "semimedium",
    align = "flex-start",
    color,
    style,
}) => {
    const { theme } = useCustomHooks();
    const value = String(text ?? "");

    if (value.length <= head + tail + 3) {
        return (
            <Text numoflines={1} family={family} size={size} align={align} color={color} style={style}>
                {value}
            </Text>
        );
    }

    return (
        <Menu>
            <MenuTrigger>
                <Text family={family} size={size} align={align} color={color} style={style}>
                    {`${value.slice(0, head)}...${value.slice(-tail)}`}
                </Text>
            </MenuTrigger>
            <MenuOptions
                customStyles={{
                    optionsContainer: {
                        backgroundColor: theme.card,
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        marginTop: -44,
                    },
                }}
            >
                <Text size="small" family="medium" color={theme.primarytext}>
                    {value}
                </Text>
            </MenuOptions>
        </Menu>
    );
};

export default TruncatedText;
