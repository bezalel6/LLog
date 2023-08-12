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
export function makeProvider() {
  const provider = new GoogleAuthProvider();
  for (let i = 0; i < scopes.length; i++) {
    provider.addScope(scopes[i]);
  }
  return provider;
}
export function SignIn() {
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
import { useEffect } from "react";

export const MyComponent: React.FC = () => {
  const handleCredentialResponse = (response: any) => {
    console.log(response);

    // Handle the response here, such as sending it to your backend for verification
  };

  useEffect(() => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GCP_CLIENT_ID_T,
      callback: handleCredentialResponse,
    });
    window.google.accounts.id.prompt(); // This will display the One Tap sign-in prompt
  }, []);

  return <div>{/* Your component JSX here */}</div>;
};

export default MyComponent;

export const _SignIn: FC = () => {
  const setAuth = useContext(GoogleAuthContext).setAuth;
  type BackendLogin = "loading" | { accessToken: string } | { error: string };
  const [backendLoggedIn, setBackendLoggedIn] =
    useState<BackendLogin>("loading");
  Auth.getCredentials()
    .then((res) => {
      setBackendLoggedIn("loading");
      setAuth({ access_token: res.access_token });
    })
    .catch((reason) => setBackendLoggedIn({ error: reason }));

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      const tokens = await Auth.signIn(codeResponse.code);
      console.log({ tokens });
      setAuth({ access_token: tokens.access_token });
    },
    onError(errorResponse) {
      console.error(errorResponse);
    },
  });

  return (
    <div>
      {backendLoggedIn === "loading" ? (
        <h4>Loading...</h4>
      ) : (
        backendLoggedIn["error"] && (
          <>
            <h3>{backendLoggedIn["error"]}</h3>
            <button onClick={googleLogin}>Login</button>
          </>
        )
      )}
    </div>
  );
};
