import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Mainview from "../Components/mainview";
import { Stacknavigationtypes } from "../Navigations/navigationtypes";
import useCustomHooks from "../Actions/Hooks/customhook";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Test'>;

const Test: React.FC<Props> = () => {
    const {theme} = useCustomHooks()
    return (
        <Mainview
            headertitle="Test"
            isscollable={true}
            ismainloading={false}
            isnodata={false}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.45, 1]}
        >
        </Mainview>
    )
}

export default Test;