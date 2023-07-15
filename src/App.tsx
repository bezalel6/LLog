/* eslint-disable no-inner-declarations */
import "./App.css";
import React, { FC, useContext, useEffect, useRef, useState } from "react";
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
import EventCreator, {
  EventPresets,
  GUIEventLog,
  GlobalAddEventToDB,
} from "./EventCreator";
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
  TokenResponse,
  // GoogleOAuthProvider,
  googleLogout,
  hasGrantedAllScopesGoogle,
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
// axios.defaults.withCredentials = true;

const auth = firebase.auth();

const App: FC = () => {
  const [user, setUser] = React.useState<firebase.User | null | "initializing">(
    "initializing"
  );
  const [googleAuth, setGoogleAuth] = React.useState<GoogleAuthType>(null);
  const setAuth = (token: GoogleAuthType) => {
    const credential = firebase.auth.GoogleAuthProvider.credential(
      null,
      token.access_token
    );
    firebase
      .auth()
      .signInWithCredential(credential)
      .then(() => {
        console.log("successfully logged into firebase");
        // hasGrantedAllScopesGoogle();
        setGoogleAuth(token);
      })
      .catch((e) => console.error("error logging into firebase " + e));
  };
  React.useEffect(() => {
    async function au() {
      await firebase
        .auth()
        .setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setUser(user);
      });
    }
    au();
  }, []);

  return (
    <div className="App">
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
      <div className="footer">
        <a href="https://www.freeprivacypolicy.com/live/181543f2-ce03-4f06-8f10-494b6416e31f">
          Privacy Policy
        </a>
      </div>
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

  // useGoogleOneTapLogin({
  //   onSuccess: async (res) => {
  //     console.log("succ", res);
  //     authContext.setAuth(res.credential);
  //     // const data = await signIn(code);

  //     // setAccessToken(tokens)
  //     // console.log(tokens);
  //   },
  //   onError: () => {
  //     console.error("err");
  //   },

  // });
  const googleLogin = useGoogleLogin({
    onSuccess: (res) => {
      console.log("succ", res);
      authContext.setAuth(res);
    },
    onError(errorResponse) {
      console.error(errorResponse);
    },
    scope: scopes.join(" "),
    flow: "implicit",
  });

  return (
    <>
      {/* <GoogleLogin
        locale="he-il"
        onSuccess={(res) => {
          authContext.setAuth(res.credential);
        }}
        onError={() => console.error("login failed")}
        useOneTap
        auto_select
      ></GoogleLogin> */}
      <button onClick={() => googleLogin()}>Sign In With Google</button>
    </>
  );
};
function err(e: any) {
  console.error(e);
}
const checkEventInParams = (addEventToDB: (e: GUIEventLog) => void) => {
  const params = new URLSearchParams(window.location.search);
  if (params.size) {
    let e: GUIEventLog;
    if (params.has("preset")) {
      const presetName = params.get("preset");
      if (!EventPresets[presetName]) {
        err("preset " + presetName + " doesnt exist");
        return;
      } else {
        e = EventPresets[presetName];
      }
    } else {
      e = {
        amount: Number(params.get("amount")),
        event_type: params.get("event_type"),
        unit: params.get("unit"),
      };
    }
    console.log(e);
    addEventToDB(e);
  }
};
export function catchErr(e: any) {
  console.error("caught error");
  console.error({ e });

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
    checkEventInParams(GlobalAddEventToDB);
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
