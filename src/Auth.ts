import axios from "axios";
import Cookies from "js-cookie";
import { scopes } from "./App";
import { fomratDate } from "./utils/formatter";
const SERVER_PATH = "http://127.0.0.1:5001/llog-9e6bc/us-central1";
const cookieName = "AUTH";

// const SERVER_PATH = "https://llog-auth-server.onrender.com";
const Auth = {
  async alive(): Promise<boolean> {
    return axios
      .get(SERVER_PATH + "/alive")
      .then((data) => !!data.data.alive)
      .catch((e) => {
        console.log("couldnt contact the backend", e);
        return false;
      });
  },
  saveAuth(tokens: AuthenticationData) {
    Cookies.set(cookieName, JSON.stringify(tokens));
  },
  deleteSavedAuth() {
    Cookies.remove(cookieName);
  },
  async logout() {
    Auth.deleteSavedAuth();
    return Promise.resolve();
    // return axios.post(`${SERVER_PATH}/auth/logout`);
  },
  async signIn(code: string): Promise<AuthenticationData> {
    return axios.post(`${SERVER_PATH}/getTokens`, { code }).then((r) => {
      const ret = r.data as AuthenticationData;
      const expiration = fomratDate(ret.expiry_date);
      console.log(
        "current token will expire in",
        expiration.desc,
        "@",
        expiration.date
      );
      Auth.saveAuth(ret);
      return ret;
    });
  },
  couldntLogIn(str: string = "") {
    return Promise.reject("not logged in " + str);
  },
  async refresh(tokens: AuthenticationData) {
    return axios
      .post(`${SERVER_PATH}/refreshToken`, {
        refreshToken: tokens.refresh_token,
      })
      .then((r) => {
        const ret = r.data as AuthenticationData;
        Auth.saveAuth(ret);
        return ret;
      });
  },
  async getCredentials(): Promise<AuthenticationData> {
    try {
      const cookie = Cookies.get(cookieName);
      if (cookie) {
        const parsedTokens = JSON.parse(cookie) as AuthenticationData;
        let valid = await Auth.isValid(parsedTokens);
        if (valid === "valid") {
          return parsedTokens;
        }
        if (valid === "invalid") {
          Auth.deleteSavedAuth();
        } else if (valid === "expired") {
          console.log("found expired token. attempting refresh...");
          const newTokens = await Auth.refresh(parsedTokens);
          valid = await Auth.isValid(newTokens);
          if (valid !== "valid") {
            console.error("couldnt refresh token. new token was", newTokens);
          } else {
            console.log("successfully refreshed token");
            Auth.saveAuth(newTokens);
            return newTokens;
          }
        }
      }
      return oneTapSignInPrompt().then((c) => {
        return Auth.signIn((c as any).code);
      });
    } catch (e) {
      return Auth.couldntLogIn(e);
    }
    // return axios.get(`${SERVER_PATH}/auth/credentials`).then((r) => r.data);
  },
  isExpired(data: AuthenticationData) {
    return data.expiry_date < new Date().getTime();
  },

  async isValid(
    tokens: AuthenticationData
  ): Promise<"invalid" | "expired" | "valid"> {
    try {
      if (Auth.isExpired(tokens)) {
        return "expired";
      }
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${tokens.access_token}`
      );
      const ret = !response.data.error_description;
      if (!ret) {
        console.error("access token was not valid:");
        console.error(response.data.error_description);
        return "invalid";
      }
      return "valid";
    } catch (error) {
      console.error(error);
      return "invalid";
    }
  },
};
const signInPromise: {
  resolve?: (tokens: AuthenticationData) => void;
  reject?: (reason?: string) => void;
} = {};
interface Client {
  requestAccessToken: () => void;
}
function oneTapSignInPrompt() {
  const google = window.google;
  google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GCP_CLIENT_ID,
    callback: handleCredentialResponse,
    cancel_on_tap_outside: true,
    itp_support: true,
  });
  console.log({ google });
  google.accounts.id.prompt();
  const promise = new Promise<AuthenticationData>((res, rej) => {
    signInPromise.resolve = res;
    signInPromise.reject = rej;
  });
  return promise;
}
function handleCredentialResponse(response) {
  // One Tap Sign in returns a JWT token.
  const responsePayload = parseJwt(response.credential);
  if (!responsePayload.email_verified) {
    oneTapSignInPrompt();
  } else {
    // We are passing the signed in email id to oAuth.
    // If we pass an email id to oAuth consent.
    // If the user has already given the oAuth consent. it will get auto selected.
    oauthSignIn(responsePayload.email);
  }
}
function parseJwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  return JSON.parse(jsonPayload);
} // This method request the oauth consent for the passed in google account.

let currentClient: Client & any = null;
function oauthSignIn(googleId) {
  const google = window.google;
  if (currentClient) {
    console.log("used existing client");
  } else {
    currentClient = google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GCP_CLIENT_ID,
      scope: scopes.join(" "),
      hint: googleId,
      prompt: "", // Specified as an empty string to auto select the account which we have already consented for use.
      access_type: "offline", // Request a refresh token

      callback: (tokenResponse) => {
        const access_token = tokenResponse.access_token;
        console.log(tokenResponse);
        signInPromise.resolve(tokenResponse);
      },
    });
    console.log(currentClient, google.accounts.oauth2);
  }

  // currentClient.requestAccessToken();
  currentClient.requestCode();
}

export type AuthenticationData = {
  access_token: string;
  expiry_date: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: "Bearer";
};
export default Auth;
