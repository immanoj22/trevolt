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

type Props = NativeStackScreenProps<Stacknavigationtypes, 'UpdateName'>;

const UpdateName: React.FC<Props> = () => {
    const { triggeruserdetails } = useApihooks();
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);

    const { firstName, lastName } = useSelector((state: any) => state.auth.userData);

    const initialUserData: athuDataProps = useMemo(() => ({
        firstName: {
            value: firstName,
            rules: { required: true },
            messages: { required: 'First name is required!' },
            isValid: true,
        },
        lastName: {
            value: lastName,
            rules: { required: true },
            messages: { required: 'Last name is required!' },
            isValid: true,
        }
    }), []);


    const [userData, setUserData] = useState<athuDataProps>(initialUserData);

    const [update, { isLoading, error }] = useUpdateSettingsMutation();

    useApiError(error ?? false);

    const handleSubmit = async () => {
        const response = await update({
            firstName: userData.firstName?.value,
            lastName: userData.lastName?.value,
            type: "name",
            filter: "firlast",
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
            headertitle="Update Display Name 13"
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
                    label="First Name"
                    value={userData.firstName?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, firstName: { ...prev.firstName, value: text } }))}
                />
                <Input
                    label="Last Name"
                    value={userData.lastName?.value}
                    onChange={(text: any) => setUserData(prev => ({ ...prev, lastName: { ...prev.lastName, value: text } }))}
                />
            </View>
        </Mainview>
    )

}

export default UpdateName;