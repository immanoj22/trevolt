import React, { useState } from "react";
import { View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import Text from "../../../Components/text";
import Mainview from "../../../Components/mainview";
import VectorIcons from "../../../Utilities/vectoricons";
import Flexcomponent from "../../../Components/flexcomponent";
import useCustomHooks from "../../../Actions/Hooks/customhook";
import { Button, Dropdown, InputDateTime } from "../../../Components/Field";
import { Stacknavigationtypes } from "../../../Navigations/navigationtypes";
import { borderradius, windowheight, windowwidth } from "../../../Utilities/dimensions";
import { getCsvDownloader, getExcelDownloader, getPdfDownloader } from "../../../Utilities/file";

import { styles } from "../styles";
import { Colors } from "../../../Utilities/uiasset";

type Props = NativeStackScreenProps<Stacknavigationtypes, 'ExportData'>;

// Hoisted so both Dropdowns below get a stable list= reference - an inline array
// literal there would be a new array every render, which the Dropdown's internal
// effect (keyed on that reference) reads as new data and re-syncs on.
const EXPORT_TABLE_OPTIONS = [
    { label: "History", value: "history" },
    { label: "Recent Transactions", value: "recenttransaction" },
    { label: "Orders History", value: "orderhistory" },
    { label: "Fills", value: "fills" },
    { label: "Closed History", value: "closedhistory" },
];
const EXPORT_FILE_TYPE_OPTIONS = [
    // { label: "PDF", value: "PDF" },
    { label: "Excel", value: "XLS" },
    { label: "CSV", value: "CSV" },
];

const ExportData: React.FC<Props> = ({ route }) => {
    const { theme, navigation, failuretoast, successtoast } = useCustomHooks();
    const style = styles(theme);
    const { type: types } = route?.params

    const [type, setType] = useState(types);
    const [filterBy, setFilterData] = useState<any>({});
    const [loading, setBtnLoading] = useState(false)

    const handleType = (e: any) => {
        setType(e)
        setFilterData((prev: any) => ({
            ...prev,
            type: e,
        }));
    }

    const handleStartDate = (date: any) => {
        setFilterData((prev: any) => ({
            ...prev,
            startDate: date,
        }));
    };

    const handleEndDate = (date: any) => {
        setFilterData((prev: any) => ({
            ...prev,
            endDate: date,
        }));
    };

    const handleDownload = async () => {

        if (!type) {
            failuretoast("Error", "Please select a table type");
            return;
        }
        if (!filterBy?.fileType) {
            failuretoast("Error", "Please select a file type");
            return;
        }

        const payload = {
            ...filterBy,
            startDate: filterBy.startDate?.getTime() || "",
            endDate: filterBy.endDate?.getTime() || "",
        };

        try {
            setBtnLoading(true)

            if (filterBy?.fileType == "XLS") {
                const result = await getExcelDownloader(payload, type + "." + "XLS")
                if (result?.status) {
                    successtoast("Success", "Excel file downloaded!");
                } else {
                    failuretoast("Error", "Failed to download Excel");
                }
            }

            if (filterBy?.fileType == "CSV") {
                const result = await getCsvDownloader(payload, type + "." + "CSV")
                if (result?.status) {
                    successtoast("Success", "CSV file downloaded!");
                } else {
                    failuretoast("Error", "Failed to download CSV");
                }
                return
            }

            if (filterBy?.fileType == "PDF") {
                const result = await getPdfDownloader(payload, type + "." + "PDF")
                if (result?.status) {
                    successtoast("Success", "PDF file downloaded!");
                } else {
                    failuretoast("Error", "Failed to download PDF");
                }
                return
            }
        } catch (err) {
            failuretoast("Error", "Something went wrong while downloading the file.");
        } finally {
            setBtnLoading(false);
            setFilterData({})
            setType("")
        }
    };

    return (
        <Mainview
            isheader={true}
            isscollable={false}
            headertitle="Export Data"
            onleftfn={() => navigation.goBack()}
            gradientColors={theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"]}
            gradientLocations={[0, 0.20, 1]}
        >
            <View style={style.container}>
                <Dropdown
                    value={type}
                    list={EXPORT_TABLE_OPTIONS}
                    label="Select Export Table"
                    placeholder="Select Type"
                    onChange={(e) => {
                        handleType(e.value)
                    }}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                    modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />
                <Dropdown
                    list={EXPORT_FILE_TYPE_OPTIONS}
                    value={filterBy.fileType}
                    label="Select Export Table"
                    placeholder="Select File type"
                    onChange={(e) => {
                        setFilterData((prev: any) => ({ ...prev, fileType: e.value, type: type }))
                    }}
                    background={theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"}
                        modleSyle={{ borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0" }}
                />

                <Flexcomponent justifyContent="space-between" >
                    <View style={{ width: "45%", alignItems: "flex-start" }} >
                        <Text style={[{ color: theme.secondarytext }]}>Start Date</Text>
                        <InputDateTime
                            placeHolder="dd/mm/yyyy"
                            inputType="date"
                            value={filterBy.startDate}
                            onConfirm={(text: any) => handleStartDate(text)}
                            containerstyle={{
                                width: windowwidth * 0.4,
                                marginTop: "5%",
                                borderRadius: borderradius * 0.5,
                                backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"
                            }}
                            restrictFuture={true}
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
                    <View style={{ width: "45%", marginLeft: "5%", alignItems: "flex-start" }} >
                        <Text style={[{ color: theme.secondarytext }]}>End Date</Text>
                        <InputDateTime
                            placeHolder="dd/mm/yyyy"
                            inputType="date"
                            value={filterBy.endDate}
                            onConfirm={(text: any) => handleEndDate(text)}
                            containerstyle={{
                                width: windowwidth * 0.4,
                                marginTop: "5%",
                                borderRadius: borderradius * 0.5,
                                backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC"
                            }}
                            restrictFuture={true}
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

                <View style={{ marginTop: "10%" }}>
                    <Button
                        title="Download"
                        buttonStyle={{ width: "35%" }}
                        onPress={handleDownload}
                        loading={loading}
                        textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                    />
                </View>
            </View>
        </Mainview>
    )

}

export default ExportData;