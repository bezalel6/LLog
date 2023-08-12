import axios from "axios";
import moment, { Duration, Moment } from "moment";
import { catchErr } from "../App";
const dataValues = [
  {
    title: "Calories",
    type: "com.google.calories.expended",
  },
  {
    title: "Heart",
    type: "com.google.heart_minutes",
  },
  {
    title: "Move",
    type: "com.google.active_minutes",
  },
  {
    title: "Steps",
    type: "com.google.step_count.delta",
  },
];
// axios.defaults.withCredentials = true;

// We need to get aggregated data *on that particular day for now*

// Provide request headers to be attached with each function call
export const getRequestHeaders = (accessToken: string) => {
  if (!accessToken) debugger;
  console.log("creating request headers with access token:", accessToken);
  const requestHeaderBody = {
    params: {
      key: import.meta.env.VITE_GCP_API_KEY,
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  };
  return requestHeaderBody;
};

export const getAggregatedDataBody = (
  dataType: string,
  startTime: number,
  endTime: number,
  bucketByTime = true
) => {
  const requestBody = {
    aggregateBy: [
      {
        dataTypeName: dataType,
      },
    ],
    startTimeMillis: startTime,
    endTimeMillis: endTime,
  };
  if (bucketByTime)
    return {
      ...requestBody,
      bucketByTime: {
        durationMillis: 86400000,
      },
    };
  return requestBody;
};
// Each object has : {"Calories" : value, "Heart": value ... , "Date": }
// const baseObj = {
//   Calories: 0,
//   Heart: 0,
//   Move: 0,
//   Steps: 0,
// };
export const getDataForRange = async (
  startTime: number,
  endTime: number,
  requestParameters
) => {
  const state: DatedActivityData[] = [];
  const promises = [];

  // calculate the difference in days
  const differenceInDays = Math.ceil(Math.abs(endTime - startTime) / 86400000);

  for (let i = differenceInDays - 1; i >= 0; i--) {
    const currTime = new Date(endTime - i * 86400000);
    state.push({
      Calories: 0,
      Heart: 0,
      Move: 0,
      Steps: 0,
      Date: currTime,
    });
  }
  dataValues.forEach((element) => {
    const body = getAggregatedDataBody(element.type, startTime, endTime);
    promises.push(
      axios
        .post(
          "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
          body,
          { ...requestParameters, withCredentials: false }
        )
        .then((resp) => {
          for (let idx = 0; idx < differenceInDays; idx++) {
            resp.data.bucket[idx].dataset[0].point.forEach((point) => {
              point.value.forEach((val) => {
                const extract = val["intVal"] || Math.ceil(val["fpVal"]) || 0;
                state[idx][element.title] += extract;
              });
            });
          }
        })
    );
  });
  await Promise.all(promises);
  return state;
};

export const getAggregateData = async (body, headers) => {
  const req = await axios.post(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    body,
    { ...headers, withCredentials: false }
  );
  return req;
};

const getSleepSessions = async (
  startTime: number,
  endTime: number,
  headers
) => {
  const res = await axios
    .get(
      `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${new Date(
        startTime
      ).toISOString()}&endTime=${new Date(
        endTime
      ).toISOString()}&activityType=72`,
      { ...headers, withCredentials: false }
    )
    .catch((e) => {
      catchErr(e);
      return { data: [] };
    });
  // .then(() => Promise.resolve({ data: [] }));
  return res.data;
};

const getSleepSegments = async (sleepSessions, headers): Promise<SleepData> => {
  const promises = [];
  sleepSessions.session.forEach((session) => {
    const body = getAggregatedDataBody(
      "com.google.sleep.segment",
      session.startTimeMillis,
      session.endTimeMillis,
      false
    );
    // body.startTimeMillis = session.startTimeMillis;
    promises.push(
      axios.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        body,
        { ...headers, withCredentials: false }
      )
    );
  });

  const results = await Promise.all(promises);
  return results.map((res, idx) => {
    console.log(res.data);
    // console.log('res #',idx," - ",res);
    // Process the sleep data

    const totalSleep: Map<number, SleepSegment> = new Map();
    res.data.bucket[0].dataset[0].point.forEach((point) => {
      point.value.forEach((val) => {
        const extract = val["intVal"] || 0;
        if (!totalSleep.has(extract))
          totalSleep.set(extract, {
            sleepType: extract,
            timeSleptMS: 0,
            duration: moment.duration(),
          });
        const timeInSleepType =
          (point.endTimeNanos - point.startTimeNanos) / 1e6;
        totalSleep.get(extract).timeSleptMS += timeInSleepType;
      });
    });
    totalSleep.forEach((segment) => {
      segment.duration = moment.duration(segment.timeSleptMS);
    });
    const created = {
      Sleep: totalSleep,
      DateStart: new Date(sleepSessions.session[idx].startTimeMillis / 1),
      DateEnd: new Date(sleepSessions.session[idx].endTimeMillis / 1),
    };

    return created;
  });
};

export const getSleepData = async (
  startTime: number,
  endTime: number,
  requestParameters
) => {
  const sleepSessions = await getSleepSessions(
    startTime,
    endTime,
    requestParameters
  );
  const sleepData = await getSleepSegments(sleepSessions, requestParameters);
  return sleepData;
};

export function stringifySleepData(sleepData: SleepData) {
  let ret = "";
  sleepData.forEach((night) => {
    const total = moment.duration();
    ret +=
      night.DateStart.toDateString() +
      " - " +
      night.DateEnd.toDateString() +
      "\n";
    for (const [index, segment] of night.Sleep) {
      ret += stringifySleepSegment(segment);
      total.add(segment.duration);
      ret += "\n";
    }
    ret += "total: " + total.humanize() + "\n\n";
  });
  return ret;
}

export function stringifySleepSegment(segment: SleepSegment) {
  return SleepType[segment.sleepType] + " " + segment.duration.humanize();
}

export type ActivityData = {
  Calories: number;
  Heart: number;
  Move: number;
  Steps: number;
};
export type DatedActivityData = ActivityData & {
  Date: Date;
};

export type SleepData = {
  Sleep: Map<number, SleepSegment>;
  DateStart: Date;
  DateEnd: Date;
}[];

export type SleepSegment = {
  sleepType: SleepType;
  duration: Duration;
  timeSleptMS: number;
};

export enum SleepType {
  Awake = 1,
  Sleep = 2,
  Out_of_bed = 3,
  Light_sleep = 4,
  Deep_sleep = 5,
  REM = 6,
}
