/* eslint-disable no-inner-declarations */
import "./App.css";
import React, { FC, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/messaging";
import "firebase/compat/firestore";
import { FirebaseContext, UserContext } from "./contexts";
import Events from "./Events";
import { EventLog } from "./Event";
import EventCreator from "./EventCreator";
import moment from "moment";
import {
  getRequestHeaders,
  getWeeklyData,
  getWeeklySleepData,
  stringifySleepData,
} from "./utils/dataRequestManager";
import { AxiosError } from "axios";

const app = firebase.initializeApp({
  apiKey: "AIzaSyBv8K7EfFbjG0Bb_Ji7_bQirZ1LXaK7ylw",
  authDomain: "llog-9e6bc.firebaseapp.com",
  projectId: "llog-9e6bc",
  storageBucket: "llog-9e6bc.appspot.com",
  messagingSenderId: "240965235389",
  appId: "1:240965235389:web:e580f88807edc926227dd4",
  measurementId: "G-1WTVS2RTGR",
});

const auth = firebase.auth();

const App: FC = () => {
  const [user, setUser] = React.useState<firebase.User | null | "initializing">(
    "initializing"
  );

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="App">
      {user === "initializing" ? (
        "Initializing..."
      ) : user ? (
        <LoggedIn user={user} />
      ) : (
        <SignIn />
      )}
    </div>
  );
};
const scopes = [
  "https://www.googleapis.com/auth/fitness.activity.read",
  "https://www.googleapis.com/auth/fitness.activity.write",
  "https://www.googleapis.com/auth/fitness.blood_glucose.read",
  "https://www.googleapis.com/auth/fitness.blood_glucose.write",
  "https://www.googleapis.com/auth/fitness.blood_pressure.read",
  "https://www.googleapis.com/auth/fitness.blood_pressure.write",
  "https://www.googleapis.com/auth/fitness.body.read",
  "https://www.googleapis.com/auth/fitness.body.write",
  "https://www.googleapis.com/auth/fitness.body_temperature.read",
  "https://www.googleapis.com/auth/fitness.body_temperature.write",
  "https://www.googleapis.com/auth/fitness.heart_rate.read",
  "https://www.googleapis.com/auth/fitness.heart_rate.write",
  "https://www.googleapis.com/auth/fitness.location.read",
  "https://www.googleapis.com/auth/fitness.location.write",
  "https://www.googleapis.com/auth/fitness.nutrition.read",
  "https://www.googleapis.com/auth/fitness.nutrition.write",
  "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
  "https://www.googleapis.com/auth/fitness.oxygen_saturation.write",
  "https://www.googleapis.com/auth/fitness.reproductive_health.read",
  "https://www.googleapis.com/auth/fitness.reproductive_health.write",
  "https://www.googleapis.com/auth/fitness.sleep.read",
  "https://www.googleapis.com/auth/fitness.sleep.write",
];
const SignIn: FC = () => {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    scopes.forEach((scope) => {
      provider.addScope(scope);
    });
    auth.signInWithPopup(provider).then((result) => {
      if (result.credential) {
        // This gives you a Google Access Token.
        const token = (result.credential as firebase.auth.OAuthCredential)
          .accessToken;
        setAccessToken(token);
      }
    });
  };

  return (
    <button className="sign-in" onClick={signInWithGoogle}>
      Sign in with Google
    </button>
  );
};

const accessTokenKey = "ACCESS_TOKN";
function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(accessTokenKey, token);
  else localStorage.removeItem(accessTokenKey);
}

async function getAccessToken() {
  return localStorage.getItem(accessTokenKey);
  // const res = await auth.getRedirectResult();
  // return (res.credential as firebase.auth.OAuthCredential).accessToken;
}
function catchErr(e: any) {
  console.error(e);
  if (e instanceof AxiosError) {
    if (e.status === 401) {
      alert("authentication err. please try authenticating again");
      signOut();
    }
  }
}
async function rertrieveSleepInfo(accessToken: string) {
  const callBack = (state) => {
    console.table(state);
  };
  const requestHeaders = getRequestHeaders(accessToken);
  const timeRightNow = new Date().getTime();
  await getWeeklyData(timeRightNow, requestHeaders, callBack, []).catch(
    catchErr
  );

  const startTime = moment(new Date()).subtract("day", 4).toDate();
  const endTime = new Date();
  const requestParameters = getRequestHeaders(accessToken);

  await getWeeklySleepData(startTime, endTime, requestParameters)
    .then((data) => {
      console.log("SLEEP", data);
      console.log(stringifySleepData(data));
    })
    .catch(catchErr);
}
const signOut = () => {
  firebase.auth().signOut().then(location.reload);
};
const SignOut: FC<{ user: firebase.User }> = ({ user }) => {
  return (
    <div className="sign-out">
      <p>Hello {user.displayName}</p>
      <a onClick={signOut}>Sign out</a>
    </div>
  );
};

const LoggedIn: FC<{ user: firebase.User }> = ({ user }) => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

  return (
    <FirebaseContext.Provider value={app}>
      <UserContext.Provider value={user}>
        <SignOut user={user} />
        <button
          onClick={() => {
            getAccessToken().then((t) => rertrieveSleepInfo(t));
          }}
        >
          shleep
        </button>
        <Events currentLogs={eventLogs} setEventLogs={setEventLogs}></Events>
        <EventCreator eventLogs={eventLogs}></EventCreator>
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};

export default App;
