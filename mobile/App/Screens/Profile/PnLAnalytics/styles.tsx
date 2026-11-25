import { StyleSheet } from "react-native";

import { Colors } from "../../../Utilities/uiasset";

export const styles = (theme: any) => StyleSheet.create({

    line: {
        borderBottomWidth: 0.8,
        borderStyle: "dashed",
        borderBlockColor: theme.darktext,
        width: "80%",
        marginVertical: '2%'
    },
    container: {
        justifyContent: "center",
        marginTop: "5%",
        borderWidth: 1,
        borderColor: theme.infoCardBorder,
        backgroundColor: theme.infoCardBg,
    },
    contentContainer: {
        marginHorizontal: "4%",
        marginRight: "5%",
    },
    toolTip: {
        paddingHorizontal: 10,
        backgroundColor: theme.theme == "dark" ? Colors.datebg_txt : "#ccc",
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 2,
        top: 20,
    },
    label: {
        color: Colors.grey,
        fontSize: 9,
        fontWeight: "600",
        textAlign: "center",
        width: 60,
        transform: [{ rotate: "-30deg" }],
    },
    yaxis: {
        color: Colors.grey,
        fontSize: 12,
        textAlign: "right",
    },
    noData: {
        height: 250,
        alignItems: "center",
        justifyContent: "center",
    },
    pnl: {
        paddingHorizontal: '4%',
        paddingVertical: '5%',
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    }
})