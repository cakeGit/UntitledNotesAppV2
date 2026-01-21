import { PageCenterContent } from "../../components/layout/pageCenterContent/component.jsx";
import { GoogleLogin } from "@react-oauth/google";
import "./style.css";
import { fetchApi } from "../../foundation/api.js";
import { AppLineBreak } from "../../components/app/line_break/component.jsx";

function BuildPage() {
    return (
        <PageCenterContent>
            <h1>Log in or create account with Google</h1>
            <AppLineBreak/>
            <p className="centered_text">Sign in with your Google account.</p>

            <GoogleLogin
                onSuccess={async (credentialResponse) => {
                    let credential = credentialResponse.credential;

                    //Ask the server to check for an account with this credential, so we can go to create account screen or sign in
                    let response = await fetchApi("google_check_account", {
                        credential,
                    });

                    if (
                        !response.exists &&
                        response.link_action === "go_to_signup"
                    ) {
                        console.log("No account found, going to signup");
                        //Store credential in localstorage for the onboarding process
                        localStorage.setItem("google_jwt", credential);
                        window.location.href = "/create_account";
                        return;
                    }
                    if (response.exists) {
                        console.log("Account found");
                        window.location.href = "/"; //Logged in, go to main app
                        return;
                    }
                }}
                onError={() => {
                    console.log("Login Failed");
                }}
            />
        </PageCenterContent>
    );
}

export default BuildPage;
