import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fontfamily, Fontsize } from '../Utilities/uiasset';
import { borderradius, windowwidth } from '../Utilities/dimensions';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastOptions {
    message: string;
    description?: string;
    type?: ToastType;
    duration?: number;
}

interface ActiveToast extends ToastOptions {
    id: number;
}

const toastColors: Record<ToastType, { borderLeftColor: string; backgroundColor: string; titleColor: string }> = {
    success: { borderLeftColor: '#4a72b1', backgroundColor: '#e6ebf4', titleColor: '#243b61' },
    warning: { borderLeftColor: '#FF9800', backgroundColor: '#FFF4E5', titleColor: '#8C6D1F' },
    danger: { borderLeftColor: '#F44336', backgroundColor: '#FDECEA', titleColor: '#B71C1C' },
    info: { borderLeftColor: '#2196F3', backgroundColor: '#E8F1FC', titleColor: '#0D47A1' },
};

const ANIM_MS = 220;
const DEFAULT_DURATION = 2000;
const ENTER_OFFSET_Y = -80;
// How far (px) a drag has to travel - or how fast (px/s) it has to be flicked -
// before it counts as "the user wants this gone" rather than an idle touch.
const DISMISS_DISTANCE = 60;
const DISMISS_VELOCITY = 800;

let idCounter = 0;

// Module-level, not React state/context - showAppToast() can be called from
// anywhere (event handlers, the API layer) without any component needing to hold
// a ref or be an ancestor.
let activeHost: { show: (opts: ToastOptions) => void; hide: () => void } | null = null;

export function showAppToast(opts: ToastOptions) {
    activeHost?.show(opts);
}

export function hideAppToast() {
    activeHost?.hide();
}

const ToastHostImpl: React.FC = () => {
    const insets = useSafeAreaInsets();
    const [toast, setToast] = useState<ActiveToast | null>(null);

    // Reanimated shared values, not React state or plain Animated.Value - mutating
    // them never goes through React's render cycle at all (that's the whole point
    // of Reanimated), and the drag gesture below updates them directly on the UI
    // thread with zero JS-thread/bridge round trips per frame. Created exactly
    // once for the app's lifetime.
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(ENTER_OFFSET_Y);
    const opacity = useSharedValue(0);

    const isShowingRef = useRef(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const durationRef = useRef(DEFAULT_DURATION);
    const isDraggingRef = useRef(false);

    const clearHideTimer = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
            hideTimer.current = null;
        }
    }, []);

    const finishHide = useCallback(() => {
        isShowingRef.current = false;
        setToast(null);
    }, []);

    const hide = useCallback(() => {
        clearHideTimer();
        translateX.value = withTiming(0, { duration: ANIM_MS });
        translateY.value = withTiming(ENTER_OFFSET_Y, { duration: ANIM_MS });
        opacity.value = withTiming(0, { duration: ANIM_MS }, (finished) => {
            if (finished) runOnJS(finishHide)();
        });
    }, [clearHideTimer, finishHide, opacity, translateX, translateY]);

    // hide's own deps (clearHideTimer/finishHide/the shared values) never actually
    // change, so hide itself is stable - safe to schedule directly with no ref
    // indirection needed to dodge staleness.
    const scheduleAutoHide = useCallback(() => {
        clearHideTimer();
        hideTimer.current = setTimeout(hide, durationRef.current);
    }, [clearHideTimer, hide]);

    const show = useCallback((opts: ToastOptions) => {
        const next: ActiveToast = { ...opts, id: ++idCounter };
        setToast(next);
        durationRef.current = opts.duration ?? DEFAULT_DURATION;

        if (!isShowingRef.current) {
            // Nothing currently visible - play the full entrance.
            isShowingRef.current = true;
            translateX.value = 0;
            translateY.value = ENTER_OFFSET_Y;
            opacity.value = 0;
            translateY.value = withTiming(0, { duration: ANIM_MS });
            opacity.value = withTiming(1, { duration: ANIM_MS });
        } else {
            // Already visible and new content arrived (or it was mid-drag) - swap
            // content in place instead of replaying the entrance, which would
            // otherwise snap it back to hidden and re-enter: a visible flicker for
            // what is really just new text on a toast that's already up.
            translateX.value = withTiming(0, { duration: ANIM_MS });
            translateY.value = withTiming(0, { duration: ANIM_MS });
            opacity.value = withTiming(1, { duration: ANIM_MS });
        }

        if (!isDraggingRef.current) {
            scheduleAutoHide();
        }
    }, [opacity, scheduleAutoHide, translateX, translateY]);

    useEffect(() => {
        activeHost = { show, hide };
        return () => {
            clearHideTimer();
            if (activeHost && activeHost.show === show) activeHost = null;
        };
    }, [clearHideTimer, hide, show]);

    const onDragStart = useCallback(() => {
        isDraggingRef.current = true;
        clearHideTimer();
    }, [clearHideTimer]);

    const onDragCancelled = useCallback(() => {
        isDraggingRef.current = false;
        scheduleAutoHide();
    }, [scheduleAutoHide]);

    const onDismissedByGesture = useCallback(() => {
        isDraggingRef.current = false;
        clearHideTimer();
        isShowingRef.current = false;
        setToast(null);
    }, [clearHideTimer]);

    // Up, left, or right all dismiss - there's nowhere for a top banner to usefully
    // go on a downward drag, so that direction just rubber-bands (a small fraction
    // of the drag, capped) rather than dismissing.
    const pan = Gesture.Pan()
        .onStart(() => {
            runOnJS(onDragStart)();
        })
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY < 0 ? e.translationY : Math.min(e.translationY * 0.25, 12);

            const upProgress = Math.min(Math.max(-e.translationY, 0) / DISMISS_DISTANCE, 1);
            const sideProgress = Math.min(Math.abs(e.translationX) / DISMISS_DISTANCE, 1);
            opacity.value = 1 - Math.max(upProgress, sideProgress) * 0.5;
        })
        .onEnd((e) => {
            const dismissUp = e.translationY < -DISMISS_DISTANCE || e.velocityY < -DISMISS_VELOCITY;
            const dismissSide = Math.abs(e.translationX) > DISMISS_DISTANCE || Math.abs(e.velocityX) > DISMISS_VELOCITY;

            if (dismissUp) {
                translateY.value = withTiming(ENTER_OFFSET_Y - 60, { duration: ANIM_MS });
                opacity.value = withTiming(0, { duration: ANIM_MS }, (finished) => {
                    if (finished) runOnJS(onDismissedByGesture)();
                });
            } else if (dismissSide) {
                const toX = e.translationX > 0 ? windowwidth : -windowwidth;
                translateX.value = withTiming(toX, { duration: ANIM_MS });
                opacity.value = withTiming(0, { duration: ANIM_MS }, (finished) => {
                    if (finished) runOnJS(onDismissedByGesture)();
                });
            } else {
                translateX.value = withSpring(0, { damping: 18, stiffness: 260 });
                translateY.value = withSpring(0, { damping: 18, stiffness: 260 });
                opacity.value = withTiming(1, { duration: ANIM_MS });
                runOnJS(onDragCancelled)();
            }
        });

    const tap = Gesture.Tap().onEnd(() => {
        runOnJS(hide)();
    });

    // Race, not Simultaneous - a tap (near-zero movement) and a pan (real movement)
    // are mutually exclusive by nature, so whichever one's criteria is met first is
    // the one that should win.
    const gesture = Gesture.Race(pan, tap);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    }));

    if (!toast) return null;

    const colors = toastColors[toast.type ?? 'success'] ?? toastColors.success;

    return (
        <Animated.View pointerEvents="box-none" style={[styles.root, { paddingTop: insets.top + 8 }, animatedStyle]}>
            <GestureDetector gesture={gesture}>
                <View style={[styles.toast, { borderLeftColor: colors.borderLeftColor, backgroundColor: colors.backgroundColor }]}>
                    <Text style={[styles.title, { color: colors.titleColor }]}>{toast.message}</Text>
                    {toast.description ? <Text style={styles.description}>{toast.description}</Text> : null}
                </View>
            </GestureDetector>
        </Animated.View>
    );
};

// Zero props, so there is nothing for a parent re-render to ever change - React.memo
// with no custom comparator already bails unconditionally, because an empty props
// object is trivially equal to itself every time. This component only re-renders
// from its own setState (show/hide), never because anything else in the app did.
export const ToastHost = React.memo(ToastHostImpl);

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        zIndex: 999,
        elevation: 999,
    },
    toast: {
        width: '90%',
        padding: '5%',
        elevation: 4,
        borderRadius: borderradius * 0.5,
        alignSelf: 'center',
        borderLeftWidth: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    title: {
        fontFamily: Fontfamily.bold,
        fontSize: Fontsize.semimedium,
    },
    description: {
        fontFamily: Fontfamily.regular,
        fontSize: Fontsize.small,
        color: '#333333',
        marginTop: 5,
    },
});
