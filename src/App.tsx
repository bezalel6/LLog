/* eslint-disable no-inner-declarations */
import "./App.css";
import React, { FC, useContext, useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/messaging";
import "firebase/compat/firestore";
import {
  FirebaseContext,
  GoogleAuthContext,
  GoogleAuthType,
  UserContext,
} from "./contexts";
import Events from "./Events";
import { EventLog } from "./Event";
import EventCreator, { GUIEventLog } from "./EventCreator";
import moment from "moment";
import {
  getDataForRange,
  getRequestHeaders,
  getSleepData,
  stringifySleepData,
} from "./utils/dataRequestManager";

import axios, { AxiosError } from "axios";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  // GoogleOAuthProvider,
  googleLogout,
  useGoogleLogin,
  useGoogleOneTapLogin,
} from "@react-oauth/google";
import { alive, signIn } from "./Backend";
import jwtDecode from "jwt-decode";
import { GitModule } from "@faker-js/faker";

const app = firebase.initializeApp({
  apiKey: import.meta.env.VITE_GCP_API_KEY,
  authDomain: "llog-9e6bc.firebaseapp.com",
  projectId: "llog-9e6bc",
  storageBucket: "llog-9e6bc.appspot.com",
  messagingSenderId: "240965235389",
  appId: "1:240965235389:web:e580f88807edc926227dd4",
  measurementId: "G-1WTVS2RTGR",
});
axios.defaults.withCredentials = true;

const auth = firebase.auth();

const App: FC = () => {
  const [user, setUser] = React.useState<firebase.User | null | "initializing">(
    "initializing"
  );
  const [googleAuth, setGoogleAuth] = React.useState<GoogleAuthType>(null);
  const [backendConnected, setBackendConnected] = React.useState(false);
  const setAuth = (token: string) => {
    const credential = firebase.auth.GoogleAuthProvider.credential(
      token,
      token
    );
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(() => {
        console.log("successfully logged into firebase");
        setGoogleAuth(token);
      })
      .catch((e) => console.error("error logging into firebase " + e));
  };
  React.useEffect(() => {
    alive().then(setBackendConnected);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="App">
      {!backendConnected && <div>Connecting to server...</div>}
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GCP_CLIENT_ID_T}>
        <GoogleAuthContext.Provider
          value={{ auth: googleAuth, setAuth: setAuth }}
        >
          {user === "initializing" ? (
            "Initializing..."
          ) : user ? (
            <LoggedIn user={user} />
          ) : (
            <SignIn />
          )}
        </GoogleAuthContext.Provider>
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
  // return (
  //   <GoogleLogin
  //     onSuccess={(res) => {
  //       console.log(res);
  //     }}
  //     onError={() => {
  //       console.error("err");
  //     }}
  //   ></GoogleLogin>
  // );
  const authContext = useContext(GoogleAuthContext);

  const login = useGoogleOneTapLogin({
    onSuccess: async (res) => {
      console.log("succ", res);
      authContext.setAuth(res.credential);
      // const data = await signIn(code);

      // setAccessToken(tokens)
      // console.log(tokens);
    },
    onError: () => {
      console.error("err");
    },
  });
  // const l = useGoogleLogin({});
  // l.
  // const googleLogin = useGoogleLogin({
  //   onSuccess: async ({ code }) => {
  //     console.log("succ", { code });

  //     const data = await signIn(code);
  //     const credential = firebase.auth.GoogleAuthProvider.credential(
  //       data.id_token,
  //       data.access_token
  //     );
  //     firebase
  //       .auth()
  //       .signInWithCredential(credential)
  //       .then(() => console.log("successfully logged into firebase"))
  //       .catch((e) => console.error("error logging into firebase " + e));
  //     // setAccessToken(tokens)
  //     // console.log(tokens);
  //   },
  //   onError(errorResponse) {
  //     console.error(errorResponse);
  //   },
  //   flow: "auth-code",
  // });

  return (
    <>
      {/* <button onClick={() => googleLogin()}>Sign In With Google</button> */}
    </>
  );
};
function checkEventInParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.size) {
    const e: GUIEventLog = {
      amount: Number(params.get("amount")),
      event_type: params.get("event_type"),
      unit: params.get("unit"),
    };
    console.log(e);
  }
}
export function catchErr(e: any) {
  console.error("caught error: " + e);
  if (e.name === "AxiosError") {
    if (e.status === 401) {
      alert("authentication err. please try authenticating again");
      signOut();
    }
  }
}

const signOut = () => {
  googleLogout();
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
  useEffect(() => {
    checkEventInParams();
  }, []);
  return (
    <FirebaseContext.Provider value={app}>
      <UserContext.Provider value={user}>
        <SignOut user={user} />

        <Events currentLogs={eventLogs} setEventLogs={setEventLogs}></Events>
        <EventCreator eventLogs={eventLogs}></EventCreator>
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};

export default App;
