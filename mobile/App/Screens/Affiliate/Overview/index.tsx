import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Dashboard from "./Dashboard";
import RewardsHub from "./RewardHub";
import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import Mainview from "../../../Components/mainview";
import ComingSoon from "../../../Components/ComingSoon";
import { RFvalue } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";

import styles from "../styles";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'Overview'>;

const Overview: React.FC<Props> = () => {
    const { theme, navigation } = useCustomHooks();
    const style = styles(theme);
    const [activeTab, setActiveTab] = useState("Dashboard");

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle={""}
            horizontalpadding={0}
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            {/* Affiliate isn't available for this release yet - matches web's
                ComingSoon gate on OptionsTrading.jsx (same pattern applied here).
                Flip this back to render the original tabs/Dashboard/RewardsHub
                content to re-enable - nothing below was removed, only gated. */}
            <ComingSoon message="Affiliate isn't available yet. Please check back later." />
        </Mainview>
    )

}

export default Overview;