import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { ALL_FIELDS_PRESENT } from "../../web/foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";
import { logWeb } from "../../logger.mjs";
import { restructureTree } from "../foundation/tree/treeStructureHelper.js";

export default function notebookWebRoutes(apiRouter) {
    apiRouter.for("/flashcards/get_selectable_pages", async (req) => {
        let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
        let notebookId = req.body?.notebookId;

        if (!notebookId) {
            notebookId = (
                await dbInterface.sendRequest("get_default_user_notebook", {
                    userId,
                })
            ).notebook_id; //TEMP I SWEAR

            logWeb(
                "resolved ntoebook id property because it was missing:",
                notebookId,
            );
        }

        //Check the user has access to this notebook
        await dbInterface.sendRequest("notebook/get_accessible_notebook_name", {
            notebookId,
            userId,
        });
        const pages = await dbInterface.sendRequest(
            "flashcards/get_selectable_pages",
            { notebookId },
        );
        const pageTree = restructureTree(pages, "pageId", "fileTreeParentId");
        return pageTree;
    });

    apiRouter.for(
        "/flashcards/get_flashcards_information_of_pages",
        async (req) => {
            let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            let pageIds = req.body?.pageIds;

            ALL_FIELDS_PRESENT.test({
                pageIds,
            }).throwRequestErrorIfInvalid();
            const startCheckTime = performance.now();
            //Check the user has access to all these pages
            for (const pageId of pageIds) {
                await dbInterface.sendRequest("check_page_access", {
                    pageId,
                    userId,
                });
            }
            logWeb(//Im concerned about the performance of this so ill be tracking it
                "Checked access for", pageIds.length, "pages in",
                performance.now() - startCheckTime,
                "ms",
            );

            const flashcards = [];

            for (const pageId of pageIds) {
                const pageFlashcards = await dbInterface.sendRequest(
                    "flashcards/get_flashcards_information_of_page",
                    { pageId },
                );
                flashcards.push(...pageFlashcards);
            }
            return {
                flashcards,
            };
        },
    );

    apiRouter.for("/flashcards/update_flashcard_learning_data", async (req) => {
        logWeb("called");
        let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
        let flashcardLearningUpdates = req.body?.flashcardLearningUpdates;
        logWeb("Received flashcard learning updates:", flashcardLearningUpdates);
        ALL_FIELDS_PRESENT.test({
            flashcardLearningUpdates,
        }).throwRequestErrorIfInvalid();
        logWeb("Processing flashcard learning updates:", flashcardLearningUpdates);
        return await dbInterface.sendRequest("flashcards/update_flashcard_learning_data", {
            userId,
            flashcardLearningUpdates,
        } );
    } );
}
