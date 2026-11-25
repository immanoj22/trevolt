import React, { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import ApexCharts from "apexcharts";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useSelector } from "react-redux";

function VolumnTradeChat({ barChart }) {
  const { theme, convertValueforChart } = useGlobalContext();
  const { showCurrency, secondaryCurrency } = useSelector(
    (state) => state.wallet,
  );
  const [series, setSeries] = useState([]);

  useEffect(() => {
    if (barChart?.series) {
      setSeries(barChart.series);
      setTimeout(() => {
        ApexCharts.exec("volume-chart", "updateSeries", barChart.series);
      }, 20);
    }
  }, [barChart, showCurrency, secondaryCurrency]);

  const options = useMemo(
    () => ({
      chart: {
        id: "volume-chart",
        type: "bar",
        toolbar: { show: false },
        background: "transparent",

        events: {
          mounted: () => {
            window.dispatchEvent(new Event("resize"));
          },
          updated: () => {
          },
        },
      },

      theme: { mode: theme === "dark" ? "dark" : "light" },

      colors: ["#F5A524"],

      plotOptions: {
        bar: {
          columnWidth: "12%",
          borderRadius: 4,
        },
      },

      dataLabels: { enabled: false },

      xaxis: {
        categories: barChart?.categories || [],
        axisBorder: { show: false },
        axisTicks: { show: false },
      },

      yaxis: {
        labels: {
          formatter: (value) => `${convertValueforChart(value)}`,
        },
      },

      grid: {
        borderColor: "#444",
        strokeDashArray: 3,
      },

      tooltip: {
        theme: theme === "dark" ? "dark" : "light",
        y: {
          formatter: (value) => `${convertValueforChart(value.toFixed(2))}`,
        },
      },
    }),
    [theme, convertValueforChart, barChart?.categories],
  );

  return (
    <div>
      <ReactApexChart
        key={barChart?.categories?.length}
        options={options}
        series={series}
        type="bar"
        height={350}
      />
    </div>
  );
}

export default VolumnTradeChat;
