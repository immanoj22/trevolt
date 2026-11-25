import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";;
import { Pressable, ScrollView, View } from "react-native";

import Fills from "./Fills";
import Orders from "./Order";
import History from "./history";
import Logfilter from "./filter";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Recenttransaction from "./recenttransaction";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'TransactionLogs'>;

const TransactionLogs: React.FC<Props> = () => {

    const { theme, navigation, bottomsheetref: fil1, openbottomsheet } = useCustomHooks();

    const [activeTab, setActiveTab] = useState("recenttransaction");

    return (
        <Mainview
            onleftfn={() => navigation.goBack()}
            headertitle="Transaction Logs"
            isheader={true}
            righticon={
                <VectorIcons
                    family="AntDesign"
                    name={"filter"}
                    size={windowwidth * 0.05}
                />
            }
            onrightfn={() => {
                openbottomsheet(fil1)
            }}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={{ height: windowheight * 0.9, width: "100%", justifyContent: "flex-start", backgroundColor: "transparent" }}>
                <Flexcomponent justifyContent={"flex-start"} alignItems="center" >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ paddingRight: 100 }}
                    >
                        <Pressable onPress={() => setActiveTab("recenttransaction")}>
                            <Card borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ justifyContent: "center", alignItems: "center", padding: 10, backgroundColor: activeTab === "recenttransaction" ? Colors.brand : theme.theme == 'dark' ? "#131D31" : "#FFFFFF" }}>
                                <Text
                                    family="regular"
                                    size="small"
                                    color={activeTab === "recenttransaction" ? "#fff" : theme.theme == 'dark' ? "#fff" : "#000"}
                                >  Recent Transactions  </Text>
                            </Card>
                        </Pressable>

                        <Pressable onPress={() => setActiveTab("history")} style={{ marginLeft: 12 }}>
                            <Card borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ justifyContent: "center", alignItems: "center", padding: 10, backgroundColor: activeTab === "history" ? Colors.brand : theme.theme == 'dark' ? "#131D31" : "#FFFFFF" }}>
                                <Text
                                    family="regular"
                                    size="small"
                                    color={activeTab === "history" ? "#fff" : theme.theme == 'dark' ? "#fff" : "#000"}>  History  </Text>
                            </Card>
                        </Pressable>

                        <Pressable style={{ marginLeft: 12 }} onPress={() => setActiveTab("orderhistory")}>
                            <Card borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ justifyContent: "center", alignItems: "center", padding: 10, backgroundColor: activeTab === "orderhistory" ? Colors.brand : theme.theme == 'dark' ? "#131D31" : "#FFFFFF" }}>
                                <Text
                                    family="regular"
                                    size="small"
                                    color={activeTab === "orderhistory" ? "#fff" : theme.theme == 'dark' ? "#fff" : "#000"}
                                >  Orders History  </Text>
                            </Card>
                        </Pressable>

                        <Pressable style={{ marginLeft: 12 }} onPress={() => setActiveTab("fills")}>
                            <Card borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={{ justifyContent: "center", alignItems: "center", padding: 10, backgroundColor: activeTab === "fills" ? Colors.brand : theme.theme == 'dark' ? "#131D31" : "#FFFFFF" }}>
                                <Text
                                    family="regular"
                                    size="small"
                                    color={activeTab === "fills" ? "#fff" : theme.theme == 'dark' ? "#fff" : "#000"}
                                >  Fills  </Text>
                            </Card>
                        </Pressable>
                    </ScrollView>
                </Flexcomponent>
                {
                    activeTab === "history" && (
                        <History />
                    )
                }
                {
                    activeTab === "recenttransaction" && (
                        <Recenttransaction />
                    )
                }
                {
                    activeTab === "orderhistory" && (
                        <Orders />
                    )
                }
                {
                    activeTab === "fills" && (
                        <Fills />
                    )
                }
            </View>
            <Logfilter
                sheetref={fil1}
                snappoint={["40%"]}
                assetHistory={activeTab}
            />
        </Mainview>
    )

}

export default TransactionLogs;