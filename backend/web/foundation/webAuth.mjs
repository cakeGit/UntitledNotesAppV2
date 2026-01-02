import { RequestNeedsNewLoginError } from "../foundation_safe/requestError.js";
import { dbInterface } from "../webDbInterface.mjs";

export async function getOrThrowAuthorizedUserUUIDOfRequest(req) {
    //Get the "auth_key" cookie, and check if it's valid
    if (!req.cookies) {
        throw new RequestNeedsNewLoginError("No cookies present in request");
    }

    let authKey = req.cookies["auth_key"];

    if (!authKey) {
        throw new RequestNeedsNewLoginError("No auth_key cookie present in request");
    }

    let validUserAuth = await dbInterface.sendRequest("validate_user_auth", { authKey });

    if (!validUserAuth || !validUserAuth.user_id) {
        throw new RequestNeedsNewLoginError("Invalid auth_key cookie");
    }

    return validUserAuth.user_id;
}