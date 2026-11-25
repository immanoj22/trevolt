import React, { useMemo, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import UpdateMargin from "./UpdateMargin";
import Text from "../../../../Components/text";
import Mainview from "../../../../Components/mainview";
import { Colors } from "../../../../Utilities/uiasset";
import { athuDataProps } from "../../../../Actions/type";
import VectorIcons from "../../../../Utilities/vectoricons";
import { Button, Input } from "../../../../Components/Field";
import useApiError from "../../../../Actions/Hooks/errorhook";
import { capitalizeFirst } from "../../../../Utilities/helerfunction";
import { useSubAccountEditMutation } from "../../../../Slices/subAccount";
import { Stacknavigationtypes } from "../../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../../Actions/Hooks/customhook";

import { styles } from "../../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'SubAccountManage'>;

const SubAccountManage: React.FC<Props> = ({ route }) => {
    const { theme, navigation, bottomsheetref, openbottomsheet, closebottomsheet, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);
    const { account } = route.params;

    const initialUserData: athuDataProps = useMemo(() => ({
        name: {
            value: account?.accountName || "",
            rules: { required: true },
            messages: { required: 'First name is required!' },
            isValid: true,
        },
    }), []);

    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const isChanged = userData.name?.value !== initialUserData.name?.value;
    const [edit, { error, isLoading }] = useSubAccountEditMutation();
    const { Fetchsubaccounts } = useApihooks()
    useApiError(error ?? false);

    const handleSubmit = async () => {
        const paylaod: any = {
            "_id": account?._id,
            "accountId": account?.accountId,
            "accountName": userData.name?.value,
            "balance": account?.balance,
            "marginMode": account?.marginMode,
            "isPrimary": false,
            "name": userData.name?.value,
        }
        try {
            const response = await edit(paylaod).unwrap()
            console.log("responseOfEditSubAccount",response);
            if (response.success) {
                successtoast("Success", response.message);
                Fetchsubaccounts()
                navigation.goBack();
            } else {
                failuretoast("Error", "Something went wrong!");
            }
        } catch (e: any) {
            failuretoast("Error", e?.data?.message || "Something went wrong!");
        }
    }

    return (
        <Mainview
            isheader={true}
            headertitle={"Edit Sub Account"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
            >
            <View style={style.container}>
                <Input
                    label="Sub Account Name"
                    value={userData.name?.value}
                    allowed={"text"}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, name: { ...prev.name, value: text } }))}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    containerprops={{ borderRadius: 15, borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <View style={[style.between, { marginTop: "-2%" }]}>
                    <View style={style.row}>
                        <Text style={{ color: Colors.grey }}>Margin Mode</Text>
                        <Pressable style={{ flexDirection: "row", alignItems: "center" }} onPress={() => {
                            Keyboard.dismiss()
                            openbottomsheet(bottomsheetref)
                        }}>
                            <Text style={{ color: Colors.green }}> Change</Text>
                            <VectorIcons
                                family="Feather"
                                name="chevron-right"
                                iconcolor={Colors.brand}
                                size={20}

                            />
                        </Pressable>
                    </View>
                    <Text>{capitalizeFirst(account?.marginMode)}</Text>
                </View>
                <Button
                    title="Update"
                    loading={isLoading}
                    disabled={!isChanged}
                    buttonStyle={style.bottomButton}
                    onPress={() => handleSubmit()}
                    textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                />
            </View>
            <UpdateMargin
                ref={bottomsheetref}
                value={account?.marginMode}
                accountId={account?.accountId}
                title={"Change Margin mode"}
                onClose={() => closebottomsheet(bottomsheetref)}
                confirm={() => { closebottomsheet(bottomsheetref) }}
                onContinue={() => { closebottomsheet(bottomsheetref), navigation.navigate("SubAccount", { pageName: "subacc" }) }}
            />
        </Mainview>
    )

}

export default SubAccountManage;