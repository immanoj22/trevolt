import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import TabHeader from "./Tab";
import Text from "../../../../Components/text";
import Images from "../../../../Utilities/images";
import { Button } from "../../../../Components/Field";
import { Colors } from "../../../../Utilities/uiasset";
import Sheet from "../../../../Components/bottomsheet";
import VectorIcons from "../../../../Utilities/vectoricons";
import useApiError from "../../../../Actions/Hooks/errorhook";
import { useSubAccountMarginMutation } from "../../../../Slices/subAccount";
import useCustomHooks, { useApihooks } from "../../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../../Utilities/dimensions";

import { styles } from "../../styles";

interface ConfirmProps {
    ref?: any;
    title?: any;
    value?: string;
    onChange?: any;
    accountId?: any;
    onClose?: () => void;
    confirm?: () => void;
    onContinue?: () => void;
}

const UpdateMarginComponent: React.FC<ConfirmProps> = ({
    ref,
    title,
    value,
    onChange,
    onClose,
    accountId,
    onContinue
}) => {
    const { theme, navigation, successtoast, failuretoast } = useCustomHooks();
    const { Fetchsubaccounts, triggeruserdetails } = useApihooks();
    const style = styles(theme);
    const [activeindex, setActiveindex] = useState(value);

    // activeindex only ever came from the initial `value` at mount - since this sheet
    // stays mounted (it's a persistent BottomSheetModal, not remounted per open), it
    // never picked up a fresh `value` on a later open, and a rejected switch (e.g. the
    // backend blocking changes to the main account) left it stuck showing the attempted
    // selection instead of what's actually saved, until a full app restart remounted
    // everything fresh. Re-sync whenever the real value changes or the sheet reopens.
    useEffect(() => {
        setActiveindex(value);
    }, [value]);

    const [changeMargin, { error, isLoading }] = useSubAccountMarginMutation();
    useApiError(error ?? false);

    const handleSubmit = async (margin: string) => {
        const paylaod: any = {
            "marginMode": margin,
            "accountId": accountId
        }
        try {
            const response = await changeMargin(paylaod).unwrap()
            if (response.success) {
                successtoast("Success", response.message);
                Fetchsubaccounts();
                // Fetchsubaccounts only refreshes the separate subAccount list - it never
                // updates state.auth.userData.marginMode, which is the field every other
                // screen (Positions, OpenOrders, the trade screens) actually reads the
                // active account's margin mode from. Without this, that field stayed
                // stale until the next full app-level userData refetch.
                triggeruserdetails();
                onContinue?.()
            } else {
                // Was a hardcoded generic message regardless of why the backend actually
                // rejected the switch (e.g. the main account, which the backend always
                // blocks - see AccountHook.js's UpdateSubAccount) - showed "Something
                // went wrong" for every failure instead of the real reason. Also revert
                // the tab back to the real current value - it was left on the rejected
                // selection otherwise.
                failuretoast("Error", response.message || "Something went wrong!");
                setActiveindex(value);
            }
        } catch (e: any) {
            // .unwrap() rejects on a failed request (e.g. 400 validation error) - this
            // had no catch at all before, which is an unhandled promise rejection.
            // Not re-toasting here: useApiError(error) above already shows the real
            // backend message (error.data.message) once the mutation's error state
            // updates - toasting again here would just duplicate it.
            console.log("handleSubmit__err", e);
            setActiveindex(value);
        }
    }

    return (
        <Sheet
            sheetref={ref}
            snappoint={["45%"]}
            custominterface={true}
            backgroundStyle={style.sheet}
        >
            <View style={{
                padding: "4%",
                paddingHorizontal: "5%"
            }}>
                <View style={style.between}>
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>{title}</Text>
                    <Pressable onPress={() => { onChange?.("cross"); onClose?.() }}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.060}
                            height={windowheight * 0.040}
                        />
                    </Pressable>
                </View>
            </View>
            <View style={{ padding: "5%" }}>
                <TabHeader
                    style={style}
                    theme={theme}
                    tabs={["Isolated", "Portfolio", "Cross"]}
                    activeindex={activeindex}
                    onchangeindex={setActiveindex}
                    hiddenValues={["portfolio"]}
                />
                {
                    activeindex === "isolated" && (
                        <>
                            <Text style={{ color: Colors.grey }}>You can trade</Text>
                            <View style={{ marginBottom: "4%", flexDirection: "row", alignItems: "center" }}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.050}
                                />
                                <Text style={{ color: theme.darktext, marginTop: "1%" }}> All instruments / pairs</Text>
                            </View>
                            <Text style={{ color: Colors.grey }}>Salient points</Text>
                            <View style={[{ flexDirection: "row" }]}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    style={{ marginTop: 5 }}
                                />
                                <Text style={{ color: theme.darktext, marginTop: "1%" }}> Flexible leverage</Text>
                            </View>
                            {
                                value === "isolated" ? (
                                    <Button
                                        title={"Continue with Isolated Marign"}
                                        buttonStyle={{ marginTop: "5%" }}
                                        onPress={onContinue}
                                        textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                    />
                                ) : (
                                    <Button
                                        title={"Switch to Isolated Margin"}
                                        buttonStyle={{ marginTop: "5%" }}
                                        loading={isLoading}
                                        onPress={() => handleSubmit("isolated")}
                                        textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                    />
                                )
                            }
                        </>
                    )
                }
                {
                    activeindex === "portfolio" && (
                        <>
                            <Text style={{ color: Colors.grey }}>You can trade</Text>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.040}
                                />
                                <Text style={{ color: theme.darktext }}> Options</Text>
                            </View>
                            <View style={[{ flexDirection: "row", alignItems: "center", marginTop: "1%" }]}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.040}
                                />
                                <Text style={{ color: theme.darktext, flexShrink: 1 }}> Futures for underlyings with Options</Text>
                            </View>
                            <Text style={{ color: Colors.grey, marginTop: "4%" }}>Salient points</Text>
                            <View style={[{ flexDirection: "row" }]}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.040}
                                />
                                <Text style={{ color: theme.darktext, flexShrink: 1 }}> PNL offset - Open positions profits can support losses and new orders</Text>
                            </View>
                            <View style={[{ flexDirection: "row", alignItems: "center", marginTop: "1%" }]}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.040}
                                />
                                <Text style={{ color: theme.darktext, flexShrink: 1 }}> Risk offset</Text>
                            </View>
                            {
                                value === "portfolio" ? (
                                    <Button
                                        title={"Continue with Portfolio Margin"}
                                        buttonStyle={{ marginTop: "5%" }}
                                        onPress={onContinue}
                                        textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                    />
                                ) : (
                                    <Button
                                        title={"Switch to Portfolio Margin"}
                                        buttonStyle={{ marginTop: "5%" }}
                                        loading={isLoading}
                                        onPress={() => handleSubmit("portfolio")}
                                        textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                    />
                                )
                            }
                        </>
                    )
                }
                {
                    activeindex === "cross" && (
                        <>
                            <Text style={{ color: Colors.grey }}>You can trade</Text>
                            <View style={{ marginBottom: "4%", flexDirection: "row", alignItems: "center" }}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    size={windowwidth * 0.050}
                                />
                                <Text style={{ color: theme.darktext, marginTop: "1%" }}> All instruments / pairs</Text>
                            </View>
                            <Text style={{ color: Colors.grey }}>Salient points</Text>
                            <View style={[{ flexDirection: "row" }]}>
                                <VectorIcons
                                    family="Feather"
                                    name="check"
                                    iconcolor={Colors.brand}
                                    style={{ marginTop: 5 }}
                                />
                                <Text style={{ color: theme.darktext, marginTop: "1%", flexShrink: 1 }}> PNL offset - Open positions profits can support losses and new orders</Text>
                            </View>
                            {
                                value === "cross" ? (
                                    <Button
                                        title={"Continue with Cross Margin"}
                                        buttonStyle={{ marginTop: "5%" }}
                                        onPress={onContinue}
                                        textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                    />
                                ) : (
                                    <Button
                                        title={"Switch to Cross Margin"}
                                        buttonStyle={{ marginTop: "5%" }}
                                        loading={isLoading}
                                        onPress={() => handleSubmit("cross")}
                                        textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                                    />
                                )
                            }
                        </>
                    )
                }
            </View>
        </Sheet>
    )

}

// Stays mounted (just hidden) inside BuysellNew - see PlaceOrder.tsx's identical note.
const UpdateMargin = React.memo(UpdateMarginComponent);

export default UpdateMargin;