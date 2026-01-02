import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { dbInterface } from "../webDbInterface.mjs";

export default function userRouter(apiRouter) {
    apiRouter.for("/get_current_user_info", async (req) => {
        let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);

        return await dbInterface.sendRequest("get_user_info", { userId });
    });
}