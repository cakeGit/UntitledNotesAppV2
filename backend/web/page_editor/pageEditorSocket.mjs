import { logEditor, logWeb } from "../../logger.mjs";
import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { RequestError } from "../foundation_safe/requestError.js";
import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";
import { ActivePage } from "./activePage.mjs";

const activePages = {};

async function loadPage(pageId) {
    logEditor("Loading page", pageId, "for editing.");
    const pageData = await dbInterface.sendRequest("get_page_data", {
        pageId,
    });
    if (!pageData) {
        throw new RequestError("Failed to load page " + pageId);
    }
    logEditor(`Page ${pageId} has been loaded`);
    return new ActivePage(
        pageData.metadata,
        pageData.structure,
        pageData.content
    );
}

const pageLoadThreads = {};
async function loadPageSynchronously(pageId, userId) {
    //Check the user has access, this can be done asynchronously
    const accessState = await dbInterface.sendRequest("check_page_access", {
        pageId,
        userId,
    });

    if (!accessState.hasAccess) {
        throw new RequestError(
            "User does not have access to the page " + pageId,
            //This is the linked action, which in this case, tells the client
            // to reset what page they're looking at, as this one is unavaliable
            //The server has an endpoint for "default_page", which at this point
            // is some page the user is expected to be able to access
            "goto_default_page"
        );
    }

    //If there is a thread made for loading this page, we bind to it and wait for it to give back a page
    if (pageLoadThreads[pageId]) {
        return activePages[pageId]
            ? activePages[pageId] //Sometimes the page has loaded by the time we checked if they had access
            : await pageLoadThreads[pageId];
    }

    //Create the loading thread and make it avaliable through the 'pageLoadThreads'
    logEditor("Creating load thread for page", pageId);
    pageLoadThreads[pageId] = new Promise(async (resolve, reject) => {
        const pageData = await loadPage(pageId) //Here we call the "unsafe" load page,
            .catch(reject); //And make sure that if loading fails we fail the promise as well
        activePages[pageId] = pageData; //Make sure we make the page avaliable to editors before closing the load thread
        resolve(pageData);
        delete pageLoadThreads[pageId]; //Now it is safe to delete
        logEditor("Load thread for page", pageId, "has finished.");
    });

    return await pageLoadThreads[pageId];
}

export function addPageEditorRouterEndpoint(app) {
    //Create the websocket port on the server at /page_editor
    app.ws("/page_editor", async (ws, req) => {
        try {
            //Ensure the connection is authorised and provides a pageId to link to 
            logEditor("New WebSocket connection to /page_editor");
            const userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            const { pageId } = req.query;

            ALL_FIELDS_PRESENT.test({
                pageId,
                userId,
            }).throwRequestErrorIfInvalid();

            let currentPageEditor = activePages[pageId];

            if (!currentPageEditor) {
                currentPageEditor = await loadPageSynchronously(
                    pageId,
                    userId
                );
            }

            currentPageEditor.connectClient(ws);
        } catch (error) {
            if (error instanceof RequestError) {
                logEditor(
                    "User request to open editor socket failed: " + error.message
                );
                ws.send(
                    JSON.stringify({
                        type: "invalid_close_connection",
                        message: error.message,
                        link_action: error.effect,
                    })
                );
            } else {
                throw error;
            }
            ws.close();
        }
    });
}

//Has to be unused for 2 intervals before it can be deleted, to avoid immediatley deleteing and recreating a page
const pagesToClearIfNobodyIsUsing = new Set(); //Faster access than an array, we just want to check if elements are present

setInterval(async () => {
    for (const pageId in activePages) {
        const page = activePages[pageId];
        if (page.isDirty) {
            await dbInterface.sendRequest("write_page_data", {
                metadata: page.metadata,
                structure: page.structure,
                content: page.content,
            });
        }

        if (page.connectedClients.length == 0) {
            if (pagesToClearIfNobodyIsUsing.has(pageId)) {
                //No connections are open, just remove from the active pages map to close
                delete activePages[pageId];
            } else {
                pagesToClearIfNobodyIsUsing.add(pageId);
            }
        } else {
            pagesToClearIfNobodyIsUsing.delete(pageId);
        }
    }
}, 1000 * 30); //Save every 30 seconds, which is very frequent, but for development purposes it is helpful
