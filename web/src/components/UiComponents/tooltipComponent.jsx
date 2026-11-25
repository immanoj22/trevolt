import React, { useState, useRef, useEffect } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import styles from "./UiComponents.module.css"
const TooltipComponent = ({ children, text, placement = "top", triggerType = "hover", highlight = true }) => {
    const [show, setShow] = useState(false);
    const targetRef = useRef(null);
    const targetTooltipRef = useRef(null);

    // Close tooltip on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (targetRef.current && !targetRef.current.contains(event.target) && !targetTooltipRef?.current?.contains(event.target)) {
                setShow(false);
            }
        };

        if (triggerType === "click") {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [triggerType]);

    // --- Click Mode ---
    if (triggerType === "click") {
        return (
            <OverlayTrigger
                placement={placement}
                show={show}

                overlay={
                    <Tooltip className="tooltipComponent" id={`tooltip-${placement}`}>
                        <div ref={targetTooltipRef}>
                            {typeof text === "string" ? <span>{text}</span> : text}
                        </div>
                    </Tooltip>
                }
            >
                <span
                    ref={targetRef}
                    className={`${styles.tooltipChildrenPart} ${highlight ? styles.highlight : ""}`}
                    onClick={() => setShow((prev) => !prev)}
                >
                    {children}
                </span>
            </OverlayTrigger>
        );
    }

    // --- Hover/Focus Mode ---
    return (
        <OverlayTrigger
            placement={placement}
            trigger={["hover", "focus"]}
            overlay={
                <Tooltip className="tooltipComponent" id={`tooltip-${placement}`}>
                    {typeof text === "string" ? <span>{text}</span> : text}
                </Tooltip>
            }
        >
            <span className={`${styles.tooltipChildrenPart} ${highlight ? styles.highlight : ""}`}>{children}</span>
        </OverlayTrigger>
    );
};

export default TooltipComponent;

// old

// // TooltipWrapper.jsx
// import React from "react";
// import { OverlayTrigger, Tooltip } from "react-bootstrap";

// const TooltipComponent = ({ children, text, placement = "top", triggerType = "hover" }) => {
//     const trigger =
//         triggerType === "click" ? "click" : ["hover", "focus"];
//     return (
//         <OverlayTrigger
//             trigger={trigger}
//             placement={placement}
//             overlay={<Tooltip className="tooltipComponent" id={`tooltip-${placement}`}>{text}</Tooltip>}
//         >
//             <span style={{ cursor: "pointer" }}>{children}</span>
//         </OverlayTrigger>
//     );
// };

// export default TooltipComponent;