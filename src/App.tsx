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
  getDataForRange,
  getRequestHeaders,
  getSleepData,
  stringifySleepData,
} from "./utils/dataRequestManager";

import { AxiosError } from "axios";
import GoogleLoginPage, { GoogleLoginResponse } from "./GoogleLoginPage";
import Fitness from "./Fitness";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

const app = firebase.initializeApp({
  apiKey: import.meta.env.VITE_GCP_API_KEY,
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
  const login = useGoogleLogin({ flow: "implicit" });
  console.log(login);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="App">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GCP_CLIENT_ID_T}>
        {user === "initializing" ? (
          "Initializing..."
        ) : user ? (
          <LoggedIn user={user} />
        ) : (
          <SignIn />
        )}
      </GoogleOAuthProvider>
    </div>
  );
};
export const scopes = [
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
  const signInWithGoogle = async () => {
    // const gapiA = await loadAuth2(gapi, clientID, scopes.join(" "));
    // console.log({ gapi: gapiA });
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
  const onRes = (res: GoogleLoginResponse) => {
    console.log(res);
    const credential = firebase.auth.GoogleAuthProvider.credential(
      res.credential,
      res.clientId
    );
    firebase
      .auth()
      .signInWithCredential(credential)
      .then((result) => {
        console.log("got user", result);
        // if (result.credential) {
        //   // This gives you a Google Access Token.
        //   const token = (result.credential as firebase.auth.OAuthCredential)
        //     .accessToken;
        //   setAccessToken(token);
        // }
      })
      .catch((e) => {
        console.error("error logging into firebase", e);
      });
  };
  const onErr = () => {
    console.error("err logging into google");
  };
  return (
    // <button className="sign-in" onClick={signInWithGoogle}>
    //   Sign in with Google
    // </button>
    <GoogleLoginPage onRes={onRes} onErr={onErr} />
  );
};

const accessTokenKey = "ACCESS_TOKN";
function setAccessToken(token: string | null) {
  if (token) localStorage.setItem(accessTokenKey, token);
  else localStorage.removeItem(accessTokenKey);
}

export async function getAccessToken() {
  return Promise.resolve(localStorage.getItem(accessTokenKey));
  // const res = await auth.getRedirectResult();
  // return (res.credential as firebase.auth.OAuthCredential).accessToken;
}
export function catchErr(e: any) {
  console.error(e);
  if (e.name === "AxiosError") {
    if (e.status === 401) {
      alert("authentication err. please try authenticating again");
      signOut();
    }
  }
}
async function rertrieveSleepInfo(accessToken: string) {
  const requestHeaders = getRequestHeaders(accessToken);
  const startTime = moment(new Date()).subtract("day", 4).toDate().getTime();
  const endTime = new Date().getTime();
  // await getDataForRange(startTime, endTime, requestHeaders, callBack, []).catch(
  // catchErr
  // );

  const requestParameters = getRequestHeaders(accessToken);

  await getSleepData(startTime, endTime, requestParameters)
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
