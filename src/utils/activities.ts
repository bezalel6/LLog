import moment from "moment";
import { getAccessToken } from "../App";
import { TimeRange } from "../eventsViews/LineChart";
import {
  SleepSegment,
  SleepType,
  getDataForRange,
  getRequestHeaders,
  getSleepData,
} from "./dataRequestManager";

export async function generateActivityInfo(
  timeRange: TimeRange
): Promise<Dataset> {
  const accessToken = await getAccessToken();
  const headers = getRequestHeaders(accessToken);
  const activityDays = await getDataForRange(
    timeRange.start.getTime(),
    timeRange.end.getTime(),
    headers
  );
  const data = new Map<string, any>();
  let dayKeys = [];
  activityDays.forEach((day) => {
    const keys = (dayKeys = Object.keys(day));
    const value: { [activityType: string]: number } = {};
    keys.forEach((t) => (value[t] = 0));
    keys.forEach((key) => {
      const currentTime = day.Date.getTime();
      const currentVal = day[key];
      //   prob the first bug imma have
      if (!currentVal) return;
      if (!data.has(key)) data.set(key, []);
      data.get(key).push({ y: (value[key] += currentVal), x: day.Date });
    });
  });

  return dayKeys.map((key, i) => {
    const dataset = {
      type: "line" as const,
      label: key,
      data: data.get(key),
      borderWidth: 2,
    };
    return dataset;
  });
}

export async function generateSleepInfo(
  timeRange: TimeRange
): Promise<Dataset> {
  console.time("sleep-info");
  const accessToken = await getAccessToken();
  const sleepData = await getSleepData(
    timeRange.start.getTime(),
    timeRange.end.getTime(),
    getRequestHeaders(accessToken)
  );
  const data = new Map<string, any>();
  let segmentKeys = [];
  let hours = 0;
  data.set("Sleep", []);
  sleepData.forEach((night) => {
    // const keys = (segmentKeys = Object.keys(night));
    // const value: { [sleepType: string]: number } = {};
    // keys.forEach((t) => (value[t] = 0));
    // night.Sleep.forEach((segment, sleepType) => {
    //     value[sleepType]+=segment.timeSleptMS;
    // });
    if (!data.get("Sleep")) data.set("Sleep", []);
    // data.get("Sleep").push({ y: 0, x: night.DateStart.getTime() });
    data.get("Sleep").push({ y: sum(night.Sleep), x: night.DateEnd.getTime() });
  });

  const singleDataset = {
    type: "line" as const,
    label: "Sleep",
    data: [],
    borderWidth: 2,
  };
  data.get("Sleep").forEach((n) => singleDataset.data.push(n));
  console.timeEnd("sleep-info");
  return [singleDataset];
}

function sum(segments: Map<number, SleepSegment>) {
  let sum = 0;

  for (const [i, segment] of segments) {
    sum += segment.timeSleptMS;
  }
  return moment.duration(sum).hours();
}

type Dataset = any[];
export type ActivityInfo = {};
