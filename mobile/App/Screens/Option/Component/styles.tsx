import { StyleSheet } from "react-native";

import { Colors, Fontsize } from "../../../Utilities/uiasset";
import { borderradius } from "../../../Utilities/dimensions";

export const styles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1,
    },
    activetab: {
        // paddingHorizontal: 7,
        paddingVertical: 10,
        width: "32%",
        backgroundColor: Colors.brand,
        borderRadius: borderradius * 0.5,
        alignItems: "center",
        justifyContent: "center"
    },
    inactivetab: {
        // paddingHorizontal: 7,
        paddingVertical: 10,
        width: "32%",
        backgroundColor: theme.card,
        borderRadius: borderradius * 0.5,
        borderWidth: 1,
        borderColor: theme.theme === "dark" ? "#2F2F2F" : theme.boderColor,
        alignItems: "center",
        justifyContent: "center"
    },
    tshapeInactiveTab: {
        paddingVertical: 10,
        width: "32%",
        backgroundColor: "transparent",
        borderRadius: borderradius * 0.5,
        alignItems: "center",
        justifyContent: "center"
    },
    subcontainer: {
        flex: 1,
        marginTop: 10
    },
    headerCellFixed: {
        width: 110,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderColor: "#222",
        backgroundColor: theme.theme === "dark" ? theme.bottomheader : theme.card,
    },
    cellFixed: {
        width: 110,
        height: 60,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderColor: "#222",
    },
    headerText: {
        color: "#6D7584",
        fontWeight: "600",
        fontSize: Fontsize.xsmall,
        textAlign: "center"
    },

    cellText: {
        color: "#FFFFFF",
        fontSize: Fontsize.xsmall
    },
    button: {
        borderWidth: 1,
        paddingVertical: "1.5%",
        paddingHorizontal: "3%",
        borderColor: Colors.darkgray,
        borderRadius: 5
    },
    strikeHeader: {
        width: 100,
        height: 55,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#111A2D",
        borderBottomWidth: 0.5,
        borderColor: theme.tableBorder,
        alignSelf: "center",
        borderRightWidth: 10
    },
    headerRow: {
        height: 55,
        flexDirection: "row",
        backgroundColor: theme.theme === "dark" ? theme.bottomheader : theme.card,
        borderBottomWidth: 0.5,
        borderColor: theme.tableBorder,
        justifyContent: "center",
        alignItems: "center",
    },
    headerCell: {
        width: 80,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        borderColor: theme.tableBorder,
    },
    strikeCell: {
        width: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 0.5,
        borderColor: theme.tableBorder,
        alignSelf: "center"
    },
    cell: {
        width: 80,
        height: 100,
        justifyContent: "center",
        alignItems: "center",
        borderColor: theme.tableBorder,
    },
    cells: {
        width: 80,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
        borderColor: theme.tableBorder,
    },
    rows: {
        flexDirection: "row",
        height: 50,
        borderBottomWidth: 0.5,
        borderColor: theme.tableBorder,
    },
    row: {
        flexDirection: "row",
        height: 100,
        borderBottomWidth: 0.5,
        borderColor: theme.tableBorder,
    },
    text: {
        color: theme.theme === "dark" ? "#ccc" : Colors.dune,
        textAlign: "center",
        fontSize: Fontsize.xsmall
    },
    all: {
        width: 60,
        paddingVertical: 10,
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
        alignItems: "center"
    },
    calls: {
        paddingVertical: 10,
        paddingHorizontal: 12
    },
    puts: {
        width: 60,
        paddingVertical: 10,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
        alignItems: "center"
    },
    coin: {
        paddingHorizontal: 20,
        flexDirection: "row",
        gap: 10
    },
    contracts: {
        paddingHorizontal: 20,
        marginTop: "3%",
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center"
    },
    date: {
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
        width: "40%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 5
    },
    putss: {
        flexDirection: "row",
        gap: 3
    },
    expiry: {
        paddingHorizontal: 20,
        marginTop: '4%',
        alignItems: "center"
    },
    statContainer: {
        paddingHorizontal: 10,
        height: "100%",
        justifyContent: "center",
        gap: 2,
    },
    loader: {
        flexDirection: 'row',
        justifyContent: "center",
        flex: 1
    },
    mark: {
        alignItems: "flex-start",
        borderBottomWidth: 0.5,
        borderColor: theme.tableBorder
    },
    markPrice: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 8
    },
    strikePrice: {
        backgroundColor: Colors.brand,
        width: 80,
        borderTopRightRadius: 10,
        borderBottomEndRadius: 10,
        paddingVertical: 2,
        flexDirection: "row",
        alignItems: "center"
    },
    line: {
        borderBottomWidth: 1,
        borderColor: Colors.brand,
        width: '100%'
    },
    strike: {
        justifyContent: "space-around",
        borderBottomWidth: 0.5,
        borderRightWidth: 0.5,
        borderColor: theme.tableBorder,
        backgroundColor: theme.background
    }
});