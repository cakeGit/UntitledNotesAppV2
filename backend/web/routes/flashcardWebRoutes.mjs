import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { ALL_FIELDS_PRESENT } from "../../web/foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";
import { restructureTree } from "../foundation/tree/treeStructureHelper.js";

//Gets the list of nodes but includes some of parent fallback nodes such that no nodes are left without a parent
function getNodesWithParentFallback(nodes, parentFallbackNodes) {
    const nodeById = {};
    for (const fallbackNode of parentFallbackNodes) {
        if (!nodeById[fallbackNode.pageId]) {
            nodeById[fallbackNode.pageId] = fallbackNode;
        }
    }
    for (const node of nodes) {
        nodeById[node.pageId] = node;
    }

    const requiredParentsStack = []; //Use a stack rather than queue because order doesent matter and stack is faster
    const availableNodes = new Set();

    for (const node of nodes) {
        requiredParentsStack.push(node.fileTreeParentId);
        availableNodes.add(node.pageId);
    }

    while (requiredParentsStack.length > 0) {
        //While we have unresolved dependencies
        const parentId = requiredParentsStack.pop(); //Get the next parent we need
        if (!availableNodes.has(parentId)) {
            //If we dont have in the nodes list
            const parentNode = nodeById[parentId]; //Get the parent node from the fallback list

            if (!parentNode) continue; //If it doesent exist, skip

            nodes.push(parentNode);
            availableNodes.add(parentNode.pageId);

            if (parentNode.fileTreeParentId) {
                //If there is a transitive parent dependency, add it to the stack
                requiredParentsStack.push(parentNode.fileTreeParentId);
            }
        }
    }

    return nodes;
}

async function getPageTree(notebookId) {
    //Get all pages in the notebook, regardless of if they have flashcards or not (as a flashcard page may be a child of a normal page)
    const fallbackPages = await dbInterface.sendRequest(
        "notebook/get_notebook_pages",
        {
            notebookId,
        },
    );

    //Get the flat page data
    const pages = await dbInterface.sendRequest(
        "flashcards/get_selectable_pages",
        { notebookId },
    );

    const combinedPages = getNodesWithParentFallback(pages, fallbackPages);

    //Use the restructure tree module to turn it into a tree structure
    const pageTree = restructureTree(
        combinedPages,
        "pageId",
        "fileTreeParentId",
    );
    return { pageTree, pages };
}

export default function notebookWebRoutes(apiRouter) {
    //For the user to get all pages they can use for flashcards, when they select
    apiRouter.for("/flashcards/get_selectable_pages", async (req) => {
        let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
        let notebookId = req.body?.notebookId;

        //Check the user has access to this notebook
        await dbInterface.sendRequest("notebook/get_accessible_notebook_name", {
            notebookId,
            userId,
        });

        const { pageTree } = await getPageTree(notebookId);
        return pageTree;
    });

    //Combination of get pages and get flashcard info
    apiRouter.for(
        "/flashcards/get_selectable_pages_and_flashcards",
        async (req) => {
            let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            let notebookId = req.body?.notebookId;

            //Check the user has access to this notebook
            await dbInterface.sendRequest(
                "notebook/get_accessible_notebook_name",
                {
                    notebookId,
                    userId,
                },
            );

            const { pageTree, pages } = await getPageTree(notebookId);

            const flashcards = [];

            const pageIds = pages.map((page) => page.pageId);

            for (const pageId of pageIds) {
                //Make a request for each page's flashcards and collect them
                const pageFlashcards = await dbInterface.sendRequest(
                    "flashcards/get_flashcards_information_of_page",
                    { pageId, userId },
                );
                flashcards.push(...(pageFlashcards.map(e => ({...e, pageId}))));
            }

            return { pageTree, flashcards };
        },
    );

    //When we are just starting a session, we want to get all the information of flashcards in the pages we selected
    apiRouter.for(
        "/flashcards/get_flashcards_information_of_pages",
        async (req) => {
            let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            let pageIds = req.body?.pageIds;

            ALL_FIELDS_PRESENT.test({
                pageIds,
            }).throwRequestErrorIfInvalid();

            // const startCheckTime = performance.now();
            //Check the user has access to all these pages
            for (const pageId of pageIds) {
                await dbInterface.sendRequest("check_page_access", {
                    pageId,
                    userId,
                });
            }
            //There was a concern about the performance of this so it was tracked,
            // but it got around 2-3ms per page which is acceptable
            // logWeb(
            //     "Checked access for", pageIds.length, "pages in",
            //     performance.now() - startCheckTime,
            //     "ms",
            // );

            const flashcards = [];

            for (const pageId of pageIds) {
                //Make a request for each page's flashcards and collect them
                const pageFlashcards = await dbInterface.sendRequest(
                    "flashcards/get_flashcards_information_of_page",
                    { pageId, userId },
                );
                flashcards.push(...pageFlashcards);
            }

            return {
                flashcards,
            };
        },
    );

    //This is the upload handling for after the session is complete
    apiRouter.for("/flashcards/update_flashcard_learning_data", async (req) => {
        let userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
        let flashcardLearningUpdates = req.body?.flashcardLearningUpdates;

        ALL_FIELDS_PRESENT.test({
            flashcardLearningUpdates,
        }).throwRequestErrorIfInvalid();

        //Simply pass this to the database worker to handle after checking user and data presence
        return await dbInterface.sendRequest(
            "flashcards/update_flashcard_learning_data",
            {
                userId,
                flashcardLearningUpdates,
            },
        );
    });
}
