/* global process */

import axios from "axios";
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

export const getAggregatedDataBody = (dataType, endTime,bucketByTime = true) => {
  const requestBody = {
    aggregateBy: [
      {
        dataTypeName: dataType,
      },
    ],
    endTimeMillis: endTime,
    startTimeMillis: endTime - 7 * 86400000,
  };
  if(bucketByTime)
  requestBody.bucketByTime= {
    durationMillis: 86400000,
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
  initialState,
) => {
  let state = [];
  let promises = [];
  if ( initialState.length === 0) {
    for (var i = 6; i >= 0; i--) {
      var currTime = new Date(endTime - i * 86400000);
      state.push({
        ...baseObj,
        Date: currTime,
      });
    }
    dataValues.forEach((element) => {
      let body = getAggregatedDataBody(element.type, endTime);
      promises.push(
        axios
          .post(
            "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
            body,
            requestParameters
          )
          .then((resp) => {
            console.log(resp);
            // now, each data bucket represents exactly one day
            for (let idx = 0; idx < 7; idx++) {
              resp.data.bucket[idx].dataset[0].point.forEach((point) => {
                point.value.forEach((val) => {
                  console.table("val",val);
                  let extract = val["intVal"] || Math.ceil(val["fpVal"]) || 0;
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


export const getSleepSessions = async (startTime, endTime, headers) => {
  const res = await axios.get(
    `https://www.googleapis.com/fitness/v1/users/me/sessions?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}&activityType=72`,
    headers
  );
  return res.data;
};

export const getSleepData = async (sleepSessions, headers) => {
  let promises = [];
  sleepSessions.session.forEach((session) => {
    let body = getAggregatedDataBody("com.google.sleep.segment", session.endTimeMillis,false);
    body.startTimeMillis = session.startTimeMillis;
    promises.push(
      axios.post(
        "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
        body,
        headers
      )
    );
  });

  let results = await Promise.all(promises);
  return results.map((res, idx) => {
    console.log(res.data)
    // console.log('res #',idx," - ",res);
    // Process the sleep data
    let totalSleep ={};
    res.data.bucket[0].dataset[0].point.forEach((point) => {
      point.value.forEach((val) => {
        let extract = val["intVal"] || 0;
        if(!totalSleep[extract])totalSleep[extract]= {name:SleepType[extract],val:0};
        const timeInSleepType = (point.endTimeNanos-point.startTimeNanos)/1e+9;
        totalSleep[extract].val +=timeInSleepType;
      });
    });
    
    const created = {
      Sleep: totalSleep,
      DateStart: new Date(sleepSessions.session[idx].startTimeMillis/1),
      DateEnd:new Date(sleepSessions.session[idx].endTimeMillis/1),
    };
    
    return created;
  });
};
const SleepType = {
1:"Awake",
2:"Sleep",
3:"Out_of_bed",
4:"Light_sleep",
5:"Deep_sleep:",
6:"REM",
}
export const getWeeklySleepData = async (startTime, endTime, requestParameters) => {
  let sleepSessions = await getSleepSessions(startTime, endTime, requestParameters);
  console.log('sleep sessions',sleepSessions);
  let sleepData = await getSleepData(sleepSessions, requestParameters);
  return sleepData;
};
