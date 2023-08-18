import { EventLog } from "../EventLog";
import React, { useContext, useEffect, useState } from "react";
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
  TimeUnit,
} from "chart.js";
import { Chart, Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import Selection from "../components/SelectionButtons/SelectionButtons";
import moment from "moment";
import { generateActivityInfo, generateSleepInfo } from "../utils/activities";
import { catchErr } from "../App";
import { GoogleAuthContext, GoogleAuthType } from "../contexts";
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
  unit: TimeUnit;
}
const options = (conf: ConfigData): ChartOptions => {
  return {
    responsive: true,
    // maintainAspectRatio: false,
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: conf.unit,
          // unit: "hour" as const,

          // displayFormats: {
          //   hour: "ha" as const,
          // },
        },
        ticks: {
          source: "auto",
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
  const [configData, setConfigData] = useState<ConfigData>(null);
  const googleAuth = useContext(GoogleAuthContext);

  async function a() {
    if (googleAuth.auth) {
      const conf = await createData(events, timespan, googleAuth.auth);
      setConfigData(conf);
    }
  }

  useEffect(() => {
    a();
  }, []);
  useEffect(() => {
    a();
  }, [events, timespan, googleAuth]);

  // console.log(data);

  return (
    <div className="chart-container">
      {configData && (
        <Chart
          type="line"
          options={options(configData)}
          data={configData.data}
        ></Chart>
      )}
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

async function createData(
  events: EventLog[],
  timespan: TimeSpan,
  googleAuth: GoogleAuthType
): Promise<ConfigData> {
  // Group events by date

  const eventTypes = getEventTypes(events);

  const data = new Map<string, any>();
  const timeRange: TimeRange = {
    start: new Date(),
    end: new Date(),
  };
  let unit: TimeUnit;
  if (timespan === TimeSpan.Day) {
    unit = "hour";
    // timeRange.end.setHours(23, 59, 59, 999);
    timeRange.start = moment(new Date()).subtract(1, "day").toDate();
    timeRange.end = moment(new Date()).add(0.5, "day").toDate();
  } else if (timespan === TimeSpan.Week) {
    unit = "day";
    timeRange.start = moment(new Date()).subtract(1, "weeks").toDate();
    timeRange.end = moment(new Date()).add(0.5, "weeks").toDate();
  } else if (timespan === TimeSpan.Month) {
    unit = "week";
    timeRange.start = moment(new Date()).subtract(1, "months").toDate();
    timeRange.end = moment(new Date()).add(0.5, "months").toDate();
  }
  // const activities = await generateActivityInfo(timeRange);
  const sleep = await generateSleepInfo(timeRange, googleAuth).catch((e) => {
    catchErr(e);
    return [];
  });
  const value: { [eventType: string]: number } = {};

  eventTypes.forEach((t) => (value[t] = 0));
  let prevE;
  events
    .filter((e) =>
      moment(e.timestamp).isBetween(timeRange.start, timeRange.end)
    )
    .forEach((e) => {
      if (!data.has(e.event_type)) data.set(e.event_type, []);
      if (
        prevE &&
        e.timestamp.toDateString() !== prevE.timestamp.toDateString()
      ) {
        eventTypes.forEach((t) => (value[t] = 0));
      }
      prevE = e;
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

  return { unit, timeRange, data: { datasets: [...datasets, ...sleep] } };
}

export enum TimeSpan {
  Day,
  Week,
  Month,
}
