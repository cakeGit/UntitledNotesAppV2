import { logWeb } from "../logger.mjs";
import { RequestError } from "./foundation_safe/requestError.js";

//A wrapper for express's router to simplify the error handling process.
//It's a bit non-standard to send 200 responses with an error attached,
// but it makes it clearer whats expected behaviour that needs more formal client handling.
export class ApiRouter {
    constructor(expressRouter) {
        this.expressRouter = expressRouter;
    }

    for(path, handler) {
        this.expressRouter.all(path, async (req, res) => {
            try {
                const result = await handler(req);

                if (result.linked_auth_key) {
                    //Remove the sensitive info, and set the user's cookie appropriately
                    res.cookie("auth_key", result.linked_auth_key, {
                        maxAge: 1000 * 60 * 60 * 24 * 100,
                        httpOnly: true,
                        secure: true,
                        sameSite: 'strict'
                    });
                    if (result.linked_auth_key !== "") {
                        res.cookie("auth_present", "1", {
                            maxAge: 1000 * 60 * 60 * 24 * 100,
                            httpOnly: false,
                            secure: true,
                            sameSite: 'strict'
                        });
                    }
                    delete result.linked_auth_key;
                }

                res.json({ success: true, ...result });
            } catch (error) {
                if (error instanceof RequestError) {
                    res.status(200).json({ success: false, error: error.message, effect: error.effect });
                } else {
                    logWeb("Internal server error in api:", error);
                    console.trace(error);
                    res.status(500).json({ success: false, error: "Internal server error: " + error.message });
                }
            }
        });
    }
}