import { logDb } from "../../logger.mjs";
import { ALL_FIELDS_PRESENT } from "../../web/foundation_safe/validations.js";
import { generateRandomUUID, getUUIDBlob, parseUUIDBlob } from "../uuidBlober.mjs";
import { issueNewAuthKeyForUserUUID } from "./authDatabaseRoutes.mjs";

const FALLBACK_TAG_NAME_CHARS = 'abcdefghijklmnopqrstuvwxyz';

function randomChars(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += FALLBACK_TAG_NAME_CHARS.charAt(Math.floor(Math.random() * FALLBACK_TAG_NAME_CHARS.length));
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

export default function userDatabaseRoutes(addEndpoint) {
    addEndpoint("login_to_google_user_if_exists", async (db, message, response) => {
        let googleUserId = message.googleUserId;
        let deviceInfo = message.deviceInfo;

        ALL_FIELDS_PRESENT.test({googleUserId, deviceInfo}).throwErrorIfInvalid();
        
        const query = db.getQueryOrThrow('get_user_by_google_uid');
    
        let row = await db.get(query, [googleUserId]);
        
        if (row) {
            let userUUID = parseUUIDBlob(row.UserID);
            
            response.success({ exists: true, user_id: userUUID, linked_auth_key: await issueNewAuthKeyForUserUUID(db, userUUID, deviceInfo) });
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
        
        const query = db.getQueryOrThrow('create_user');
    
        let tagName = getTagName(userData.displayName);
        let userUUID = generateRandomUUID();
        let userUUIDBlob = getUUIDBlob(userUUID);

        logDb(`Creating new user account ${userData.displayName} (${userUUID}): ${tagName}~${userData.email}`);

        await db.run(query, [userUUIDBlob, userData.googleUserId, userData.displayName, tagName, userData.email, userData.profilePictureUrl]);
        
        response.success({ userId: userUUID });
    });
}