import { StyleSheet } from "react-native";

import { Colors, Fontfamily, Fontsize } from "../../Utilities/uiasset";
import { borderradius, windowheight, windowwidth } from "../../Utilities/dimensions";

export const style = (theme?: any) => StyleSheet.create({

    container: {
        flex: 1
    },
    trade: {
        height: windowheight * 0.05,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: "2.5%",
        paddingHorizontal: "3%",
        backgroundColor: "#2563EB",
        borderRadius: borderradius * 0.5
    },
    between: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        marginTop: "5%"
    },
    search: {
        height: windowheight * 0.05,
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
        borderRadius: borderradius * 0.40,
        alignItems: "center"
    },
    searchText: {
        flex: 1,
        paddingHorizontal: "2.5%",
        paddingVertical: 0,
        textAlignVertical: "center",
        color: theme.textinput,
        fontFamily: Fontfamily.regular,
        fontSize: Fontsize.semimedium
    },
    icon: {
        marginLeft: 5,
        marginRight: 3
    },
    select: {
        borderRadius: borderradius * 0.40,
        paddingHorizontal: 15
    },
    card: {
        padding: "5%",
        borderRadius: borderradius * 0.5,
        marginBottom: "2.5%"
    },
    man: {
        width: windowwidth * 0.15,
        height: windowwidth * 0.15
    },
    name: {
        width: "70%",
        paddingHorizontal: windowwidth * 0.025
    },
    content: {
        padding: "5%",
        marginTop: "5%"
    },
    copy: {
        width: "45%",
        backgroundColor: theme.theme === "dark" ? "#24272C" : Colors.white,
        marginTop: "5%",
        borderRadius: borderradius * 0.5,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: "2.5%"
    },
    profile: {
        width: "20%",
        marginRight: 10
    },
    activetab: {
        alignSelf: "center",
        borderBottomWidth: 1,
        borderBottomColor: theme.boderColor,
        height: windowheight * 0.045,
        paddingHorizontal: "5%",
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
        width: windowwidth
    },
    tab: {
        paddingHorizontal: 15,
        paddingVertical: 6,
        marginRight: 15,
    },
    profileContainer: {
        width: "30%",
        alignItems: "center"
    },
    follow: {
        backgroundColor: "#05398b",
        marginTop: "5%",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: "4%",
        borderRadius: borderradius * 2,
        width: "80%"
    },
    profileContent: {
        width: "70%",
        paddingLeft: "2%"
    },
    icons: {
        width: windowwidth * 0.06,
        height: windowwidth * 0.06,
        backgroundColor: theme.tabactive,
        borderRadius: borderradius * 3,
        justifyContent: "center",
        alignItems: "center"
    },
    copier: {
        flexDirection: 'row',
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: "5%",
        marginBottom: "10%"
    },
    contentname: {
        marginLeft: 8,
        marginTop: 3
    },
    pnl: {
        alignItems: "center",
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF",
        borderWidth: 1,
        borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
        padding: 10,
        borderRadius: 5,
        width: "30%"
    },
    user: {
        flexDirection: 'row',
        width: "60%"
    },
    master: {
        width: "60%",
        backgroundColor: theme.background,
        borderWidth: 1,
        borderColor: Colors.dustygrey
    },
    userContainer: {
        marginTop: "3%",
        justifyContent: "space-between"
    },
    pair: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        width: "auto",
        paddingHorizontal: '5%',
        marginBottom: "5%"
    },
    selectPair: {
        paddingVertical: "2%",
        borderRadius: borderradius * 0.5,
        backgroundColor: Colors.brand,
        paddingHorizontal: "5%"
    },
    header: {
        borderRadius: 5,
        flexDirection: 'row',
        backgroundColor: theme.card,
        justifyContent: "space-between",
        alignItems: "center",
    },
    nav: {
        paddingHorizontal: 15,
        borderRadius: 5,
        height: 35,
        alignItems: "center",
        justifyContent: "center"
    },
    order: {
        flex: 1,
        marginTop: "5%"
    },
    orders: {
        padding: 15,
        marginBottom: 10,
        backgroundColor: theme.card
    },
    date: {
        padding: "2.5%",
        width: "48%",
        alignItems: "center"
    },
    status: {
        width: "50%",
        alignItems: "flex-end"
    },
    rightContent: {
        flex: 0.5,
        alignItems: "flex-end"
    },
    line: {
        backgroundColor: theme.background,
        width: "100%",
        height: 8
    },
    tabContent: {
        marginTop: '5%',
        backgroundColor: theme.background
    },
    viewCopier: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 15,
        marginBottom: "5%"
    },
    unFollow: {
        backgroundColor: Colors.brand,
        paddingVertical: "2%",
        paddingHorizontal: "5%",
        borderRadius: 10
    },
    orderHistory: {
        flexDirection: 'row',
        justifyContent: "space-around",
        borderBottomWidth: 1,
        borderColor: theme.boderColor,
        alignItems: "center",
        width: "100%",

    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: "space-around",
        alignItems: "center",
        width: "100%",
    },
    item: {
        width: "50%",
        alignItems: "center"
    },
    searchHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    searchIcon: {
        height: windowheight * 0.05,
        backgroundColor: theme.card,
        borderRadius: borderradius * 0.40
    },
    searchHere: {
        flex: 1,
        paddingHorizontal: "2.5%",
        color: theme.textinput,
        fontFamily: Fontfamily.regular,
        fontSize: Fontsize.semimedium
    },
    change: {
        paddingHorizontal: 30,
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        height: windowheight * 0.045,
    },
    profileCon: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between"
    },
    pariLabel: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        width: "auto",
        paddingHorizontal: '5%',
        marginBottom: "5%"
    },
    pairData: {
        flexWrap: "wrap",
        gap: 10,
        marginBottom: "3%"
    },
    edit: {
        paddingVertical: "2%",
        borderRadius: borderradius * 0.5,
        backgroundColor: theme.tabactive,
        paddingHorizontal: "4%"
    },
    title: {
        width: "30%", height: windowheight * 0.045,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: borderradius * 0.5,
        marginBottom: "5%",
    },
    selectPairs: {
        paddingVertical: "2%",
        borderRadius: borderradius * 0.5,
        backgroundColor: Colors.brand,
        paddingHorizontal: "4%"
    },
    empty: {
        flexWrap: "wrap",
        gap: 10,
        marginBottom: "3%"
    },
    noPair: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        width: "auto",
        paddingHorizontal: '5%',
        marginBottom: "5%"
    },
    masterTrader: {
        flexDirection: "row",
        justifyContent: "flex-start",
        marginBottom: "1.5%"
    },
    onlyTrade: {
        width: "40%",
        height: windowheight * 0.045,
        borderRadius: 10
    },
    follower: {
        width: "30%",
        height: windowheight * 0.045,
        marginLeft: 15,
        borderRadius: 10
    },
    setup: {
        justifyContent: "center",
        alignItems: "center"
    },
    condition: {
        width: "90%",
        justifyContent: "center",
        alignItems: "flex-start"
    },
    fee: {
        marginTop: "5%",
        marginBottom: "5%"
    },
    paires: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        backgroundColor: Colors.brand,
        paddingHorizontal: "7.5%"
    },
    wrap: {
        flexWrap: "wrap",
        gap: 10
    },
    wraplabel: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        width: "32%",
        paddingHorizontal: '5%',
        marginBottom: "5%",
        alignItems: "center",
        justifyContent: "center"
    },
    invest: {
        marginTop: -10,
        marginBottom: "5%"
    },
    manageRist: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        backgroundColor: Colors.brand,
        paddingHorizontal: "7.5%"
    },
    sheet: {
        paddingHorizontal: "5%",
        flex: 1,
        paddingBottom: "5%"
    },
    risk: {
        borderBottomWidth: 1,
        borderColor: "#313131",
        width: windowwidth,
        alignSelf: "center",
        height: windowheight * 0.08,
        paddingHorizontal: "5%",
        justifyContent: "space-between",
        flexDirection: "row",
        alignItems: "center"
    },
    close: {
        width: "15%",
        alignItems: "center",
        justifyContent: "center"
    },
    copyPair: {
        padding: "5%",
        flex: 1
    },
    check: {
        backgroundColor: theme.card,
        width: windowwidth * 0.06,
        height: windowwidth * 0.06,
    },
    list: {
        paddingBottom: 10,
        justifyContent: "space-between"
    },
    toggle: {
        paddingVertical: "2.5%",
        borderRadius: borderradius * 0.5,
        width: "30%",
        paddingHorizontal: '2%',
        justifyContent: "center",
        alignItems: "center",
        marginTop: "5%",
        marginLeft: 10
    },
    linear: {
        width: "46%",
        height: windowheight * 0.1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: borderradius * 0.5
    },
    input: {
        borderRadius: borderradius * 0.40,
        paddingHorizontal: 15,
        height: windowheight * 0.045,
        borderColor: Colors.dune
    },
    rio: {
        borderRadius: borderradius * 0.5,
        paddingHorizontal: "5%",
        marginBottom: "5%",
        height: 380
    },
    performance: {
        borderRadius: borderradius * 0.5,
        paddingHorizontal: "5%",
        paddingBottom: "5%"
    },
    usd: {
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#FFFFFF",
        borderWidth: 1,
        borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
        marginTop: "5%",
        paddingHorizontal: "2.5%",
        paddingVertical: "4%",
        borderRadius: borderradius * 0.5
    },
    volume: {
        borderRadius: borderradius * 0.5,
        paddingHorizontal: "5%",
        paddingBottom: "5%",
        marginTop: "5%"
    },
    pie: {
        alignItems: "center",
        marginTop: '4%'
    },
    ens: {
        backgroundColor: theme.theme === "dark" ? "#1A1C1F" : Colors.white,
        marginTop: "5%",
        paddingHorizontal: "6%",
        borderRadius: borderradius * 0.5,
        flexDirection: 'row',
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingTop: 20
    },
    win: {
        borderRadius: borderradius * 0.5,
        paddingHorizontal: "5%",
        marginTop: "5%",
        paddingBottom: "5%"
    },
    traders: {
        width: "20%",
        borderRadius: 5,
        paddingHorizontal: 15,
        height: windowheight * 0.045,
        borderWidth: 1,
        borderColor: theme.theme == 'dark' ? "#1B2740" : "#E2E8F0",
        backgroundColor: theme.theme == 'dark' ? "#101A2C" : "#E8EFFC",
        alignItems: "center",
        justifyContent: "center"
    },
    yaxis: {
        color: Colors.grey,
        fontSize: 12,
        textAlign: "right",
    },

    


    xaxis: {
        color: Colors.grey,
        fontSize: 10,
        fontWeight: "600",
        textAlign: "center",
    },
    noData: {
        marginTop: "40%"
    }
})