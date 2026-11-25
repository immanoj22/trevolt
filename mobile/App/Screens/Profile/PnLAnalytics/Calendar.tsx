

import React, { useContext, useState } from "react";
import { View } from "react-native";

import Sheet from "../../../Components/bottomsheet";
import { Colors } from "../../../Utilities/uiasset";
import VectorIcons from "../../../Utilities/vectoricons";
import ThemeContext from "../../../Utilities/themecontext";
import Flexcomponent from "../../../Components/flexcomponent";
import { Button, InputDateTime } from "../../../Components/Field";
import { windowheight, windowwidth } from "../../../Utilities/dimensions";

interface Logfilterprops {
    sheetref?: any;
    snappoint?: any;
    onselect?: any
}

const Calendar: React.FC<Logfilterprops> = ({
    sheetref,
    snappoint,
    onselect,
}) => {
    const [startdate, setStartdate] = useState<any>("")
    const [enddate, setEnddate] = useState<any>("")

    const theme = useContext(ThemeContext);

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
            <View style={{ marginTop: "10%", flexDirection: "row", justifyContent: "space-between", height: windowheight * 0.06, borderRadius: 10 }}>
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
                    datePickerProps={{
                        maximumDate: new Date()
                    }}
                    containerstyle={{ width: windowwidth * 0.40, paddingHorizontal: 20 }}
                    themes={theme}
                    restrictFuture
                    rightIcon={
                        <VectorIcons
                            name={"calendar"}
                            family="Feather"
                            iconcolor={theme.secondarytext}
                            size={windowwidth * 0.045}
                        />
                    }
                />
                <InputDateTime
                    placeHolder="End date"
                    inputType="date"
                    value={enddate}
                    onConfirm={(text: any) => {
                        setEnddate(text)
                    }}
                    datePickerProps={{
                        maximumDate: new Date(),
                        minimumDate: startdate ? new Date(startdate) : undefined,
                    }}
                    containerstyle={{ width: windowwidth * 0.40, paddingHorizontal: 20 }}
                    themes={theme}
                    restrictFuture
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
            <Flexcomponent justifyContent="center" top={"10%"} style={{ paddingHorizontal: "5%" }}>
                <Button
                    title="Reset"
                    style={{ height: windowheight * 0.05, alignSelf: "center", borderRadius: 100, borderColor: Colors.brand, width: "40%", justifyContent: "center", alignItems: "center", borderWidth: 1 }}
                    onPress={() => {
                        setStartdate("")
                        setEnddate("")
                    }}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.white : Colors.black }}
                />
                <View style={{ width: "10%" }} />
                <Button
                    title="Apply"
                    style={{ height: windowheight * 0.05, alignSelf: "center", borderRadius: 100, backgroundColor: Colors.brand, width: "40%", justifyContent: "center", alignItems: "center" }}
                    onPress={() => {
                        onselect({ startDate: toStartOfDay(startdate), endDate: toEndOfDay(enddate) }, true)
                        sheetref?.current?.dismiss()
                    }}
                    textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                />
            </Flexcomponent>
        </Sheet>
    )

}

export default Calendar;