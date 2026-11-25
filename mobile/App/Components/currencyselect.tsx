import React from "react";
import { StyleProp, View, ViewProps } from "react-native";

import Text from "./text";
import Images from "../Utilities/images";
import Flexcomponent from "./flexcomponent";
import VectorIcons from "../Utilities/vectoricons";
import useCustomHooks from "../Actions/Hooks/customhook";
import { borderradius, RFvalue, windowheight, windowwidth } from "../Utilities/dimensions";

interface Currencyselectprops {
    style?: StyleProp<ViewProps>,
    onselect?: () => void,
    currency: string,
    descrption: string,
    currencyicon?: any,
    width?: any,
    // Optional so every existing call site keeps its current size by default -
    // only future.tsx's Futures screen (tight on vertical room, especially on a
    // short device like an iPhone mini) passes a smaller value.
    height?: any
}

const Currencyselect: React.FC<Currencyselectprops> = ({
    style,
    onselect,
    currency,
    descrption,
    currencyicon,
    width = "53%",
    height = windowheight * 0.075
}) => {
    const { theme } = useCustomHooks()
    return (
        <Flexcomponent ispress={true} onPress={onselect} style={[{ borderRadius: borderradius * 0.5, backgroundColor: theme.theme == 'dark' ? "#151a1759" : "#FFFFFF", borderWidth: 0.8, borderColor: "#1B2740" }, style]} height={height} width={width} paddingHorizontal={"3%"} >
            {
                currencyicon && (
                    <View style={{ width: "25%", height: "100%", alignItems: "center", justifyContent: "center" }} >
                        <Images
                            type="image"
                            source={currencyicon}
                            resizeMode="contain"
                            width={"65%"}
                            height={"65%"}
                        />
                    </View>
                )
            }
            <View style={{ width: currencyicon ? "60%" : "85%", height: "100%", paddingHorizontal: "5%", justifyContent: "center" }} >
                <Text numoflines={1} family="medium" color={theme.futuretext} >{currency}</Text>
                <Text family="medium" fontSize={RFvalue(11)} color={theme.secondarytext} >{descrption}</Text>
            </View>
            <View style={{ width: "20%", height: "100%", alignItems: "center", justifyContent: "center" }} >
                <VectorIcons
                    family="Ionicons"
                    name={"chevron-down"}
                    iconcolor={theme.futuretext}
                    size={windowwidth * 0.05}
                />
            </View>
        </Flexcomponent>
    )
}

export default Currencyselect