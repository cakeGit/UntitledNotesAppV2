import { PageCenterContent } from "../../components/layout/pageCenterContent/component.js";
import { GoogleLogin } from "@react-oauth/google";
import "./style.css";
import { fetchRawApi } from "../../foundation/rawApi.js";

function BuildPage() {
  return (
    <PageCenterContent>
      <h1>Log in or create account with Google</h1>
      <hr/>
      <p className="centered_text">
        Sign in with your Google account to access or create an account for your notes.
      </p>
      
      <GoogleLogin
        onSuccess={async credentialResponse => {
          let credential = credentialResponse.credential;

          //Ask the server to check for an account with this credential, so we can go to create account screen or sign in;
          let response = await fetchRawApi("google_check_account", { credential });
          console.log(response);
        }}
        onError={() => {
          console.log('Login Failed');
        }}
      />
    </PageCenterContent>
  );
}

export default BuildPage;
