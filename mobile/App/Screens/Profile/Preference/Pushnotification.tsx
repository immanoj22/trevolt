import React, { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";

import Text from "../../../Components/text";
import VectorIcons from "../../../Utilities/vectoricons";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import useApiError from "../../../Actions/Hooks/errorhook";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { useSubAccountPreferencesMutation } from "../../../Slices/subAccount";
import { setUserData } from "../../../Slices/auth";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Pushnotification'>;

const Pushnotification: React.FC<Props> = () => {
    const { theme, navigation, successtoast } = useCustomHooks();
    const style = styles(theme);
    const dispatch = useDispatch();
    const userData = useSelector((state: any) => state.auth.userData);
    const { accountId, emailNotify, pushNotify } = userData;
    const [email, setEmailNotify] = useState<any>({})
    const [push, setPushNotify] = useState<any>({})

    const [updatePreferences, { error, isLoading }] = useSubAccountPreferencesMutation()

    useApiError(error);

    const handleCheckBox = async (checked: any, name: any, type: any) => {
        const payload = {
            accountId: accountId,
            notifyType: type,
            messageType: name,
            checked: checked,
        };
        const response = await updatePreferences(payload).unwrap();

        if (response.success) {
            if (type == "push") {
                const updated = { ...pushNotify, [name]: checked };
                setPushNotify((prev: any) => ({ ...prev, [name]: checked }));
                dispatch(setUserData({ ...userData, pushNotify: updated }));
            }
            if (type == "email") {
                const updated = { ...emailNotify, [name]: checked };
                setEmailNotify((prev: any) => ({ ...prev, [name]: checked }));
                dispatch(setUserData({ ...userData, emailNotify: updated }));
            }
            successtoast("Success", response.message);
        }
    }

    useEffect(() => {
        setEmailNotify(emailNotify)
        setPushNotify(pushNotify)
    }, [emailNotify, pushNotify])

    const CheckboxOption = ({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: (value: boolean) => void }) => {
        return (
            <Pressable
                onPress={() => onToggle(!checked)}
                disabled={isLoading}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    marginTop: 14,
                }}
            >
                <Text>{label}</Text>

                <View
                    style={{
                        height: 22,
                        width: 22,
                        borderRadius: 5,
                        borderWidth: 2,
                        borderColor: Colors.brand,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: checked ? "transparent" : "transparent",
                    }}
                >
                    {checked && (
                        <VectorIcons
                            family="Feather"
                            name="check"
                            iconcolor={Colors.brand}
                            size={14}
                        />
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <Mainview
            isheader={true}
            headertitle={"Push Notification"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            horizontalpadding={0}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <View style={{ paddingHorizontal: "6%" }}>
                    <Text size="medium">Push Notifications</Text>
                    <Text color={Colors.grey} style={{ marginTop: "2%" }}>We send push notifications on certain events. You can choose to disable some or all of them.</Text>

                    <CheckboxOption
                        label="Liquidation"
                        checked={!!push?.isLiquidation}
                        onToggle={(checked) => handleCheckBox(checked, "isLiquidation", "push")}
                    />
                    <CheckboxOption
                        label="Order Fill"
                        checked={!!push?.isorderFill}
                        onToggle={(checked) => handleCheckBox(checked, "isorderFill", "push")}
                    />
                    <CheckboxOption
                        label="Stop Order Trigger"
                        checked={!!push?.isstopOrderTrigger}
                        onToggle={(checked) => handleCheckBox(checked, "isstopOrderTrigger", "push")}
                    />
                </View>

                <View style={{ borderBottomWidth: 1, borderColor: theme.boderColor, marginVertical: 10 }} />

                <View style={{ marginTop: 10, paddingHorizontal: "6%" }}>
                    <Text size="medium">Email Alerts</Text>
                    <Text color={Colors.grey} style={{ marginTop: "2%" }}>We send emails on certain events. You can choose to disable some or all of them.</Text>

                    <CheckboxOption
                        label="Liquidation"
                        checked={!!email?.isLiquidation}
                        onToggle={(checked) => handleCheckBox(checked, "isLiquidation", "email")}
                    />
                    <CheckboxOption
                        label="Order Fill"
                        checked={!!email?.isorderFill}
                        onToggle={(checked) => handleCheckBox(checked, "isorderFill", "email")}
                    />
                    <CheckboxOption
                        label="Stop Order Trigger"
                        checked={!!email?.isstopOrderTrigger}
                        onToggle={(checked) => handleCheckBox(checked, "isstopOrderTrigger", "email")}
                    />
                    <CheckboxOption
                        label="Order Cancel"
                        checked={!!email?.isorderCancel}
                        onToggle={(checked) => handleCheckBox(checked, "isorderCancel", "email")}
                    />
                </View>

            </View>
        </Mainview>
    )

}

export default Pushnotification;