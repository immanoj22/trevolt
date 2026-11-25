import React, { useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useSelector } from "react-redux";

function FeePaidChat({ barChart }) {
  const { theme, convertValueforChart } = useGlobalContext();
  const { showCurrency, secondaryCurrency } = useSelector(
    (state) => state.wallet,
  );

  const [state, setState] = React.useState({
    series: [{ name: "Delta", data: [12, 0, 67] }],
    options: {
      chart: {
        type: "bar",
        toolbar: { show: false },
        background: "transparent",
      },
      theme: { mode: "dark" },

      colors: ["#F5B041"],
      plotOptions: {
        bar: {
          columnWidth: "12%",
          borderRadius: 2,
        },
      },
      dataLabels: { enabled: false },

      legend: {
        labels: { colors: "#ccc" },
        markers: { width: 10, height: 10, radius: 12 },
        itemMargin: { horizontal: 10 },
      },

      xaxis: {
        categories: ["06-20", "06-22", "06-24"],
        axisBorder: { show: false },
        axisTicks: { show: false },
      },

      yaxis: {
        labels: {
          style: { colors: "#ccc" },
          formatter: (value) => convertValueforChart(value),
        },
      },

      grid: {
        borderColor: "#444",
        strokeDashArray: 3,
      },

      tooltip: {
        theme: "dark",
        y: {
          formatter: (value) => convertValueforChart(value.toFixed(2)),
        },
      },
    },
  });

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      series: barChart?.series || [],

      options: {
        ...prev.options,

        xaxis: {
          ...prev.options.xaxis,
          categories: barChart?.categories || [],
        },

        theme: { mode: theme === "dark" ? "dark" : "light" },
      },
    }));
  }, [theme, barChart]);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      options: {
        ...prev.options,

        yaxis: {
          ...prev.options.yaxis,
          labels: {
            ...prev.options.yaxis.labels,
            formatter: (value) => convertValueforChart(value),
          },
        },

        tooltip: {
          ...prev.options.tooltip,
          y: {
            formatter: (value) => convertValueforChart(value.toFixed(2)),
          },
        },
      },
    }));
  }, [showCurrency, secondaryCurrency]);

  return (
    <div>
      {state && (
        <ReactApexChart
          options={state.options}
          series={state.series}
          type="bar"
          height={350}
        />
      )}
    </div>
  );
}

export default FeePaidChat;
