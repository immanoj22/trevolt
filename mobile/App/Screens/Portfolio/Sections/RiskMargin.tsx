import React from "react";
import { View } from "react-native";
import { FlatList } from "react-native";
import { useSelector } from "react-redux";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Images from "../../../Utilities/images";
import NoData from "../../../Components/Nodata";
import { futureSelector } from "../../../Slices/future";
import { walletSelector } from "../../../Slices/wallet";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { getTokenImage, isEmpty } from "../../../Utilities/helerfunction";

import { styles } from "../styles";

interface StopHistorysprops {
    tradeMode?: any;
    futureId?: any;
    ref?: any;
    tab?: any;
    active?: any
}

const RiskMargin: React.FC<StopHistorysprops> = ({ }) => {
    const { theme, convert, convertSec } = useCustomHooks();
    const style = styles(theme);
    const { wallet } = useSelector(walletSelector)
    const { riskAndMarginDetails } = useSelector(futureSelector);
    return (
        <View style={[style.padding, { marginTop: "3%" }]}>
            <FlatList
                data={!isEmpty(riskAndMarginDetails)
                    ? Object.keys(riskAndMarginDetails).map(key => ({
                        underlying: key,
                        value: riskAndMarginDetails[key]
                    }))
                    : []
                }
                keyExtractor={(item) => item.underlying}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
                alwaysBounceVertical={false}
                ListEmptyComponent={<NoData />}
                ListHeaderComponent={
                    <View style={{ backgroundColor: theme.background, paddingBottom: "3%" }}>
                        <Flexcomponent justifyContent="space-between" style={{ flexWrap: "wrap" }}>
                            <View>
                                <Text color={theme.secondarytext}>Blocked as margin</Text>
                                <Text>{convert(wallet.freezeBalance)}</Text>
                                <Text size="xsmall">{convertSec(wallet.freezeBalance)}</Text>
                            </View>
                            <View>
                                <Text color={theme.secondarytext}>Initial Margin</Text>
                                <Text>{convert(wallet.totalMargin)}</Text>
                                <Text size="xsmall">{convertSec(wallet.totalMargin)}</Text>
                            </View>
                        </Flexcomponent>
                        <View style={{ marginTop: '3%' }}>
                            <Text color={theme.secondarytext}>Maintenance Margin</Text>
                            <Text>{convert(wallet.totalMaintainMargin)}</Text>
                            <Text size="xsmall">{convertSec(wallet.totalMaintainMargin)}</Text>
                        </View>
                    </View>
                }
                stickyHeaderIndices={[0]}
                renderItem={({ item }) => {
                    return (
                        <Card containerStyle={style.tokenContainer}>
                            <View style={style.token}>
                                <Images
                                    type="image"
                                    source={getTokenImage(item.underlying)}
                                    width={windowwidth * 0.085}
                                    height={windowwidth * 0.085}
                                />
                                <Text size="medium">   {item.underlying}</Text>
                            </View>
                            <View style={style.borderLight} />
                            <View style={{ padding: '5%' }}>
                                <Flexcomponent justifyContent="space-between">
                                    <Text color={theme.secondarytext}>Status</Text>
                                    <Text>--</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" style={{ marginVertical: "2.5%" }}>
                                    <Text color={theme.secondarytext}>Blocked in Margin</Text>
                                    <Text>--</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between">
                                    <Text color={theme.secondarytext}>Initial Margin</Text>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text>{convert(item.value.initialMargin)}</Text>
                                        <Text size="xsmall">{convertSec(item.value.initialMargin)}</Text>
                                    </View>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" style={{ marginVertical: "2.5%" }}>
                                    <Text color={theme.secondarytext}>Maintenance Margin</Text>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text>{convert(item.value.maintenanceMargin)}</Text>
                                        <Text size="xsmall">{convertSec(item.value.maintenanceMargin)}</Text>
                                    </View>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between">
                                    <Text color={theme.secondarytext}>Theta</Text>
                                    <Text>0</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between" style={{ marginVertical: "2.5%" }}>
                                    <Text color={theme.secondarytext}>Vega</Text>
                                    <Text>0</Text>
                                </Flexcomponent>
                                <Flexcomponent justifyContent="space-between">
                                    <Text color={theme.secondarytext}>Gamma</Text>
                                    <Text>0</Text>
                                </Flexcomponent>
                            </View>
                        </Card>
                    )
                }}
            />
        </View>
    )
}

export default RiskMargin;