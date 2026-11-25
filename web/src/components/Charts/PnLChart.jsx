import React, { useMemo } from "react";
import Chart from "react-apexcharts";

const PROFIT_COLOR = "#00e396";
const LOSS_COLOR = "#ff5555";
const TARGET_DATE_COLOR = "#008ffb";

// Splits a curve into two series with nulled-out gaps outside each zone, so
// ApexCharts renders a hard color split (green above zero, red below) instead
// of one flat color for the whole area - this is the "On Expiry Date" curve's
// classic red/green kinked-payoff look.
function splitByZone(curve) {
    const profit = [];
    const loss = [];
    curve.forEach((p) => {
        profit.push({ x: p.x, y: p.y >= 0 ? p.y : null });
        loss.push({ x: p.x, y: p.y < 0 ? p.y : null });
    });
    return { profit, loss };
}

export default function PnLChart({ series = [], expirySeries = [], currentPrice, targetPrice, targetPnl }) {
    const options = useMemo(() => {
        const xaxisAnnotations = [];

        if (Number.isFinite(currentPrice)) {
            xaxisAnnotations.push({
                x: currentPrice,
                borderColor: "#008ffb",
                borderWidth: 1,
                label: {
                    borderColor: "#008ffb",
                    orientation: "horizontal",
                    textAnchor: "middle",
                    position: "top",
                    style: { color: "#fff", background: "#008ffb" },
                    text: `Current Price: ${currentPrice.toFixed(2)}`,
                },
            });
        }

        if (Number.isFinite(targetPrice) && Number.isFinite(targetPnl)) {
            const isProfit = targetPnl >= 0;
            const color = isProfit ? "#00e396" : "#ff5555";
            xaxisAnnotations.push({
                x: targetPrice,
                borderColor: color,
                borderWidth: 2,
                label: {
                    borderColor: color,
                    orientation: "horizontal",
                    textAnchor: "middle",
                    position: "bottom",
                    offsetY: 20,
                    style: { color: "#fff", background: color },
                    text: `Projected ${isProfit ? "Profit" : "Loss"}: ${targetPnl.toFixed(2)}`,
                },
            });
        }

        return {
            chart: {
                type: "line",
                background: "transparent",
                toolbar: { show: false },
                animations: { enabled: false },
            },
            grid: {
                borderColor: "var(--color-bg10)",
                strokeDashArray: 0,
            },
            legend: { show: false },
            stroke: {
                // The expiry curve is genuinely piecewise-linear (intrinsic value has
                // sharp kinks at each strike) - smoothing it would misrepresent the
                // shape, so only the target-date curve (which has real Black-Scholes
                // curvature from time value) gets the "smooth" treatment.
                width: [1, 1, 2],
                curve: ["straight", "straight", "smooth"],
            },
            fill: {
                type: ["gradient", "gradient", "solid"],
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.38,
                    opacityTo: 0,
                    stops: [0, 90, 100],
                },
            },
            dataLabels: { enabled: false },
            markers: {
                size: 0,
                hover: { size: 5 },
            },
            xaxis: {
                type: "numeric",
                labels: {
                    style: { colors: "var(--color-bg16)" },
                    formatter: (val) => Number(val).toFixed(0),
                },
            },
            yaxis: {
                labels: {
                    style: { colors: "var(--color-bg16)" },
                    formatter: (val) => Number(val).toFixed(2),
                },
            },
            colors: [PROFIT_COLOR, LOSS_COLOR, TARGET_DATE_COLOR],
            tooltip: {
                shared: true,
                intersect: false,
                theme: "dark",
                x: { formatter: (val) => `Price: ${Number(val).toFixed(2)}` },
                y: { formatter: (val) => (Number.isFinite(val) ? `PnL: ${Number(val).toFixed(2)}` : undefined) },
            },
            annotations: {
                xaxis: xaxisAnnotations,
                yaxis: [{
                    y: 0,
                    borderColor: "var(--color-bg16)",
                    strokeDashArray: 4,
                    label: {
                        borderColor: "transparent",
                        style: { color: "var(--color-bg16)", background: "transparent" },
                        text: "Breakeven",
                    },
                }],
            },
        };
    }, [currentPrice, targetPrice, targetPnl]);

    const { profit, loss } = splitByZone(expirySeries.length ? expirySeries : series);

    const chartSeries = [
        { name: "Profit Zone", type: "area", data: profit },
        { name: "Loss Zone", type: "area", data: loss },
        { name: "On Target Date", type: "line", data: series.map((p) => ({ x: p.x, y: p.y })) },
    ];

    return (
        <div className="p-0">
            <Chart options={options} series={chartSeries} type="line" height={300} />
        </div>
    );
}
