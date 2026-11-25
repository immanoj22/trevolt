import React, { useRef, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Managerisk from "./managerisk";
import Filter from "../Components/Filter";
import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Toptabs from "../../../Components/toptabs";
import { Button } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import { RFvalue } from "../../../Utilities/dimensions";
import { validateCopyTrade } from "../../../Validation";
import Input from "../../../Components/Field/Input/Input";
import useApiError from "../../../Actions/Hooks/errorhook";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import Checkbox from "../../../Components/Field/Input/Checkbox";
import { Colors, Fontfamily } from "../../../Utilities/uiasset";
import { formatDisplayPair } from "../../../Utilities/formatPair";
import { useRequestCopierMutation } from "../../../Slices/copy";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { style } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Tradepairs'>;

const initialState = {
    strategyId: "",
    investType: "",
    investPercen: "",
    maxAllowAmount: "",
    takeProfit: "",
    stopLoss: "",
    leverage: "",
    tradePairs: ""
}

const Tradepairs: React.FC<Props> = ({ route }) => {
    const { data } = route.params
    const pairsref = useRef(null);
    const managerisk = useRef(null);
    const { theme, navigation, openbottomsheet, failuretoast, successtoast } = useCustomHooks()
    const styles = style(theme)
    const [pairData, setPairData] = useState<any>([])
    const [activeindex, setActiveindex] = useState(0);
    const [agree1, setAgree1] = useState(false);
    const [agree2, setAgree2] = useState(false);
    const [agree3, setAgree3] = useState(false);

    const [formData, setFormData] = useState(initialState);

    const [requestCopier, { error, isLoading }] = useRequestCopierMutation();

    useApiError(error);

    const handleRequestCoper = async () => {
        if (!validateCopyTrade(pairData, formData, agree1, agree2, agree3, failuretoast)) return;
        const payload = {
            strategyId: data._id,
            investType: activeindex === 1 ? "fixed" : "flexible",
            investPercen: formData.investPercen || "",
            maxAllowAmount: formData.maxAllowAmount,
            takeProfit: formData.takeProfit,
            stopLoss: formData.stopLoss,
            leverage: formData.leverage,
            tradePairs: pairData
        }
        const response = await requestCopier(payload).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            navigation.navigate("Copytrade");
        } else {
            failuretoast("Error!", "Something went worng ")
        }
    }

    const height = pairData.length > 6 ? 150 : pairData.length > 3 ? 120 : 40;

    return (
        <Mainview
            headertitle="Copy Traders Setup"
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <View style={styles.setup}>
                    {/* <View style={styles.condition}>
                        <Checkbox
                            label="I agree to the terms and conditions of Copy Trading"
                            checkboxlabelprops={{
                                style: {
                                    fontFamily: Fontfamily.regular,
                                    fontSize: RFvalue(11),
                                    color: theme.secondarytext
                                }
                            }}
                            initial={agree1}
                            onChange={(val) => setAgree1(val)}
                            activecheckboxcolor={Colors.white}
                            activecheckbox={Colors.brand}
                        />

                        <View style={styles.fee}>
                            <Checkbox
                                label="I agree to share the profit of 1% (Copy trade fee) with the Master Trader"
                                checkboxlabelprops={{
                                    style: {
                                        fontFamily: Fontfamily.regular,
                                        fontSize: RFvalue(11),
                                        color: theme.secondarytext
                                    }
                                }}
                                initial={agree2}
                                onChange={(val) => setAgree2(val)}
                                activecheckboxcolor={Colors.white}
                                activecheckbox={Colors.brand}
                            />
                        </View>

                        <Checkbox
                            label="Once you copy a strategy, you can’t unfollow it until after the 7-day lock-in period"
                            checkboxlabelprops={{
                                style: {
                                    fontFamily: Fontfamily.regular,
                                    fontSize: RFvalue(11),
                                    color: theme.secondarytext
                                }
                            }}
                            initial={agree3}
                            onChange={(val) => setAgree3(val)}
                            activecheckboxcolor={Colors.white}
                            activecheckbox={Colors.brand}
                        />

                    </View> */}

                    <Button
                        title="Copy"
                        loading={isLoading}
                        onPress={() => handleRequestCoper()}
                        buttonStyle={{ marginTop: "5%" }}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={styles.container}>
                <Flexcomponent justifyContent="space-between">
                    <Text fontSize={RFvalue(14)} >Copy Trading Pairs</Text>
                    <Pressable onPress={() => openbottomsheet(pairsref)} style={styles.paires}>
                        <Text color={theme.theme == 'dark' ? Colors.black : Colors.white} family="semiBold" size="small">Select Pairs</Text>
                    </Pressable>
                </Flexcomponent>
                <View style={{ height: height, marginTop: 10 }}>
                    <FlatList
                        data={pairData}
                        keyExtractor={(item, index) => index.toString()}
                        numColumns={3}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ justifyContent: "space-between" }}
                        renderItem={({ item }) => (
                            <Card containerStyle={[styles.wraplabel, { marginHorizontal: 3 }]}>
                                <Text size="small" numoflines={1}>{item?.label}</Text>
                            </Card>
                        )}
                        ListEmptyComponent={
                            <Text style={{ marginVertical: 10 }} color={Colors.warmgrey}>
                                No pair selected
                            </Text>
                        }
                    />
                </View>

                <Toptabs
                    tabs={["Flexible Amount", "Fixed Amount"]}
                    activeindex={activeindex}
                    onchangeindex={setActiveindex}
                    onpress={() => setFormData({ ...formData, ...{ investPercen: "" } })}
                />
                <View style={styles.container}>
                    <View style={{ flex: 0.725 }}>
                        {
                            activeindex == 0 &&
                            <>
                                <Input
                                    rightContent={
                                        <Text color={Colors.brand} >{formatDisplayPair("USDT")}</Text>
                                    }
                                    containerprops={{ marginTop: "7.5%", borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                                    placeHolder="Enter amount"
                                    keyboardType="numeric"
                                    value={formData?.investPercen}
                                    onChange={(val) => { setFormData({ ...formData, ...{ investPercen: val } }) }}
                                    allowed={"number"}
                                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                                />
                                <Text size="small" color={Colors.warmgrey} style={styles.invest}>Note : Minimum Investment Amount is 5</Text>
                                <Flexcomponent justifyContent="space-between">
                                    <Text fontSize={RFvalue(14)}>Risk Management</Text>
                                    <Pressable onPress={() => openbottomsheet(managerisk)} style={styles.manageRist}>
                                        <Text color={theme.theme == 'dark' ? Colors.black : Colors.white} family="semiBold" size="small">Manage Risk</Text>
                                    </Pressable>
                                </Flexcomponent>
                            </>
                        }

                        {
                            activeindex == 1 && (
                                <Flexcomponent justifyContent="space-between" style={{ marginTop: "5%" }}>
                                    <Text fontSize={RFvalue(14)} >Risk Management</Text>
                                    <Pressable onPress={() => openbottomsheet(managerisk)} style={styles.manageRist}>
                                        <Text color={theme.activetabtext} family="semiBold" size="small" >Manage Risk</Text>
                                    </Pressable>
                                </Flexcomponent>
                            )
                        }

                        <View style={[styles.condition, {marginTop: "10%"}]}>
                            <Checkbox
                                label="I agree to the terms and conditions of Copy Trading"
                                checkboxlabelprops={{
                                    style: {
                                        fontFamily: Fontfamily.regular,
                                        fontSize: RFvalue(11),
                                        color: theme.secondarytext
                                    }
                                }}
                                initial={agree1}
                                onChange={(val) => setAgree1(val)}
                                activecheckboxcolor={Colors.white}
                                activecheckbox={Colors.brand}
                            />

                            <View style={styles.fee}>
                                <Checkbox
                                    label="I agree to share the profit of 1% (Copy trade fee) with the Master Trader"
                                    checkboxlabelprops={{
                                        style: {
                                            fontFamily: Fontfamily.regular,
                                            fontSize: RFvalue(11),
                                            color: theme.secondarytext
                                        }
                                    }}
                                    initial={agree2}
                                    onChange={(val) => setAgree2(val)}
                                    activecheckboxcolor={Colors.white}
                                    activecheckbox={Colors.brand}
                                />
                            </View>

                            <Checkbox
                                 label="Once you copy a strategy, you can’t unfollow it until after the 7-day lock-in period"
                                checkboxlabelprops={{
                                    style: {
                                        fontFamily: Fontfamily.regular,
                                        fontSize: RFvalue(11),
                                        color: theme.secondarytext
                                    }
                                }}
                                initial={agree3}
                                onChange={(val) => setAgree3(val)}
                                activecheckboxcolor={Colors.white}
                                activecheckbox={Colors.brand}
                            />

                        </View>
                    </View>
                </View>

                <Filter
                    data={data.tradePairs}
                    sheetref={pairsref}
                    onSelect={setPairData}
                />

                <Managerisk
                    formData={formData}
                    sheetref={managerisk}
                    setFormData={setFormData}
                />

            </View>
        </Mainview>
    )

}

export default Tradepairs;