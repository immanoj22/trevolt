import { useEffect } from "react";
import { useLocation } from "react-router-dom";
    import tippy from "tippy.js";
    import "tippy.js/dist/tippy.css";   

const TooltipWrapper = ({ children }) => {
    const { pathname } = useLocation();

    useEffect(() => {
        const elements = document.querySelectorAll("[data-tooltip]");

        elements.forEach((el) => {
            const contentId = el.getAttribute("data-tooltip");
            const placement = el.getAttribute("data-tooltip-position") || "top";
            const isClick = el.hasAttribute("data-click");

            const tooltipContent = document.getElementById(contentId); // get DOM node from ID
            if (!tooltipContent) return;

            tippy(el, {
                content: tooltipContent,
                placement,
                animation: "scale",
                arrow: true,
                interactive: true,
                trigger: "click", // or use `data-click`
                theme: "custom-tooltip", // optional
                appendTo: document.body,
            });
        });
    }, [pathname]);

    return children;
};

export default TooltipWrapper;

