import React, { useContext, useState } from "react";
import { Pressable, View } from "react-native";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useDispatch } from "react-redux";

import { Colors } from "../../../Utilities/uiasset";
import Sheet from "../../../Components/bottomsheet";
import VectorIcons from "../../../Utilities/vectoricons";
import ThemeContext from "../../../Utilities/themecontext";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { update_transactionlogdata } from "../../../Slices/helper";
import { Button, Dropdown, InputDateTime } from "../../../Components/Field";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";

interface Logfilterprops {
    sheetref: React.RefObject<BottomSheetModal | null>;
    snappoint?: any;
    onselect?: (paylaod: any) => void
    assetHistory?: any;
    exportData?: boolean

}

const Logfilter: React.FC<Logfilterprops> = ({
    sheetref,
    snappoint,
    assetHistory,
    exportData = true
}) => {
    const { navigation, closebottomsheet } = useCustomHooks();
    const [startdate, setStartdate] = useState<any>("")
    const [enddate, setEnddate] = useState<any>("")

    const theme = useContext(ThemeContext)
    const dispatch = useDispatch()

    const filter1: any = [
        { label: "All", value: "all" },
        { label: "Deposit", value: "deposit" },
        { label: "Withdraw", value: "withdraw" },
        { label: "Internal transfer", value: "internaltransfer" }]

    const filter2: any = [
        { label: "All", value: "all" },
        { label: "Credit", value: "credit" },
        { label: "Debit", value: "debit" }]

    const [fill1, setFill1] = useState("all")
    const [fill2, setFill2] = useState("all")

    // The date picker seeds itself with the current moment and only lets the
    // user change the day/month/year, so the Date it returns carries whatever
    // time-of-day the picker happened to be opened at - not midnight. Left
    // as-is, picking the same day for both Start and End collapses the query
    // range to the few seconds between the two taps instead of the full day.
    const toStartOfDay = (date: any) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    };

    const toEndOfDay = (date: any) => {
        const d = new Date(date);
        d.setHours(23, 59, 59, 999);
        return d.getTime();
    };

    return (
        <Sheet
            sheetref={sheetref}
            snappoint={snappoint}
            headertitle="Filter"
        >
            <Flexcomponent top={"5%"} justifyContent="space-between" >
                {
                    (assetHistory === "history" || assetHistory === "recenttransaction") && (
                        <>

                            <Dropdown
                                list={filter1}
                                value={fill1}
                                onChange={(value) => setFill1(value?.value)}
                                themes={theme}
                                conatinerstyle={{ width: assetHistory === "history" ? "45%" : "100%", height: windowheight * 0.05 }}

                            />

                            <Dropdown
                                list={filter2}
                                value={fill2}
                                onChange={(value) => setFill2(value?.value)}
                                themes={theme}
                                conatinerstyle={{ width: "45%", height: windowheight * 0.05 }}

                            />
                        </>
                    )
                }
            </Flexcomponent>

            <Flexcomponent justifyContent="space-between" >
                <View style={{ width: "45%", alignItems: "center" }} >
                    {/* <Text family="regular" fontSize={RFvalue(13)} color={theme.tabactive} >Start Date</Text> */}
                    <Flexcomponent
                        height={windowheight * 0.06}
                        style={{
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.theme === "dark" ? theme.boderlight : "#d7dce5",
                            backgroundColor: theme.theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.55)",
                            paddingLeft: "5%",
                            paddingRight: "2.5%"
                        }}
                        justifyContent="space-between"
                        width={"100%"}
                        top={"5%"}
                    >
                      <View style={{ flex: 1 }}>
                        <InputDateTime
                            placeHolder="Start date"
                            inputType="date"
                            value={startdate}
                            // onConfirm={(text: any) => {
                            //     setStartdate(text)
                            // }}
                            onConfirm={(date: any) => {
                                setStartdate(date)

                                if (enddate && new Date(date) > new Date(enddate)) {
                                    setEnddate("")
                                }
                            }}
                            containerstyle={{
                                height: "100%",
                                top: 3,
                                paddingHorizontal: 0,
                                backgroundColor: "transparent",
                                shadowColor: "transparent",
                                shadowOpacity: 0,
                                elevation: 0
                            }}
                            datePickerProps={{
                                maximumDate: new Date()
                            }}
                            themes={theme}
                            restrictFuture
                            // Icon lives inside InputDateTime's own Pressable so
                            // tapping it (or anywhere on the field) opens the picker.
                            rightIcon={
                                <VectorIcons
                                    name={"calendar"}
                                    family="Feather"
                                    iconcolor={theme.secondarytext}
                                    size={windowwidth * 0.045}
                                />
                            }
                        />
                      </View>
                    </Flexcomponent>
                </View>

                <View style={{ width: "45%", marginLeft: "5%", alignItems: "center" }} >
                    {/* <Text family="regular" fontSize={RFvalue(13)} color={theme.tabactive} >End Date</Text> */}
                    <Flexcomponent
                        height={windowheight * 0.06}
                        style={{
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: theme.theme === "dark" ? theme.boderlight : "#d7dce5",
                            backgroundColor: theme.theme === "dark" ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.55)",
                            paddingLeft: "5%",
                            paddingRight: "2.5%"
                        }}
                        justifyContent="space-between"
                        width={"100%"}
                        top={"5%"}
                    >
                      <View style={{ flex: 1 }}>
                        <InputDateTime
                            placeHolder="End date"
                            inputType="date"
                            value={enddate}
                            onConfirm={(text: any) => {
                                setEnddate(text)
                            }}
                            containerstyle={{
                                height: "100%",
                                top: 3,
                                paddingHorizontal: 0,
                                backgroundColor: "transparent",
                                shadowColor: "transparent",
                                shadowOpacity: 0,
                                elevation: 0
                            }}
                            datePickerProps={{
                                maximumDate: new Date(),
                                minimumDate: startdate ? new Date(startdate) : undefined,
                            }}
                            themes={theme}
                            rightIcon={
                                <VectorIcons
                                    name={"calendar"}
                                    family="Feather"
                                    iconcolor={theme.secondarytext}
                                    size={windowwidth * 0.045}
                                />
                            }
                        />
                      </View>
                    </Flexcomponent>
                </View>

            </Flexcomponent>

            <Flexcomponent justifyContent="space-between" top={"10%"} >
                <Button
                    title="Reset"
                    style={{ height: windowheight * 0.05, alignSelf: "center", borderRadius: 100, borderColor: Colors.brand, width: "40%", justifyContent: "center", alignItems: "center", borderWidth: 1 }}
                    onPress={() => {
                        setStartdate("")
                        setEnddate("")
                        setFill1("all")
                        setFill2("all")
                        dispatch(update_transactionlogdata({
                            startdate: "",
                            enddate: "",
                            transferType: "All",
                            selectedType: "All",
                            newchange: true
                        }))
                        sheetref?.current?.dismiss()
                    }}
                    textStyle={{ color: theme.theme === "dark" ? Colors.white : Colors.black }}
                />

                <Button
                    title="Apply"
                    style={{ height: windowheight * 0.05, alignSelf: "center", borderRadius: 100, backgroundColor: Colors.brand, width: "40%", justifyContent: "center", alignItems: "center" }}
                    onPress={() => {
                        const payload = {
                            startdate: startdate ? toStartOfDay(startdate) : "",
                            enddate: enddate ? toEndOfDay(enddate) : "",
                            transferType: fill1,
                            selectedType: fill2,
                            newchange: true
                        }
                        dispatch(update_transactionlogdata(payload))
                        sheetref?.current?.dismiss()
                    }}
                    textStyle={{ color: theme.theme === "dark" ? Colors.black : Colors.white }}
                />
                {
                    exportData === true && (
                        <Pressable
                            onPress={() => {
                                closebottomsheet(sheetref)
                                navigation.navigate("ExportData", { type: assetHistory })
                            }}
                            style={{ height: windowwidth * 0.11, width: windowwidth * 0.11, alignSelf: "center", borderRadius: 100, backgroundColor: theme.card, justifyContent: "center", alignItems: "center" }}>
                            <VectorIcons
                                family="Entypo"
                                name="export"
                                iconcolor={theme.darktext}
                                size={20}
                            />
                        </Pressable>
                    )
                }
            </Flexcomponent>
        </Sheet>
    )

}

export default Logfilter