import React, { FC, useContext, useEffect, useState } from "react";
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
  await Auth.logout();
  if (window.google && window.google.accounts) {
    window.google.accounts.id.disableAutoSelect();
  }
  await firebase.auth().signOut();
};
export const SignOut: FC<{ user: firebase.User }> = ({ user }) => {
  return (
    <div className="sign-out">
      <p>Hello {user.displayName}</p>
      <a onClick={signOut}>Sign out</a>
    </div>
  );
};

export function SignIn() {
  const setAuth = useContext(GoogleAuthContext).setAuth;
  // const onCredentialResponse = (res: any) => {
  //   setAuth({ access_token: res.credential });
  //   console.log(res);

  //   // const googleProvider = GoogleAuthProvider.credential(res.clientId,res.credential);
  // };
  // window.onCredentialResponse = onCredentialResponse;
  const onClick = () => {
    Auth.getCredentials().then((tokens) => {
      console.log("got credentials:", tokens);

      setAuth(tokens);
    });
  };
  useEffect(() => {
    onClick();
  }, []);
  return (
    <>
      <button onClick={onClick}>Login</button>
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
