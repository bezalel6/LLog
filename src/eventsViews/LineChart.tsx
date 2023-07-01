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
  ChartOptions,
} from "chart.js";
import { Chart, Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import Selection from "../components/SelectionButtons";
import moment from "moment";
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
export interface TimeRange {
  start: Date;
  end: Date;
}
interface ConfigData {
  data: { datasets: any };
  timeRange: TimeRange;
}
const options = (conf: ConfigData): ChartOptions => {
  return {
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "hour" as const,

          displayFormats: {
            hour: "ha" as const,
          },
        },
        min: conf.timeRange.start.getTime(),
        max: conf.timeRange.end.getTime(),
        // ticks: {
        //   stepSize: 10,
        // },
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
};
export default function LineChart({ events }: { events: EventLog[] }) {
  const [timespan, setTimeSpan] = useState(TimeSpan.Day);

  const data = createData(events, timespan);

  // console.log(data);

  return (
    <div>
      <Chart type="line" options={options(data)} data={data.data}></Chart>
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
function groupEventsByTime(events: EventLog[], maxTimeDiffMs: number) {
  const grouped: EventLog[][] = [];
  for (let i = 0; i < events.length; i++) {
    const element = events[i];
    const arr = [element];
    for (let j = i + 1; j < events.length; j++) {
      const other = events[i];
      if (
        Math.abs(element.timestamp.getTime() - other.timestamp.getTime()) <=
        maxTimeDiffMs
      ) {
        arr.push(other);
      }
    }
    grouped.push(arr);
  }
  return grouped;
}

function createData(events: EventLog[], timespan: TimeSpan): ConfigData {
  // Group events by date

  const eventTypes = getEventTypes(events);

  const data = new Map<string, any>();
  const timeRange: TimeRange = {
    start: new Date(),
    end: new Date(),
  };

  if (timespan === TimeSpan.Day) {
    // timeRange.end.setHours(23, 59, 59, 999);
    timeRange.start = moment(new Date()).subtract(1, "day").toDate();
    timeRange.end = moment(new Date()).add(0.5, "day").toDate();
  } else if (timespan === TimeSpan.Week) {
    timeRange.start = moment(new Date()).subtract(1, "weeks").toDate();
  } else if (timespan === TimeSpan.Month) {
    timeRange.start = moment(new Date()).subtract(1, "months").toDate();
  }

  const value: { [eventType: string]: number } = {};
  eventTypes.forEach((t) => (value[t] = 0));
  events
    .filter((e) =>
      moment(e.timestamp).isBetween(timeRange.start, timeRange.end)
    )
    .forEach((e) => {
      if (!data.has(e.event_type)) data.set(e.event_type, []);

      data
        .get(e.event_type)
        .push({ y: (value[e.event_type] += e.normalized), x: e.timestamp });
    });
  const datasets = eventTypes.map((t, i) => {
    const dic: any = {
      type: "line" as const,
      label: t,
      data: data.get(t),
      // backgroundColor: "rgb(75, 192, 192)",
      // borderColor: "white",
      borderWidth: 2,
    };
    return dic;
  });
  // console.log(datasets);

  return { timeRange, data: { datasets } };
}

enum TimeSpan {
  Day,
  Week,
  Month,
}
