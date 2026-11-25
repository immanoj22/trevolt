import { StyleSheet } from "react-native";

import { Fontfamily } from "../../Utilities/uiasset";
import { RFvalue, windowheight, windowwidth } from "../../Utilities/dimensions";

const styles = (theme: any) => StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        color: theme.primarytext,
        fontFamily: Fontfamily.medium,
        fontSize: RFvalue(18),
        width: "70%",
        textAlign: "center"
    },
    headerContainer: {
        height: windowheight * 0.1,
        justifyContent: "center",
        flexDirection: "row",
        alignItems: "center"
    },
    rightContent: {
        width: "15%",
        height: "100%",
        position: "absolute",
        right: "5%",
        justifyContent: "center",
        alignItems: "center"
    },
    content: {
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: "5%"
    },
    buttonContainer: {
        marginTop: "8%",
        marginBottom: "5%"
    },
    continue: {
        position: "absolute",
        bottom: "2%",
        left: 0,
        right: 0
    },
    select: {
        width: windowwidth * 0.065,
        height: windowwidth * 0.065,
        borderRadius: 100,
        borderColor: theme.boderColor,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        marginRight: 10
    },
    heroBadge: {
        width: windowwidth * 0.2,
        height: windowwidth * 0.2,
        borderRadius: windowwidth * 0.1,
        backgroundColor: theme.theme === "dark" ? "rgba(37, 99, 235,0.12)" : "rgba(37, 99, 235,0.08)",
        justifyContent: "center",
        alignItems: "center"
    },
    methodCard: {
        padding: "5%"
    },
    methodIcon: {
        width: windowwidth * 0.11,
        height: windowwidth * 0.11,
        borderRadius: windowwidth * 0.055,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12
    }
})

export default styles;