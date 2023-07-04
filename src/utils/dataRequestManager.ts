import axios from "axios";
import moment, { Duration, Moment } from "moment";
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
// We need to get aggregated data *on that particular day for now*

// Provide request headers to be attached with each function call
export const getRequestHeaders = (accessToken) => {
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
  endTime: number,
  bucketByTime = true
) => {
  const requestBody = {
    aggregateBy: [
      {
        dataTypeName: dataType,
      },
    ],
    endTimeMillis: endTime,
    startTimeMillis: endTime - 7 * 86400000,
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

export const getAggregateData = async (body, headers) => {
  const req = await axios.post(
    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
    body,
    headers
  );
  return req;
};

// we need to return [{Today}, {Yesterday} .... {7 days back}]
// Each object has : {"Calories" : value, "Heart": value ... , "Date": }
const baseObj = {
  Calories: 0,
  Heart: 0,
  Move: 0,
  Steps: 0,
};

export const getWeeklyData = async (
  endTime,
  requestParameters,
  callBack,
  initialState
) => {
  const state = [];
  const promises = [];
  if (initialState.length === 0) {
    for (let i = 6; i >= 0; i--) {
      const currTime = new Date(endTime - i * 86400000);
      state.push({
        ...baseObj,
        Date: currTime,
      });
    }
    dataValues.forEach((element) => {
      const body = getAggregatedDataBody(element.type, endTime);
      promises.push(
        axios
          .post(
            "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            body,
            requestParameters
          )
          .then((resp) => {
            console.log(resp.data.bucket.length);
            console.log(resp);
            // now, each data bucket represents exactly one day
            for (let idx = 0; idx < 7; idx++) {
              resp.data.bucket[idx].dataset[0].point.forEach((point) => {
                point.value.forEach((val) => {
                  // console.table("val", val);
                  const extract = val["intVal"] || Math.ceil(val["fpVal"]) || 0;
                  state[idx][element.title] += extract;
                });
              });
            }
          })
      );
    });
    Promise.all(promises).then(() => {
      callBack(state);
    });
  }
};

export const getSleepSessions = async (
  startTime: Moment | Date,
  endTime: Moment | Date,
  headers
) => {
  const res = await axios.get(
    `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&activityType=72`,
    headers
  );
  return res.data;
};

export const getSleepData = async (
  sleepSessions,
  headers
): Promise<SleepData> => {
  const promises = [];
  sleepSessions.session.forEach((session) => {
    const body = getAggregatedDataBody(
      "com.google.sleep.segment",
      session.endTimeMillis,
      false
    );
    body.startTimeMillis = session.startTimeMillis;
    promises.push(
      axios.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        body,
        headers
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

enum SleepType {
  Awake = 1,
  Sleep = 2,
  Out_of_bed = 3,
  Light_sleep = 4,
  Deep_sleep = 5,
  REM = 6,
}
export const getWeeklySleepData = async (
  startTime: Date | Moment,
  endTime: Date | Moment,
  requestParameters
) => {
  const sleepSessions = await getSleepSessions(
    startTime,
    endTime,
    requestParameters
  );
  const sleepData = await getSleepData(sleepSessions, requestParameters);
  return sleepData;
};
