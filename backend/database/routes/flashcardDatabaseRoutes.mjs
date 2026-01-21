import { logDb } from "../../logger.mjs";
import { ALL_FIELDS_PRESENT } from "../../web/foundation_safe/validations.js";
import { adaptSqlRowsContentToJs } from "../foundation/adapter.mjs";
import { getUUIDBlob } from "../uuidBlober.mjs";

export default function notebookDatabaseRoutes(addEndpoint) {
    addEndpoint(
        "flashcards/get_selectable_pages",
        async (db, message, response) => {
            let notebookId = message.notebookId;
            ALL_FIELDS_PRESENT.test({
                notebookId,
            }).throwErrorIfInvalid();
            const pages = await db.all(
                db.getQueryOrThrow("flashcards.get_selectable_pages"),
                [getUUIDBlob(notebookId)],
            );
            adaptSqlRowsContentToJs(pages);
            return pages;
        },
    );

    addEndpoint(
        "flashcards/get_flashcards_information_of_page", async (db, message, response) => {
            let pageId = message.pageId;
            ALL_FIELDS_PRESENT.test({
                pageId,
            }).throwErrorIfInvalid();
            const flashcards = await db.all(
                db.getQueryOrThrow("flashcards.get_flashcards_information_of_page"),
                [getUUIDBlob(pageId)],
            );
            adaptSqlRowsContentToJs(flashcards);
            return flashcards;
        }
    );
}
