import axios from "axios";
import Cookies from "js-cookie";
import { scopes } from "./App";
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

  async logout() {
    Cookies.remove(cookieName);
    return Promise.resolve();
    // return axios.post(`${SERVER_PATH}/auth/logout`);
  },
  async signIn(code: string): Promise<AuthenticationData> {
    return axios.post(`${SERVER_PATH}/getTokens`, { code }).then((r) => {
      const ret = r.data;
      Cookies.set(cookieName, JSON.stringify(ret));
      return ret;
    });
  },
  couldntLogIn(str: string = "") {
    return Promise.reject("not logged in " + str);
  },
  async getCredentials(): Promise<AuthenticationData> {
    try {
      return oneTapSignInPrompt();
    } catch (e) {
      return Auth.couldntLogIn(e);
    }
    // return axios.get(`${SERVER_PATH}/auth/credentials`).then((r) => r.data);
  },
  isExpired(data: AuthenticationData) {
    return data.expiry_date < new Date().getTime();
  },

  async isValid(access_token: string) {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${access_token}`
      );
      const ret = !response.data.error_description;
      if (!ret) {
        console.error("access token was not valid:");
        console.error(response.data.error_description);
      }
      return ret;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
};
const signInPromise: {
  resolve?: (tokens: AuthenticationData) => void;
  reject?: (reason?: string) => void;
} = {};

function oneTapSignInPrompt() {
  const google = window.google;
  google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GCP_CLIENT_ID,
    callback: handleCredentialResponse,
    cancel_on_tap_outside: true,
    itp_support: true,
  });
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
function oauthSignIn(googleId) {
  const google = window.google;
  const client = google.accounts.oauth2.initTokenClient({
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
  console.log(client, google.accounts.oauth2);
  client.requestAccessToken();
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
