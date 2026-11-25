// import React, { useCallback, useMemo } from 'react';
// import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
// import { BottomSheetBackdrop, BottomSheetFooter, BottomSheetModal, BottomSheetModalProps, BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'react-native-linear-gradient';

// import Text from './text';
// import Images from '../Utilities/images';
// import { Colors } from '../Utilities/uiasset';
// import useCustomHooks from '../Actions/Hooks/customhook';
// import { borderradius, windowwidth } from '../Utilities/dimensions';

// interface Props {
//     sheetref: React.RefObject<BottomSheetModal | null>;
//     children?: React.ReactNode;
//     snappoint?: any;
//     opacity?: number;
//     backgroundStyle?: StyleProp<
//         Omit<ViewStyle, 'position' | 'top' | 'left' | 'bottom' | 'right'>
//     >;
//     onDismiss?: () => void;
//     onClose?: () => void;
//     bottomSheetProps?: Omit<BottomSheetModalProps, 'children'>;
//     headertitle?: string,
//     headerdescrption?: string,
//     custominterface?: boolean
// }

// const Sheet: React.FC<Props> = ({
//     sheetref,
//     children,
//     snappoint = ['40%'],
//     backgroundStyle = {},
//     opacity = 0.7,
//     onDismiss = () => { },
//     onClose,
//     bottomSheetProps,
//     headertitle,
//     headerdescrption,
//     custominterface
// }) => {
//     const { theme } = useCustomHooks();
//     const insets = useSafeAreaInsets();
//     const snapPointList = useMemo(() => snappoint, [snappoint]);

//     const gradientColors = theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"];
//     const gradientLocations = [0, 0.20, 1];

//     const renderBackground = useCallback(
//         () => (
//             <LinearGradient
//                 colors={gradientColors}
//                 locations={gradientLocations}
//                 style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: borderradius * 1, borderTopRightRadius: borderradius * 1 }]}
//             />
//         ),
//         [theme.theme],
//     );

//     const renderBackdrop = useCallback(
//         (props?: any) => (
//             <BottomSheetBackdrop
//                 {...props}
//                 appearsOnIndex={0}
//                 disappearsOnIndex={-1}
//                 opacity={opacity}
//             />
//         ),
//         [opacity],
//     );

//     return (
//         <BottomSheetModal
//             ref={sheetref}
//             snapPoints={snapPointList}
//             backdropComponent={renderBackdrop}
//             backgroundComponent={renderBackground}
//             backgroundStyle={[{ paddingHorizontal: windowwidth * 0.05 }, backgroundStyle]}
//             onDismiss={onDismiss}
//             keyboardBehavior='extend'
//             keyboardBlurBehavior={'restore'}
//             footerComponent={(props) => (
//                 <BottomSheetFooter {...props} bottomInset={0}>
//                     <View style={{ height: insets.bottom }} />
//                 </BottomSheetFooter>
//             )}
//             handleComponent={null}
//             enableDismissOnClose={true}
//             enableDynamicSizing={true}
//             {...bottomSheetProps}
//         >
//             {custominterface ?
//                 <BottomSheetView>
//                     {children}
//                 </BottomSheetView> :
//                 <>
//                     <View style={{ width: "100%", borderTopLeftRadius: borderradius * 1, borderTopRightRadius: borderradius * 1, flexDirection: "row", paddingVertical: "5%", paddingLeft: "7.5%", paddingRight: "5%", justifyContent: "center", alignItems: "center" }} >
//                         <View style={{ width: "85%" }} >
//                             <Text family='medium' size='medium' style={{ color: theme.inversetext }}  >{headertitle}</Text>
//                             {headerdescrption &&
//                                 <Text family='medium' size='semimedium' style={{ color: theme.graytext, marginTop: "2.5%" }}  >{headerdescrption}</Text>}
//                         </View>

//                         <Pressable onPress={() => {
//                             sheetref?.current?.dismiss()
//                             onClose
//                         }} style={{ width: "15%", alignItems: "center", justifyContent: "center" }} >
//                             <Images
//                                 type='svg'
//                                 name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
//                                 width={windowwidth * 0.075}
//                                 height={windowwidth * 0.075}
//                             />
//                         </Pressable>

//                     </View>

//                     <View style={{ flex: 1, paddingHorizontal: "7.5%" }} >
//                         <BottomSheetScrollView
//                             keyboardShouldPersistTaps="handled"
//                             showsVerticalScrollIndicator={false} >
//                             {children}
//                         </BottomSheetScrollView>
//                     </View>
//                 </>}
//         </BottomSheetModal>
//     );
// };

// export default Sheet;

import React, { useCallback, useContext, useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BottomSheetModal, BottomSheetModalProps, BottomSheetScrollView, useBottomSheet } from '@gorhom/bottom-sheet';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Extrapolation, interpolate, runOnJS, useAnimatedStyle } from 'react-native-reanimated';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { LinearGradient } from './lineargradient';

import Text from './text';
import Images from '../Utilities/images';
import { Colors } from '../Utilities/uiasset';
import ThemeContext from '../Utilities/themecontext';
import { borderradius, windowwidth } from '../Utilities/dimensions';

interface Props {
    sheetref: React.RefObject<BottomSheetModal | null>;
    children?: React.ReactNode;
    snappoint?: any;
    opacity?: number;
    backgroundStyle?: StyleProp<
        Omit<ViewStyle, 'position' | 'top' | 'left' | 'bottom' | 'right'>
    >;
    onDismiss?: () => void;
    onClose?: () => void;
    bottomSheetProps?: Omit<BottomSheetModalProps, 'children'>;
    headertitle?: string,
    headerdescrption?: string,
    custominterface?: boolean
}

const backdropStyles = StyleSheet.create({
    fill: { backgroundColor: 'black' },
});

// Hoisted so `footerComponent` is a stable reference - an inline arrow there is a
// new component identity on every <Sheet> render, which makes gorhom tear down and
// remount the footer each time the host screen re-renders (the Futures screen does
// so on every price tick).
const SHEET_BOTTOM_INSET = initialWindowMetrics?.insets?.bottom ?? 0;
const SheetFooter = () => <View style={{ height: SHEET_BOTTOM_INSET }} />;

interface BackdropProps {
    // SharedValue<number> - kept loose to avoid a reanimated type import here.
    animatedIndex: { value: number };
    style?: StyleProp<ViewStyle>;
    opacity?: number;
    appearsOnIndex?: number;
    disappearsOnIndex?: number;
}

// Why a hand-rolled backdrop instead of gorhom's <BottomSheetBackdrop>:
// the stock one flips its own `pointerEvents` between 'auto' and 'none' via a
// `useAnimatedReaction` -> `runOnJS` -> `setState` hop (see the library's
// BottomSheetBackdrop.tsx). On any screen that re-renders off a live feed - the
// Futures buy/sell screen re-renders on every `futureTicker` socket tick - that
// state update lands behind the render backlog, so after the sheet has fully
// animated shut the full-screen backdrop keeps `pointerEvents: 'auto'` for a
// second or two and silently swallows every tap on the page behind it. That is
// the "tapped Place Order, closed the sheet, screen frozen for ~2s" report.
// Driving both the fade AND the touch-blocking from a single useAnimatedStyle
// keeps it 100% on the UI thread, so the backdrop stops intercepting touches the
// instant the sheet passes the closed position no matter how busy JS is.
const SheetBackdrop: React.FC<BackdropProps> = ({
    animatedIndex,
    style,
    opacity = 0.7,
    appearsOnIndex = 0,
    disappearsOnIndex = -1,
}) => {
    const { close } = useBottomSheet();

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: interpolate(
            animatedIndex.value,
            [disappearsOnIndex, appearsOnIndex],
            [0, opacity],
            Extrapolation.CLAMP,
        ),
        // UI-thread pointer-events toggle - this is the whole point of the custom backdrop.
        pointerEvents: animatedIndex.value > disappearsOnIndex ? 'auto' : 'none',
    }));

    // Preserve gorhom's default `pressBehavior="close"` - tap the scrim to close.
    const tapToClose = useMemo(
        () => Gesture.Tap().onEnd(() => { runOnJS(close)(); }),
        [close],
    );

    return (
        <GestureDetector gesture={tapToClose}>
            <Animated.View style={[style, backdropStyles.fill, animatedStyle]} />
        </GestureDetector>
    );
};

const Sheet: React.FC<Props> = ({
    sheetref,
    children,
    snappoint = ['40%'],
    backgroundStyle = {},
    opacity = 0.7,
    onDismiss = () => { },
    onClose,
    bottomSheetProps,
    headertitle,
    headerdescrption,
    custominterface
}) => {
    // Read theme straight from context, not via useCustomHooks() - that hook also
    // subscribes this component to the whole wallet slice, so every bottom sheet
    // used to re-render on every price/balance socket tick while it was open.
    const theme = useContext(ThemeContext);
    // Key the memo on the snap points' *content*, not the array reference - callers
    // routinely pass an inline literal (`snappoint={["55%"]}`), which is a fresh array
    // every render and would otherwise make gorhom recompute snap points on every
    // host re-render, fighting an in-progress open/close animation.
    const snapPointList = useMemo(() => snappoint, [JSON.stringify(snappoint)]);

    const gradientColors = theme.theme === "dark" ? ["#0B2545", "#0A1020", "#000000"] : ["#DBEAFE", "#F4F8FF", "#F4F8FF"];
    const gradientLocations = [0, 0.20, 1];

    const renderBackground = useCallback(
        () => (
            <LinearGradient
                colors={gradientColors}
                locations={gradientLocations}
                style={[StyleSheet.absoluteFillObject, { borderTopLeftRadius: borderradius * 1, borderTopRightRadius: borderradius * 1 }]}
            />
        ),
        [theme.theme],
    );

    const renderBackdrop = useCallback(
        (props?: any) => (
            <SheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                opacity={opacity}
            />
        ),
        [opacity],
    );

    return (
        <BottomSheetModal
            ref={sheetref}
            snapPoints={snapPointList}
            backdropComponent={renderBackdrop}
            backgroundComponent={renderBackground}
            backgroundStyle={[{ paddingHorizontal: windowwidth * 0.05 }, backgroundStyle]}
            onDismiss={onDismiss}
            keyboardBehavior='extend'
            keyboardBlurBehavior={'restore'}
            android_keyboardInputMode="adjustResize"
            footerComponent={SheetFooter}
            handleComponent={null}
            enableDismissOnClose={true}
            enableDynamicSizing={false}
            {...bottomSheetProps}
        >
            {custominterface ?
                <View style={{ flex: 1, }} >
                    {children}
                </View> :
                <>
                    <View style={{ width: "100%", borderTopLeftRadius: borderradius * 1, borderTopRightRadius: borderradius * 1, flexDirection: "row", paddingVertical: "5%", paddingLeft: "7.5%", paddingRight: "5%", justifyContent: "center", alignItems: "center" }} >
                        <View style={{ width: "85%" }} >
                            <Text family='medium' size='medium' style={{ color: theme.inversetext }}  >{headertitle}</Text>
                            {headerdescrption &&
                                <Text family='medium' size='semimedium' style={{ color: theme.graytext, marginTop: "2.5%" }}  >{headerdescrption}</Text>}
                        </View>

                        <Pressable onPress={() => {
                            sheetref?.current?.dismiss()
                            onClose
                        }} style={{ width: "15%", alignItems: "center", justifyContent: "center" }} >
                            <Images
                                type='svg'
                                name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                                width={windowwidth * 0.075}
                                height={windowwidth * 0.075}
                            />
                        </Pressable>

                    </View>

                    <View style={{ flex: 1, paddingHorizontal: "7.5%" }} >
                        <BottomSheetScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false} >
                            {children}
                        </BottomSheetScrollView>
                    </View>
                </>}
        </BottomSheetModal>
    );
};

export default Sheet;