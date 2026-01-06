import { RequestError } from "../../web/foundation_safe/requestError.js";
import { constructPageFromDatabase } from "../page/pageSerializer.mjs";
import { getUUIDBlob } from "../uuidBlober.mjs";

export default function pageDatabaseRoutes(addEndpoint) {
    addEndpoint("get_page_data", async (db, message, response) => {
        const pageIdBlob = getUUIDBlob(message.pageId);
        const userIdBlob = getUUIDBlob(message.userId);

        //Check the user has access to the page via the notebook
        const pageWithAccess = await db.get(
            db.getQueryOrThrow("page.check_page_access"),
            [pageIdBlob, userIdBlob]
        );

        if (!pageWithAccess) {
            throw new RequestError(
                `User ${message.userId} does not have access to the page ${message.pageId}, or it does not exist.`,
                "goto_default_page"
            );
        }

        const pageData = await constructPageFromDatabase(db, message.pageId);

        return pageData;
    });

    addEndpoint("check_page_access", async (db, message, response) => {
        const pageIdBlob = getUUIDBlob(message.pageId);
        const userIdBlob = getUUIDBlob(message.userId);

        const pageWithAccess = await db.get(
            db.getQueryOrThrow("page.check_page_access"),
            [pageIdBlob, userIdBlob]
        );

        return {
            hasAccess: !!pageWithAccess,
        };
    });
}
