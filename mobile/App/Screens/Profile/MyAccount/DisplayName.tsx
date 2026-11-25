import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Mainview from "../../../Components/mainview";
import { athuDataProps } from "../../../Actions/type";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import { useUpdateSettingsMutation } from "../../../Slices/auth";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'DisplayName'>;

const DisplayName: React.FC<Props> = () => {
    const { triggeruserdetails } = useApihooks();
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);

    const { userName } = useSelector((state: any) => state.auth.userData);

    const initialUserData: athuDataProps = useMemo(() => ({
        userName: {
            value: userName,
            rules: { required: true },
            messages: { required: 'First name is required!' },
            isValid: true,
        },
    }), []);


    const [userData, setUserData] = useState<athuDataProps>(initialUserData);

    const [update, { isLoading, error }] = useUpdateSettingsMutation();

    useApiError(error ?? false);

    const handleSubmit = async () => {
        const response = await update({
            userName: userData.userName?.value,
            type: "name",
            filter: "userName",
        }).unwrap()
        if (response.success) {
            successtoast("Success", response.message);
            await triggeruserdetails();
            navigation.goBack();
            setUserData(initialUserData)
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    return (
        <Mainview
            isheader={true}
            isscollable={true}
            headertitle="Update Display Name"
            onleftfn={() => navigation.goBack()}
            bottomContent={
                <Button
                    title="Submit"
                    onPress={() => handleSubmit()}
                    loading={isLoading}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            }
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Input
                    label="User Name"
                    value={userData.userName?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, userName: { ...prev.userName, value: text } }))}
                />
            </View>
        </Mainview>
    )

}

export default DisplayName;