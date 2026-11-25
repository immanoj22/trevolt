// App.js
import React, { useRef, useState } from "react";
import { Overlay } from "react-overlays";

function ClickableTooltip() {
    const [show, setShow] = useState(false);
    const targetRef = useRef(null);

    return (
        <div style={{ padding: "100px" }}>
            <div
                ref={targetRef}
                // onClick={() => setShow((prev) => !prev)}

                onMouseOver={() => setShow(true)}
                // onMouseLeave={() => setShow(false)}
                style={{
                    display: "inline-block",
                    padding: "10px 15px",
                    background: "#007bff",
                    color: "#fff",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                Click Me
            </div>

            <Overlay
                show={show}
                target={() => targetRef.current}
                placement="left"
                container={document.body}
                rootClose
                onHide={() => setShow(false)}
            >
                {({ props, ref }) => (
                    <div
                        ref={ref}
                        {...props}
                        style={{
                            ...props.style,
                            backgroundColor: "white",
                            padding: "10px",
                            border: "1px solid #ccc",
                            borderRadius: "4px",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                            zIndex: 9999,
                        }}
                    >
                        <strong>This is a tooltip!</strong>
                        <br />
                        <button aria-label="clickMe" onClick={() => alert("Clicked inside tooltip!")}>
                            Click me
                        </button>
                    </div>
                )}
            </Overlay>
        </div>
    );
}

export default ClickableTooltip;
