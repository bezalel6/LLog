/* eslint-disable no-inner-declarations */
import "./App.css";
import React, { FC, useEffect, useRef, useState } from "react";
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

import { AuthenticationData } from "./Auth";
import Auth from "./Auth";
import { GitModule } from "@faker-js/faker";
import { GoogleOAuthProvider, useGoogleOneTapLogin } from "@react-oauth/google";
import { SignIn } from "./SignIn";

const app = firebase.initializeApp({
  apiKey: "AIzaSyBv8K7EfFbjG0Bb_Ji7_bQirZ1LXaK7ylw",
  authDomain: "llog-9e6bc.firebaseapp.com",
  projectId: "llog-9e6bc",
  storageBucket: "llog-9e6bc.appspot.com",
  messagingSenderId: "240965235389",
  appId: "1:240965235389:web:e580f88807edc926227dd4",
  measurementId: "G-1WTVS2RTGR",
});
// axios.defaults.withCredentials = true;

const App: FC = () => {
  const [connectedToBackend, setConnectedToBackend] = useState<null | boolean>(
    null
  );
  Auth.alive().then(setConnectedToBackend);
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
  //tocheck: if the google token expired, theres a chance firebase wouldnt know the persistence is NONE before it calls
  //firebase.auth().onAuthStateChanged((user) => {...
  React.useEffect(() => {
    function au() {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        setUser(user);
      });
      return unsubscribe;
    }
    return au();
  }, []);
  console.log(user);

  return (
    <div className="App">
      {connectedToBackend ? (
        <>
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
        </>
      ) : connectedToBackend === null ? (
        <h3>Connecting to backend...</h3>
      ) : (
        <h3 className="error">Couldnt connect to the backend</h3>
      )}
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

const signOut = async () => {
  // googleLogout();
  await Auth.logout();
  await firebase.auth().signOut();
  // location.reload();
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
  const [showEvents, setShowEvents] = useState(false);
  useEffect(() => {
    checkEventInParams(GlobalAddEventToDB);
  }, []);
  // const fixME = async () => {
  //   const db = firebase.firestore();
  //   const ref = db.collection("events");
  //   let fixed = 0;
  //   ref.get().then((querySnapshot) => {
  //     querySnapshot.forEach(async (doc) => {
  //       console.log(doc.id, "=>", doc.data());
  //       const data = doc.data() as EventLog;
  //       if (data.event_type == "mg") {
  //         await ref.doc(doc.id).update({
  //           event_type: data.units,
  //           units: "mg",
  //         });
  //         console.log(++fixed);
  //       }
  //     });
  //   });
  // };
  return (
    <FirebaseContext.Provider value={app}>
      <UserContext.Provider value={user}>
        <div className="inline-children">
          <button onClick={() => setShowEvents((s) => !s)}>
            Toggle Events
          </button>
          <SignOut user={user} />
        </div>
        {showEvents && (
          <Events currentLogs={eventLogs} setEventLogs={setEventLogs}></Events>
        )}
        <EventCreator eventLogs={eventLogs}></EventCreator>
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};

export default App;
