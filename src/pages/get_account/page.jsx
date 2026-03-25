import { GoogleLogin } from "@react-oauth/google";
import "./style.css";
import { tryFetchApi } from "../../foundation/api.js";
import { FlexCenter } from "../../components/app/flex_center/component.jsx";

//If user's google login matches their account, log them in, otherwise go to signup
async function useGoogleAccountForLoginOrSignup(credentialResponse) {
    let credential = credentialResponse.credential;

    //Ask the server to check for an account with this credential, so we can go to create account screen or sign in
    let response = await tryFetchApi("google_check_account", {
        credential,
    });
    if (response === null) {
        return;
    }

    if (!response.exists && response.link_action === "go_to_signup") {
        //Store credential in sessionStorage for the onboarding process
        sessionStorage.setItem("google_jwt", credential);
        window.location.href = "/create_account";
        return;
    }
    if (response.exists) {
        window.location.href = "/"; //Logged in, go to main app
        return;
    }
}

function BuildPage() {
    return (
        <FlexCenter fullHeight={true}>
            <h1>Log in or create account with Google</h1>
            <br />
            <GoogleLogin
                onSuccess={useGoogleAccountForLoginOrSignup}
                onError={() => {
                    alert("Google login failed, please try again.");
                }}
            />
        </FlexCenter>
    );
}

export default BuildPage;
