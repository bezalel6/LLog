import { EventLog } from "../Event";
import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
interface LineProps {
  events: EventLog[];
}

export default function LineChart({ events }: LineProps) {
  const eventsByType: { [type: string]: EventLog[] } = {};

  events.forEach((e) => {
    if (!eventsByType[e.event_type]) {
      eventsByType[e.event_type] = [];
    }
    eventsByType[e.event_type].push(e);
  });

  return (
    <div>
      {Object.values(eventsByType).map((evs, i) => (
        <LineComponent key={i} events={evs}></LineComponent>
      ))}
    </div>
  );
}

function LineComponent({ events }: LineProps) {
  const labels = [],
    data = [];
  // const { labels, data } = createData(events);
  console.log(labels);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "# of events",
        data: data,
        fill: false,
        backgroundColor: "rgba(75,192,192,0.4)",
        borderColor: "rgba(75,192,192,1)",
      },
    ],
  };

  return (
    <div>
      <Line data={chartData} />
    </div>
  );
}

interface ChartData {
  labels: string[];
  data: number[];
}

/**
 * label: "Dataset 1",
        data: labels.map(() =>
          faker.datatype.number({ min: -1000, max: 1000 })
        ),
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        yAxisID: "y",
 */
interface Dataset {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
  yAxisID: string;
}
function createData(events: EventLog[]) {
  // Group events by date
  const eventsByDate: { [date: string]: EventLog[] } = {};
  const labels = new Set<string>();

  const eventTypes = new Set<string>();

  events.forEach((event) => {
    const date = event.timestamp?.toDateString();
    if (date) {
      if (!eventsByDate[date]) {
        eventsByDate[date] = [];
      }
      eventsByDate[date].push(event);
      labels.add(date.toString());
    }
    eventTypes.add(event.event_type);
  });

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
