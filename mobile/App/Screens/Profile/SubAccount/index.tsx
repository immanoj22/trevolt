import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Main from "./Main";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import Flexcomponent from "../../../Components/flexcomponent";
import { useInitialCall } from "../../../Components/HelperComponent";
import { capitalizeFirst } from "../../../Utilities/helerfunction";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";
import { subAccountSelector, useSubAccountSwitchMutation } from "../../../Slices/subAccount";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'SubAccount'>;

const SubAccount: React.FC<Props> = ({ route }) => {
    const { theme, navigation, successtoast, failuretoast, convert, dispatch, convertSec } = useCustomHooks();
    const { Fetchsubaccounts, triggerAvailableMargin } = useApihooks();
    const style = styles(theme);

    const { pageName } = route?.params;

    const { accountId, kycStatus } = useSelector((state: any) => state.auth.userData);

    const { subaccounts } = useSelector(subAccountSelector)
    const [switchAcc, { error }] = useSubAccountSwitchMutation();

    const [selectedAccountId, setSelectedAccountId] = useState(accountId);
    const { ReCallInitial } = useInitialCall()

    const activeAccountValue = subaccounts?.find(
        (item: any) => item.accountId === selectedAccountId
    );

    useApiError(error ?? false);

    const switchAccount = async (accountId: any) => {
        const paylaod: any = {
            "accountId": accountId
        }
        const response = await switchAcc(paylaod).unwrap()
        if (response.success) {
            setSelectedAccountId(accountId);
            ReCallInitial()
            Fetchsubaccounts();
            triggerAvailableMargin();
            if (pageName === "buysell") {
                navigation.goBack();
            }
            successtoast("Success", response.message);
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    useEffect(() => {
        setSelectedAccountId(accountId);
    }, [accountId]);

    const renderAccount = ({ item }: { item: any }) => (
        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[style.account, { marginBottom: 15 }]}>
            <View style={style.checkIcon}>
                <Pressable onPress={() => {
                    if (selectedAccountId !== item.accountId) {
                        Commonalert({
                            title: "Switch Account",
                            des: "Are you sure you want to switch to this account?",
                            yes: () => switchAccount(item.accountId),
                        });
                    }
                }} style={[{ backgroundColor: selectedAccountId === item.accountId ? Colors.brand : "transparent" }, style.subAccount]}>
                    {
                        accountId && (
                            <VectorIcons
                                family="Feather"
                                name="check"
                                iconcolor={selectedAccountId === item.accountId ? Colors.black : theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"}
                                size={windowwidth * 0.04}
                            />
                        )
                    }
                </Pressable>
            </View>
            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                <View style={{ flex: 1 }}>
                    <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>
                        Account Name
                    </Text>
                    <Text style={{ marginTop: 8 }}>{item.accountName}</Text>
                </View>
            </Flexcomponent>
            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                <View style={{ flex: 1 }}>
                    <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>
                        Account ID
                    </Text>
                    <Text style={{ marginTop: 8 }}>{item.accountId}</Text>
                </View>
            </Flexcomponent>
            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                <View style={{ flex: 1 }}>
                    <Text family="regular" size="semimedium" style={{ color: Colors.grey }}>
                        Margin Mode
                    </Text>
                    <Text style={{ marginTop: 8 }}>{capitalizeFirst(item.marginMode)}</Text>
                </View>
            </Flexcomponent>
            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                <View style={{ flex: 1 }}>
                    <Text family="regular" style={{ color: Colors.grey }}>
                        Balance
                    </Text>
                    <Text style={{ marginTop: 8 }}>{convert(item.balance)}</Text>
                    <Text style={{ marginTop: 1 }}>{convertSec(item.balance)}</Text>
                </View>
            </Flexcomponent>
            <Flexcomponent justifyContent="space-between" alignItems="center" paddingVertical={8}>
                <View style={{ flex: 1 }}>
                    <Text family="regular" style={{ color: Colors.grey }}>
                        Action
                    </Text>
                    <Pressable
                        onPress={() => {
                            if (!item.isPrimary) {
                                navigation.navigate("SubAccountManage", { account: item });
                            }
                        }}>
                        <Text style={{ marginTop: 8, color: Colors.brand, alignSelf: "flex-start" }}>Manage</Text>
                    </Pressable>
                </View>
            </Flexcomponent>
        </Card>
    );

    return (
        <Mainview
            isheader={true}
            headertitle={"Sub Accounts"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            onrightfn={() => {
                if (kycStatus !== 'approved') {
                    failuretoast("Error!", "Please complete your KYC details")
                } else {
                    navigation.navigate("SubAccountCreate")
                }
            }}
            righticon={
                <VectorIcons
                    family="Entypo"
                    name={"plus"}
                    size={windowwidth * 0.055}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Main
                    theme={theme}
                    subAccounts={subaccounts}
                    name={activeAccountValue?.accountName || ""}
                    accountId={activeAccountValue?.accountId || 0}
                    balance={convert(activeAccountValue?.balance) ?? 0}
                />

                <View style={{ marginVertical: "2.5%" }}>
                    <Text size="medium">Accounts</Text>
                </View>

                <FlatList
                    data={subaccounts}
                    keyExtractor={(item, index) =>
                        String(item._id || item.accountId || index)
                    }
                    renderItem={renderAccount}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 50 }}
                />
            </View>


        </Mainview>
    )

}

export default SubAccount;