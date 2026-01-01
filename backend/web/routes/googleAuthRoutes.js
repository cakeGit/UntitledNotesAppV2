import { OAuth2Client } from 'google-auth-library';
import { dbInterface } from '../webDbInterface.js';
import { logWeb } from '../../logger.mjs';
import { Validator } from '../foundation_safe/validator.js';
import { RequestError } from '../foundation_safe/requestError.js';

const clientId = '72817083579-kd1gu053ehj8os6snedmut08i4dgl6md.apps.googleusercontent.com';
const googleOAuthClient = new OAuth2Client(clientId);

const VALID_DISPLAY_NAME_VALIDATOR = new Validator("Display name")
  .notNull()
  .lengthBetween(1, 30)
  .hasNameLikeCharsOnly();

async function tryGetCredentialPayload(credential) {
    //Verify the credential with google - generic code here
    let ticket;
    try {
        ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
    } catch (error) {
        logWeb("Error verifying Google ID token:", error);
        return new RequestError("Invalid Google credential " + error.message);
    }
    return ticket.getPayload();
}

export default function googleAuthRouter(apiRouter) {
    apiRouter.for("/google_check_account", async (req) => {
        let credential = req.body?.credential;

        if (!credential) {
            throw new RequestError("Missing credential");
        }

        //Verify the credential with google - generic code here
        let credentialPayload = await tryGetCredentialPayload(credential);
        const userId = credentialPayload['sub'];
        
        //Now go ask the database worker to see if this user exists, send it straight back
        return await dbInterface.sendRequest("google_check_account", { googleUserId: userId });
    });

    apiRouter.for("/create_account", async (req) => {
        let displayName = req.body?.display_name;
        
        VALID_DISPLAY_NAME_VALIDATOR.test(displayName).throwRequestErrorIfInvalid();
        
        let credential = req.body?.credential;

        if (!credential) {
            throw new RequestError("Missing credential");
        }

        //Verify the credential with google - generic code here
        let credentialPayload = await tryGetCredentialPayload(credential);

        //Now go ask the database worker to create the account
        return await dbInterface.sendRequest("create_account", {
            //Unpack everything now so i dont forget later
            googleUserId: credentialPayload['sub'],
            displayName: displayName,
            email: credentialPayload['email'],
            profilePictureUrl: credentialPayload['picture'],
        });
    });
}