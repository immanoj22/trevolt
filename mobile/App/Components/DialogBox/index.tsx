import React, { ReactNode, useContext } from 'react';
import { View, ScrollView, ViewStyle, StyleSheet, Pressable, Platform, BackHandler } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Portal } from '@gorhom/portal';

import Text from '../text';
import ThemeContext from '../../Utilities/themecontext';
import VectorIcons from '../../Utilities/vectoricons';
import { windowheight, windowwidth } from '../../Utilities/dimensions';

type DialogBoxProps = {
    content?: ReactNode;
    style?: ViewStyle;
    type?: 'fade' | 'slide';
    title?: string;
    closeIcon?: boolean;
    onClose?: () => void;
};

const DialogBox: React.FC<DialogBoxProps> = ({
    content,
    style = {},
    type = 'fade',
    title,
    closeIcon = true,
    onClose = () => { },
}) => {

    const theme = useContext(ThemeContext);

    React.useEffect(() => {
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            onClose();
            return true;
        });
        return () => sub.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getBehavior = () => {
        if (Platform.OS === 'ios') {
            return 'padding';
        }
        return;
    }

    return (
        // Rendered via Portal instead of a native <Modal> - this keeps it inside the
        // normal view hierarchy (so it correctly escapes any ScrollView it's opened
        // from, instead of scrolling away with the trigger screen's content) and
        // means the app's single, permanent root FlashMessage (declared after this
        // Portal's host in App.tsx) naturally renders above it via normal sibling
        // stacking - no separate toast instance or hold/unhold hand-off needed here
        // anymore, and no risk of a toast being torn down mid-animation when this
        // popup closes.
        <Portal>
            <View style={styles.overlayContainer}>
                <KeyboardAvoidingView behavior={getBehavior()} style={{ flex: 1 }} keyboardVerticalOffset={0}>
                    {type === 'fade' && (
                        <View style={styles.container}>
                            <View style={[styles.whiteContainer, { backgroundColor: theme.card, borderColor: theme.boderColor }]}>
                                <View style={[styles.contentContainer, { backgroundColor: theme.card, borderBottomColor: theme.boderColor }, style]}>
                                    <Text family="semiBold" size="medium" color={theme.primarytext}>
                                        {title}
                                    </Text>

                                    {
                                        closeIcon && (
                                            <View style={styles.closeIconContainer}>
                                                <Pressable
                                                    onPress={onClose}
                                                    style={[styles.closeIconButton, { backgroundColor: theme.card }]}
                                                >
                                                    <VectorIcons
                                                        family="Ionicons"
                                                        name="close"
                                                        size={16}
                                                        iconcolor={theme.primarytext}
                                                    />
                                                </Pressable>
                                            </View>
                                        )
                                    }
                                </View>

                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    bounces={false}
                                    keyboardShouldPersistTaps="handled"
                                    style={{ backgroundColor: theme.card }}
                                >
                                    {content}
                                </ScrollView>
                            </View>
                        </View>
                    )}

                    {type === 'slide' && <>{content}</>}
                </KeyboardAvoidingView>
            </View>
        </Portal>

    );
};

export default DialogBox;

const styles = StyleSheet.create({
    overlayContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    contentContainer: {
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
    },
    whiteContainer: {
        maxHeight: windowheight - 30,
        width: windowwidth - 30,
        borderRadius: 18,
        borderWidth: 1,
        overflow: "hidden",
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: 'rgba(0,0,0,0.75)',
    },
    closeIconContainer: {
        position: "absolute",
        right: 14,
    },
    closeIconButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    closeContainer: {
        paddingRight: 10
    },
});
