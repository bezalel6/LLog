import axios from "axios";

const SERVER_PATH = "http://localhost:3030";
// const SERVER_PATH = "https://llog-auth-server.onrender.com";

export async function alive(): Promise<boolean> {
  return axios
    .get(SERVER_PATH + "/alive")
    .then((data) => data.data.alive)
    .catch((e) => {
      console.log("couldnt contact the backend", e);
      return false;
    });
}

export async function logout() {
  return axios.post(`${SERVER_PATH}/auth/logout`);
}
export async function signIn(code: string): Promise<AuthenticationData> {
  return axios.post(`${SERVER_PATH}/auth/google`, { code }).then((r) => r.data);
}
export async function getCredentials() {
  return axios.get(`${SERVER_PATH}/auth/credentials`).then((r) => r.data);
}
export async function getAccessToken() {
  try {
    return axios
      .get(`${SERVER_PATH}/auth/google/get-token`, { withCredentials: true })
      .then((res) => res.data.access_token);
  } finally {
  }
}

export type AuthenticationData = {
  access_token: string;
  expiry_date: number;
  id_token: string;
  refresh_token: string;
  scope: string;
  token_type: "Bearer";
};
