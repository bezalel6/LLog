/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { Credentials, UserRefreshClient } from "google-auth-library";
import { OAuth2Client } from "google-auth-library";
import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";

admin.initializeApp();
// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const alive = onRequest(
  { cors: true, maxInstances: 10 },
  (request, response) => {
    logger.info("Hello logs!", { structuredData: true });
    response.send({ alive: true });
    // admin
    //   .firestore()
    //   .collection("events")
    //   .listDocuments()
    //   .then((v) => {
    //     logger.log(v);
    //   });
  }
);

function formatForESP(r: string) {
  return "---start---\n" + r;
}

export const espCon = onRequest(
  { cors: true, maxInstances: 10 },
  (req, res) => {
    res.set("Content-Type", "text/plain");
    res.send(formatForESP("hello"));
  }
);
const clientId = defineString("CLIENT_ID");
const clientSecret = defineString("CLIENT_SECRET");

let _oAuth2Client: OAuth2Client = null;

const oAuth2Client = () => {
  if (!_oAuth2Client) {
    _oAuth2Client = new OAuth2Client(
      clientId.value(),
      clientSecret.value(),
      "postmessage"
    );
  }
  return _oAuth2Client;
};

export const getTokens = onRequest(
  { cors: true, maxInstances: 10 },
  async (request, respose) => {
    logger.log("got tokens request");
    // logger.log({ request });
    const code = request.body.code as string;
    const { tokens } = await oAuth2Client().getToken(code); // exchange code for tokens
    respose.send(tokens);
  }
);
export const refreshToken = onRequest(
  { cors: true, maxInstances: 10 },
  async (request, response) => {
    const token = request.body.refreshToken as string;
    if (!token) {
      response.send({
        error: "a refresh token wasnt provided.",
      });
      logger.error(
        "didnt include refresh token when trying to refresh. got:",
        request.query,
        { structuredData: true }
      );
    } else {
      let result;
      try {
        result = await refresh(request.body.refreshToken as string);
      } catch (e) {
        result = { error: e };
      }
      response.send(result);
    }
  }
);

// async function ensureTokenDate(cred: Credentials) {
//   if (new Date() > new Date(cred.expiry_date!)) {
//     return refresh(cred.refresh_token as string);
//   }
//   return Promise.resolve(cred);
// }
async function refresh(refreshToken: string) {
  console.log("refreshing token!!!");
  const user = new UserRefreshClient(
    clientId.value(),
    clientSecret.value(),
    refreshToken
  );
  const { credentials } = await user.refreshAccessToken(); // obtain new tokens

  return credentials;
}
