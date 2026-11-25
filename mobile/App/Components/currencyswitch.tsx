import React from "react";
import { StyleProp, ViewStyle } from "react-native";

import SegmentedControl from "./segemental";
import useCustomHooks from "../Actions/Hooks/customhook";
import { windowheight, windowwidth } from "../Utilities/dimensions";
import { formatDisplayPair } from "../Utilities/formatPair";

interface CurrencyswitchProps {
    index: string;
    onchangeindex: (currency: string) => void;
    style?: StyleProp<ViewStyle>;
}

const Currencyswitch: React.FC<CurrencyswitchProps> = ({
    index = "INR",
    onchangeindex,
    style = { alignSelf: "flex-end" },
}) => {
    const { theme } = useCustomHooks();
    // `tabs` stays the internal value SegmentedControl reports back via onChange;
    // `displayTabs` is only what it renders - same order/length, so indices line up.
    const tabs = ["INR", "USDT",];
    const displayTabs = tabs.map((tab) => formatDisplayPair(tab));

    const normalized = String(index).toUpperCase().trim();
    const currentIndex = Math.max(tabs.indexOf(normalized), 0);

    return (
        <SegmentedControl
            tabs={displayTabs}
            currentIndex={currentIndex}
            width={windowwidth * 0.3}
            height={windowheight * 0.045}
            onChange={(i: number) => onchangeindex(tabs[i])}
            activeSegmentBackgroundColor="#2563EB"
            segmentedControlBackgroundColor={theme.card}
            bgstyle={style}
            
        />
    );
};

export default Currencyswitch;