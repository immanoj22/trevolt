import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Animated, BackHandler } from "react-native";
import { Portal } from "@gorhom/portal";
import Icon from "react-native-vector-icons/Ionicons";
import LottieView from "lottie-react-native";

import Text from "../../../Components/text";
import { Colors } from "../../../Utilities/uiasset";
import { Lotties } from "../../../Utilities/images";
import { windowwidth } from "../../../Utilities/dimensions";
import useCustomHooks from "../../../Actions/Hooks/customhook";

interface Props {
    visible: boolean;
    onClose: () => void;
}

const KYCSuccessModal = ({ visible, onClose }: Props) => {
    const { theme } = useCustomHooks();
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const styles = style(theme);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    useEffect(() => {
        if (!visible) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });
        return () => sub.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    if (!visible) return null;

    return (
        // Rendered via Portal instead of a native <Modal> - stays inside the normal
        // view hierarchy and stacks below the app's permanent root FlashMessage, so a
        // toast fired while this is open is never hidden behind it.
        <Portal>
            <View style={[styles.overlay, { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }]}>
                <Animated.View
                    style={[styles.card, {
                        opacity: opacityAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                    ]}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Icon name="close" size={20} color="#fff" />
                    </TouchableOpacity>
                    <LottieView
                        source={Lotties.verified}
                        autoPlay
                        style={{ width: windowwidth, height: windowwidth * 0.28, alignSelf: "center", marginTop: "5%" }}
                    />
                    <Text size="semilarge" family="medium">KYC Verification – Submitted</Text>
                    <Text style={{ textAlign: "center" }} color={theme.secondarytext}>Your KYC documents have been submitted successfully for verification</Text>
                </Animated.View>
            </View>
        </Portal>
    );
};

export default KYCSuccessModal;


export const style = (theme: any) => StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        width: "90%",
        backgroundColor: theme.theme === "dark" ? "#141414" : theme.card,
        borderRadius: 16,
        padding: 40,
        alignItems: "center",
    },
    closeBtn: {
        position: "absolute",
        right: 14,
        top: 14,
        backgroundColor: Colors.dune,
        padding: 5,
        borderRadius: 8
    },
    iconWrapper: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#124aa7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 8,
        textAlign: "center",
    },
    desc: {
        fontSize: 14,
        color: "#aaa",
        textAlign: "center",
        lineHeight: 20,
    },
});