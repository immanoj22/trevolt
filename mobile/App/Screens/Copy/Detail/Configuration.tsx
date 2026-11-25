import React, { useEffect, useState } from "react";
import { Pressable, StyleProp, View, ViewStyle, FlatList } from "react-native";
import { SOCKET_URL } from "@env";
import { useSelector } from "react-redux";

import Pairs from "../Setup/pairslist"
import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Images from "../../../Utilities/images";
import useApiError from "../../../Actions/Hooks/errorhook";
import { toBase64UploadBody } from "../../../Utilities/fileToBase64";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import Flexcomponent from "../../../Components/flexcomponent";
import { RFvalue, windowwidth } from "../../../Utilities/dimensions";
import { Button, FileUpload, Input, Textarea } from "../../../Components/Field";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { copyTradeSelector, useEditStartegyMutation } from "../../../Slices/copy";
import { formatDisplayPair } from "../../../Utilities/formatPair";

import { style } from "../styles";

interface Configurationsprops {
    data?: any,
    onRefech?: any
}

interface Buttonprops {
    colors?: any[],
    title: string,
    style?: StyleProp<ViewStyle>
    onPress?: () => void,
    isSelected?: any,

}

const Configuration: React.FC<Configurationsprops> = ({ data, onRefech }) => {
    const { theme, openbottomsheet, bottomsheetref, successtoast, failuretoast } = useCustomHooks();
    const styles = style(theme);
    const { myStrategy } = useSelector(copyTradeSelector);
    const futurePairData = useSelector((state: any) => state.future.futurePairData);
    const { _id, name, tradePairs, showHistory, maxFollower, profileImage } = myStrategy;
    const [frontImage, setFrontImage] = useState<any>(profileImage);

    const [userData, setUserData] = useState<any>({
        name: { value: "" },
        tradePairs: [],
        description: { value: "" },
        showHistory: "",
        minFixedInvesPercen: { value: "" },
        linkedInUrl: { value: "" },
        twitterUrl: { value: "" },
        telegramUrl: { value: "" },
        copyTradeFee: { value: "" },
        binanceUrl: { value: "" },
        bybitUrl: { value: "" },
        coinbaseUrl: { value: "" },
        maxFollower: { value: "" },
    });

    const { mystrategyDetails } = useApihooks();

    const mapPairIdsToObjects = (ids: string[]) => {
        return ids
            ?.map((id) => {
                const pair = futurePairData.find((p: any) => p._id === id);
                if (!pair) return null;
                return {
                    label: `${pair.baseCurrency}/${formatDisplayPair(pair.quoteCurrency)}`,
                    value: pair._id,
                };
            })
            .filter(Boolean);
    };

    const [pairData, setPairData] = useState<any[]>([]);
    const [history, setHistory] = useState(showHistory);

    useEffect(() => {
        setPairData(mapPairIdsToObjects(tradePairs));
    }, []);


    useEffect(() => {
        if (myStrategy) {
            setUserData({
                tradePairs: myStrategy.tradePairs || [],
                description: { value: myStrategy.description || "" },
                showHistory: myStrategy.showHistory || "",
                minFixedInvesPercen: { value: data.minFixedInvesPercen || "" },
                linkedInUrl: { value: myStrategy.linkedInUrl || "" },
                twitterUrl: { value: myStrategy.twitterUrl || "" },
                telegramUrl: { value: myStrategy.telegramUrl || "" },
                copyTradeFee: { value: myStrategy.copyTradeFee || "" },
                binanceUrl: { value: myStrategy.binanceUrl || "" },
                bybitUrl: { value: myStrategy.bybitUrl || "" },
                coinbaseUrl: { value: myStrategy.coinbaseUrl || "" },
            });
            setPairData(mapPairIdsToObjects(myStrategy.tradePairs));
            setFrontImage(myStrategy.profileImage);
            setHistory(myStrategy.showHistory || "");
        }
    }, [myStrategy]);

    const Buttons = ({ title, onPress, style, isSelected }: Buttonprops,) => {
        return (
            <Pressable onPress={onPress} style={[styles.title, { backgroundColor: isSelected ? Colors.white : "#1B2740" }, style]}>
                <Text size="small" family={"medium"} color={isSelected ? Colors.black : Colors.white}>{title}</Text >
            </Pressable>
        )
    }

    const [editStartegy, { error, isLoading }] = useEditStartegyMutation();

    useApiError(error);

    const handeEditStartegy = async () => {

        if (!frontImage) {
            failuretoast("Error", "Profile image is required.");
            return;
        }

        const body = await toBase64UploadBody({
            // Only send profileImage when the user picked a new one - otherwise
            // frontImage is still the existing image URL string, not a file.
            ...(frontImage?.uri
                ? {
                    profileImage: {
                        uri: frontImage.uri,
                        fileName: frontImage.fileName ?? `profile_${Date.now()}.jpg`,
                    },
                }
                : {}),
            _id,
            name,
            tradePairs: JSON.stringify(pairData),
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
            maxFollower: maxFollower ? maxFollower : 1,
        });
        const response = await editStartegy(body).unwrap();
        if (response.success) {
            successtoast("Success!", response.message);
            mystrategyDetails()
            onRefech()
        } else {
            failuretoast("Error!", "Some thing went wrong")
        }
    }

    const height = pairData.length > 6 ? 150 : pairData.length > 3 ? 120 : 50;

    return (
        <View style={{ flex: 1, marginBottom: "10%" }} pointerEvents="box-none" >
            <Flexcomponent justifyContent="space-between" top={"5%"}>
                <Text fontSize={RFvalue(14)} >Copy Trading Pairs</Text>
                <Pressable onPress={() => openbottomsheet(bottomsheetref)} style={styles.edit}>
                    <Text color={theme.activetabtext} family="semiBold" size="small" >Edit Pairs</Text>
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
            <View style={styles.profileCon}>
                <View>
                     {
                        frontImage ? <Images
                            type="image"
                            source={
                                frontImage?.uri
                                    ? { uri: frontImage.uri }
                                    : profileImage
                                        ? { uri: `${SOCKET_URL}${profileImage}` }
                                        : undefined
                            }
                            height={windowwidth * 0.18}
                            width={windowwidth * 0.18}
                            style={{ borderRadius: 100, }}
                            resizeMode="cover"
                        />
                            :
                            <Images
                                type="svg"
                                name={theme.theme == "dark" ? "DarkUser" : "EmptyUser"}
                                width={windowwidth * 0.18}
                                height={windowwidth * 0.18}
                            />
                    }
                </View>
                <View>
                    <FileUpload
                        source="sheet"
                        mediaData={frontImage}
                        preview={false}
                        component={
                            <Card containerStyle={styles.change}>
                                <Text style={{ fontSize: Fontsize.small, color: theme.darktext }}>Change</Text>
                            </Card>
                        }
                        onChange={(data) => { setFrontImage(data) }}
                    />
                </View>
            </View>
            <Text style={{ marginTop: "3%" }}>View Access</Text>
            <Flexcomponent style={{ flexWrap: "wrap" }} justifyContent="flex-start" top={"2%"} >
                <Buttons
                    title="Master Trader"
                    isSelected={history === "only_trader"}
                    onPress={() => setHistory('only_trader')}

                />
                <Buttons
                    title="Followers"
                    isSelected={history === "only_follower"}
                    onPress={() => setHistory('only_follower')}
                    style={{ marginLeft: "5%" }}
                />
            </Flexcomponent>

            <Input
                label="Minimum Invest Percentage"
                allowed={"number"}
                placeholder="Enter Your mininvest"
                value={userData.minFixedInvesPercen?.value}
                keyboardType="numeric"
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, minFixedInvesPercen: { ...prev.minFixedInvesPercen, value: text } }))}
            />

            <Input
                label="Copy trade fee (%)"
                keyboardType="numeric"
                allowed={"number"}
                placeholder="Enter your copty trade fee"
                value={userData.copyTradeFee?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, copyTradeFee: { ...prev.copyTradeFee, value: text } }))}
            />

            <Input
                label="LinkedIn"
                placeholder="Enter your linkedin URL"
                value={userData.linkedInUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, linkedInUrl: { ...prev.linkedInUrl, value: text } }))}
            />

            <Input
                label="Twitter"
                placeholder="Enter your twitter URL"
                value={userData.twitterUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, twitterUrl: { ...prev.twitterUrl, value: text } }))}
            />

            <Input
                label="Telegram"
                placeholder="Enter your telegram URL"
                value={userData.telegramUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, telegramUrl: { ...prev.telegramUrl, value: text } }))}
            />

            <Input
                label="Binance"
                placeholder="Enter your binance URL"
                value={userData.binanceUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, binanceUrl: { ...prev.binanceUrl, value: text } }))}
            />

            <Input
                label="Coinbase"
                placeholder="Enter your coinbase URL"
                value={userData.coinbaseUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, coinbaseUrl: { ...prev.coinbaseUrl, value: text } }))}
            />

            <Input
                label="Bybit"
                placeholder="Enter your bybit URL"
                value={userData.bybitUrl?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, bybitUrl: { ...prev.bybitUrl, value: text } }))}
            />

            <Textarea
                label="Description"
                placeholder="Enter your description"
                value={userData.description?.value}
                onChange={(text: any) => setUserData((prev: any) => ({ ...prev, description: { ...prev.description, value: text } }))}
            />

            <Button
                title="Submit"
                onPress={handeEditStartegy}
                loading={isLoading}
                buttonStyle={{ marginTop: "5%" }}
                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
            />

            <Pairs
                sheetref={bottomsheetref}
                onSelect={(pairs: any[]) => {
                    setPairData(pairs);
                    setUserData((prev: any) => ({
                        ...prev,
                        tradePairs: pairs.map((p: any) => p.value),
                    }));
                }}
                initialSelected={pairData}
            />
        </View>
    )
}

export default Configuration;