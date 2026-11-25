// components/Button/Button.jsx

import React from 'react';
import styles from './button.module.css';

/**
 * A customizable button component.
 *
 * @param {Object} props - The button props.
 * @param {boolean} [props.isLoading=false] - Whether the button shows a loading state.
 * @param {string} [props.loadingText="Loading..."] - Text to display while loading.
 * @param {string|number} [props.btnText="Submit"] - Button label text or number.
 * @param {function} props.onClick - Click handler function, receives selectedValue as argument.
 * @param {string} [props.type="button"] - HTML button type.
 * @param {string} [props.staticClass=""] - HTML button type.
 * @param {"primaryBtn" | "secondaryBtn" | "outlineBtn" | "outlineFillBtn" | "textBtn" | "darkFillRectangleBtn" | "invertFillRectangleBtnXs" | "cardBtn" | "cardBtnRectangleSm" | "cardLightBtn" | "cardSuccessBtn" | "cardSuccessBtnXs" | "cardSuccessBtnXxs" | "cardSuccessBtnSm" | "cardSuccessBtnInputAlign" | "backBtn" | "darkFillBtn" | "darkFillBtnXs" | "cardLightBtnSimilar" | "successFillRectangleBtn"|"dangerOuterlineButton"| "dangerOuterlineButtonXs" | "darkOutlineButton" | "dangerFillRectangleBtnXs" | "successFillRectangleBtnXs" | "successFillRectangleBtnXxs" | "successOuterlineButtonXs" | "dangerFillRectangleBtnXxs"  | "badgeBtnXs" | "rectIconBtn" | "successOutLineRectangleBtn"} [props.className="primaryBtn"] - Button style class from `button.module.css`.
 * @param {string} [props.isActive=false] - Custom style from button.module.css.
 * @param {boolean} [props.disabled=false] - Whether button is disabled.
 * @param {*} [props.selectedValue=null] - Value to be passed to `onClick`.
 * @param {number} [props.iconOrder=1] - 1 = icon left, 2 = icon right.
 * @param {"click" | "tab" | "orderPlace" | "none"} [props.clickTone] - 1 = icon left, 2 = icon right.
 * @param {React.ReactElement} [props.reactIconElement=null] - Optional icon.
 */


// "primaryBtn"
// "secondaryBtn"
// "outlineBtn"
// "outlineFillBtn"
// "textBtn"
// "darkFillRectangleBtn"
// "invertFillRectangleBtnXs"
// "cardBtn"
// "cardBtnRectangleSm"
// "cardLightBtn"
// "cardSuccessBtn"
// "cardSuccessBtnXs"
// "cardSuccessBtnXxs"
// "cardSuccessBtnSm"
// "cardSuccessBtnInputAlign"
// "backBtn"
// "darkFillBtn"
// "darkFillBtnXs"
// "cardLightBtnSimilar"
// "successFillRectangleBtn"
// "successOutLineRectangleBtn"
// "successOuterlineButtonXs"
// "dangerOuterlineButton"
// "dangerOuterlineButtonXs"
// "darkOutlineButton"
// "dangerFillRectangleBtnXs"
// "dangerFillRectangleBtnXxs"
// "successFillRectangleBtnXs"
// "successFillRectangleBtnXxs"
// "badgeBtnXs"
// "rectIconBtn"

const Button = ({
    isLoading = false,
    loadingText = "Loading...",
    btnText = "Submit",
    onClick,
    type = 'button',
    className = 'primaryBtn',
    disabled = false,
    selectedValue = null,
    iconOrder = 1,
    reactIconElement = null,
    isActive = false,
    staticClass = "",
    clickTone = "none"
}) => {
    const handleClick = (e) => {
        e.preventDefault();
        if (!disabled && onClick) {
            onClick(selectedValue);
        }
    };

    return (
        <button
            aria-label={btnText ? btnText : 'labelButton'}
            data-click-effect={clickTone}

            type={type}
            disabled={disabled || isLoading}
            onClick={handleClick}
            className={`${styles.defaultBtn} ${styles[className] || ''} ${isActive ? styles.active : ""} ${staticClass}`}
        >
            {reactIconElement && iconOrder === 1 && reactIconElement}
            <span>{isLoading ? loadingText : btnText}</span>
            {reactIconElement && iconOrder === 2 && reactIconElement}
        </button>
    );
};

export default Button;
