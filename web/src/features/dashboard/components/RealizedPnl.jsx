import React, { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import ApexCharts from "apexcharts";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useSelector } from "react-redux";

function RealizedPnlChat({ barChart, range }) {
  const { theme, convertValueforChart } = useGlobalContext();
  const { showCurrency, secondaryCurrency } = useSelector(
    (state) => state.wallet,
  );

  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (barChart?.series) {
      setChartData(barChart.series);
      setTimeout(() => {
        ApexCharts.exec("realized-pnl-chart", "updateSeries", barChart.series);
      }, 20);
    }
  }, [barChart, showCurrency, secondaryCurrency]);

  const chartOption = useMemo(
    () => ({
      chart: {
        id: "realized-pnl-chart",
        type: "bar",
        toolbar: { show: false },
        background: "transparent",

        events: {
          mounted: (chart, opts) => {
            window.dispatchEvent(new Event("resize"));
          },
          updated: (chart, opts) => {
          },
          animationEnd: () => {
          },
        },
      },

      theme: { mode: theme === "dark" ? "dark" : "light" },

      plotOptions: {
        bar: {
          columnWidth: "12%",
          borderRadius: 3,
          colors: {
            ranges: [
              { from: -999999, to: -1, color: "#FF4560" },
              { from: 0, to: 999999, color: "#2563EB" },
            ],
          },
        },
      },

      dataLabels: { enabled: false },

      xaxis: {
        categories: barChart?.categories || [],
        type: "category",
        axisBorder: { show: false },
        axisTicks: { show: false },
      },

      yaxis: {
        labels: {
          style: { colors: "#ccc" },
          formatter: (value) => `${convertValueforChart(value)}`,
        },
      },

      grid: {
        borderColor: "#444",
        strokeDashArray: 3,
      },

      tooltip: {
        theme,
        y: {
          formatter: (value) => `${convertValueforChart(value)}`,
        },
      },
    }),
    [theme, convertValueforChart, barChart?.categories],
  );

  return (
    <div>
      <ReactApexChart
        key={range}
        options={chartOption}
        series={chartData}
        type="bar"
        height={350}
      />
    </div>
  );
}

export default RealizedPnlChat;
