import styles from './UiComponents.module.css';

export default function CustomRangeSlider({
    min = 1,
    max = 100,
    percentages = [0, 25, 50, 75, 100],
    startingValue = 50,
    handleButtonClick,
    handleSliderChange,
    selectedPercentage = 100,
    disabled,
    disabledPointer,
    labelSuffix,
    // When true, the tick-mark labels along the track (e.g. "2.5x", "7.5x")
    // are rounded to whole numbers for display only — the slider's actual
    // draggable value/step and the click-to-set behavior are untouched,
    // since handleButtonClick still fires with the raw percentage `p`, not
    // the rounded label. Opt-in so other CustomRangeSlider usages (balance
    // %, calculator, risk sliders) keep their existing label precision.
    roundLabels = false,
    // The draggable <input type="range">'s step — defaults to the existing
    // 0.1 (fine-grained) precision every other caller relies on. Leverage
    // sliders pass step={1} so dragging can only ever land on whole
    // numbers, matching roundLabels' whole-number tick marks.
    sliderStep = 0.1
}) {
    // const sidebarValue = {
    //     "0": [0, 0.99],
    //     "25": [25, 25.99],
    //     "50": [50, 55.99],
    //     "75": [75, 75.99],
    // }

    const step = percentages.length > 1
        ? ((percentages[1] - percentages[0]) / 100) * (max - min)
        : 0.01;
    // Guard the max===min case (e.g. a pair whose max_leverage is 1, so the
    // slider's whole range is a single point) — dividing by a zero range
    // would otherwise produce NaN/Infinity and break the handle position.
    const progress = (max - min) > 0 ? ((startingValue - min) / (max - min)) * 100 : 100;
    return (
        <div className={`${styles.customRangeWrapper} ${disabledPointer ? styles.disabledPointer : ""}`}>
            <div className={styles.sliderContainer}>
                {percentages.map((p) => {
                    // const valAtP = (p / 100) * max;
                    const valAtP = p === 0 ? min : (p / 100) * max;
                    // When roundLabels is on, the dot's position (and fill/
                    // active-hide comparisons) must use the SAME rounded
                    // value as its label — otherwise the dot sits at the
                    // true (fractional) percentage while the label shows a
                    // rounded number, and a click lands on a tick visually
                    // offset from where the handle then snaps to.
                    // Clamped to `min` — rounding a fractional tick below the
                    // slider's own minimum (e.g. 0.25 rounding to "0x" when
                    // min/max_leverage is 1x) produced a mark showing a value
                    // the slider can never actually be set to.
                    const labelValue = roundLabels ? Math.max(min, Math.round(valAtP)) : valAtP;
                    const positionValue = labelValue;
                    // const leftPct = (p);
                    // const left = `${((valAtP - min) / (max - min)) * 100}%`;
                   const leftPct = (max - min) > 0 ? ((positionValue - min) / (max - min)) * 100 : 100;
                    const left = `${leftPct}%`

                    const leftValue = `${(valAtP / max) * 100}`;
                    // console.log("valAtP ---->", valAtP, styles)
                    let markerClass;
                    if (max) {
                        markerClass = [
                            styles.sliderMarker,
                            startingValue >= positionValue ? styles.fill : '',
                            // (startingValue == leftValue && progress == startingValue) ? styles.dNone : ''
                            // (valAtP == startingValue) ? styles.dNone : ''
                            (Math.abs(positionValue - startingValue) < 0.05) ? styles.dNone : ''
                        ]
                            .filter(Boolean)
                            .join(' ');
                    }

                    return (
                        <div
                            key={p}
                            // data-label-value={`${valAtP}x`}
                            data-label-value={`${labelValue}${labelSuffix ?? 'x'}`}
                            className={markerClass}
                            style={{ left, transform: 'translateX(-50%)' }}
                            title={`${valAtP}`}
                            // onClick={() => handleButtonClick ? handleButtonClick(p) : null}
                            onClick={() => handleButtonClick?.(p)}
                        >
                        </div>
                    );
                })}

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={sliderStep}
                    value={startingValue}
                    onChange={(e) => handleSliderChange ? handleSliderChange(e) : null}
                    className={styles.customRange}
                    style={{ '--progress': `${progress}%` }}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

export function CustomRangeSliderWithoutLabel({
    max = 100,
    percentages = [0, 25, 50, 75, 100],
    startingValue = 50,
    handleButtonClick,
    handleSliderChange,
    selectedPercentage = 100,
    disabled
}) {
    // const sidebarValue = {
    //     "0": [0, 0.99],
    //     "25": [25, 25.99],
    //     "50": [50, 55.99],
    //     "75": [75, 75.99],
    // }
    const progress = (startingValue / max) * 100;
    return (
        <div className={styles.customRangeWrapper}>
            <div className={styles.sliderContainer}>
                {percentages.map((p) => {
                    const valAtP = (p / 100) * max;
                    const left = `${(valAtP / max) * 100}%`;
                    const leftValue = `${(valAtP / max) * 100}`;
                    // console.log("valAtP ---->", valAtP)
                    
                    let markerClass;
                    if (max) {
                        markerClass = [
                            styles.sliderMarker,
                            startingValue >= valAtP ? styles.fill : '',
                            // (startingValue == leftValue && progress == startingValue) ? styles.dNone : ''
                            (valAtP == startingValue) ? styles.dNone : ''

                        ]
                            .filter(Boolean)
                            .join(' ');
                    }

                    return (
                        <div
                            key={p}
                            data-label-value={`${valAtP}x`}
                            className={markerClass}
                            style={{ left, transform: 'translateX(-50%)' }}
                            title={`${valAtP}`}
                            onClick={() => handleButtonClick ? handleButtonClick(p) : null}
                        >
                        </div>
                    );
                })}

                <input
                    type="range"
                    min="0"
                    max={max}
                    step="0.01"
                    value={startingValue}
                    onChange={(e) => handleSliderChange ? handleSliderChange(e) : null}
                    className={styles.customRange}
                    style={{ '--progress': `${progress}%` }}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}