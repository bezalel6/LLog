import { Credentials, UserRefreshClient } from "google-auth-library";

require("dotenv").config();
import express from "express";
import { OAuth2Client } from "google-auth-library";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const oAuth2Client = new OAuth2Client(clientId, clientSecret, "postmessage");

const safe = new Map<string, Credentials>();

app.get("/auth/credentials", async (req, res) => {
  if (safe.has(req.ip)) {
    const cred = await ensureTokenDate(safe.get(req.ip)!);
    res.json(cred);
  } else {
    res.json({ error: "please log in" });
  }
});
app.post("/auth/google", async (req, res) => {
  const { tokens } = await oAuth2Client.getToken(req.body.code); // exchange code for tokens
  console.log(tokens);
  safe.set(req.ip, tokens);
  res.json(tokens);
});
app.post("/auth/logout", (req, res) => {
  safe.delete(req.ip);
  res.json({});
});
app.post("/auth/google/refresh-token", async (req, res) => {
  const credentials = await refresh(req.body.refreshToken);
  res.json(credentials);
});
async function ensureTokenDate(cred: Credentials) {
  if (new Date().getDate() > cred.expiry_date!) {
    return refresh(cred.refresh_token);
  }
  return Promise.resolve(cred);
}
async function refresh(refreshToken) {
  const user = new UserRefreshClient(clientId, clientSecret, refreshToken);
  const { credentials } = await user.refreshAccessToken(); // optain new tokens

  return credentials;
}
app.listen(3030, () => console.log(`server is running`));
