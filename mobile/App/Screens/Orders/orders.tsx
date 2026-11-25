import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Text from "../../Components/text";
import Mainview from "../../Components/mainview";
import VectorIcons from "../../Utilities/vectoricons";
import Logfilter from "../Profile/TransactionLogs/filter";
import Flexcomponent from "../../Components/flexcomponent";
import useCustomHooks from "../../Actions/Hooks/customhook";
import Order from "../../Screens/Profile/TransactionLogs/Order";
import { BottomTabParamList } from "../../Navigations/navigationtypes";
import { windowheight, windowwidth } from "../../Utilities/dimensions";

type Props = NativeStackScreenProps<BottomTabParamList, 'Orders'>;

const Orders: React.FC<Props> = () => {
    const { theme, navigation, bottomsheetref: fil1, openbottomsheet } = useCustomHooks();
    const initialstate = {
        startdate: "",
        enddate: "",
        transferType: "All",
        selectedType: "All",
        newchange: false
    }

    const [selected, setSelected] = useState<any>(initialstate)

    return (
        <Mainview
            isheader={false}
            isbottomtab={true}
            horizontalpadding={0}
            isscollable={false}
            gradientColors={theme.heroGradient}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={{ flex: 1, paddingHorizontal: 20 }}>
                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ height: windowheight * 0.065 }}>
                    <Text size="medium" family="medium">Orders</Text>
                </Flexcomponent>
                <Flexcomponent justifyContent="flex-start" alignItems="center" >
                </Flexcomponent>
                <Flexcomponent justifyContent="space-between" alignItems="center" style={{ width: "100%" }}>
                    <Pressable onPress={() => openbottomsheet(fil1)} style={{ flex: 0.3, backgroundColor: theme.infoCardBg, borderRadius: 8, padding: 10, flexDirection: "row", height: "auto", justifyContent: "center", width: "auto", }}>
                        <Text family="regular" size="small">Filter</Text>
                        <VectorIcons
                            family="Ionicons"
                            name={"chevron-down-outline"}
                            size={windowwidth * 0.05}
                            style={{ marginLeft: 5 }}
                        />
                    </Pressable>
                    <View style={{ flex: 0.6, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
                        <Pressable onPress={() => navigation.navigate("ExportData", { type: "orderhistory" })} style={{ backgroundColor: theme.infoCardBg, borderRadius: 8, padding: 10, flexDirection: "row", height: "auto", justifyContent: "flex-end", width: "auto", }}>
                            <Text family="regular" size="small">Order History</Text>
                            <VectorIcons
                                family="Feather"
                                name={"download"}
                                size={windowwidth * 0.045}
                                style={{ marginLeft: 5 }}
                            />
                        </Pressable>
                    </View>
                </Flexcomponent>
                <Order
                    enddate={selected?.enddate}
                    startdate={selected?.startdate}
                />
            </View>
            <Logfilter
                sheetref={fil1}
                snappoint={["40%"]}
            />
        </Mainview>
    )

}

export default Orders;