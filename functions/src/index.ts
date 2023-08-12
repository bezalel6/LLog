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

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
  admin
    .firestore()
    .collection("events")
    .listDocuments()
    .then((v) => {
      logger.log(v);
    });
});

const clientId = defineString("CLIENT_ID").value();
const clientSecret = defineString("CLIENT_SECRET").value();

const oAuth2Client = new OAuth2Client(clientId, clientSecret, "postmessage");

export const getTokens = onRequest(async (request, respose) => {
  const code = request.query.code as string;
  const { tokens } = await oAuth2Client.getToken(code); // exchange code for tokens
  respose.send(tokens);
});
export const refreshToken = onRequest(async (request, response) => {
  const refreshed = await refresh(request.query.refreshToken as string);
  response.send(refreshed);
});

// async function ensureTokenDate(cred: Credentials) {
//   if (new Date() > new Date(cred.expiry_date!)) {
//     return refresh(cred.refresh_token as string);
//   }
//   return Promise.resolve(cred);
// }
async function refresh(refreshToken: string) {
  console.log("refreshing token!!!");
  const user = new UserRefreshClient(clientId, clientSecret, refreshToken);
  const { credentials } = await user.refreshAccessToken(); // obtain new tokens

  return credentials;
}
