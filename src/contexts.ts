import { createContext } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
// import { TokenResponse } from "@react-oauth/google";

export const FirebaseContext = createContext<firebase.app.App | null>(null);

export const UserContext = createContext<firebase.User | null>(null);

export type GoogleAuthType = {
  access_token: string;
  expiry_date: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
} | null;

type SetGoogleAuth = ((auth: GoogleAuthType) => void) | null;
export const GoogleAuthContext = createContext<{
  auth: GoogleAuthType;
  setAuth: SetGoogleAuth;
}>({ auth: null, setAuth: null });
// export const UserContext = createContext<firebase.User | null>(null);
