import React from "react";
import { Pressable, View } from "react-native";

import Text from "../../../../Components/text";

interface TabHeaderprops {
    theme?: any
    tabs?: any
    style?: any,
    activeindex?: any,
    onchangeindex?: any
    // Values (e.g. "portfolio") not available yet - skipped entirely rather than shown
    // disabled, so re-enabling later is just removing an entry from this list. Can't
    // just drop the label from `tabs` itself since getValue() below maps by position
    // (0=isolated, 1=portfolio, 2=cross) against the full, original tabs array.
    hiddenValues?: string[]
}

const TabHeader: React.FC<TabHeaderprops> = ({
    theme,
    tabs = [],
    style,
    activeindex,
    onchangeindex,
    hiddenValues = []
}) => {
    const getValue = (index: number) => {
        if (index === 0) return "isolated";
        if (index === 1) return "portfolio";
        return "cross";
    }
    return (
        <View style={[style.between, { marginBottom: "4%", justifyContent: "center", gap: 20 }]}>
            {
                tabs?.map((e: any, i: any) => {
                    const value = getValue(i);
                    if (hiddenValues.includes(value)) return null;
                    return (
                        <Pressable key={value ?? i} onPress={() => onchangeindex(value)} style={[activeindex == value ? style.marginActive : style.margin]}>
                            <Text size="small" style={{ color: theme.darktext }}>{e}</Text>
                        </Pressable>
                    )
                })
            }
        </View>
    )

}

export default TabHeader;