import moment from "moment";
import { TimeRange } from "../eventsViews/LineChart";
import {
  SleepSegment,
  SleepType,
  getDataForRange,
  getRequestHeaders,
  getSleepData,
} from "./dataRequestManager";
import { getAccessToken } from "../Backend";
import { useContext } from "react";
import { GoogleAuthContext, GoogleAuthType } from "../contexts";

export async function generateActivityInfo(
  timeRange: TimeRange,
  googleAuth: GoogleAuthType
): Promise<Dataset> {
  // const accessToken = await getAccessToken();
  const accessToken = googleAuth;
  const headers = getRequestHeaders(accessToken.access_token);
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
  timeRange: TimeRange,
  googleAuth: GoogleAuthType
): Promise<Dataset> {
  console.time("sleep-info");
  // const accessToken = await getAccessToken();
  const accessToken = googleAuth;
  const sleepData = await getSleepData(
    timeRange.start.getTime(),
    timeRange.end.getTime(),
    getRequestHeaders(accessToken.access_token)
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
