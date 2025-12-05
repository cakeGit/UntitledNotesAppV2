import { PageCenterContent } from "../../components/layout/pageCenterContent/component.js";
import { GoogleLogin } from "@react-oauth/google";
import "./style.css";
import { fetchRawApi } from "../../foundation/rawApi.js";

function BuildPage() {
  //Get the google sign in JWT token from local storage
  let googleJWT = localStorage.getItem("google_jwt");
  console.log("googleJWT from storage", googleJWT);

  //If not present, send to get account
  if (!googleJWT) {
    console.log("No google JWT found from the create account page, redirecting to /get_account");
    window.location.href = "/get_account";
    return null;
  }

  //Decrypt the JWT to get user info
  let userInfo = null;
  try {
    userInfo = JSON.parse(atob(googleJWT.split('.')[1]));
    console.log("Decrypted user info:", userInfo);
  } catch (error) {
    console.error("Failed to decrypt JWT:", error);
  }

  let userEmail = userInfo ? userInfo.email : "unknown";
  console.log("User email:", userEmail);
  let userFullName = userInfo ? userInfo.name : "unknown";
  console.log("User full name:", userFullName);
  let userPicture = userInfo ? userInfo.picture : null;
  console.log("User picture URL:", userPicture);
  console.log(userInfo);

  return (
    <PageCenterContent>
      <h1>Create account</h1>
      <hr/>
      <p>
        Using existing google account
      </p>
      <pre>
        Google account data (debug):
        {JSON.stringify(userInfo, null, 2)}
      </pre>
      <hr/>
      
      <h3>
        Account name
      </h3>
      <input/>
    </PageCenterContent>
  );
}

export default BuildPage;
