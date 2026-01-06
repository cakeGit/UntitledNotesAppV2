import { logWeb } from "../../logger.mjs";
import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { RequestError } from "../foundation_safe/requestError.js";
import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";
import { ActivePage } from "./activePage.mjs";

// const currentPageEditor = new ActivePage(
//     {
//         children: [
//             {
//                 blockId: "textboxid",
//                 children: [
//                     {
//                         blockId: "textboxid2",
//                     },
//                 ],
//             },
//         ],
//     },
//     {
//         textboxid: {
//             type: "textbox",
//             textContent: "hey",
//         },
//         textboxid2: {
//             type: "textbox",
//             textContent: "hooo",
//         },
//     }
// );

const activePages = {};

async function loadPage(pageId, userId) {
    console.log("Loading page", pageId, "for editing.");
    const pageData = await dbInterface.sendRequest("get_page_data", {
        pageId,
        userId,
    });
    if (!pageData) {
        throw new RequestError("Failed to load page " + pageId);
    }
    logWeb(`Page ${pageId} has been loaded`)
    return new ActivePage(
        pageData.metadata,
        pageData.structure,
        pageData.content
    );
}

const pageLoadThreads = {};
async function loadPageSynchronously(pageId, userId) {
    if (pageLoadThreads[pageId]) {
        //Check the user has access
        const accessState = await dbInterface.sendRequest("check_page_access", {
            pageId,
            userId,
        });
        if (!accessState.hasAccess) {
            throw new RequestError(
                "User does not have access to the page " + pageId,
                "goto_default_page"
            );
        }

        return await pageLoadThreads[pageId];
    }

    pageLoadThreads[pageId] = new Promise(async (resolve, reject) => {
        const pageData = await loadPage(pageId, userId).catch(reject);
        resolve(pageData);
        delete pageLoadThreads[pageId];
    });

    return await pageLoadThreads[pageId];
}

export function addPageEditorRouterEndpoint(app) {
    app.ws("/page_editor", async (ws, req) => {
        try {
            console.log("New WebSocket connection to /page_editor");
            const userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            const { pageId } = req.query;

            ALL_FIELDS_PRESENT.test({
                pageId,
                userId,
            }).throwRequestErrorIfInvalid();

            if (!activePages[pageId]) {
                activePages[pageId] = await loadPageSynchronously(
                    pageId,
                    userId
                );
            }

            let currentPageEditor = activePages[pageId];
            currentPageEditor.connectClient(ws);
        } catch (error) {
            if (error instanceof RequestError) {
                logWeb(
                    "User request to editor socket failed: " + error.message
                );
                ws.send(JSON.stringify({
                    type: "invalid_close_connection",
                    message: error.message,
                    link_action: error.effect
                }));
            } else {
                throw error;
            }
            ws.close();
        }
    });
}
