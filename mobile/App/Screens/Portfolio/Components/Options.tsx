import React from "react";
import { Pressable, View } from "react-native";
import { useSelector } from "react-redux";

import CancelOrder from "./CancelOrder";
import Text from "../../../Components/text";
import { Button } from "../../../Components/Field";
import VectorIcons from "../../../Utilities/vectoricons";
import useApiError from "../../../Actions/Hooks/errorhook";
import { windowwidth } from "../../../Utilities/dimensions";
import { Colors, Fontsize } from "../../../Utilities/uiasset";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks, { Commonalert, useApihooks } from "../../../Actions/Hooks/customhook";
import { setCancelOrders, setPairsList, useCancelAllOrdersMutation, useCloseAllOrdersMutation } from "../../../Slices/future";

interface Optionsprops {
    active: any;
    ref?: any,
    title?: any
    tab?: any
    onFetch?: any
    containerStyle?: any
    // Trade-page callers (e.g. the embedded Positions tab on the Future/Option chart
    // screens) don't have an "All/Current Contract/Options/Futures" scope bottomsheet
    // wired up - they just want the Payoff/Close buttons, so the filter pill is optional.
    showFilter?: boolean
}

const Options: React.FC<Optionsprops> = ({
    active,
    ref,
    title,
    tab,
    onFetch,
    containerStyle,
    showFilter = true
}) => {
    const { theme, openbottomsheet, bottomsheetref, successtoast, dispatch, closebottomsheet } = useCustomHooks();
    const cancelOrdersList = useSelector((state: any) => state.future.cancelOrdersList);
    const cancelType = useSelector((state: any) => state.future.cancelType);
    const pairsList = useSelector((state: any) => state.future.pairsList);
    const [cancelAllOrders, { error, isLoading: cancelLoading }] = useCancelAllOrdersMutation();
    const [closeAllOrders, { error: clsErr, isLoading: closeLoading }] = useCloseAllOrdersMutation();

    useApiError(error ?? clsErr);

    const { triggerpositionOrders, triggerOpendOrders } = useApihooks();

    const handleCloseAllOrders = async () => {
        const payload = {
            pairId: pairsList
        }
        Commonalert({
            title: "Close Orders",
            des: "Are you sure you want to close this order ?",
            yes: async () => {
                try {
                    const response = await closeAllOrders(payload).unwrap();
                    if (response.success) {
                        triggerpositionOrders();
                        triggerOpendOrders();
                        onFetch?.();
                        successtoast("Success", response.message);
                        dispatch(setPairsList({
                            pairsList: []
                        }));
                        closebottomsheet(ref);
                    }
                } catch (error) {
                    console.log("Cancel order failed:", error);
                }
            },
        });
    };

    const handleCancelAllOrders = async () => {
        const payload = {
            orderId: cancelOrdersList,
            isOpen: false,
            isStop: false,
        };
        Commonalert({
            title: "Cancel Orders",
            des: "Are you sure you want to cancel this order ?",
            yes: async () => {
                try {
                    const response = await cancelAllOrders(payload).unwrap();
                    if (response.success) {
                        onFetch?.();
                        successtoast("Success", response.message);
                        dispatch(setCancelOrders({ cancelOrdersList: [], cancelType: "" })
                        );
                        closebottomsheet(ref);
                    }
                } catch (error) {
                    console.log("Cancel order failed:", error);
                }
            },
        });
    };

    const isNotFirstOrder = tab !== "Positions";
    const hasCancelOrders = cancelOrdersList.length > 0;
    const isCancelAll = cancelType === "all";

    const isDisabled = isNotFirstOrder
        ? !(isCancelAll || hasCancelOrders)
        : pairsList.length <= 0;

    const btnText = isNotFirstOrder
        ? isCancelAll
            ? "Cancel All"
            : `Cancel`
        : "Close";

    const handleClick = () => {
        if (isNotFirstOrder) {
            if (btnText === "Cancel All") openbottomsheet(bottomsheetref);
            else handleCancelAllOrders();
        } else {
            handleCloseAllOrders();
        }
    };

    return (
        <Flexcomponent justifyContent="space-between" alignItems="center" style={{ marginBottom: "5%", marginTop: "6%", paddingHorizontal: 20, ...containerStyle }}>
            {showFilter ? (
                <Pressable onPress={() => openbottomsheet(ref)} style={{ backgroundColor: theme.theme == 'dark' ? "#151a1786" : "#FFFFFF", borderWidth: 1, borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0", borderRadius: 5, alignItems: 'center', flexDirection: "row", height: 30, justifyContent: "flex-start", paddingHorizontal: 10, width: windowwidth * 0.23 }}>
                    <Text
                        family="medium"
                        size="xsmall"
                        style={{ verticalAlign: "middle", width: "75%", textAlign: "center" }}
                        numoflines={1}>{active}</Text>
                    <VectorIcons
                        family="Ionicons"
                        name={"chevron-down-outline"}
                        size={windowwidth * 0.035}
                        style={{ marginRight: 10 }}
                    />
                </Pressable>
            ) : <View />}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                {
                    ["Balances", "Positions", "Open Orders", "Stop Orders"].includes(tab) && (
                        <Button
                            disabled={isDisabled || cancelLoading || closeLoading}
                            loading={cancelLoading || closeLoading}
                            title={btnText}
                            onPress={handleClick}
                            textStyle={{ fontSize: Fontsize.xsmall, color: isDisabled ? (theme.theme === "dark" ? Colors.white : Colors.black) : Colors.red, textAlign: "center" }}
                            buttonStyle={{
                                width: windowwidth * 0.28,
                                height: 32,
                                backgroundColor: isDisabled
                                    ? (theme.theme == 'dark' ? "#101A2C" : "#E8EFFC")
                                    : "rgba(255,22,92,0.12)",
                                borderColor: isDisabled ? (theme.theme == 'dark' ? "#1B2740" : "#E2E8F0") : "rgba(255,22,92,0.4)",
                                borderWidth: 1,
                                borderRadius: 8,
                            }}
                        />
                    )
                }
                {
                    title && (
                        title
                    )
                }
            </View>

            <CancelOrder ref={bottomsheetref} />
        </Flexcomponent>
    )
}

export default Options;