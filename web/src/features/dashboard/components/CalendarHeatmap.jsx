import React, { useEffect, useMemo } from "react";
import ReactDOMServer from "react-dom/server";
import CalHeatmap from "cal-heatmap";
import "cal-heatmap/cal-heatmap.css";
import Tooltip from "cal-heatmap/plugins/Tooltip";
import "cal-heatmap/cal-heatmap.css";

/**CONTEXT */
import { useGlobalContext } from "../../../context/GlobalProvider";
import { momentFormat } from "../../../lib/dateTimeHelper";

// const chartValue = [
//     { "_id": { "year": 2022, "month": 1, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-01-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2022-01-12" },
//     { "_id": { "year": 2022, "month": 2, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-02-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2022-02-12" },
//     { "_id": { "year": 2022, "month": 3, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-03-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2022-03-12" },
//     { "_id": { "year": 2022, "month": 4, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-04-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2022-04-12" },
//     { "_id": { "year": 2022, "month": 5, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-05-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2022-05-12" },
//     { "_id": { "year": 2022, "month": 6, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-06-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2022-06-12" },
//     { "_id": { "year": 2022, "month": 7, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-07-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2022-07-12" },
//     { "_id": { "year": 2022, "month": 8, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-08-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2022-08-12" },
//     { "_id": { "year": 2022, "month": 9, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-09-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2022-09-12" },
//     { "_id": { "year": 2022, "month": 10, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-10-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2022-10-12" },
//     { "_id": { "year": 2022, "month": 11, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-11-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2022-11-12" },
//     { "_id": { "year": 2022, "month": 12, "day": 12, "hour": 10, "minute": 1440 }, "date": "2022-12-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2022-12-12" },

//     { "_id": { "year": 2023, "month": 1, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-01-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2023-01-12" },
//     { "_id": { "year": 2023, "month": 2, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-02-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2023-02-12" },
//     { "_id": { "year": 2023, "month": 3, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-03-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2023-03-12" },
//     { "_id": { "year": 2023, "month": 4, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-04-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2023-04-12" },
//     { "_id": { "year": 2023, "month": 5, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-05-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2023-05-12" },
//     { "_id": { "year": 2023, "month": 6, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-06-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2023-06-12" },
//     { "_id": { "year": 2023, "month": 7, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-07-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2023-07-12" },
//     { "_id": { "year": 2023, "month": 8, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-08-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2023-08-12" },
//     { "_id": { "year": 2023, "month": 9, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-09-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2023-09-12" },
//     { "_id": { "year": 2023, "month": 10, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-10-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2023-10-12" },
//     { "_id": { "year": 2023, "month": 11, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-11-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2023-11-12" },
//     { "_id": { "year": 2023, "month": 12, "day": 12, "hour": 10, "minute": 1440 }, "date": "2023-12-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2023-12-12" },

//     { "_id": { "year": 2024, "month": 1, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-01-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2024-01-12" },
//     { "_id": { "year": 2024, "month": 2, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-02-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2024-02-12" },
//     { "_id": { "year": 2024, "month": 3, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-03-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2024-03-12" },
//     { "_id": { "year": 2024, "month": 4, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-04-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2024-04-12" },
//     { "_id": { "year": 2024, "month": 5, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-05-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2024-05-12" },
//     { "_id": { "year": 2024, "month": 6, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-06-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2024-06-12" },
//     { "_id": { "year": 2024, "month": 7, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-07-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2024-07-12" },
//     { "_id": { "year": 2024, "month": 8, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-08-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2024-08-12" },
//     { "_id": { "year": 2024, "month": 9, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-09-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2024-09-12" },
//     { "_id": { "year": 2024, "month": 10, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-10-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2024-10-12" },
//     { "_id": { "year": 2024, "month": 11, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-11-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2024-11-12" },
//     { "_id": { "year": 2024, "month": 12, "day": 12, "hour": 10, "minute": 1440 }, "date": "2024-12-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2024-12-12" },

//     { "_id": { "year": 2025, "month": 1, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-01-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2025-01-12" },
//     { "_id": { "year": 2025, "month": 2, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-02-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2025-02-12" },
//     { "_id": { "year": 2025, "month": 3, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-03-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2025-03-12" },
//     { "_id": { "year": 2025, "month": 4, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-04-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2025-04-12" },
//     { "_id": { "year": 2025, "month": 5, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-05-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2025-05-12" },
//     { "_id": { "year": 2025, "month": 6, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-06-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2025-06-12" },
//     { "_id": { "year": 2025, "month": 7, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-07-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2025-07-12" },
//     { "_id": { "year": 2025, "month": 8, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-08-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2025-08-12" },
//     { "_id": { "year": 2025, "month": 9, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-09-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2025-09-12" },
//     { "_id": { "year": 2025, "month": 10, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-10-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2025-10-12" },
//     { "_id": { "year": 2025, "month": 11, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-11-12T00:00:00.000Z", "status": "Profit", "amount": 271.07, "Date": "2025-11-12" },
//     { "_id": { "year": 2025, "month": 12, "day": 12, "hour": 10, "minute": 1440 }, "date": "2025-12-12T00:00:00.000Z", "status": "Lose", "amount": 271.07, "Date": "2025-12-12" }
// ];

const CalendarHeatmapChart = ({ chartValue, startDate, endDate }) => {
  const { convertValue, convertSecValue } = useGlobalContext();

  const processDate = useMemo(() => {
    if (startDate && endDate) {
      const startYear = new Date(startDate).getFullYear();
      const startMonth = new Date(startDate).getMonth() + 1;

      const processStartDate = new Date(startYear, startMonth);

      const endYear = new Date(endDate).getFullYear();
      const endMonth = new Date(endDate).getMonth() + 1;
      const processEndDate = new Date(endYear, endMonth);

      // const startDateVal = new Date(startDate).getFullYear();
      // console.log('processDate -->', { processStartDate, processEndDate });
      // console.log('processDate -->', { endYear, endMonth });

      return { startDate: processStartDate, endDate: processEndDate };
    }
  }, [startDate, endDate]);

  // console.log('processDate', processDate);

  useEffect(() => {
    if (startDate && endDate) {
      const cal = new CalHeatmap();

      const chartData = chartValue.map((item) => ({
        formateDate: new Date(item.date),
        value: item.status === "Profit" ? 1 : -1,
        ...item,
      }));

      cal.paint(
        {
          itemSelector: "#cal-heatmap",
          // range: 12,
          domain: {
            type: "month",
            label: { position: "top" },
            gutter: 10,
            // sort: "desc",
          },
          subDomain: {
            type: "day",
            radius: 2,
            width: 17,
            height: 17,
            // label: (timestamp) => {
            //     // Only show label for the first column (left side)
            //     const day = new Date(timestamp).getDay();
            //     const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            //     return days[day];
            // },
          },
          data: {
            source: chartData,
            x: "date",
            y: "value",
          },
          scale: {
            color: {
              type: "linear",
              domain: [-1, 1],
              range: ["#FF1F1F", "#3B82F6"],
            },
          },
          date: {
            // start: new Date(startDate),
            // end: new Date(endDate),

            start: new Date(processDate.startDate),
            end: new Date(processDate.endDate),

            // start: new Date(2000, 1),
            // end: new Date(2000, 12),

            // start: new Date("01/01/2025"),
            // end: new Date("31/12/2025"),
          },
        },
        [
          [
            Tooltip,
            {
              enabled: true,
              custom: true,

              text: (timestamp, value, dayjsDate) => {
                const dateFormate = "DD-MM-YYYY";
                const dateStr = dayjsDate.format(dateFormate);

                const item = chartData.find(
                  (d) =>
                    momentFormat(
                      d?.formateDate?.toISOString()?.slice(0, 10),
                      "DD-MM-YYYY",
                    ) === dateStr,
                );
                if (!item) {
                  return `<div class="pnlChartTooltip">
                            <div><strong>Date:</strong> <span class="fs15">${dateStr}</span></div>
                            <div class="w-100">
                            <strong class="fs15">No Data</strong>
                            </div>
                        </div>`;
                }
                const amountString = ReactDOMServer.renderToString(
                  convertValue(item?.amount, 2),
                );
                const amountString2 = ReactDOMServer.renderToString(
                  convertSecValue(item?.amount, 2),
                );
                return `
                        <div class="pnlChartTooltip">
                        <div><strong>Date:</strong> <span class="fs15">${dateStr}</span></div>
                        <div><strong>Status:</strong> <span class="fs15">${item.status}</span></div>
                        <div>
                        <strong>Amount:</strong> <span class="fs14"> ${amountString} </span> <span class="fs13"> ${amountString2} </span></div>
                        </div>
                        `;
              },
            },
          ],
        ],
      );
      return () => cal.destroy();
    }
  }, [chartValue, startDate, endDate]);

  return (
    <div className="calendarHeatmapChart">
      <ul className="chartDayList">
        {[
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].map((item, index) => (
          <li title={item}>{item.charAt(0)}</li>
        ))}
      </ul>
      <div id="cal-heatmap"></div>
    </div>
  );
};

export default CalendarHeatmapChart;
