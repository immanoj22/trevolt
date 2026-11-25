import { useState } from "react";
import { getItem, setItem } from "../Storage/localstorage";

export default function useCurrency(defaultValue = "INR") {
    // getItem is synchronous (MMKV), so the stored value is read in the state
    // initializer rather than in an effect. Initialising to the default and
    // correcting a tick later meant the FIRST render always reported "INR" even
    // when USDT was selected — visible as a flash, and TransferFunds derives both
    // its amount label and the `symbol` it submits from this value.
    const [currency, setCurrency] = useState(
        () => (getItem("convertCurrency") || defaultValue).toUpperCase().trim()
    );

    const updateCurrency = async (newCurrency: string) => {
        setCurrency(newCurrency);
        await setItem("convertCurrency", newCurrency);
    };

    return { currency, setCurrency: updateCurrency };
}
