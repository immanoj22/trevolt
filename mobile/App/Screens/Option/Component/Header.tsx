import React, { memo } from "react";
import { View } from "react-native";

import Text from "../../../Components/text";
import useCustomHooks from "../../../Actions/Hooks/customhook";

import { styles } from "./styles";

interface HeaderProps {
    style?: any
}

// Column order mirrors web-frontend's utils/tableDatas.js TableHead exactly (Strike/Type
// prepended since mobile shows one Calls-or-Puts list at a time instead of web's
// side-by-side mirrored tables, so it needs an explicit per-row anchor/identity).
const Header: React.FC<HeaderProps> = memo(() => {
    const { theme } = useCustomHooks();
    const style = styles(theme);

    return (
        <View style={style.headerRow}>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Strike</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Type</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Last</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>OI</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>High</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Volume</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>OI Chg.</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Delta</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Theta</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>24h Chg.</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Gamma</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>POS</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Vega</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Low</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Open</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Ask Qty</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Ask</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Mark</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Bid</Text>
            </View>
            <View style={style.headerCell}>
                <Text style={style.headerText}>Bid Qty</Text>
            </View>
        </View>
    );
});

export default Header;
