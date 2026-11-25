import React from "react";
import { Pressable } from "react-native";

import Text from "../../../Components/text";
import VectorIcons from "../../../Utilities/vectoricons";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import { formatDisplayPair } from "../../../Utilities/formatPair";

interface Headprops {
    pairname?: string
    ref?: any
    share?: any
    onClick?: any
    rightContent?: any
}

const Head: React.FC<Headprops> = ({
    pairname,
    share,
    onClick,
    rightContent
}) => {
    return (
        <Flexcomponent alignItems="center" justifyContent="space-between" paddingHorizontal={10}>
            <Flexcomponent width={"auto"}>
                <Text family="medium" size="semimedium">{formatDisplayPair(pairname)}</Text>
            </Flexcomponent>
            {
                share === true && (
                    <Pressable onPress={onClick} hitSlop={10}>
                        <VectorIcons
                            family="Fontisto"
                            name={"share-a"}
                            size={windowwidth * 0.04}
                            style={{ marginLeft: 10 }}

                        />
                    </Pressable>
                )
            }
            {
                rightContent && (
                     rightContent
                )
            }
        </Flexcomponent>
    )
}

export default Head;