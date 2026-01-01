import { logWeb } from "../logger.mjs";
import { RequestError } from "./foundation_safe/requestError.js";

/**
 * A wrapper for express's router to simplify the error handling process.
 * It's a bit non-standard to send 200 responses with an error attached, but it makes it clearer whats expected behaviour that needs more formal client handling.
 */
export class ApiRouter {
    constructor(expressRouter) {
        this.expressRouter = expressRouter;
    }

    for(path, handler) {
        this.expressRouter.all(path, async (req, res) => {
            try {
                const result = await handler(req);
                res.json({ success: true, ...result });
            } catch (error) {
                if (error instanceof RequestError) {
                    res.status(200).json({ success: false, error: error.message });
                } else {
                    logWeb("Internal server error in api:", error);
                    res.status(500).json({ success: false, error: "Internal server error: " + error.message });
                }
            }
        });
    }
}