import { StyleSheet } from "react-native";

import { Colors } from "../../Utilities/uiasset";
import { borderradius, windowheight } from "../../Utilities/dimensions";

export const styles = (theme: any) => StyleSheet.create({
    darkInput: {
        backgroundColor: "#131D31",
        borderWidth: 0.4,
        borderColor: "#1B2740",
        borderRadius: 10,
        paddingHorizontal: "5%",
        width: '100%',
        justifyContent: "center",
        position: "relative"
    },
    lightInput: {
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        paddingHorizontal: "5%",
        width: '100%',
        justifyContent: "center",
        position: "relative",
        shadowColor: "rgba(0,0,0,0.25)",
        shadowOffset: { width: 0, height: 0.5 },
        shadowOpacity: 1,
        shadowRadius: 2,
        elevation: 3,
    },
    right: {
        position: "absolute",
        right: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    button: {
        width: "100%",
        backgroundColor: Colors.brand,
        paddingHorizontal: 20,
        // borderRadius: 10,
        borderRadius: borderradius * 3,
        alignItems: "center",
        justifyContent: "center",
        height: Math.max(windowheight * 0.056, 50)
    },
    disabledButton: {
        backgroundColor: theme.graytext,
    },
    check: {
        backgroundColor: theme.card,
        width: 25,
        height: 25,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.grey,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8
    }
})