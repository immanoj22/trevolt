import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import { Input } from "../../../Components/Field";
import Mainview from "../../../Components/mainview";
import useApiError from "../../../Actions/Hooks/errorhook";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { useSubAccountPreferencesMutation } from "../../../Slices/subAccount";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'ConfirmMessage'>;

const ConfirmMessage: React.FC<Props> = () => {
    const { theme, navigation, successtoast } = useCustomHooks();
    const { accountId, confirmMsg } = useSelector((state: any) => state.auth.userData);
    const [confirm, setConfirmMsg] = useState<any>({})
    const style = styles(theme);

    const [updatePreferences, { error, isLoading }] = useSubAccountPreferencesMutation()

    useApiError(error);

    const handleCheckBox = async (checked: any, name: any) => {
        const payload = {
            accountId: accountId,
            notifyType: "confirm",
            messageType: name,
            checked: checked,
        };
        const response = await updatePreferences(payload).unwrap();
        if (response.success) {
            successtoast("Success", response.message);
        }
    }

    useEffect(() => {
        setConfirmMsg(confirmMsg);
    }, [confirmMsg])


    return (
        <Mainview
            isheader={true}
            headertitle={"Confirmation Message"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <Input
                    type="checkbox"
                    label="Limit Order"
                    custom={true}
                    disabled={isLoading}
                    initial={confirm?.isLimitOrder}
                    onChange={(e) => handleCheckBox(e, "isLimitOrder")}
                />

                <Input
                    type="checkbox"
                    custom={true}
                    label="Market Order"
                    disabled={isLoading}
                    initial={confirm?.isMarketOrder}
                    onChange={(e) => handleCheckBox(e, "isMarketOrder")}

                />

                <Input
                    type="checkbox"
                    custom={true}
                    label="Stop Market Order"
                    disabled={isLoading}
                    initial={confirm?.isStopMarket}
                    onChange={(e) => handleCheckBox(e, "confirm")}
                />


                <Input
                    type="checkbox"
                    label="Stop Limit Order"
                    custom={true}
                    disabled={isLoading}
                    initial={confirm?.isStopLimit}
                    onChange={(e) => handleCheckBox(e, "isStopLimit")}
                />

                <Input
                    type="checkbox"
                    custom={true}
                    label="Trailing Stop Order"
                    disabled={isLoading}
                    initial={confirm?.isTrailing}
                    onChange={(e) => handleCheckBox(e, "isTrailing")}
                />

                <Input
                    type="checkbox"
                    custom={true}
                    label="Take Profit Limit Order"
                    disabled={isLoading}
                    initial={confirm?.isTakeLimit}
                    onChange={(e) => handleCheckBox(e, "isTakeLimit")}
                />

                <Input
                    type="checkbox"
                    custom={true}
                    label="Always show on mobile"
                    disabled={isLoading}
                    value={confirm?.isShowMobile || false}
                    onChange={(e) => handleCheckBox(e, "isShowMobile")}
                />

            </View>
        </Mainview>
    )

}

export default ConfirmMessage;