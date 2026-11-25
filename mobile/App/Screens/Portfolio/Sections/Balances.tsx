import React, { useState } from "react";
import { View, LayoutAnimation } from "react-native";
import { useSelector } from "react-redux";

import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import VectorIcons from "../../../Utilities/vectoricons";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import usePriceConversion from "../../../Actions/Hooks/usePriceConversion";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { styles } from "../styles";

interface Balancesprops {

}

const Balances: React.FC<Balancesprops> = () => {
    const { theme, failuretoast, navigation, convert, convertSec } = useCustomHooks();
    const style = styles(theme);

    const { kycStatus, firstName } = useSelector((state: any) => state.auth.userData);
    const { conversionRate } = usePriceConversion('USD', 'INR');
    const { wallet } = useSelector((state: any) => state.wallet);
    const [accordion, setAccordion] = useState(false);

    const toggleAccordion = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setAccordion(!accordion);
    };

    return (
        <>
            <View style={style.balance}>
                <Card containerStyle={[style.balanceContainer, { backgroundColor: theme.theme == 'dark' ? "#151a1786" : "#FFFFFF", borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }]}>
                    <View style={{ width: "100%", }}>
                        <View style={{ width: "100%" }}>
                            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={5}>
                                <Text family="medium" size="small">Welcome {firstName}, <Text family="medium" size="small" >Your account value is</Text> </Text>
                            </Flexcomponent>
                            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={5}>
                                <Text color={theme.darktext} family="medium" size="semilarge"> {convert(wallet?.tradingBalance)}  <Text color={Colors.grey}>{convertSec(wallet?.tradingBalance)}</Text></Text>
                            </Flexcomponent>
                        </View>
                        <Button
                            title=" Add Funds"
                            buttonStyle={style.add}
                            leftContent={
                                <VectorIcons
                                    family="Ionicons"
                                    name="add"
                                    iconcolor={ theme.theme == 'dark' ? Colors.black : Colors.white}
                                    size={20}
                                />
                            }
                            textStyle={{ fontSize: Fontsize.xsmall, color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            onPress={() => {
                                if (kycStatus != "approved") {
                                    failuretoast("Error", "Please complete your KYC verification to continue using deposit")
                                    navigation.navigate('MyAccount')
                                    return false
                                }
                                navigation.navigate("Deposit")
                            }}
                        />
                    </View>
                </Card>
            </View>

            <Card containerStyle={[style.accrodion, {
                backgroundColor: accordion ? theme.theme == 'dark' ? "#092f0962" : "#FFFFFF" : theme.theme == 'dark' ? "#101A2C" : "#FFFFFF",
                borderColor: accordion ? theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" : theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
            }]}>
                <Flexcomponent ispress={true} justifyContent="space-between" alignItems="center" onPress={() => toggleAccordion()}>
                    <View style={{ flexDirection: 'row', alignItems: "center", justifyContent: "center" }}>
                        <Text color={Colors.grey}>Trading Wallet </Text>
                        <VectorIcons
                            family="Feather"
                            name={accordion ? "chevron-up" : "chevron-down"}
                            iconcolor={Colors.grey}
                            size={22}
                        />
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text>{convert(wallet.tradingBalance)}</Text>
                        <Text color={Colors.grey} size="semismall">{convertSec(parseFloat(wallet.tradingBalance))}</Text>
                    </View>
                </Flexcomponent>
                {
                    accordion && (
                        <>
                            <View style={style.line} />
                            <Flexcomponent justifyContent="space-between" alignItems="center">
                                <Text size="small" color={Colors.grey}>Wallet Balance </Text>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text>{convert(wallet.walletBalance)}</Text>
                                    <Text color={Colors.grey} size="semismall">{convertSec(parseFloat(wallet.walletBalance))}</Text>
                                </View>
                            </Flexcomponent>
                            <Flexcomponent justifyContent="space-between" style={{ paddingTop: '5%' }} alignItems="center">
                                <Text size="small" color={Colors.grey}>UnRealized PNL </Text>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text>{convert(wallet.unRealizedPnL)}</Text>
                                    <Text color={Colors.grey} size="semismall">{convertSec(parseFloat(wallet.unRealizedPnL))}</Text>
                                </View>
                            </Flexcomponent>
                            <Flexcomponent justifyContent="space-between" style={{ paddingTop: '5%' }} alignItems="center">
                                 <Text size="small" color={Colors.grey}>Frozen wallet </Text>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text>{convert(wallet.freezeBalance)}</Text>
                                    <Text color={Colors.grey} size="semismall">{convertSec(parseFloat(wallet.freezeBalance))}</Text>
                                </View>
                            </Flexcomponent>
                        </>
                    )
                }
            </Card>
            <View style={{ paddingHorizontal: 20 }}>
                <Flexcomponent justifyContent="space-between" style={{ paddingTop: '5%' }} alignItems="center">
                    <Text color={Colors.grey}>Available Margin </Text>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text>{convert(wallet?.availableBalance)}</Text>
                        <Text color={Colors.grey} size="semismall">{convertSec(parseFloat(wallet?.availableBalance))}</Text>
                    </View>
                </Flexcomponent>
                <Card containerStyle={[style.rate, {backgroundColor: theme.theme == 'dark' ? "#151a1786" : "#FFFFFF", borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }]}>
                    <Text style={{ color: theme.graytext }} size="xsmall">Convertion Rate <Text style={{ color: theme.darktext }} size="xsmall">1 {formatDisplayPair("USDT")} = INR {parseFloat(conversionRate?.price)?.toFixed(2)}</Text></Text>
                </Card>
            </View>
        </>
    )
}

export default Balances;