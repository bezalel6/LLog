import axios from "axios";
import Cookies from "js-cookie";
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
export type AuthenticationData = {
  access_token: string;
  expiry_date: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: "Bearer";
};
export default Auth;
