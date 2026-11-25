import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Mainview from "../../../Components/mainview";
import { athuDataProps } from "../../../Actions/type";
import { Button, Input } from "../../../Components/Field";
import useApiError from "../../../Actions/Hooks/errorhook";
import { useChangeEmailMutation } from "../../../Slices/auth";
import useCustomHooks, { useApihooks } from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'UpdateEmail'>;

const UpdateEmail: React.FC<Props> = () => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const { triggeruserdetails } = useApihooks();
    const style = styles(theme);

    const initialUserData: athuDataProps = useMemo(() => ({
        requestedEmail: {
            value: '',
            rules: { required: true },
            messages: { required: 'First name is required!' },
            isValid: true,
        },
    }), []);


    const [userData, setUserData] = useState<athuDataProps>(initialUserData);
    const [changeEmail, { isLoading, error }] = useChangeEmailMutation();

    useApiError(error ?? false);

    const handleSubmit = async () => {
        const payload: any = {
            requestedEmail: userData.requestedEmail?.value?.toString()
        }
        const response = await changeEmail(payload).unwrap();
        if (response.success) {
            await triggeruserdetails();
            successtoast("Success", response.message);
            navigation.goBack();
        } else {
            failuretoast("Error", "Something went wrong!");
        }
    }

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle="Update Email"
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
                    label="Enter Email Address"
                    value={userData.requestedEmail?.value}
                    placeHolder="Enter email Address"
                    onChange={(text: any) => setUserData(prev => ({ ...prev, requestedEmail: { ...prev.requestedEmail, value: text } }))}
                />
            </View>
        </Mainview>
    )

}

export default UpdateEmail;