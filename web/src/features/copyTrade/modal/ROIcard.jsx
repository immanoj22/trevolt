import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import ReactApexChart from "react-apexcharts";
import { useSelector } from "react-redux";
// import { getProfitandLossChart, getReturnOfInvestmentChart } from '../actions/copyTradeAction';
import isEmpty from "is-empty";
import { useParams } from "react-router-dom";
import styles from "../styles/copyProfileDashboard.module.css";
import {
  getProfitandLossCharts,
  getReturnOfInvestmentCharts,
} from "../../../actions/copyTradeAction";

const ROIcard = ({ strategyId, type, userId }) => {
  // const { type, id } = useParams();
  const { userdetails } = useSelector((state) => state.user);
  const [filterType, setFilterType] = useState("1y");
  const [isLoading, setIsLoading] = useState(false);
  const [chartSelected, setChartSelected] = useState("roi");
  const options = [
    { value: "7d", label: "Last 7D" },
    { value: "10d", label: "Last 10D" },
    { value: "1m", label: "Last 1M" },
    { value: "1y", label: "Last 1Y" },
  ];

  // const currentThemeRedux = useSelector((state) => state.theme.theme);

  const [RoiChart, setRoiChart] = useState({
    values: [],
    labels: [],
  });

  // const ChartData = {
  //   series: [
  //     {
  //       name: "series1",
  //       data: RoiChart.values || [""],
  //     },
  //   ],
  //   options: {
  //     chart: {
  //       height: 350,
  //       type: "area",
  //       toolbar: {
  //         show: false,
  //       },
  //       foreColor: "#77777a",
  //     },
  //     dataLabels: {
  //       enabled: false,
  //     },
  //     colors: ["#1DB500"],
  //     stroke: {
  //       curve: "smooth",
  //     },
  //     // xaxis: {
  //     //     // type: 'datetime',
  //     //     type: '',
  //     //     categories: RoiChart.labels
  //     // },
  //     yaxis: {
  //       categories: RoiChart.labels || [""],
  //     },

  //     tooltip: {
  //       x: {
  //         format: "dd/MM/yy HH:mm",
  //       },
  //       theme: true,
  //       // fillSeriesColor: true,
  //       style: {
  //         fontSize: "12px",
  //       },
  //       // onDatasetHover: {
  //       //     highlightDataSeries: true,
  //       // },
  //     },
  //     grid: {
  //       show: false,
  //     },
  //   },
  // };

  const ChartData = useMemo(() => ({
    series: [
      {
        name: "series1",
        data: RoiChart.values || [""],
      },
    ],
    options: {
      chart: {
        height: 350,
        type: "area",
        toolbar: { show: false },
        foreColor: "#77777a",
      },
      dataLabels: { enabled: false },
      colors: ["#1DB500"],
      stroke: { curve: "smooth" },
      xaxis: {
        type: "category",
        categories: RoiChart.labels || [""],
      },
      tooltip: {
        x: { show: true },
        theme: true,
        style: { fontSize: "12px" },
      },
      grid: { show: false },
    },
  }), [RoiChart]);


  const hasData = !isEmpty(RoiChart.values) && RoiChart.values.length > 0;
  const fetchROIChart = async (time = "") => {
    try {
      setIsLoading(true);
      const payload = {
        strategyId: strategyId,
        time: time == "" ? "1Y" : time,
        type: type,
      };
      if (chartSelected == "roi") {
        if (type == "copier") {
          payload["id"] = isEmpty(userdetails.userId) ? "" : userdetails.userId;
        }
        const result = await getReturnOfInvestmentCharts(payload);

        if (result.data.success) {
          setRoiChart(result.data.result);
        }
      } else {
        getPnL(time);
      }
    } catch (e) {
      console.log("getRoi_err", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getPnL = async (time = "") => {
    try {
      if (chartSelected == "pnl") {
        const payload = {
          strategyId: strategyId,
          time: time == "" ? "1Y" : time,
          type: type,
        };
        if (type == "copier") {
          payload["id"] = isEmpty(userdetails.userId) ? "" : userdetails.userId;
        }
        const result = await getProfitandLossCharts(payload);
        if (result.data.success) {
          setRoiChart(result.data.result);
        }
        // setRoiChart(
        //     {
        //         labels: ['02-01-2025', '02-01-2025', '02-01-2025', '02-01-2025', '02-01-2025', '02-01-2025', '02-01-2025', '02-01-2025', '02-01-2025', '03-01-2025', '03-01-2025', '03-01-2025', '03-01-2025', '03-01-2025', '03-01-2025', '03-01-2025', '03-01-2025', '31-01-2025', '31-01-2025'],
        //         totalPandLPercentage: 0,
        //         totalProfitandLossPercentage: 677522319.8810723,
        //         values: ['-170188348.95', '-96773767.05', '-270299142.45', '-163514296.05', '-86762687.70', '-126807005.10', '-210232666.35', '-223580772.15', '-340376697.90', '-116795925.75', '-180199428.30', '-173525375.40', '-110121872.85', '-200221587.00', '-163514296.05', '-126807005.10', '-126807005.10', '1295530806.71', '2268519392.42']
        //     }
        // )
      }
    } catch (error) {
      console.log("getPnL_err", error);
    }
  };

  useEffect(() => {
    // Switching between the ROI/PnL tabs must keep whatever time range is currently
    // selected — passing "" here made fetchROIChart fall back to its internal default
    // ("1Y"), silently discarding the user's chosen filter (e.g. "Last 7D") every time
    // they switched tabs.
    fetchROIChart(filterType.toUpperCase(), chartSelected);
  }, [chartSelected]);

  useEffect(() => {
    if (!isEmpty(type) && !isEmpty(strategyId)) {
      fetchROIChart();
    }
  }, [type, strategyId, userdetails]);

  const handleSelect = (value) => {
    // Keep filterType in the same lowercase casing as `options[].value` (e.g. "1y"),
    // not the uppercased string sent to the API — otherwise the Select's `value` prop
    // (options.find(val => val.value == filterType)) never matches any option, so the
    // dropdown always falls back to the "Select" placeholder instead of showing what's
    // actually selected, even right after picking it or after a refresh.
    setFilterType(value);
    const apiTime = value.toUpperCase();
    if (chartSelected == "roi") {
      fetchROIChart(apiTime);
    } else if (chartSelected == "pnl") {
      getPnL(apiTime);
    }
  };

  return (
    <div className="tcp_insight_cards">
      {/* <div className='tcp_insight_cards_header'>
                <p className='tcp_ic_header_title'>
                    ROI
                </p>

                <div className='tcp_ic_header_tabs'>
                    <button className={tab == 'roi' ? "active" : ""} onClick={() => setTab('roi')}>ROI</button>
                    <button className={tab == 'pnl' ? "active" : ""} onClick={() => setTab('pnl')}>PnL</button>
                </div>
                <div className='tcp_ic_header_filter'>
                    <Select
                        // menuIsOpen={true}
                        options={options}
                        isSearchable={false}
                        placeholder="Last 7D"
                        classNamePrefix="react_select_two"
                        onChange={(e) => { handleSelect(e.value.toUpperCase()) }}
                    />
                </div>
            </div> */}
      <div className={styles.labelHeader}>
        <div className={`${styles.containerFlex}`}>
          <div className={`${styles.labelChartTabs}`}>
            <button
              aria-label="roi"
              className={`${chartSelected == "roi" ? styles.active : ""}`}
              onClick={() => setChartSelected("roi")}
            >
              ROI
            </button>
            <button
              aria-label="pnl"
              className={`${chartSelected == "pnl" ? styles.active : ""}`}
              onClick={() => setChartSelected("pnl")}
            >
              PnL
            </button>
          </div>
          <div className={`react-select__width-sm`}>
            <Select
              // menuIsOpen
              isSearchable={false}
              placeholder="Select"
              classNamePrefix="react-select__primary"
              className="mt-1 mt-md-0"
              options={options}
              // options={"Last 7D"
              //     (userdetails && userdetails?.mobileNumber === "" || userdetails?.mobileNumber === 0) ?
              //         authOptions.filter((el) => el.value != "mobile") : authOptions
              // }
              // onChange={(e) => { setFilterType({ type: e.value }) }}
              value={
                !isEmpty(filterType)
                  ? options.find((val) => val.value == filterType)
                  : ""
              }
              onChange={(e) => {
                handleSelect(e.value);
              }}
            />
          </div>
        </div>
      </div>
      <div className={`${styles.borderBottom}`}></div>
      <div className="tcp_insight_cards_body">
        <div className="tcp_insight_cards_graph">
          {/* <div id="chart">
                        {ChartData && <ReactApexChart
                            options={ChartData.options}
                            series={ChartData.series}
                            type="area" height={350}
                        />}
                    </div> */}

          <div id="chart">
            {isLoading ? (
              <div
                style={{
                  height: 350,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#77777a",
                }}
              >
                <p>Loading...</p>
              </div>
            ) : hasData ? (
              <ReactApexChart
                options={ChartData.options}
                series={ChartData.series}
                type="area"
                height={350}
              />
            ) : (
              <div
                style={{
                  height: 350,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#77777a",
                  gap: "8px",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#77777a"
                  strokeWidth="1.5"
                >
                  <path d="M3 3v18h18" />
                  <path d="M7 16l4-4 4 4 4-6" strokeDasharray="3 2" />
                </svg>
                <p style={{ margin: 0, fontSize: "14px" }}>No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROIcard;
