import { EventLog } from "../Event";
import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  Colors,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  BarElement,
  LineController,
} from "chart.js";
import { Chart, Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import Selection from "../components/SelectionButtons";
ChartJS.register(
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  LineElement,
  TimeScale,
  Legend,
  Tooltip,
  LineController,
  BarController,
  Colors
);
interface LineProps {
  events: EventLog[];
}
const options = {
  scales: {
    x: {
      type: "time" as const,
      time: {
        unit: "hour" as const,
        displayFormats: {
          hour: "ha" as const,
        },
      },
      min: new Date().setHours(0, 0, 0, 0),
      max: new Date().setHours(23, 59, 59, 999),
      ticks: {
        stepSize: 10,
      },
      title: {
        display: true,
        text: "Time" as const,
      },
    },
    y: {
      title: {
        display: true,
        text: "Value" as const,
      },
    },
  },
};
export default function LineChart({ events }: LineProps) {
  const [timespan, setTimeSpan] = useState(TimeSpan.Day);

  const data = createData(events, timespan);

  // console.log(data);

  return (
    <div>
      <Chart type="line" options={options} data={data}></Chart>
      <Selection<TimeSpan>
        currentValue={timespan}
        enumV={TimeSpan}
        setValue={setTimeSpan}
      ></Selection>
    </div>
  );
}

function getEventTypes(events: EventLog[]) {
  return [...new Set(events.map((e) => e.event_type))];
}

interface Dataset {
  label: string;
  data: any;
}
function createData(events: EventLog[], timespan: TimeSpan) {
  // Group events by date

  const labels = new Set<string>();

  const eventTypes = getEventTypes(events);

  const data = new Map<string, any>();
  if (timespan === TimeSpan.Day) {
    const dayDate = new Date();
    events
      .filter((e) => {
        const ret = e.timestamp?.toDateString() === dayDate.toDateString();

        return ret;
      })
      .forEach((e) => {
        if (!data.has(e.event_type)) data.set(e.event_type, []);

        data.get(e.event_type).push({ y: e.normalized, x: e.timestamp });
      });
  }

  const datasets = eventTypes.map((t, i) => {
    const dic: Dataset & any = {
      type: "line" as const,
      label: t,
      data: data.get(t),
      // backgroundColor: "rgb(75, 192, 192)",
      // borderColor: "white",
      borderWidth: 2,
    };
    return dic;
  });
  console.log(datasets);

  return { labels: [...labels], datasets };
  // const datasets = [...eventTypes].map((t, i) => {
  //   const dic: Dataset = {
  //     label: i == 0 ? t + "" : t + "" + (i + 1),
  //   };
  //   return dic;
  // });
  // const data = {
  //   labels: [...labels],
  //   datasets: [
  //     {
  //       label: "Dataset 1",
  //       data: labels.map(() =>
  //         faker.datatype.number({ min: -1000, max: 1000 })
  //       ),
  //       borderColor: "rgb(255, 99, 132)",
  //       backgroundColor: "rgba(255, 99, 132, 0.5)",
  //       yAxisID: "y",
  //     },
  //     {
  //       label: "Dataset 2",
  //       data: labels.map(() =>
  //         faker.datatype.number({ min: -1000, max: 1000 })
  //       ),
  //       borderColor: "rgb(53, 162, 235)",
  //       backgroundColor: "rgba(53, 162, 235, 0.5)",
  //       yAxisID: "y1",
  //     },
  //   ],
  // };

  // const options = {
  //   responsive: true,
  //   interaction: {
  //     mode: "index" as const,
  //     intersect: false,
  //   },
  //   stacked: false,
  //   plugins: {
  //     title: {
  //       display: true,
  //       text: "Chart.js Line Chart - Multi Axis",
  //     },
  //   },
  //   scales: {
  //     y: {
  //       type: "linear" as const,
  //       display: true,
  //       position: "left" as const,
  //     },
  //     y1: {
  //       type: "linear" as const,
  //       display: true,
  //       position: "right" as const,
  //       grid: {
  //         drawOnChartArea: false,
  //       },
  //     },
  //   },
  // };

  // // Create labels and data arrays
  // for (const date in eventsByDate) {
  //   labels.push(date);
  //   const totalAmount = eventsByDate[date].reduce(
  //     (sum, event) => sum + event.amount,
  //     0
  //   );
  //   data.push(totalAmount);
  // }

  // return { labels, data };
}

enum TimeSpan {
  Day,
  Week,
  Month,
}
