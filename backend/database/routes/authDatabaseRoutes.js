import { RequestError } from "../../web/foundation_safe/requestError.js";
import { ALL_FIELDS_PRESENT } from "../../web/foundation_safe/validations.js";

const FALLBACK_TAG_NAME_CHARS = 'abcdefghijklmnopqrstuvwxyz';

function randomChars(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

function getTagName(displayName) {
    let name = displayName.split(" ").filter(part => part.length > 0)[0] || randomChars(5);

    if (name.length > 10) {
        name = name.substring(0, 10);
    }

    return name.toLowerCase();
}

export default function authDatabaseRoutes(addEndpoint) {
    addEndpoint("google_check_account", async (db, message, response) => {
        let googleUserId = message.googleUserId;

        ALL_FIELDS_PRESENT.test({googleUserId}).throwErrorIfInvalid();
        
        const query = response.getQueryOrThrow('get_user_by_google_uid');
    
        let row = await db.get(query, [googleUserId]);
        if (row) {
            response.success({ exists: true, userId: row.id });
        } else {
            response.success({ exists: false, link_action: "go_to_signup" });
        }
    });
    
    addEndpoint("create_account", async (db, message, response) => {
        let userData = {
            googleUserId: message.googleUserId,
            displayName: message.displayName,
            email: message.email,
            profilePictureUrl: message.profilePictureUrl,
        }
        ALL_FIELDS_PRESENT.test(userData).throwErrorIfInvalid();
        
        const query = response.getQueryOrThrow('create_user');
    
        let row = await db.get(query, [userData.googleUserId, userData.displayName, getTagName(userData.displayName), userData.email, userData.profilePictureUrl]);
        if (row) {
            response.success({ exists: true, userId: row.id, link_action: "go_to_login" });
        } else {
            throw new RequestError("Failed to create account in database");
        }
    });
}