import { StyleSheet } from "react-native";

import { Colors, Fontfamily, Fontsize } from "../../Utilities/uiasset";
import { borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";

export const styles = (theme: any) => StyleSheet.create({
    sheetContainer: {
        padding: "5%",
        borderWidth: 1,
        borderColor: theme.boderColor
    },
    sheet: {
        padding: "4%",
        paddingHorizontal: "5%"
    },
    between: {
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: "center"
    },
    swtich: {
        width: windowwidth * 0.25,
        height: windowheight * 0.040,
        marginTop: "3%",
        backgroundColor: theme.theme === "dark" ? "#31880828" : Colors.brand,
        borderRadius: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: Colors.brand
    },
    line: {
        borderBottomWidth: 1,
        borderStyle: "dashed",
        borderBottomColor: theme.theme === "dark" ? Colors.grey : theme.boderColor,
        marginTop: "3%"
    },
    input: {
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC", 
        padding: 5, 
        borderRadius: 5, 
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
    },
    inputStyle: {
        textAlign: 'right',
        marginRight: 25
    },
    buySellInput: {
        textAlign: 'right',
        marginRight: 35,
        fontSize: Fontsize.small,
        borderColor: "red",
        height: 45,
    },
    container: {
        flex: 1,
        marginBottom: windowheight * 0.085
    },
    quan: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 3,
    },
    quantity: {
        textAlign: 'right',
        marginRight: 60,
        paddingLeft: 60
    },
    percent: {
        width: "23%",
        paddingVertical: 6,
        backgroundColor: theme.card,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5,
        borderWidth: 1,
        borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor
    },
    addButton: {
        width: "20%",
        height: 35,
        borderRadius: 5
    },
    check: {
        borderColor: theme.theme === "dark" ? Colors.dune : theme.boderColor,
        borderWidth: 1
    },
    buttonContainer: {
        position: "absolute",
        bottom: 0,
        backgroundColor: theme.card,
        height: windowheight * 0.085,
        // "100%" of whatever parent this is embedded in (a full screen when pushed via
        // navigation, a 53%-wide column when embedded inline) - a literal windowwidth
        // pixel value here made the Buy/Sell bar always span the full device width and
        // spill out of a narrower embedded column.
        width: "100%",
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center"
    },
    sell: {
        width: "70%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: windowwidth * 0.025,
        borderRadius: borderradius * 0.5
    },
    activeButton: {
        backgroundColor: Colors.primary,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 14,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 35,
        left: 0,
        right: 0,
        backgroundColor: '#1A1A1A',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#333',
        zIndex: 999,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    menuItemText: {
        color: Colors.white,
        fontSize: 14,
    },
    activeItem: {
        backgroundColor: Colors.darkgray,
    },
    activeItemText: {
        color: Colors.white,
    },
    menu: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: windowwidth * 0.03,
        marginTop: '2%',
        paddingHorizontal: "6%"
    },
    lines: {
        borderBottomWidth: 1.5,
        borderColor: theme.boderColor,
        marginBottom: '5%',
        width: "100%",
        alignSelf: "center"
    },
    buy: {
        width: "40%",
        borderWidth: 1,
        borderColor: Colors.brand,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: borderradius * 0.5,
        paddingVertical: "2.5%"
    },
    sellBtn: {
        width: "40%",
        borderWidth: 1,
        borderColor: Colors.red,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: borderradius * 0.5,
        paddingVertical: "2.5%"
    },
    close: {
        width: "10%",
        alignItems: "center",
        justifyContent: "center"
    },
    card: {
        borderRadius: borderradius * 0.5,
        borderColor: theme.boderColor
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
    linee: {
        borderBottomWidth: 1,
        borderBottomColor: theme.graytext,
        borderStyle: "dotted",
    },
    text: {
        color: theme.graytext,
        fontWeight: "600",
        fontSize: Fontsize.tiny,
        fontFamily: Fontfamily.regular,
        paddingBottom: 2,
    },
    modalone: {
        padding: 12,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.theme === "dark" ? Colors.darkgray : theme.boderColor,
        marginTop: -110,
    },
    modaltwo: {
        padding: 5,
        backgroundColor: theme.card,
        borderWidth: 1,
        borderColor: theme.theme === "dark" ? Colors.darkgray : theme.boderColor,
        marginTop: -40,
    }
})