import React, { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import ApexCharts from "apexcharts";
import { useGlobalContext } from "../../../context/GlobalProvider";
import { useSelector } from "react-redux";

function TradingEquityChat({ chartData, range }) {
  const { theme, convertValueforChart } = useGlobalContext();
  const { showCurrency, secondaryCurrency } = useSelector(
    (state) => state.wallet,
  );

  const [chartDataSeries, setChartDataSeries] = useState([]);

  useEffect(() => {
    if (chartData?.series) {
      setChartDataSeries(chartData.series);

      setTimeout(() => {
        ApexCharts.exec(
          "trading-equity-chart",
          "updateSeries",
          chartData.series,
        );
      }, 20);
    }
  }, [chartData, showCurrency, secondaryCurrency]);

  const chartOptions = useMemo(
    () => ({
      chart: {
        id: "trading-equity-chart",
        height: 350,
        type: "line",
        background: "transparent",
        toolbar: { show: false },
        zoom: { enabled: false },

        events: {
          mounted: () => {
            window.dispatchEvent(new Event("resize"));
          },
          updated: () => {
          },
        },
      },

      theme: { mode: theme === "dark" ? "dark" : "light" },

      xaxis: {
        type: "datetime",
      },

      yaxis: {
        labels: {
          formatter: (value) => `${convertValueforChart(value)}`,
        },
      },

      tooltip: {
        x: {
          format: "dd MMM yyyy, HH:mm",
        },
        y: {
          formatter: (val) => `${convertValueforChart(val.toFixed(2))}`,
          title: {
            formatter: (seriesName) => `${seriesName}:`,
          },
        },
      },

      stroke: { curve: "smooth" },

      legend: {
        position: "top",
        horizontalAlign: "right",
        markers: {
          fillColors: ["#FFA500", "#2563EB", "#FF0000"],
        },
        labels: {
          colors: theme === "dark" ? "#fff" : "#000",
        },
        onItemClick: { toggleDataSeries: false },
        onItemHover: { highlightDataSeries: false },
      },

      colors: ["#FFA500", "#2563EB", "#FF0000"],

      noData: {
        text: "No data found",
        align: "center",
        verticalAlign: "middle",
        style: {
          color: theme === "dark" ? "#fff" : "#000",
          fontSize: "14px",
        },
      },
    }),
    [theme, convertValueforChart],
  );

  return (
    <div>
      <ReactApexChart
        key={range}
        options={chartOptions}
        series={chartDataSeries}
        type="line"
        height={350}
        className="tradingEquityGraph"
      />
    </div>
  );
}

export default TradingEquityChat;
