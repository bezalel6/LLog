import "./App.css";
import React, { FC } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import { FirebaseContext, UserContext } from "./contexts";
import Events from "./Events";
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

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  return (
    <div className="App">{user ? <LoggedIn user={user} /> : <SignIn />}</div>
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
  return (
    <FirebaseContext.Provider value={app}>
      <UserContext.Provider value={user}>
        <Events></Events>
        <EventCreator></EventCreator>
      </UserContext.Provider>
    </FirebaseContext.Provider>
  );
};

export default App;
