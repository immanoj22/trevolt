import React, { useEffect, useState } from "react";
import Select from "react-select";
import { useSelector } from "react-redux";
import Chart from "react-apexcharts";
import isEmpty from "is-empty";
import { useParams, useLocation } from "react-router-dom";
import styles from "../styles/copyProfileDashboard.module.css";
import ReactApexChart from "react-apexcharts";
import { getVolumeBreakDowns } from "../../../actions/copyTradeAction";

// import { getVolumeBreakDown } from '../actions/copyTradeAction'

const VolumeAllocation = ({ strategyId, type, userId }) => {
  const { userdetails } = useSelector((state) => state.user);
  // const [state, setState] = React.useState({})
  const [data, setData] = useState([]);
  const [filterType, setFilterType] = useState("1y");

  const options = [
    { value: "7d", label: "Last 7D" },
    { value: "10d", label: "Last 10D" },
    { value: "1m", label: "Last 1M" },
    { value: "1y", label: "Last 1Y" },
  ];

  const [state, setState] = React.useState({
    series: [],
    options: {
      chart: {
        type: "donut",
      },
      legend: {
        show: false,
      },
      stroke: {
        show: false,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200,
            },
            //   legend: {
            //     position: 'bottom'
            //   }
          },
        },
      ],
    },
  });

  const hasData = !isEmpty(state.series);

  const fetchVolumeBreakDown = async (rawValue) => {
    try {
      // Keep filterType in the same lowercase casing as `options[].value` (e.g. "1y")
      // — otherwise the Select's `value` prop (options.find(val => val.value ==
      // filterType)) never matches any option, so the dropdown always falls back to
      // the "Select" placeholder instead of showing what's actually selected.
      const lowerValue = rawValue.toLowerCase();
      setFilterType(lowerValue);
      let payload = { strategyId: strategyId, time: rawValue.toUpperCase(), type: type };
      if (type == "copier") {
        payload["id"] = isEmpty(userdetails.userId) ? "" : userdetails.userId;
      }
      // console.log("-------------------------------------");
      // console.log("fetchVolumeBreakDown", payload);
      // console.log("-------------------------------------");
      const result = await getVolumeBreakDowns(payload, userdetails.secretKey);

      if (result.data.success) {
        if (result.data.result.length > 0) {
          const value = [];
          const label = [];
          const valueWithLabel = [];
          result.data.result.forEach((item) => {
            value.push(item.count);
            label.push(item.symbol);
            valueWithLabel.push({ count: item.count, symbol: item.symbol });
          });
          setData(valueWithLabel);
          setState({
            options: {
              legend: { show: false },
              dataLabels: { enabled: true },
              onItemHover: { highlightDataSeries: true },
              tooltip: { enabled: true },
              stroke: { show: false, width: 0 },
              labels: label,
            },
            series: value,
          });
        } else {
          setData([]);
          setState({
            series: [],
            options: {
              chart: { type: "donut" },
              legend: { show: false },
              stroke: { show: false },
            },
          });
        }
      }
    } catch (e) {
      console.log("fetchVolumeBreakDown_err", e);
    }
  };

  useEffect(() => {
    if (!isEmpty(strategyId) && !isEmpty(type)) {
      fetchVolumeBreakDown("1y");
    }
  }, [strategyId, type, userdetails]);

  return (
    <div className="tcp_insight_cards">
      {/* <div className='tcp_insight_cards_header'>
                <p className='tcp_ic_header_title'>
                    Volume Allocation
                </p>
                <div className='tcp_ic_header_filter'>
                    <Select
                        // menuIsOpen={true}
                        options={options}
                        isSearchable={false}
                        placeholder="Last 7D"
                        classNamePrefix="react_select_two"
                        onChange={(e) => { fetchVolumeBreakDown(e.value.toUpperCase()) }}
                    />
                </div>
            </div> */}

      <div className={styles.labelHeader}>
        <div className={`${styles.containerFlex}`}>
          <div>
            <p className={styles.cardTitle}>Volume Allocation</p>
          </div>
          <div className={`react-select__width-sm`}>
            <Select
              // menuIsOpen
              isSearchable={false}
              placeholder="Select"
              classNamePrefix="react-select__primary"
              options={options}
              // options={"Last 7D"
              //     (userdetails && userdetails?.mobileNumber === "" || userdetails?.mobileNumber === 0) ?
              //         authOptions.filter((el) => el.value != "mobile") : authOptions
              // }
              // onChange={(e) => { updateType({ type: e.value }) }}
              onChange={(e) => {
                fetchVolumeBreakDown(e.value);
              }}
              value={
                !isEmpty(filterType)
                  ? options.find((val) => val.value == filterType)
                  : ""
              }
            />
          </div>
        </div>
      </div>
      <div className={`${styles.borderBottom}`}></div>
      {/* <div className={`${styles.labelBody}`}>
                <div className={`${styles.containerFlex}`}>
                    <div>
                        <ReactApexChart
                            options={state.options}
                            series={state.series}
                            type="donut"
                            height={350} width={200}
                        />
                    </div>
                    <div className={`${styles.chartInnerContainer} ${styles.containerWidth}`}>
                        <div className={`${styles.containerFlex}`}>
                            {!isEmpty(data) &&
                                data.map((item, index) => (
                                    <p key={index} className={styles.labelValue}>
                                        {item.symbol + " " + item.count
                                        }
                                    </p>
                                ))
                            }

                        </div>
                    </div>
                </div>
            </div> */}

      <div className={`${styles.labelBody}`}>
        <div className={`${styles.containerFlex}`}>
          {!isEmpty(state.series) && state.series.length > 0 ? (
            <>
              <div>
                <ReactApexChart
                  options={state.options}
                  series={state.series}
                  type="donut"
                  height={350}
                  width={200}
                />
              </div>
              <div
                className={`${styles.chartInnerContainer} ${styles.containerWidth}`}
              >
                <div className={`${styles.containerFlex}`}>
                  {!isEmpty(data) &&
                    data.map((item, index) => (
                      <p key={index} className={styles.labelValue}>
                        {item.symbol + " " + item.count}
                      </p>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                height: 350,
                width: "100%",
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
                <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
                <path d="M12 12 L12 3" />
                <path d="M12 12 L19 16" />
              </svg>
              <p style={{ margin: 0, fontSize: "14px" }}>No data available</p>
            </div>
          )}
        </div>
      </div>

      <div className="tcp_insight_cards_body">
        <div className="tcp_insight_cards_graph">
          <div className="row align-items-center">
            <div className="col-md-8 col-lg-5 col-xl-4 col-xxl-5 d-flex justify-content-center mx-auto">
              <div className="donut custom_donut_chart">
                {/* <p className='donut_center_text'>Volume</p> */}
                {/* {
                                    !isEmpty(state.series) && !isEmpty(state.options) ?
                                        <Chart
                                            type='donut'
                                            options={state.options}
                                            series={state.series}
                                        />Volume Allocation
                                        :
                                        <></>
                                    // <p className='donut_center_text'>No data found</p>
                                } */}
              </div>
            </div>
            {/* {
                            !isEmpty(state.series) && !isEmpty(state.options) ?
                                <div className='col-md-12 col-lg-7 col-xl-8 col-xxl-7'>
                                    <div className='donut_legends_container'>
                                        <div className='row'>
                                            {state &&
                                                state?.series?.map((item, index) => {
                                                    return (
                                                        <div className='col-12 col-sm-6 mb-3 d-flex justify-content-center'>
                                                            <div className='dn_single_legends'>
                                                                <div className='dn_legends_dot_bg' style={{ background: "#9F49A3" }}></div>
                                                                <p>{state.options.labels[index]}</p>
                                                                <p>{parseFloat(item).toFixed(0)}</p>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            }

                                        </div>
                                    </div>
                                </div> :
                                <div>No Data found</div>
                        } */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeAllocation;
