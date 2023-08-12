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

app.post("/api/exchangeToken", async (req, res) => {
  const { id_token } = req.body;
  const ticket = await oAuth2Client.verifyIdToken({
    idToken: id_token,
    audience: clientId,
  });
  const payload = ticket.getPayload();
  payload// Now you can exchange the ID token for an access token
  // This will depend on your server-side language and the libraries you are using

  // Send the access token back to the client
  .res
    .json({ access_token: "YOUR_ACCESS_TOKEN" });
});

app.listen(3030, () => console.log(`server is running`));
