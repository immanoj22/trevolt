import React from "react";
import { Pressable, View, FlatList } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import ChooseApi from "./ChooseAPI";
import Card from "../../../Components/Card";
import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import { setApiparams } from "../../../Slices/helper";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { borderradius, windowwidth } from "../../../Utilities/dimensions";
import { useDeleteApiKeyMutation } from "../../../Slices/apikey";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";

import { styles } from "../styles";
import LinearGradient from "../../../Components/lineargradient";

const MAX_API_KEY_LIMIT = 5;

type Props = NativeStackScreenProps<Stacknavigationtypes, 'APIKeys'>;

const APIKeys: React.FC<Props> = () => {
    const { theme, navigation, bottomsheetref, openbottomsheet, successtoast, failuretoast, dispatch } = useCustomHooks();
    const style = styles(theme);

    const { apiList } = useSelector((state: any) => state.apiAction);
    const { algoWebHook, kycStatus } = useSelector((state: any) => state.auth.userData);

    const [deleteApiKey, { error, isLoading: isDeleting }] = useDeleteApiKeyMutation();
    const { triggerfetchApiKeyLists } = useApihooks();

    useApiError(error);

    const deletekey = async (id: any) => {
        const response = await deleteApiKey(id).unwrap();
        if (response.success) {
            triggerfetchApiKeyLists();
            successtoast("Success", response.message)
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle={"API Management"}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
            bottomContent={
                <Pressable onPress={() => {
                        if (kycStatus !== 'approved') {
                            failuretoast("Error!", "Please complete your KYC details")
                        } else if ((apiList ?? []).length >= MAX_API_KEY_LIMIT) {
                            failuretoast("Error!", "You have reached the limit of API key creation.")
                        } else {
                            openbottomsheet(bottomsheetref)
                        }
                    }}
                     style={{ marginTop: "6%" }}>
                    <LinearGradient
                        colors={["#2563EB", "#2563EB"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ borderRadius: borderradius * 3, paddingVertical: "4%", alignItems: "center" }}
                    >
                        <Text family="semiBold" color={theme.theme == 'dark' ? "#000" : "#FFFFFF"}>Create API Key</Text>
                    </LinearGradient>
                </Pressable>
            }
        >
            <View style={style.container}>
                <Text size="medium">API Key</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}>1. Each account can create up to 5 API Keys.</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}> 2. Do not disclose your API Keys, Secret Key(HMAC) or Private Key (Ed25519, RSA) to anyone to protect your custodial account. You should treat your API Key and your Secret Key (HMAC) or Private Key (Ed25519, RSA) like your passwords.</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}>3. It is recommended to restrict access to trusted IPs only to increase your account security.</Text>
                <Text style={{ color: Colors.warmgrey, marginTop: "3%" }}> 4. You will not be able to create an API Key if KYC is not completed.</Text>
                <FlatList
                    data={apiList}
                    keyExtractor={(item: any) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 50 }}
                    renderItem={({ item }) => (
                        <Card containerStyle={{ padding: "4%", flexDirection: "row", justifyContent: "space-between", marginTop: "5%" }}>
                            <Text>{item?.name}</Text>
                            <View style={{ flexDirection: 'row' }}>
                                <Pressable onPress={() => {
                                    dispatch(setApiparams({ type: "edit", data: item }))
                                    navigation.navigate("EditAPIKey")
                                }} hitSlop={3}>
                                    <VectorIcons
                                        name="edit"
                                        family="Feather"
                                        size={windowwidth * 0.04}
                                        iconcolor={theme.activetab}
                                        style={{ paddingLeft: 20 }}
                                    />
                                </Pressable>
                                <Pressable
                                    disabled={(apiList.length === 1 && algoWebHook) || isDeleting}
                                    onPress={() => {
                                        Commonalert({
                                            title: "Delete API Key",
                                            des: "Are you sure you want to delete this API Key?",
                                            yes: () => deletekey(item?._id)
                                        });
                                    }}>
                                    <VectorIcons
                                        name="trash-2"
                                        family="Feather"
                                        size={windowwidth * 0.04}
                                        iconcolor={(apiList.length === 1 && algoWebHook) ? Colors.grey : theme.activetab}
                                        style={{ paddingLeft: 20 }}
                                    />
                                </Pressable>

                                <Pressable
                                    onPress={() => {
                                        dispatch(setApiparams({ type: "view", data: item }))
                                        navigation.navigate("EditAPIKey")
                                    }}
                                >
                                    <VectorIcons
                                        name="chevron-right"
                                        family="FontAwesome5"
                                        size={windowwidth * 0.04}
                                        iconcolor={theme.activetab}
                                        style={{ paddingLeft: 20 }}
                                    />
                                </Pressable>
                            </View>
                        </Card>
                    )}
                />
                {/* <Button
                    title="Create API Key"
                    buttonStyle={style.bottomButton}
                    onPress={() => {
                        if (kycStatus !== 'approved') {
                            failuretoast("Error!", "Please complete your KYC details")
                        } else if ((apiList ?? []).length >= MAX_API_KEY_LIMIT) {
                            failuretoast("Error!", "You have reached the limit of API key creation.")
                        } else {
                            openbottomsheet(bottomsheetref)
                        }
                    }}
                /> */}
            </View>
            <ChooseApi ref={bottomsheetref} />
        </Mainview>
    )

}

export default APIKeys;