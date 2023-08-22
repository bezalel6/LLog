/* eslint-disable no-inner-declarations */
import "./App.css";
import React, {
  FC,
  createRef,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { EventLog } from "./EventLog";
import EventCreator, {
  EventCreatorClassComponent,
  EventPresets,
  GUIEventLog,
  GlobalAddEventToDB,
  ME_UID_TEMPLATE,
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
import {
  GoogleOAuthProvider,
  hasGrantedAllScopesGoogle,
  useGoogleOneTapLogin,
} from "@react-oauth/google";
import { SignOut, makeProvider, signOut } from "./SignIn";
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  signInWithRedirect,
} from "firebase/auth";
import jwtDecode from "jwt-decode";
import { envDependentValue, isDev } from "./utils/environment";

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
function timeout(num: number) {
  return new Promise((res, rej) => {
    setTimeout(res, num);
  });
}
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
        setGoogleAuth(token);
        console.log("successfully logged into firebase");
        // hasGrantedAllScopesGoogle();
      })
      .catch((e) => console.error("error logging into firebase " + e));
  };
  //tocheck: if the google token expired, theres a chance firebase wouldnt know the persistence is NONE before it calls
  //firebase.auth().onAuthStateChanged((user) => {...
  React.useEffect(() => {
    async function initAuth() {
      if (!window.google) {
        console.log("oopsies no google");
      }
      try {
        const tokens = await Auth.getCredentials();
        console.log("got credentials:", tokens);
        setAuth(tokens);

        const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
          user.getIdToken(true).then((res) => {
            console.log("firebase token:", res);
          });
          setUser(user);
        });
        return unsubscribe;
      } catch (e) {
        catchErr(e);
      }
    }

    // Call the async function and handle the unsubscribe
    const unsubscribe = initAuth();

    // Return a cleanup function that will be called when the component is unmounted
    return () => {
      unsubscribe.then((unsub) => unsub());
    };
  }, []);

  return (
    <div className="App">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GCP_CLIENT_ID}>
        <GoogleAuthContext.Provider
          value={{ auth: googleAuth, setAuth: setAuth }}
        >
          {user === "initializing" ? (
            "Initializing..."
          ) : user ? (
            <LoggedIn user={user} />
          ) : (
            // <SignIn />
            // <SignIn />
            <></>
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
        created_by: ME_UID_TEMPLATE,
      };
    }
    console.log(e);

    // Remove the query parameters related to the event
    params.delete("preset");
    params.delete("amount");
    params.delete("event_type");
    params.delete("unit");
    console.log(window.location);

    // Update the URL without reloading the page
    const newUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname;
    window.history.replaceState({}, "", newUrl);
    setTimeout(() => addEventToDB(e), 1000);
  }
};
export function catchErr(e: any) {
  console.error("caught error");
  console.error({ e });
  const name = e.name ? e.name : e;
  if (name.includes("AxiosError")) {
    if (e.status === 401) {
      alert("authentication err. please try authenticating again");
      signOut();
    } else {
      alert(
        envDependentValue(
          "cant reach the backend",
          "cant reach the emulator. is it running?"
        )
      );
    }
  }
}

const LoggedIn: FC<{ user: firebase.User }> = ({ user }) => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [showEvents, setShowEvents] = useState(true);
  const creatorRef = createRef<EventCreatorClassComponent>();
  useEffect(() => {
    checkEventInParams(creatorRef.current.addEventToDB);
  }, []);

  // const fixME = async () => {
  //   const db = firebase.firestore();
  //   const ref = db.collection("events");
  //   let fixed = 0;
  //   ref.get().then((querySnapshot) => {
  //     querySnapshot.forEach(async (doc) => {
  //       console.log(doc.id, "=>", doc.data());
  //       const data = doc.data() as EventLog;
  //       if(data.created_by){

  //         await ref.doc(doc.id).update({
  //           created_by:firebase.firestore.FieldValue.delete()
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
          {/* <button onClick={fixME}>fix me</button> */}
          <button onClick={() => setShowEvents((s) => !s)}>
            {(showEvents ? "Hide" : "Show") + " "} Events
          </button>
          <SignOut user={user} />
        </div>
        <Events
          shown={showEvents}
          currentLogs={eventLogs}
          setEventLogs={setEventLogs}
        ></Events>

        <EventCreator ref={creatorRef} eventLogs={eventLogs}></EventCreator>
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};

export default App;
