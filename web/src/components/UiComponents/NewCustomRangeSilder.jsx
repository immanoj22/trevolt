import { useState, useCallback } from "react";

// ── CONFIG ───────────────────────────────────────────────────────────────────
const RANGE_PRESETS = [
    { label: "1–10x", min: 1, max: 10, markers: [1, 3, 5, 7, 10] },
    { label: "1–20x", min: 1, max: 20, markers: [1, 5, 10, 15, 20] },
    { label: "1–50x", min: 1, max: 50, markers: [1, 10, 20, 30, 40, 50] },
    { label: "1–100x", min: 1, max: 100, markers: [1, 20, 40, 60, 80, 100] },
    { label: "1–200x", min: 1, max: 200, markers: [1, 40, 80, 120, 160, 200] },
];

// Default fixed markers for 1–150 range
const DEFAULT_MARKERS = [1, 30, 60, 90, 120, 150];
const DEFAULT_MIN = 1;
const DEFAULT_MAX = 150;
const DEFAULT_VALUE = 150;

// ── HELPERS ──────────────────────────────────────────────────────────────────

/** Value → left % position on track */
function valToPct(val, min, max) {
    return ((val - min) / (max - min)) * 100;
}

/** Snap raw drag value to nearest marker if within 4% of range */
function snapToMarker(raw, markers, min, max) {
    const snapZone = (max - min) * 0.04;
    const nearest = markers.reduce((a, b) =>
        Math.abs(b - raw) < Math.abs(a - raw) ? b : a
    );
    return Math.abs(nearest - raw) <= snapZone ? nearest : raw;
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function CustomLeverageSlider({
    initialMin = DEFAULT_MIN,
    initialMax = DEFAULT_MAX,
    initialValue = DEFAULT_VALUE,
    initialMarkers = DEFAULT_MARKERS,
    showPresets = true,
    onChange,
}) {
    const [min, setMin] = useState(initialMin);
    const [max, setMax] = useState(initialMax);
    const [value, setValue] = useState(initialValue);
    const [markers, setMarkers] = useState(initialMarkers);
    const [activePreset, setActivePreset] = useState(null);

    const progress = valToPct(value, min, max);

    // ── handlers ──
    const handleSliderChange = useCallback(
        (e) => {
            const raw = Number(e.target.value);
            const snapped = snapToMarker(raw, markers, min, max);
            setValue(snapped);
            onChange?.(snapped);
        },
        [markers, min, max, onChange]
    );

    const handleMarkerClick = useCallback(
        (mv) => {
            setValue(mv);
            onChange?.(mv);
        },
        [onChange]
    );

    const handleDecrement = () => {
        const next = Math.max(min, value - 1);
        setValue(next);
        onChange?.(next);
    };

    const handleIncrement = () => {
        const next = Math.min(max, value + 1);
        setValue(next);
        onChange?.(next);
    };

    const handlePreset = (preset, idx) => {
        setMin(preset.min);
        setMax(preset.max);
        setMarkers(preset.markers);
        setValue(preset.min);
        setActivePreset(idx);
        onChange?.(preset.min);
    };

    // ── render ──
    return (
        <>
            <style>{`
        .lev-step-btn:hover { background: rgba(255,255,255,0.07) !important; }
        .lev-preset-btn:hover:not(.active) { border-color:#4cde82 !important; color:#4cde82 !important; }
        .lev-marker:hover { border-color:#4cde82 !important; transform:translateX(-50%) rotate(45deg) scale(1.25) !important; }
        .lev-range::-webkit-slider-thumb { -webkit-appearance:none; width:1px; height:1px; }
        .lev-range::-moz-range-thumb { width:1px; height:1px; border:none; background:transparent; }
      `}</style>

            <div style={s.wrapper}>

                {/* ── Label ── */}
                <div style={s.label}>Leverage</div>

                {/* ── Display box ── */}
                <div style={s.displayBox}>
                    <button className="lev-step-btn" style={s.stepBtn} onClick={handleDecrement}>−</button>
                    <span style={s.valueText}>{value}x</span>
                    <button className="lev-step-btn" style={s.stepBtn} onClick={handleIncrement}>+</button>
                </div>

                {/* ── Preset range buttons ── */}
                {showPresets && (
                    <div style={s.presetRow}>
                        {RANGE_PRESETS.map((p, i) => (
                            <button
                                key={p.label}
                                className={`lev-preset-btn${activePreset === i ? " active" : ""}`}
                                style={{ ...s.presetBtn, ...(activePreset === i ? s.presetBtnActive : {}) }}
                                onClick={() => handlePreset(p, i)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Slider section ── */}
                <div style={s.sliderSection}>

                    {/* Grey track */}
                    <div style={s.trackBg} />

                    {/* Green filled track */}
                    <div style={{ ...s.trackFill, width: `${progress}%` }} />

                    {/* ── Diamond markers at exact fixed values ── */}
                    {markers.map((mv) => {
                        const leftPct = valToPct(mv, min, max);
                        const isFilled = value > mv;
                        const isThumb = Math.abs(value - mv) < 0.5;

                        if (isThumb) return null; // hide when thumb sits on this marker

                        return (
                            <div
                                key={mv}
                                className="lev-marker"
                                title={`${mv}x`}
                                onClick={() => handleMarkerClick(mv)}
                                style={{
                                    position: "absolute",
                                    top: "4px",
                                    left: `${leftPct}%`,
                                    width: "10px",
                                    height: "10px",
                                    transform: "translateX(-50%) rotate(45deg)",
                                    background: isFilled ? "#1a3d2b" : "#12151a",
                                    border: `1.5px solid ${isFilled ? "#4cde82" : "#4a4f5e"}`,
                                    cursor: "pointer",
                                    zIndex: 2,
                                    transition: "all 0.12s",
                                }}
                            />
                        );
                    })}

                    {/* ── White circle thumb ── */}
                    <div
                        style={{
                            position: "absolute",
                            top: "1px",
                            left: `${progress}%`,
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            transform: "translateX(-50%)",
                            zIndex: 5,
                            pointerEvents: "none",
                            boxShadow: "0 0 0 3px rgba(255,255,255,0.13)",
                        }}
                    />

                    {/* ── Native range input (invisible drag layer) ── */}
                    <input
                        type="range"
                        className="lev-range"
                        min={min}
                        max={max}
                        step={1}
                        value={value}
                        onChange={handleSliderChange}
                        style={s.rangeInput}
                    />

                    {/* ── Labels below markers ── */}
                    <div style={s.labelsRow}>
                        {markers.map((mv) => (
                            <span
                                key={mv}
                                style={{ ...s.markerLabel, left: `${valToPct(mv, min, max)}%` }}
                            >
                                {mv}x
                            </span>
                        ))}
                    </div>

                </div>
            </div>
        </>
    );
}

// ── STYLES ───────────────────────────────────────────────────────────────────
const s = {
    wrapper: {
        padding: "20px 24px 16px",
        background: "#181b22",
        borderRadius: "14px",
        maxWidth: "500px",
        fontFamily: "'Inter', -apple-system, sans-serif",
        userSelect: "none",
    },
    label: {
        fontSize: "13px",
        color: "#8b8f9a",
        marginBottom: "10px",
        fontWeight: 400,
        letterSpacing: "0.02em",
    },
    displayBox: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#12151a",
        border: "1px solid #2a2d35",
        borderRadius: "10px",
        padding: "8px 14px",
        marginBottom: "16px",
    },
    stepBtn: {
        width: "34px",
        height: "34px",
        background: "transparent",
        border: "none",
        color: "#8b8f9a",
        fontSize: "22px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
        lineHeight: 1,
        padding: 0,
        fontFamily: "inherit",
        transition: "background 0.15s",
    },
    valueText: {
        fontSize: "20px",
        fontWeight: 500,
        color: "#ffffff",
        letterSpacing: "0.01em",
    },
    presetRow: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "24px",
    },
    presetBtn: {
        fontSize: "12px",
        padding: "5px 12px",
        borderRadius: "6px",
        border: "1px solid #2a2d35",
        background: "transparent",
        color: "#8b8f9a",
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
    },
    presetBtnActive: {
        background: "#1a3d2b",
        color: "#4cde82",
        border: "1px solid #4cde82",
        fontWeight: 500,
    },
    sliderSection: {
        position: "relative",
        paddingBottom: "28px",
        paddingTop: "8px",
    },
    trackBg: {
        position: "absolute",
        top: "9px",
        left: 0,
        right: 0,
        height: "3px",
        background: "#2a2d35",
        borderRadius: "2px",
    },
    trackFill: {
        position: "absolute",
        top: "9px",
        left: 0,
        height: "3px",
        background: "#26a65b",
        borderRadius: "2px",
        pointerEvents: "none",
        transition: "width 0.05s",
    },
    rangeInput: {
        position: "absolute",
        top: "2px",
        left: 0,
        width: "100%",
        margin: 0,
        opacity: 0,
        cursor: "pointer",
        height: "28px",
        zIndex: 10,
        WebkitAppearance: "none",
    },
    labelsRow: {
        position: "relative",
        height: "20px",
        marginTop: "14px",
    },
    markerLabel: {
        position: "absolute",
        fontSize: "11px",
        color: "#5a5f6e",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        top: 0,
        fontFamily: "inherit",
    },
};