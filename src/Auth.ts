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

  async getCredentials() {
    try {
      const cookie = Cookies.get(cookieName);
      if (cookie) {
        const authData = JSON.parse(cookie) as AuthenticationData;
        if (Auth.isExpired(authData)) {
          console.log("current token is expired. refreshing...", authData);
          return axios
            .post(`${SERVER_PATH}/refreshToken`, {
              refreshToken: authData.refresh_token,
            })
            .then((r) => {
              if (r.data.error) {
                throw r.data.error;
              }
              console.log("got:", r);
              const ret = r.data as AuthenticationData;
              return ret;
            })
            .then(async (data) => {
              const valid = await Auth.isValid(data.access_token);
              if (valid) {
                Cookies.set(cookieName, JSON.stringify(data));
                return data;
              } else {
                return Auth.couldntLogIn();
              }
            });
        }
        return Promise.resolve(authData);
      } else {
        return Auth.couldntLogIn();
      }
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

const google = window.google;

function oneTapSignInPrompt() {
  google.accounts.id.initialize({
    client_id:
      "240965235389-iv21jhu3th9bbkb6p8hrugrips2pgh5e.apps.googleusercontent.com",
    callback: handleCredentialResponse,
    cancel_on_tap_outside: true,
    itp_support: true,
  });
  google.accounts.id.prompt();
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
  // const scopes = [
  //   "https://www.googleapis.com/auth/fitness.activity.read",
  //   "https://www.googleapis.com/auth/fitness.activity.write",
  //   "https://www.googleapis.com/auth/fitness.blood_glucose.read",
  //   "https://www.googleapis.com/auth/fitness.blood_glucose.write",
  //   "https://www.googleapis.com/auth/fitness.blood_pressure.read",
  //   "https://www.googleapis.com/auth/fitness.blood_pressure.write",
  //   "https://www.googleapis.com/auth/fitness.body.read",
  //   "https://www.googleapis.com/auth/fitness.body.write",
  //   "https://www.googleapis.com/auth/fitness.body_temperature.read",
  //   "https://www.googleapis.com/auth/fitness.body_temperature.write",
  //   "https://www.googleapis.com/auth/fitness.heart_rate.read",
  //   "https://www.googleapis.com/auth/fitness.heart_rate.write",
  //   "https://www.googleapis.com/auth/fitness.location.read",
  //   "https://www.googleapis.com/auth/fitness.location.write",
  //   "https://www.googleapis.com/auth/fitness.nutrition.read",
  //   "https://www.googleapis.com/auth/fitness.nutrition.write",
  //   "https://www.googleapis.com/auth/fitness.oxygen_saturation.read",
  //   "https://www.googleapis.com/auth/fitness.oxygen_saturation.write",
  //   "https://www.googleapis.com/auth/fitness.reproductive_health.read",
  //   "https://www.googleapis.com/auth/fitness.reproductive_health.write",
  //   "https://www.googleapis.com/auth/fitness.sleep.read",
  //   "https://www.googleapis.com/auth/fitness.sleep.write",
  // ];
  const client = google.accounts.oauth2.initTokenClient({
    client_id:
      "240965235389-iv21jhu3th9bbkb6p8hrugrips2pgh5e.apps.googleusercontent.com",
    scope: scopes.join(" "),
    hint: googleId,
    prompt: "", // Specified as an empty string to auto select the account which we have already consented for use.
    callback: (tokenResponse) => {
      const access_token = tokenResponse.access_token;
      console.log(tokenResponse);
    },
  });
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
