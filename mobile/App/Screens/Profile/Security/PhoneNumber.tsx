import React, { useEffect } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";

import Confirm from "./Helpers/Confirm";
import Description from "../Description";
import EditCard from "./Helpers/EditCard";
import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { formatToReadableDate } from "../../../Utilities/helerfunction";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import { styles } from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'PhoneNumber'>;

const PhoneNumber: React.FC<Props> = () => {
    const { theme, bottomsheetref, openbottomsheet, closebottomsheet, navigation, successtoast, failuretoast } = useCustomHooks();
    const style = styles(theme);

    const { countryCode, mobileNumber, updatedAt } = useSelector((state: any) => state.auth.userData);

    return (
        <Mainview
            isheader={true}
            headertitle={"Phone Number"}
            isscollable={false}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
            <View style={style.container}>
                <EditCard
                    value={`${countryCode} ${mobileNumber}`}
                    text={`Added : ${formatToReadableDate(updatedAt)}`}
                    onPress={() => openbottomsheet(bottomsheetref)}
                />
                <Text style={[style.note]}>Note :</Text>
                <Description
                    content="withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email."
                />
            </View>
            <Confirm
                ref={bottomsheetref}
                title={"Are you sure want to change your mobile number?"}
                description={"withdrawal will be temporarily disabled for 24 hours after any change in your password, mobile number, or email."}
                cancel={() => closebottomsheet(bottomsheetref)}
                confirm={() => {
                    navigation.navigate("ChangeNumber");
                    closebottomsheet(bottomsheetref);
                }}
            />
        </Mainview>
    )

}

export default PhoneNumber;