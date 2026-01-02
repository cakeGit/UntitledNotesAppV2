import { generateRandomUUID, getUUIDBlob } from "../uuidBlober.mjs";

export async function issueNewAuthKeyForUserUUID(db, userUUID, deviceInfo) {
    let authKey = generateRandomUUID();
    let userUUIDBlob = getUUIDBlob(userUUID);
    let authKeyBlob = getUUIDBlob(authKey);
    
    await db.run(db.getQueryOrThrow('logins.issue_new_login'), [userUUIDBlob, authKeyBlob, deviceInfo]);

    return authKey.toString();
}

export default function authDatabaseRoutes(addEndpoint) {
    // addEndpoint("issue_new_auth_for_user", async (db, message, response) => {
        
    // });
    addEndpoint("validate_user_auth", async (db, message, response) => {
        return await db.get(db.getQueryOrThrow('logins.check_for_login'), [message.userIdBlob, message.authKey]) != null;
    });
}