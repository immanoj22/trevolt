import React, { useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, View } from "react-native";

import Pairs from "./Setup/pairslist";
import Text from "../../Components/text";
import Card from "../../Components/Card";
import Mainview from "../../Components/mainview";
import { RFvalue } from "../../Utilities/dimensions";
import { validateBecomeTrade } from "../../Validation";
import useApiError from "../../Actions/Hooks/errorhook";
import Flexcomponent from "../../Components/flexcomponent";
import { Colors, Fontfamily, Fontsize } from "../../Utilities/uiasset";
import { toBase64UploadBody } from "../../Utilities/fileToBase64";
import { useRequestTraderMutation } from "../../Slices/copy";
import { Stacknavigationtypes } from "../../Navigations/navigationtypes";
import { Button, FileUpload, Input, Textarea } from "../../Components/Field";
import useCustomHooks, { useApihooks } from "../../Actions/Hooks/customhook";

import { style } from "./styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'MasterTrader'>;

const initialState = {
    name: "",
    tradePairs: "",
    description: "",
    showHistory: "",
    minFixedInvesPercen: 0,
    linkedInUrl: "",
    twitterUrl: "",
    telegramUrl: "",
    copyTradeFee: 1,
    binanceUrl: "",
    bybitUrl: "",
    coinbaseUrl: "",
    maxFollower: 1,
    profileImage: ""
}

const MasterTrader: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast, openbottomsheet, bottomsheetref } = useCustomHooks();
    const styles = style(theme);

    const [image, setImage] = useState<any>();

    const { mystrategyDetails } = useApihooks();
    const [copyRequest, { error, isLoading }] = useRequestTraderMutation();
    const [userData, setUserData] = useState<any>(initialState);
    const [history, setHistory] = useState("only_trader");
    const [pairData, setPairData] = useState([])

    const jsonString = JSON.stringify(pairData);

    useApiError(error);

    const handleCopyRequest = async () => {
        if (!validateBecomeTrade(userData, failuretoast)) return;

        if (!image) {
            failuretoast("Error", "Profile image is required.");
            return;
        }

        const body = await toBase64UploadBody({
            profileImage: {
                uri: image.uri,
                fileName: image.fileName ?? `profile_${Date.now()}.jpg`,
            },
            name: userData.name?.value,
            tradePairs: jsonString,
            description: userData.description?.value,
            showHistory: history,
            minFixedInvesPercen: userData.minFixedInvesPercen?.value,
            linkedInUrl: userData.linkedInUrl?.value,
            twitterUrl: userData.twitterUrl?.value,
            telegramUrl: userData.telegramUrl?.value,
            copyTradeFee: userData.copyTradeFee?.value,
            binanceUrl: userData.binanceUrl?.value,
            bybitUrl: userData.bybitUrl?.value,
            coinbaseUrl: userData.coinbaseUrl?.value,
            maxFollower: userData.maxFollower?.value,
        });

        const response = await copyRequest(body).unwrap();
        if (response.success) {
            mystrategyDetails();
            successtoast("Success!", response.message);
            navigation.navigate("Copytrade");
        } else {
            failuretoast("Error!", "Some thing went wrong")
        }
    }

    return (
        <Mainview
            isscollable={true}
            headertitle={"Become a Master Trader"}
            headerTextstyle={{
                color: theme.theme === "dark" ? Colors.white : Colors.textWBlack,
                fontFamily: Fontfamily.bold,
                fontSize: RFvalue(17.5),
            }}
            bottomContent={
                <Button
                    title="Submit"
                    buttonStyle={{ marginTop: "2%" }}
                    onPress={() => handleCopyRequest()}
                    loading={isLoading}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            }
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <Input
                label="Name"
                placeholder="Enter Your Name"
                value={userData.name?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, name: { ...prev.name, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Flexcomponent justifyContent="space-between">
                <Text fontSize={RFvalue(14)}>Select your pairs</Text>
                <Pressable onPress={() => openbottomsheet(bottomsheetref)} style={styles.selectPairs}>
                    <Text color={theme.theme == 'dark' ? "#000" : "#ffff"} family="semiBold" size="xsmall" >Select Pairs</Text>
                </Pressable>
            </Flexcomponent>

            <Flexcomponent top={"2%"} justifyContent="flex-start" style={styles.empty}>
                {
                    pairData.length > 0 ?
                        pairData?.map((e: any, i: number) => (
                            <Card key={e?.label ?? i} containerStyle={styles.noPair}>
                                <Text size="small">{e.label}</Text>
                            </Card>))
                        :
                        <Text style={{ marginVertical: 10 }} color={Colors.warmgrey}>No pair selected</Text>
                }
            </Flexcomponent>

            <View style={{ marginBottom: "5%" }}>
                <View style={{ marginBottom: "3%" }}>
                    <Text style={[{ color: theme.secondarytext }]}>Select show history</Text>
                </View>
                <Flexcomponent style={styles.masterTrader}>
                    <Button
                        title="Master Trader"
                        onPress={() => setHistory("only_trader")}
                        buttonStyle={[styles.onlyTrade, { backgroundColor: history === "only_trader" ? Colors.brand : theme.card }]}
                        textStyle={{ fontSize: Fontsize.small, color: history === "only_trader" ? Colors.black : theme.theme == 'dark' ? Colors.white : Colors.black }}
                    />
                    <Button
                        title="Followers"
                        onPress={() => setHistory("only_copier")}
                        buttonStyle={[styles.follower, { backgroundColor: history === "only_copier" ? Colors.brand : theme.card }]}
                        textStyle={{ fontSize: Fontsize.small, color: history === "only_copier" ? Colors.black : theme.theme == 'dark' ? Colors.white : Colors.black }}
                    />
                </Flexcomponent>
                <Text size="small" color={theme.graytext}>Note: Your trade history will be displayed to the Traders</Text>
            </View>

            <FileUpload
                source="sheet"
                label="Upload profile photo"
                mediaData={image}
                onChange={(data) => {
                    setImage(data);
                }}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
            />

            <Input
                label="Minimum Invest (%)"
                allowed={"number"}
                placeholder="Enter Your mininvest"
                value={userData.minFixedInvesPercen?.value}
                keyboardType="numeric"
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, minFixedInvesPercen: { ...prev.minFixedInvesPercen, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Copy trade fee (%)"
                keyboardType="numeric"
                allowed={"number"}
                placeholder="Enter your copty trade fee"
                value={userData.copyTradeFee?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, copyTradeFee: { ...prev.copyTradeFee, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Followers"
                keyboardType="numeric"
                allowed={"number"}
                placeholder="Enter your foullowers count"
                value={userData.maxFollower?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, maxFollower: { ...prev.maxFollower, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="LinkedIn"
                placeholder="Enter your linkedin URL"
                value={userData.linkedInUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, linkedInUrl: { ...prev.linkedInUrl, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Twitter"
                placeholder="Enter your twitter URL"
                value={userData.twitterUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, twitterUrl: { ...prev.twitterUrl, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Telegram"
                placeholder="Enter your telegram URL"
                value={userData.telegramUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, telegramUrl: { ...prev.telegramUrl, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Binance"
                placeholder="Enter your binance URL"
                value={userData.binanceUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, binanceUrl: { ...prev.binanceUrl, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Coinbase"
                placeholder="Enter your coinbase URL"
                value={userData.coinbaseUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, coinbaseUrl: { ...prev.coinbaseUrl, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Input
                label="Bybit"
                placeholder="Enter your bybit URL"
                value={userData.bybitUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, bybitUrl: { ...prev.bybitUrl, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />

            <Textarea
                label="Description"
                placeholder="Enter your description"
                value={userData.description?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, description: { ...prev.description, value: text } }))}
                background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
            />
            <Text size="small" color={theme.graytext} style={{ marginTop: "-3%" }}>Note: Your trade history will be displayed to the subscriber</Text>

            <Pairs
                sheetref={bottomsheetref}
                onSelect={setPairData}
            />
        </Mainview>
    )

}

export default MasterTrader;