import React, { FC, useContext, useState } from "react";
import { GoogleAuthContext } from "./contexts";
import Auth from "./Auth";
import { useGoogleLogin } from "@react-oauth/google";
import {
  GoogleAuthProvider,
  getAdditionalUserInfo,
  getAuth,
  getRedirectResult,
  signInWithRedirect,
} from "firebase/auth";

import PropTypes from "prop-types";
import { Component } from "react";
import { scopes } from "./App";
import firebase from "firebase/compat/app";
export function makeProvider() {
  const provider = new GoogleAuthProvider();
  for (let i = 0; i < scopes.length; i++) {
    provider.addScope(scopes[i]);
  }
  return provider;
}
export const signOut = async () => {
  // googleLogout();
  await Auth.logout();
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
    window.google.accounts.id.revoke(
      localStorage.getItem("credential"),
      function () {
        console.log("User signed out.");
      }
    );
    await firebase.auth().signOut();
    // location.reload();
  }
};
export const SignOut: FC<{ user: firebase.User }> = ({ user }) => {
  return (
    <div className="sign-out">
      <p>Hello {user.displayName}</p>
      <a onClick={signOut}>Sign out</a>
    </div>
  );
};

// export function SignIn() {
//   return <>ssss</>;
// }
export function SignIn() {
  const setAuth = useContext(GoogleAuthContext).setAuth;
  const onCredentialResponse = (res: any) => {
    setAuth({ access_token: res.credential });
    console.log(res);

    // const googleProvider = GoogleAuthProvider.credential(res.clientId,res.credential);
  };
  window.onCredentialResponse = onCredentialResponse;

  return (
    <>
      o boi
      {/* <div
        id="g_id_onload"
        data-client_id="240965235389-iv21jhu3th9bbkb6p8hrugrips2pgh5e.apps.googleusercontent.com"
        data-context="signin"
        data-ux_mode="popup"
        data-callback="onCredentialResponse"
        data-auto_select="true"
        data-itp_support="true"
        data-scope={scopes.join(" ")}
      ></div>

      <div
        className="g_id_signin"
        data-type="standard"
        data-shape="rectangular"
        data-theme="outline"
        data-text="signin_with"
        data-size="large"
        data-logo_alignment="left"
      ></div> */}
    </>
  );
}
export function _SignIn() {
  const setAuth = useContext(GoogleAuthContext).setAuth;
  // scopes.forEach();
  const signIn = async () => {
    const auth = getAuth();
    auth.useDeviceLanguage();

    const provider = makeProvider();
    signInWithRedirect(auth, provider);
    getRedirectResult(auth)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        setAuth({ access_token: token });
        // The signed-in user info.
        // const user = ;
        // IdP data available using getAdditionalUserInfo(result)
        console.log(getAdditionalUserInfo(result));
      })
      .catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.customData.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        console.log({ error, errorCode, errorMessage, email, credential });
      });
  };
  return (
    <div>
      AnothaSignIn <button onClick={signIn}>Yuh</button>
    </div>
  );
}
