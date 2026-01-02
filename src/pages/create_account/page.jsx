import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import "./style.css";
import { UserInfo } from "../../components/app/user_information/component.jsx";
import { useRef } from "react";
import { Validator } from "../../../backend/web/foundation_safe/validator.js";
import { fetchApi } from "../../foundation/api.js";

const VALID_DISPLAY_NAME_VALIDATOR = new Validator("Display name")
  .notNull()
  .lengthBetween(1, 30)
  .hasNameLikeCharsOnly();

function trySubmitCreateAccountInfo(displayName, jwt) {
  const displayNameValue = displayName.current.value;
  const validation = VALID_DISPLAY_NAME_VALIDATOR.test(displayNameValue);

  if (!validation.isValid) {
    alert(`Invalid display name: ${validation.errorMessage}`);
    return;
  }
  
  console.log("Submitting create account with display name:", displayNameValue, "and JWT:", jwt);

  fetchApi("create_account", { display_name: displayNameValue, credential: jwt })
    .then(response => {
      console.log("Account created successfully:", response);
      window.location.href = "/";
    })
    .catch(errorResponse => {
      console.error("Failed to create account:", errorResponse);
      alert("Failed to create account: " + errorResponse.message);
    });
}

function BuildPage() {
  //Get the google sign in JWT token from local storage
  let googleJWT = localStorage.getItem("google_jwt");

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
  } catch (error) {
    console.error("Failed to decrypt JWT:", error);
  }

  let userEmail = userInfo ? userInfo.email : "unknown";
  let userShortName = userInfo ? userInfo.given_name : "unknown";
  let userFullName = userInfo ? userInfo.name : "unknown";
  let userPicture = userInfo ? userInfo.picture : null;

  let displayNameRef = useRef(null);

  return (
    <PageCenterContent>
      <h1>Create account</h1>
      <hr/>
      <div className="setting_container">
        
        <div>
          <div>
            <h3>
              Google account:
            </h3>
          </div>
          <div>
          <UserInfo pfp={userPicture} email={userEmail} name={userFullName}/>
          </div>
        </div>
        <br></br>
        <div>
          <div>
            <h3>
              Display name:
            </h3>
          </div>
          <div>
            <input defaultValue={userShortName} ref={displayNameRef}/>
          </div>
        </div>

        <div>
          <div className="create_account_button_container">
            <button disabled={!userInfo} onClick={()=>trySubmitCreateAccountInfo(displayNameRef, googleJWT)}>Create Account</button>
          </div>
        </div>
      </div>
    </PageCenterContent>
  );
}

export default BuildPage;
