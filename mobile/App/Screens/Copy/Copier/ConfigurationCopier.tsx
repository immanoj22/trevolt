import React, { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import Filter from "../Components/Filter";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import { RFvalue } from "../../../Utilities/dimensions";
import { Button, Input } from "../../../Components/Field";
import { validateLeverage } from "../../../Validation";
import useApiError from "../../../Actions/Hooks/errorhook";
import { useEditCopierMutation } from "../../../Slices/copy";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { style } from "../styles"

interface Configurationsprops {
    data?: any
    onFeach?: any
}

const ConfigurationCopier: React.FC<Configurationsprops> = ({ data, onFeach }) => {
    const { theme, openbottomsheet, bottomsheetref, successtoast, failuretoast, navigation } = useCustomHooks();
    const styles = style(theme);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);

    const [pairData, setPairData] = useState<any>([]);
    const [pairData1, setPairData1] = useState<any>([]);

    const [editCopiers, { error, isLoading }] = useEditCopierMutation();

    useApiError(error);

    const [formData, setFormData] = useState<any>({
        maxAllowAmount: { value: "" },
        tradePairs: [],
        investPercen: { value: "" },
        investType: "",
        takeProfit: { value: "" },
        stopLoss: { value: "" },
        leverage: { value: "" },
    });

    const handelUpdate = async () => {

        if (data.investType === "fixed" && !formData.investPercen?.value) {
            failuretoast("Error", "Investment amount required.");
            return;
        }

        if (!validateLeverage(formData.leverage?.value, failuretoast)) return;

        const paylod = {
            _id: data._id,
            investType: formData.investType,
            investPercen: formData.investPercen?.value ?? 0,
            maxAllowAmount: formData.maxAllowAmount?.value,
            takeProfit: formData.takeProfit?.value,
            stopLoss: formData.stopLoss?.value,
            leverage: formData.leverage?.value,
            tradePairs: pairData.length > 0 ? pairData : pairData1
        }

        const response = await editCopiers(paylod).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
            navigation.navigate("GetCopierDetails")
            onFeach();
        } else {
            failuretoast("Error!", "Something went wrong")
        }
    }

    useEffect(() => {
        if (data) {
            setFormData({
                investType: data.investType || "",
                investPercen: { value: data.investPercen || "" },
                maxAllowAmount: { value: data.maxAllowAmount },
                takeProfit: { value: data.takeProfit || "" },
                stopLoss: { value: data.stopLoss || "" },
                leverage: { value: data.leverage || "" },
                tradePairs: data.tradePairs || []
            });
        }
    }, [data]);

    useEffect(() => {
        if (!data?.tradePairs || !futurePairData?.length) return;
        const filteredData = futurePairData.filter((item: any) =>
            data.tradePairs.includes(item._id)
        );
        const result = filteredData.map((item: any) => ({
            label: item.tickerRoot,
            value: item._id,
        }));

        setPairData1(result);
    }, [data?.tradePairs, futurePairData]);

    const listData = pairData.length > 0 ? pairData : pairData1;

    // Cap the pairs box at 2 rows (numColumns={3}) and let the FlatList scroll
    // the rest. The old 150px cap for 7+ pairs clipped the 3rd row mid-text and
    // it overlapped the "Stop Loss" field below.
    const PAIR_ROW_HEIGHT = 60;
    const height = React.useMemo(() => {
        const rows = Math.ceil(listData.length / 3);
        return Math.min(Math.max(rows, 1), 2) * PAIR_ROW_HEIGHT;
    }, [listData.length]);

    return (
        <View style={{ flex: 1, marginBottom: '15%' }} >
            <Flexcomponent justifyContent="space-between" style={{ marginTop: "5%" }}>
                <Text fontSize={RFvalue(14)} >Copy Trading Pairs</Text>
                <Pressable onPress={() => openbottomsheet(bottomsheetref)} style={styles.selectPair} >
                    <Text color={theme.activetabtext} family="semiBold" size="xsmall" >Select Pairs</Text>
                </Pressable>
            </Flexcomponent>
            <View style={{ height: height, marginTop: 10 }}>
                <FlatList
                    data={listData}
                    keyExtractor={(item, index) => index.toString()}
                    numColumns={3}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ justifyContent: "space-between" }}
                    renderItem={({ item }) => (
                        <Card backgroundColor={theme.theme == 'dark' ? "#101A2C" : "#FFFFFF"} borderColor={theme.theme == 'dark' ? "#1B2740" : "#E2E8F0"} containerStyle={[styles.wraplabel, { marginHorizontal: 3 }]}>
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
            {
                data.investType == "fixed" && (
                    <Input
                        label="Investment Amount"
                        placeHolder="Enter amount"
                        keyboardType="numeric"
                        value={formData?.investPercen?.value}
                        onChange={(val) => setFormData((prev: any) => ({ ...prev, investPercen: { value: val } }))}
                        allowed={"number"}
                        rightContent={
                            <Text color={Colors.brand} >{formatDisplayPair("USDT")}</Text>
                        }
                        background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                    />
                )
            }

            <Input
                themes={theme}
                keyboardType="numeric"
                placeHolder="Enter Stop Loss"
                label="Stop Loss (1-90)"
                value={formData?.stopLoss?.value}
                onChange={(val) => setFormData((prev: any) => ({ ...prev, stopLoss: { value: val } }))}
                allowed={"number"}
                 rightContent={
                    <Text color={Colors.orange} >%</Text>
                }
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                themes={theme}
                keyboardType="numeric"
                placeHolder="Enter Take profit"
                label="Take Profit (1-90)"
                value={formData?.takeProfit?.value}
                onChange={(val) => setFormData((prev: any) => ({ ...prev, takeProfit: { value: val } }))}
                allowed={"number"}
                rightContent={
                    <Text color={Colors.brand} >%</Text>
                }
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Maximum Allow amount"
                placeHolder="Enter amount"
                keyboardType="numeric"
                value={formData?.maxAllowAmount?.value}
                onChange={(val) => setFormData((prev: any) => ({ ...prev, maxAllowAmount: { value: val } }))}
                rightContent={
                    <Text color={Colors.brand} >{formatDisplayPair("USDT")}</Text>
                }
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                themes={theme}
                keyboardType="numeric"
                placeHolder="Enter Leverage"
                label="Leverage (1-100)"
                value={formData?.leverage?.value}
                onChange={(val) => setFormData((prev: any) => ({ ...prev, leverage: { value: val } }))}
                allowed={"numbers"}
                rightContent={
                    <Text color={Colors.brand} >x</Text>
                }
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                            containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Button
                title="Update"
                loading={isLoading}
                onPress={() => handelUpdate()}
                buttonStyle={{ marginTop: "5%" }}
                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
            />
            <Filter
                data={formData.tradePairs}
                sheetref={bottomsheetref}
                onSelect={setPairData}
                initialSelected={formData.tradePairs}
            />
        </View>
    )

}

export default ConfigurationCopier;