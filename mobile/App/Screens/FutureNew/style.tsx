import { StyleSheet } from "react-native";

import { borderradius, windowheight } from "../../Utilities/dimensions";

export const style = (theme?: any) => StyleSheet.create({
    pricecontainer: {
        paddingHorizontal: 10,
        height: "100%",
        justifyContent: "center"
    },
    activetab: {
        width: "23%",
        height: "100%",
        backgroundColor: theme.tabactive,
        borderRadius: borderradius * 0.5,
        alignItems: "center",
        justifyContent: "center"
    },
    inactivetab: {
        width: "23%",
        height: "100%",
        backgroundColor: theme.card,
        borderRadius: borderradius * 0.5,
        borderWidth: 1,
        borderColor: theme.boderColor,
        alignItems: "center",
        justifyContent: "center"
    },
    tableconatiner: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: "2%"
    },
    table: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: theme.background,
        width: "100%",
        height: windowheight * 0.05,
        alignItems: "center"
    },
    tableContent: {
        width: "48%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    line: {
        position: 'absolute',
        top: 5,
        bottom: 0,
        right: 0,
        height: '100%',
        borderRadius: 10,
        zIndex: 0,
        transform: [{ translateY: -5 }],
    },
    content: {
        width: "100%",
        marginBottom: "3%",
        borderRadius: 10,
        overflow: 'hidden',
        paddingHorizontal: '3%'
    },
    noData: {
        width: "48%",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: "5%"
    },
    quantity: {
        paddingVertical: "2%",
        alignItems: "flex-end",
    },
    item: {
        paddingVertical: "2%",
        alignItems: "flex-start"
    },
    quan: {
        paddingVertical: "2%",
        alignItems: "flex-end",
        marginRight: "1.5%"
    },
    container: {
        flex: 1,
        flexDirection: "row",
        width: "100%"
    }
})