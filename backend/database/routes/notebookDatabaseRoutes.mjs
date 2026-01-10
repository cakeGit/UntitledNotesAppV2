import { getWelcomePage } from "../page/welcomePage.mjs";
import { writePageToDatabase } from "../page/serializer.mjs";
import { getUUIDBlob, parseUUIDBlob } from "../uuidBlober.mjs";
import { RequestError } from "../../web/foundation_safe/requestError.js";
import { logDb } from "../../logger.mjs";

const notebookWelcomePageInsertionsByUser = {};

async function createWelcomePageThreadSafe(db, notebookId, userId) {
    const key = `${userId}-${notebookId}`;
    if (notebookWelcomePageInsertionsByUser[key]) {
        return await notebookWelcomePageInsertionsByUser[key];
    }

    const insertionPromise = new Promise(async (resolve, reject) => {
        const { metadata, structure, content } = getWelcomePage(
            userId,
            notebookId
        );
        logDb("Inserting welcome page into database");
        await writePageToDatabase(db, metadata, structure, content);
        let newWelcomePageResult = await db.get(db.getQueryOrThrow("notebook.get_default_page"), [
            getUUIDBlob(notebookId),
        ]);
        logDb("Inserted welcome page", newWelcomePageResult);

        delete notebookWelcomePageInsertionsByUser[key];
        resolve(newWelcomePageResult);
    });
    notebookWelcomePageInsertionsByUser[key] = insertionPromise;
    return await insertionPromise;
}
export default function notebookDatabaseRoutes(addEndpoint) {
    addEndpoint("get_default_user_notebook", async (db, message, response) => {
        let result = await db.get(
            db.getQueryOrThrow("notebook.get_default_notebook"),
            [getUUIDBlob(message.userId)]
        );
        return {
            notebook_id: parseUUIDBlob(result.NotebookID),
            name: result.Name,
            owner_user_id: parseUUIDBlob(result.OwnerUserID),
        };
    });

    addEndpoint("get_default_page", async (db, message, response) => {
        //Check the player has access to the notebook
        await db.get(
            db.getQueryOrThrow("notebook.check_notebook_access"),
            [getUUIDBlob(message.notebookId), getUUIDBlob(message.userId)]
        );

        let result = await db.get(
            db.getQueryOrThrow("notebook.get_default_page"),
            [getUUIDBlob(message.notebookId)]
        );

        //If result is undefined, we need to insert the welcome page
        if (!result) {
            result = await createWelcomePageThreadSafe(
                db,
                message.notebookId,
                message.userId
            );
            if (!result) {
                throw new Error(
                    "Failed to create default welcome page after a default page could not be located"
                );
            }
        }

        return {
            page_id: parseUUIDBlob(result.PageID),
            notebook_id: parseUUIDBlob(result.NotebookID),
            title: result.Title,
            content: result.Content,
        };
    });

    addEndpoint("notebook/check_notebook_access", async (db, message, response) => {
        let result = await db.get(
            db.getQueryOrThrow("notebook.check_notebook_access"),
            [getUUIDBlob(message.notebookId), getUUIDBlob(message.userId)]
        );
        if (!result) {
            throw new RequestError("User does not have access to the notebook, or it does not exist.");
        }
        return {};
    });
}
