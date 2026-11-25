import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import Slider from "@react-native-community/slider";

import Text from "../../../Components/text";
import Card from "../../../Components/Card";
import Images from "../../../Utilities/images";
import CenterModal from "../../../Components/centermodal";
import ThemeContext from "../../../Utilities/themecontext";
import { Colors } from "../../../Utilities/uiasset";
import { Button, Input } from "../../../Components/Field";
import { failuretoast } from "../../../Actions/Hooks/customhook";
import { RFvalue, windowheight, windowwidth } from "../../../Utilities/dimensions";

import { styles } from "../styles";

interface ConfirmProps {
    visible?: boolean;
    onClose?: () => void;
    leverage?: any;
    changeLeverage?: (value: number) => void;
    max?: any;
    margin?: any;
    loading?: any;
}

// Percentages of `max` chosen so the displayed leverage values read as
// 1, 10, 25, 40, 50 at the common 50x max (2%, 20%, 50%, 80%, 100% of 50 ->
// 1, 10, 25, 40, 50), matching the marks/dots along the track.
const MARK_PERCENTAGES = [2, 20, 50, 80, 100];

// @react-native-community/slider insets its visible track by the thumb's own
// radius on each side - the track doesn't start/end at x=0/x=width of the
// component, so dot positions need to account for that inset to actually
// land on the visible line instead of drifting off both ends.
const THUMB_INSET = 11;

// Leverage is an integer everywhere else in the product (web's leverage input
// included). A tiny step turned the native slider into an event firehose -
// hundreds of JS callbacks per drag - and let a drag land on a nonsense value
// like "39.04x" that the pill then had to special-case. Whole steps keep the
// drag cheap and the committed value clean; typing a decimal is rejected too
// (see the leverage Input's `numbers` regex below).
const SLIDER_STEP = 1;

// The leverage a given mark represents, as an integer - used for BOTH the mark's
// label and the value a tap on that mark commits, so the two can never disagree.
const markValue = (percent: number, max: number) =>
    Math.max(1, Math.round((percent / 100) * max));

// The number box is more expensive to re-render than the slider, and a human
// can't read a counter faster than this anyway - so it lags the thumb during a
// drag by at most this interval.
const INPUT_UPDATE_INTERVAL_MS = 120;

// ─────────────────────────────────────────────────────────────────────────
// Interaction model (this is the whole contract of this popup):
//   - Dragging the slider, typing in the box, or tapping a mark only ever
//     updates LOCAL state. Nothing is sent to the server and nothing on the
//     parent screen changes while you're doing any of that.
//   - The ONLY thing that commits a new leverage value is pressing "Set",
//     which validates the current local value and calls `changeLeverage`
//     (a prop from the parent) exactly once.
// ─────────────────────────────────────────────────────────────────────────

// ── Slider + marks + dots ────────────────────────────────────────────────
// The live drag position updates ~60x/sec. It lives HERE, in its own memoized
// component, instead of in the parent popup - so those updates re-render only
// this small subtree and never CenterModal or its @gorhom/portal host. A fast
// drag re-rendering the whole portalled modal tree ~60x/sec (plus the parent
// screen's own socket-tick renders) is what previously read as the screen
// freezing for a second or two and then catching up.
interface LeverageSliderProps {
    committedValue: number;
    max: number;
    theme: any;
    // Live value during a drag - the parent throttles this into the number box.
    onScrub: (value: number) => void;
    // Final value: a drag ending, or a mark tapped. Still local-only, not a
    // server commit.
    onCommit: (value: number) => void;
    onSlideStart: () => void;
}

const LeverageSliderComponent: React.FC<LeverageSliderProps> = ({
    committedValue,
    max,
    theme,
    onScrub,
    onCommit,
    onSlideStart,
}) => {
    const [trackWidth, setTrackWidth] = useState(0);
    const slidingRef = useRef(false);

    // Drives the slider thumb, the dots and the mark highlight. While idle it
    // mirrors the committed value; while dragging it follows the finger. On
    // Android and iOS the native slider ignores this prop for the duration of a
    // gesture anyway (it's self-driven during a drag), so feeding it back here
    // only keeps JS in sync - it can't fight the thumb.
    const [liveValue, setLiveValue] = useState(committedValue);
    useEffect(() => {
        if (!slidingRef.current) setLiveValue(committedValue);
    }, [committedValue]);

    // Cap redraws to one per frame - the native slider fires onValueChange far
    // faster than the screen can usefully show.
    const pending = useRef(committedValue);
    const rafScheduled = useRef(false);
    const scheduleLive = (next: number) => {
        pending.current = next;
        if (rafScheduled.current) return;
        rafScheduled.current = true;
        requestAnimationFrame(() => {
            rafScheduled.current = false;
            setLiveValue(pending.current);
        });
    };

    const usableWidth = Math.max(trackWidth - THUMB_INSET * 2, 0);
    const ratio = max > 1 ? Math.min(Math.max((liveValue - 1) / (max - 1), 0), 1) : 0;

    const dots = useMemo(() => {
        if (!trackWidth) return null;
        return (
            // Purely decorative and non-interactive: "none" so a touch that lands
            // on a dot can never be captured here instead of starting a drag on
            // the slider underneath (that used to make the slider feel like it
            // "wouldn't grab" when you started dragging from a mark). Tapping a
            // mark is still done via the text labels below.
            <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, justifyContent: "center" }}>
                {MARK_PERCENTAGES.map((p) => {
                    const isReached = p / 100 <= ratio + 0.0001;
                    // Hide the dot the thumb is currently sitting on (notably the last
                    // one at max) - otherwise it pokes out from under the thumb.
                    if (Math.abs(p / 100 - ratio) < 0.02) return null;
                    // Clamp so the 100% dot can't poke past the container's right
                    // edge and get visually clipped by the modal.
                    const dotLeft = Math.min(
                        Math.max(THUMB_INSET + (p / 100) * usableWidth - 4, 0),
                        trackWidth - 8
                    );
                    return (
                        <View
                            key={p}
                            style={{
                                position: "absolute",
                                left: dotLeft,
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: isReached ? Colors.brand : "#444",
                            }}
                        />
                    );
                })}
            </View>
        );
    }, [trackWidth, ratio, usableWidth]);

    return (
        <View style={{ marginVertical: "7%" }}>
            <View
                onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
                style={{ justifyContent: "center" }}
            >
                <Slider
                    minimumValue={1}
                    maximumValue={max}
                    step={SLIDER_STEP}
                    value={liveValue}
                    // Dismissing the keyboard blurs the leverage Input if it's focused,
                    // which lets its own onBlur clear the parent's interaction latch so
                    // this drag's resync path picks the new value up correctly.
                    onSlidingStart={() => {
                        Keyboard.dismiss();
                        slidingRef.current = true;
                        onSlideStart();
                    }}
                    onValueChange={(v) => {
                        // Ignore the stray tick some platforms emit for a plain track
                        // tap with no gesture - onSlidingComplete still commits it.
                        if (!slidingRef.current) return;
                        scheduleLive(v);
                        onScrub(v);
                    }}
                    onSlidingComplete={(v) => {
                        slidingRef.current = false;
                        const next = Math.round(v);
                        setLiveValue(next);
                        onCommit(next);
                    }}
                    minimumTrackTintColor={Colors.brand}
                    maximumTrackTintColor="#444"
                    thumbTintColor={Colors.brand}
                />
                {dots}
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                {MARK_PERCENTAGES.map((p) => {
                    const valAtP = markValue(p, max);
                    const isActive = liveValue >= valAtP;
                    return (
                        <Pressable key={p} onPress={() => onCommit(valAtP)}>
                            <Text style={{ color: isActive ? Colors.brand : theme.darktext, fontSize: RFvalue(12) }}>
                                {`${valAtP}x`}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const LeverageSlider = React.memo(LeverageSliderComponent);

const LeverageComponent: React.FC<ConfirmProps> = ({
    visible,
    onClose,
    leverage,
    changeLeverage,
    max,
    margin,
    loading,
}) => {
    // Theme from context + the module-level failuretoast, NOT useCustomHooks() -
    // that hook subscribes this component to the whole wallet slice, so the popup
    // (and the CenterModal/Portal tree it renders) re-rendered on every price tick,
    // including mid-drag.
    const theme = useContext(ThemeContext);
    const style = styles(theme);
    const isPortfolio = margin === "portfolio";

    // `max` reaches this popup as "" / undefined / a numeric string depending on
    // the screen and the pair. Any of those made <Slider> collapse to a dead
    // [1,1] range (drag did nothing). Resolve to a real number once, here, and
    // use it everywhere below.
    const resolvedMax = Math.max(1, Number(max) || 100);

    // Single source of truth for the number box and the Set button. The slider
    // subtree keeps its own fast copy for the thumb/dots (see LeverageSlider);
    // this one only moves at human speed (typing, a mark tap, a drag ending, or
    // a throttled tick while dragging).
    const [value, setValue] = useState(Number(leverage) || 1);
    const [inputValue, setInputValue] = useState(Number(leverage) || 1);

    const lastInputUpdateAt = useRef(0);

    // True while the user is actively dragging or typing - stops an incoming
    // `leverage` prop change (e.g. a socket-driven userData refresh) from
    // clobbering an in-progress edit.
    const interacting = useRef(false);
    // Mirrors exactly what's in the Input, including empty/incomplete text that
    // `value` (last valid number only) can't represent - lets Set tell an
    // empty/invalid field apart from a valid one.
    const lastRawText = useRef(String(Number(leverage) || 1));
    // Tracks the previous `visible` so we can tell "just opened" / "just closed"
    // apart from a re-render while already open/closed.
    const wasVisible = useRef(false);

    useEffect(() => {
        const justOpened = visible && !wasVisible.current;
        const justClosed = !visible && wasVisible.current;
        wasVisible.current = !!visible;

        // Closing the popup (X, hardware back, or a successful Set) doesn't
        // reliably blur a focused Input, and RN doesn't fire onBlur on unmount -
        // so the `interacting` latch could be stranded `true`. Clear it on close
        // so the next open starts clean.
        if (justClosed) {
            interacting.current = false;
            return;
        }
        if (!visible) return;

        // Resync from the committed leverage: ALWAYS the moment the popup
        // (re)opens - even if an earlier edit stranded the latch - and on a
        // later `leverage` change while open only when the user isn't mid-edit.
        if (justOpened || !interacting.current) {
            const resolved = Number(leverage) || 1;
            setValue(resolved);
            setInputValue(resolved);
            lastRawText.current = String(resolved);
            if (justOpened) interacting.current = false;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, leverage]);

    const handleClose = useCallback(() => {
        interacting.current = false;
        onClose && onClose();
    }, [onClose]);

    // Throttled live value while dragging. Also (re)arms the interaction latch
    // for the whole drag - onSlidingStart's Keyboard.dismiss() can trigger the
    // Input's onBlur a beat later, which would otherwise clear it mid-drag.
    const onScrub = useCallback((next: number) => {
        interacting.current = true;
        const now = Date.now();
        if (now - lastInputUpdateAt.current < INPUT_UPDATE_INTERVAL_MS) return;
        lastInputUpdateAt.current = now;
        setInputValue(next);
    }, []);

    // Final local value from a drag ending or a mark tap. NOT a server commit -
    // that's the Set button only.
    const applyCommitted = useCallback((n: number) => {
        interacting.current = false;
        setValue(n);
        setInputValue(n);
        lastRawText.current = String(n);
    }, []);

    const handleSlideStart = useCallback(() => {
        interacting.current = true;
    }, []);

    return (
        <CenterModal
            visible={!!visible}
            onDismiss={handleClose}
            onClose={handleClose}
            custominterface={true}
            iskeyboardaware={false}
            backgroundStyle={style.sheetContainer}
        >
            <View style={style.sheet}>
                <View style={style.between}>
                    <Text family="semiBold" style={{ color: theme.darktext, fontSize: RFvalue(14) }}>
                        {isPortfolio ? "Effective Leverage" : "Select Leverage"}
                    </Text>
                    <Pressable onPress={handleClose}>
                        <Images
                            type="svg"
                            name={theme.theme === "dark" ? "Bottomclose" : "Bottomclosedark"}
                            width={windowwidth * 0.06}
                            height={windowheight * 0.04}
                        />
                    </Pressable>
                </View>
            </View>
            <View style={{ padding: "5%" }}>
                {
                    isPortfolio ? (
                        <Card containerStyle={{ backgroundColor: theme.card, paddingHorizontal: 10, marginTop: 25 }}>
                            <View style={{ paddingTop: 20 }}>
                                <Slider
                                    minimumValue={1}
                                    maximumValue={resolvedMax}
                                    step={0.01}
                                    value={value}
                                    minimumTrackTintColor={Colors.brand}
                                    maximumTrackTintColor="#444"
                                    thumbTintColor={Colors.brand}
                                    disabled={true}
                                />
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingBottom: 15, paddingHorizontal: 15 }}>
                                {
                                    [0, 25, 50, 75, 100].map((p) => {
                                        const valAtP = (p / 100) * resolvedMax;
                                        return (
                                            <Text key={p} style={{ color: theme.secondarytext, fontSize: RFvalue(12) }}>
                                                {`${valAtP}x`}
                                            </Text>
                                        );
                                    })}
                            </View>
                        </Card>
                    ) : (
                        <>
                            <Input
                                type="calculator"
                                themes={theme}
                                boxstyle={{ width: "75%" }}
                                initialValue={inputValue}
                                max={resolvedMax}
                                min={1}
                                onValueChange={(text) => {
                                    // NumberInput's +/- buttons hand over a number; typing hands
                                    // over a string. A button press is a complete, valid value and
                                    // fires no blur afterwards, so it must not leave the latch set.
                                    const isButton = typeof text === "number";
                                    if (!isButton) interacting.current = true;
                                    const raw: any = text;
                                    // Leverage is an integer everywhere else in the product - reject
                                    // "." outright so it never even appears in the box.
                                    const numbers = /^[+]?[0-9]+$/;
                                    if (raw !== "" && !numbers.test(raw)) return false;
                                    if (raw !== "" && Number(raw) < 1) return false;
                                    // Matches web's leverage input exactly (TradeActionCard.jsx) - a
                                    // keystroke that would push the value past the pair's max is
                                    // rejected outright (return `false` -> NumberInput doesn't even
                                    // display the character) instead of catching it later on Set.
                                    if (raw !== "") {
                                        const overMax = Number(raw);
                                        if (isFinite(overMax) && overMax > resolvedMax) return false;
                                    }
                                    // Mirror the raw (accepted) text so Set can check exactly what's
                                    // left in the box - `value` alone can't tell an empty/incomplete
                                    // field from a valid one.
                                    lastRawText.current = String(raw);
                                    // No further validation while typing - Set checks the rest and
                                    // toasts if still invalid, so the user isn't interrupted for a
                                    // number they haven't finished typing.
                                    if (raw === "") return;
                                    const numericValue = Number(raw);
                                    if (!isFinite(numericValue)) return;
                                    setValue(numericValue);
                                    setInputValue(numericValue);
                                    if (isButton) interacting.current = false;
                                }}
                                onBlur={() => { interacting.current = false; }}
                            />
                            <LeverageSlider
                                committedValue={value}
                                max={resolvedMax}
                                theme={theme}
                                onScrub={onScrub}
                                onCommit={applyCommitted}
                                onSlideStart={handleSlideStart}
                            />
                            <Button
                                title="Set"
                                loading={loading}
                                onPress={() => {
                                    // Validate only here, on submit - not while typing - so the
                                    // user isn't interrupted mid-edit. Re-check the raw text
                                    // actually left in the box. This is the ONLY place in this
                                    // component that calls changeLeverage.
                                    const raw = lastRawText.current;
                                    if (raw === "") {
                                        failuretoast("Error", "Please enter a leverage value.");
                                        return;
                                    }
                                    const numeric = Number(raw);
                                    if (!isFinite(numeric) || numeric < 1) {
                                        failuretoast("Error", `Enter a valid leverage between 1x and ${resolvedMax}x.`);
                                        return;
                                    }
                                    if (numeric > resolvedMax) {
                                        failuretoast("Error", `Leverage cannot exceed ${resolvedMax}x for this pair.`);
                                        return;
                                    }
                                    changeLeverage && changeLeverage(numeric);
                                }}
                                textStyle={{ color: theme.theme == 'dark' ? Colors.black : Colors.white }}
                            />
                        </>
                    )
                }
            </View>
        </CenterModal>
    );
};

// This popup stays mounted (just hidden) inside the trade screens, which re-render
// on every live futureTicker socket tick - without memoizing, every tick re-ran
// this whole component while the popup was open, fighting the user's own input.
const Leverage = React.memo(LeverageComponent);

export default Leverage;
