import React from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";
import RNLinearGradient, { LinearGradientProps } from "react-native-linear-gradient";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from "react-native-svg";

type Point = { x: number; y: number };

const DEFAULT_START: Point = { x: 0.5, y: 0 };
const DEFAULT_END: Point = { x: 0.5, y: 1 };

const HEX8 = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})$/;
const RGBA = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

// react-native-svg's stopColor parser doesn't reliably resolve every rgba()/#RRGGBBAA
// string across versions, so split color + alpha ourselves rather than trust it.
function toStop(color: string): { stopColor: string; stopOpacity: number } {
    const rgba = RGBA.exec(color);
    if (rgba) {
        const [, r, g, b, a] = rgba;
        return { stopColor: `rgb(${r}, ${g}, ${b})`, stopOpacity: a !== undefined ? parseFloat(a) : 1 };
    }

    const hex8 = HEX8.exec(color);
    if (hex8) {
        return { stopColor: `#${hex8[1]}`, stopOpacity: parseInt(hex8[2], 16) / 255 };
    }

    return { stopColor: color, stopOpacity: 1 };
}

const SvgGradientFill: React.FC<{
    colors: string[];
    locations?: number[];
    start?: Point;
    end?: Point;
    borderRadius: number;
}> = ({ colors, locations, start = DEFAULT_START, end = DEFAULT_END, borderRadius }) => {
    const gradientId = React.useId();
    // <Svg width="100%" height="100%"> doesn't reliably resolve on iOS (a known
    // react-native-svg issue - https://github.com/software-mansion/react-native-svg/issues/1262),
    // rendering blank. Measure the container instead and give Svg explicit pixel
    // dimensions, same as every other size-dependent RN component does.
    const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

    return (
        <View
            pointerEvents="none"
            onLayout={(e) => {
                const { width, height } = e.nativeEvent.layout;
                setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
            }}
            style={[StyleSheet.absoluteFill, borderRadius ? { borderRadius, overflow: "hidden" } : null]}
        >
            {size && size.width > 0 && size.height > 0 && (
                <Svg width={size.width} height={size.height}>
                    <Defs>
                        <SvgLinearGradient
                            id={gradientId}
                            x1={`${start.x * 100}%`}
                            y1={`${start.y * 100}%`}
                            x2={`${end.x * 100}%`}
                            y2={`${end.y * 100}%`}
                        >
                            {colors.map((color, index) => {
                                const offset = locations?.[index] ?? (colors.length === 1 ? 0 : index / (colors.length - 1));
                                const { stopColor, stopOpacity } = toStop(color);
                                return <Stop key={index} offset={offset} stopColor={stopColor} stopOpacity={stopOpacity} />;
                            })}
                        </SvgLinearGradient>
                    </Defs>
                    <Rect x={0} y={0} width={size.width} height={size.height} fill={`url(#${gradientId})`} />
                </Svg>
            )}
        </View>
    );
};

// react-native-linear-gradient's native BVLinearGradient view isn't Fabric
// (New Architecture) compatible on iOS - it renders blank/transparent there.
// Render the gradient with react-native-svg instead on iOS, which has full
// Fabric support; keep the native module on Android where it already works.
const CrossPlatformLinearGradient: React.FC<LinearGradientProps> = ({
    colors,
    locations,
    start,
    end,
    style,
    children,
    ...rest
}) => {
    if (Platform.OS === "ios") {
        const flatStyle = (StyleSheet.flatten(style) ?? {}) as ViewStyle;
        const borderRadius = typeof flatStyle.borderRadius === "number" ? flatStyle.borderRadius : 0;

        return (
            <View style={style}>
                <SvgGradientFill
                    colors={colors as unknown as string[]}
                    locations={locations as unknown as number[] | undefined}
                    start={start as Point | undefined}
                    end={end as Point | undefined}
                    borderRadius={borderRadius}
                />
                {children}
            </View>
        );
    }

    return (
        <RNLinearGradient colors={colors} locations={locations} start={start} end={end} style={style} {...rest}>
            {children}
        </RNLinearGradient>
    );
};

export { CrossPlatformLinearGradient as LinearGradient };
export default CrossPlatformLinearGradient;
