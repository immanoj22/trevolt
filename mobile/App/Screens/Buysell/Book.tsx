import React from "react";
import { Pressable, View, Text } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import Bookcomponent from "../Future/book";
import Sheet from "../../Components/bottomsheet";
import { Fontfamily } from "../../Utilities/uiasset";
import VectorIcons from "../../Utilities/vectoricons";
import useCustomHooks from "../../Actions/Hooks/customhook";
import { RFvalue, windowheight } from "../../Utilities/dimensions";

interface ConfirmProps {
    ref?: any;
    currentIndex?: any;
    type?: any
}

const OrderBook: React.FC<ConfirmProps> = ({
    ref,
    currentIndex,
}) => {
    const { theme } = useCustomHooks();

    return (
        <Sheet
            sheetref={ref}
            snappoint={["100%"]}
            custominterface={true}
        >
            <View style={{ height: windowheight * 0.1, justifyContent: "center", flexDirection: "row", alignItems: "center" }} >
                <Pressable style={{ width: "15%", height: "100%", position: "absolute", left: 0, justifyContent: "center", alignItems: "center" }} >
                    <VectorIcons
                        family="Ionicons"
                        name="chevron-back"
                    />
                </Pressable>
                <Text style={[{ color: theme.primarytext, fontFamily: Fontfamily.medium, fontSize: RFvalue(16), width: "70%", textAlign: "center" }]} >Order Book</Text>
                <Pressable style={{ width: "15%", height: "100%", position: "absolute", right: 5, justifyContent: "center", alignItems: "center" }} >
                </Pressable>
            </View>
            <View>
                <View>
                    <Text>aljsdfh</Text>
                </View>
            </View>
            <BottomSheetScrollView>
                <View style={{ paddingHorizontal: "6%", marginTop: "5%", flex: 1 }}>
                    <Bookcomponent currentIndex={currentIndex} themes={theme} />
                </View>
            </BottomSheetScrollView>
        </Sheet>
    );
};

export default OrderBook;
