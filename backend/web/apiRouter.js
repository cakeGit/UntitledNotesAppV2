import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { dbInterface } from './webDbInterface.js';
import { logWeb } from '../logger.mjs';

const apiRouter = Router();

const clientId = '72817083579-kd1gu053ehj8os6snedmut08i4dgl6md.apps.googleusercontent.com';
const googleOAuthClient = new OAuth2Client(clientId);

apiRouter.all("/google_check_account", async (req, res) => {
    console.log(req.body);

    let credential = req.body?.credential;

    if (!credential) {
        return res.status(400).json({ error: "Missing credential" });
    }

    //Verify the credential with google - generic code here
    let ticket;
    try {
        ticket = await googleOAuthClient.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });
    } catch (error) {
        logWeb("Error verifying Google ID token:", error);
        return res.status(400).json({ error: "Invalid credential" });
    }
    const payload = ticket.getPayload();
    const userId = payload['sub'];
    
    //Now go ask the database worker to see if this user exists, send it straight back
    try {
        const result = await dbInterface.sendRequest("google_check_account", { googleUserId: userId });
        return res.json(result);
    } catch (error) {
        logWeb("Database query error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

export { apiRouter };