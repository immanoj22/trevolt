import React, { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import Orders from "../TransactionLogs/Order";
import Logfilter from "../TransactionLogs/filter";
import Mainview from "../../../Components/mainview";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { useLazyFuturepnlOverviewQuery } from "../../../Slices/future";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'PnlAnalyticsOverview'>;

const PnlAnalyticsOverview: React.FC<Props> = () => {
    const { theme, navigation, closebottomsheet, bottomsheetref, convertSec, convert, bottomsheetref: fil1, openbottomsheet } = useCustomHooks();
    const style = styles(theme);

    const initialstate = {
        startdate: "",
        enddate: "",
        transferType: "All",
        selectedType: "All",
        newchange: false
    }
    const [cardDetails, setCardDetails] = useState<any>({});
    const [selected, setSelected] = useState<any>(initialstate)
    const [pnlOverview] = useLazyFuturepnlOverviewQuery();

    // Negative values render grey, zero/positive render green.
    const valueColor = (val: any) => (Number(val) < 0 ? Colors.grey : Colors.green);

    const fetchPNLOverview = async () => {
        let response = await pnlOverview(1).unwrap();
        setCardDetails(response.result)
    }

    useFocusEffect(
        useCallback(() => {
            fetchPNLOverview()
        }, [])
    );

    return (
        <Mainview
            iskeyboardaware={false}
            onleftfn={() => navigation.goBack()}
            headertitle="PNL Overview"
            isheader={true}
            isscollable={false}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={{ flex: 1 }}>

                <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={style.pnl}>
                    <View>
                        <Text size="medium">Realised PNL</Text>
                        <Flexcomponent justifyContent="flex-start">
                            <Text size="medium" color={valueColor(cardDetails?.pnl)}>{convert(cardDetails?.pnl)}</Text>
                            <Text size="xsmall" color={valueColor(cardDetails?.pnl)}>  {convertSec(cardDetails?.pnl)}</Text>
                        </Flexcomponent>
                    </View>
                    <View>
                        <Text size="medium">Charges & Taxes</Text>
                        <Flexcomponent justifyContent="flex-start" >
                            <Text size="medium" color={valueColor(cardDetails?.fee)}>{convert(cardDetails?.fee)}</Text>
                            <Text size="xsmall" color={valueColor(cardDetails?.fee)}>  {convertSec(cardDetails?.fee)}</Text>
                        </Flexcomponent>
                    </View>
                </Card>
                <Flexcomponent style={{ marginTop: "5%", justifyContent: "space-between", alignItems: "center" }}>
                    <Text size="medium" family="semiBold">PNL Records</Text>
                    <Pressable onPress={() => openbottomsheet(fil1)}>
                        <VectorIcons
                            family="AntDesign"
                            name={"filter"}
                            size={windowwidth * 0.04}
                        />
                    </Pressable>
                </Flexcomponent>
                <View style={{ flex: 1, marginTop: "3%" }}>
                    <Orders
                        enddate={selected?.enddate}
                        startdate={selected?.startdate}
                    />
                </View>
                <Logfilter
                    sheetref={fil1}
                    snappoint={["40%"]}
                    assetHistory={"orderhistory"}
                />
            </View>
        </Mainview>
    )

}
export default PnlAnalyticsOverview;