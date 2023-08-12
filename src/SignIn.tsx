import React, { FC, useContext, useState } from "react";
import { GoogleAuthContext } from "./contexts";
import Auth from "./Auth";
import { useGoogleLogin } from "@react-oauth/google";

export const SignIn: FC = () => {
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
