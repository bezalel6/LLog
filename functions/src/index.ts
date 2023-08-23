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
import { FieldValue } from "@google-cloud/firestore";

import { defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import moment = require("moment");

admin.initializeApp();

const db = admin.firestore();

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

interface EventLog {
  created_at: any;
  amount: number;
  units: string;
  event_type: string;
  uid: string;
  id: string;
}
interface OpenReqRes {
  allow: boolean;
  details?: string;
}
function isAllowedToOpen(data: EventLog): OpenReqRes {
  // logger.info("data: ", JSON.stringify(data.createdAt));
  const convertedDate = new Date();
  const converted = (data.created_at._seconds as number) * 1000;
  convertedDate.setTime(converted);
  const passed = moment().diff(convertedDate, "minutes");
  const left = 10 - passed;
  const msg = `not enough time passed. theres ${left} minutes left`;
  if (left > 0) {
    return {
      allow: false,
      details: msg,
    };
  }
  return { allow: true };
}

async function getLastAttent(uid: string): Promise<EventLog> {
  const query = db
    .collection("/events")
    .where("uid", "==", uid)
    .where("event_type", "==", "Attent")
    .orderBy("createdAt", "desc") // Order by the created_at field in descending order
    .limit(1); // Limit the results to 1 document

  return new Promise((res, rej) => {
    try {
      query.get().then((snapshot) => {
        if (snapshot.empty) {
          console.log("No matching documents.");
          throw "didnt find any documents";
        }
        // return snapshot[0].data();
        snapshot.forEach((doc) => {
          const data: EventLog = doc.data() as any;
          logger.info("got last event:", doc.data());
          res(data);
        });
      });
    } catch (e) {
      rej(e);
    }
  });
}
async function addToAttent(uid: string, mg: number) {
  logger.log(`adding ${mg} mg`);

  return admin.firestore().collection("events").add({
    uid,
    amount: mg,
    units: "mg",
    event_type: "Attent-TEST",
    created_at: FieldValue.serverTimestamp(),
  });
}
export const addAchievement = onRequest(
  {
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        throw "unauthenticated";
      }
      const [type, data] = req.body;
      logger.log({ type, data });
      await admin
        .firestore()
        .collection("achievements")
        .add({
          uid: userId,
          type: type ? type : null,
          data: data ? data : null,
          created_at: FieldValue.serverTimestamp(),
        });
      res.send(200);
    } catch (e) {
      logger.error(e);
      res.send(500);
    }
  }
);
export const espCon = onRequest(
  { cors: true, maxInstances: 10 },
  async (req, res) => {
    res.set("Content-Type", "application/json");

    try {
      logger.info(
        "got raw body: " +
          JSON.stringify(req.rawBody) +
          " request url: " +
          req.url
      );
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        throw "unauthenticated";
      }
      // if(!req.rawBody){
      //   throw "didnd get a body"
      // }
      logger.log("using provided userId:", userId);
      switch (req.url) {
        case "/request-open": {
          const data = await getLastAttent(userId);
          res.send(isAllowedToOpen(data));
          break;
        }
        case "/notify-opened": {
          const mg = req.body["mg"];
          // const mg =
          await addToAttent(userId, mg);
          res.send({ added: true });
          break;
        }
        default: {
          logger.log("defaulting res for requested url: ", req.url);
          res.send({});
        }
      }
    } catch (e) {
      logger.error("caught err:", e);
      res.send({ error: e });
    }
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
