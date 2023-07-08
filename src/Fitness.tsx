/* eslint-disable @typescript-eslint/no-empty-interface */
import React, { useState } from "react";
import {
  GoogleLogin,
  GoogleLoginResponse,
  GoogleLoginResponseOffline,
} from "react-google-login";

interface IFitnessProps {}

const Fitness: React.FC<IFitnessProps> = () => {
  const [gapi, setGapi] = useState<any | null>(null);

  const authenticate = (
    response: GoogleLoginResponse | GoogleLoginResponseOffline
  ) => {
    console.log(response);
    if ("tokenId" in response) {
      const { googleId, tokenId } = response;

      const auth2 = window.gapi.auth2.getAuthInstance();

      auth2
        .signIn({
          scope:
            "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.activity.write https://www.googleapis.com/auth/fitness.blood_glucose.read https://www.googleapis.com/auth/fitness.blood_glucose.write https://www.googleapis.com/auth/fitness.blood_pressure.read https://www.googleapis.com/auth/fitness.blood_pressure.write https://www.googleapis.com/auth/fitness.body.read https://www.googleapis.com/auth/fitness.body.write https://www.googleapis.com/auth/fitness.body_temperature.read https://www.googleapis.com/auth/fitness.body_temperature.write https://www.googleapis.com/auth/fitness.heart_rate.read https://www.googleapis.com/auth/fitness.heart_rate.write https://www.googleapis.com/auth/fitness.location.read https://www.googleapis.com/auth/fitness.location.write https://www.googleapis.com/auth/fitness.nutrition.read https://www.googleapis.com/auth/fitness.nutrition.write https://www.googleapis.com/auth/fitness.oxygen_saturation.read https://www.googleapis.com/auth/fitness.oxygen_saturation.write https://www.googleapis.com/auth/fitness.reproductive_health.read https://www.googleapis.com/auth/fitness.reproductive_health.write https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.sleep.write",
        })
        .then(
          () => {
            console.log("Sign-in successful", tokenId);
            loadClient(tokenId);
          },
          (err: any) => {
            console.error("Error signing in", err);
          }
        );
    }
  };

  const loadClient = (token: string) => {
    window.gapi.client.setApiKey("AIzaSyCL36LLFMpn_jKek_H7BtnYfW3iKLJXEWs");
    window.gapi.client
      .load("https://content.googleapis.com/discovery/v1/apis/fitness/v1/rest")
      .then(
        () => {
          console.log("GAPI client loaded for API");
          setGapi(window.gapi);
        },
        (err: any) => {
          console.error("Error loading GAPI client for API", err);
        }
      );
  };

  const execute = () => {
    if (gapi) {
      gapi.client.fitness.users.dataSources.datasets
        .get({
          userId: "me",
          dataSourceId:
            "derived:com.google.sleep.segment:com.google.android.gms:merged",
          datasetId: "0-1688423925",
        })
        .then(
          (response: any) => {
            console.log("Response", response);
          },
          (err: any) => {
            console.error("Execute error", err);
          }
        );
    }
  };

  return (
    <div>
      <GoogleLogin
        clientId={import.meta.env.VITE_GCP_CLIENT_ID}
        buttonText="Authorize and Load"
        onSuccess={authenticate}
        onFailure={authenticate}
        cookiePolicy={"single_host_origin"}
      />
      <button onClick={execute}>Execute</button>
    </div>
  );
};

export default Fitness;
