import { createContext } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

export const FirebaseContext = createContext<firebase.app.App | null>(null);

export const UserContext = createContext<firebase.User | null>(null);

export type GoogleAuthType = string | null;

type SetGoogleAuth = ((auth: GoogleAuthType) => void) | null;
export const GoogleAuthContext = createContext<{
  auth: GoogleAuthType;
  setAuth: SetGoogleAuth;
}>({ auth: null, setAuth: null });
// export const UserContext = createContext<firebase.User | null>(null);
