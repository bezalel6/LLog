import React from "react";
// import { FcGoogle } from "react-icons/fc";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import jwtDecode from "jwt-decode";

export interface GoogleLoginResponse {
  clientId: string;
  credential: string;
}

export interface LoginPageProps {
  onRes: (res: GoogleLoginResponse) => void;
  onErr: () => void;
}

const GoogleLoginPage = ({ onRes, onErr }: LoginPageProps) => {
  const responseGoogle = (response?) => {
    const userObject = jwtDecode(response.credential);
    console.log(userObject);

    if (response) onRes(response as GoogleLoginResponse);
    else onErr();
  };

  return (
    <div className="">
      <div className="">
        <GoogleLogin
          auto_select
          // render={(renderProps) => (
          //   <button
          //     type="button"
          //     className=""
          //     onClick={renderProps.onClick}
          //     disabled={renderProps.disabled}
          //   >
          //     <FcGoogle className="" /> Sign in with google
          //   </button>
          // )}

          onSuccess={responseGoogle}
          onError={responseGoogle}
          // cookiePolicy="single_host_origin"
        />
      </div>
    </div>
  );
};

export default GoogleLoginPage;
