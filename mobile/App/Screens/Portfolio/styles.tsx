import { StyleSheet } from "react-native";

import { Colors } from "../../Utilities/uiasset";
import { borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";

export const styles = (theme: any) => StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        borderBottomWidth: 2,
        borderBottomColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
        marginTop: 10,
        position: "relative",
    },
    tab: {
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 10
    },
    tabContent: {
        height: 2,
        backgroundColor: theme.darktext,
        width: windowwidth * 0.10,
        borderRadius: 1,
        position: "absolute",
        bottom: -10,
    },
    balance: {
        paddingHorizontal: 20,
        marginTop: "6%"
    },
    balanceContainer: {
        padding: 15,
        width: "100%",
        paddingVertical: "5%",
        marginBottom: "5%"
    },
    add: {
        marginTop: "2%",
        width: "38%",
        height: windowheight * 0.040
    },
    accrodion: {
        paddingHorizontal: 20,
        paddingVertical: "3%",
        borderRadius: 0,
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20
    },
    line: {
        width: "100%",
        borderBottomWidth: 1,
        borderStyle: "dashed",
        borderColor: Colors.grey,
        marginVertical: "3%"
    },
    rate: {
        padding: '2.5%',
        alignItems: "center",
        marginVertical: "10%"
    },
    padding: {
        paddingHorizontal: 20,
        flex: 1
    },
    position: {
        marginTop: "2.5%",
        padding: 10,
        width: "100%",
        borderWidth: 1,
        borderColor: theme.card
    },
    positionCard: {
        padding: 15,
        paddingVertical: 5,
        marginTop: 10
    },
    center: {
        width: "40%",
        alignItems: "center"
    },
    end: {
        width: "20%",
        alignItems: "flex-end"
    },
    bal: {
        alignItems: "flex-end",
        width: "20%"
    },
    bottom: {
        justifyContent: "space-between",
        paddingTop: 10,
        width: "100%"
    },
    algin: {
        alignSelf: "flex-start",
        justifyContent: "flex-start",
        alignItems: "center",
        flexDirection: "row",
        gap: 10
    },
    between: {
        flexDirection: "row",
        justifyContent: "space-between"
    },
    action: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.background,
        width: windowwidth * 0.1,
        height: windowwidth * 0.1,
        borderRadius: borderradius * 3
    },
    remove: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.background,
        width: windowwidth * 0.1,
        height: windowwidth * 0.1,
        borderRadius: borderradius * 3
    },
    noData: {
        height: windowheight * 0.5,
        justifyContent: "center",
        alignItems: "center"
    },
    addText: {
        backgroundColor: Colors.brand,
        borderWidth: 1,
        borderColor: Colors.btnBgGreen,
        borderRadius: 5,
        width: windowwidth * 0.22,
        alignItems: "center",
        justifyContent: "center"
    },
    det: {
        flexDirection: "row",
        width: "auto",
        alignItems: "center"
    },
    added: {
        color: Colors.textWhite,
        paddingVertical: 5
    },
    close: {
        color: Colors.red,
        paddingVertical: 5
    },
    closeContainer: {
        borderColor: Colors.red,
        borderWidth: 1,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        height: 30,
        width: windowwidth * 0.22
    },
    border: {
        padding: "5%",
        borderWidth: 1,
        borderColor: theme.boderColor
    },
    header: {
        padding: "4%",
        backgroundColor: theme.bottomheader,
        paddingHorizontal: "5%",
    },
    containerCon: {
        flex: 1,
        padding: "5%",
        width: "100%"
    },
    market: {
        flexDirection: 'row',
        marginBottom: "5%"
    },
    marketContent: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 5
    },
    limitContent: {
        width: "25%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 5,
        marginLeft: 15
    },
    quan: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 5
    },
    percent: {
        width: "15%",
        paddingVertical: 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5
    },
    confim: {
        width: "35%",
        marginLeft: 10
    },
    cancel: {
        width: "35%",
        backgroundColor: theme.card
    },
    quantity: {
        textAlign: 'right',
        marginRight: 60
    },
    icon: {
        backgroundColor: Colors.dune,
        width: 40,
        height: 40,
        borderRadius: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    token: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: "5%",
        paddingVertical: "3%"
    },
    tokenContainer: {
        borderRadius: 15,
        marginBottom: "5%"
    },
    borderLight: {
        borderWidth: 0.5,
        borderColor: theme.theme === "dark" ? theme.boderlight : "#ebeaeaff"
    }
})