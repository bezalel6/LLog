/* eslint-disable no-inner-declarations */
import "./App.css";
import React, { FC, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/messaging";
import "firebase/compat/firestore";
import { FirebaseContext, UserContext } from "./contexts";
import Events from "./Events";
import { EventLog } from "./components/Event";
import EventCreator from "./EventCreator";

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
  const [user, setUser] = React.useState<firebase.User | null>(null);
  const [msgs, setMessages] = React.useState(new Array<string>());

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    initNotifs();
    return unsubscribe;
  }, []);

  function initNotifs() {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js")
          .then((registration) => {
            console.log(
              "Service Worker registered with scope: ",
              registration.scope
            );
            askForNotificationPermission()
              .then(() => {
                console.log("Notification permission granted.");
                granted();
              })
              .catch((error) => console.error(error));
          })
          .catch((error) => {
            console.error("Service Worker registration failed: ", error);
          });
      });

      const askForNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          throw new Error("Permission not granted for Notification");
        }
        // You can subscribe to push notifications here if you wish
      };
      async function granted() {
        // Retrieve Firebase Messaging object.
        const messaging = firebase.messaging();
        messaging
          .getToken({
            vapidKey:
              "BFWFPkniJjk54Px7g27LVRS7ih-IzwgDNX1KlnIDjIHhdeu-OM301aNjLPjhGeNucA8GgjhA8-LsY0XKMUExspo",
          })
          .then((currentToken) => {
            if (currentToken) {
              console.log("FCM registration token: ", currentToken);
              const lll = (e) => {
                setMessages((m) => [...m, e.notification.body]);

                console.log("!!!!!", e);
                alert(JSON.stringify(e));
              };
              messaging.onMessage(lll);
            } else {
              console.log(
                "No registration token available. Request permission to generate one."
              );
            }
          })
          .catch((err) => {
            console.log("An error occurred while retrieving token. ", err);
          });
      }
      // Trigger the notification permission request
    }
  }

  return (
    <div className="App">
      {msgs.map((m) => (
        <h3>{m}</h3>
      ))}
      {user ? <LoggedIn user={user} /> : <SignIn />}
    </div>
  );
};

const SignIn: FC = () => {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <button className="sign-in" onClick={signInWithGoogle}>
      Sign in with Google
    </button>
  );
};

const LoggedIn: FC<{ user: firebase.User }> = ({ user }) => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);

  return (
    <FirebaseContext.Provider value={app}>
      <UserContext.Provider value={user}>
        <Events currentLogs={eventLogs} setEventLogs={setEventLogs}></Events>
        <EventCreator eventLogs={eventLogs}></EventCreator>
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};

export default App;
