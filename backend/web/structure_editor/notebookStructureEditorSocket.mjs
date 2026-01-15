import { generateRandomUUID } from "../../database/uuidBlober.mjs";
import { logEditor } from "../../logger.mjs";
import { destructureTree } from "../foundation/treeStructureHelper.js";
import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { RequestError } from "../foundation_safe/requestError.js";
import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";
import { ActiveNotebookStructure } from "./activeNotebookStructure.mjs";

const activeNotebooks = {};
const notebookLoadThreads = {};

async function loadNotebookStructureSynchronously(notebookId, userId) {
    if (notebookLoadThreads[notebookId]) {
        return await notebookLoadThreads[notebookId];
    }
    notebookLoadThreads[notebookId] = new Promise(async (resolve, reject) => {
        try {
            const notebookStructureData = await dbInterface.sendRequest(
                "notebook/get_notebook_page_structure",
                {
                    notebookId,
                    userId,
                }
            );
            const notebookStructure = new ActiveNotebookStructure(
                notebookId,
                notebookStructureData.pages
            );
            logEditor("Opened new notebook structure editor" + notebookId);
            activeNotebooks[notebookId] = notebookStructure;
            delete notebookLoadThreads[notebookId];
            resolve(notebookStructure);
        } catch (error) {
            delete notebookLoadThreads[notebookId];
            reject(error);
        }
    });
    return await notebookLoadThreads[notebookId];
}

export function addNotebookStructureEditorRouterEndpoint(app) {
    app.ws("/structure_editor", async (ws, req) => {
        try {
            logEditor("New WebSocket connection to /structure_editor");
            const userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            const { notebookId } = req.query;
            ALL_FIELDS_PRESENT.test({
                notebookId,
                userId,
            }).throwRequestErrorIfInvalid();

            let currentNotebookStructure = activeNotebooks[notebookId];

            if (!currentNotebookStructure) {
                currentNotebookStructure =
                    await loadNotebookStructureSynchronously(
                        notebookId,
                        userId
                    );
            }

            currentNotebookStructure.connectClient(ws);
        } catch (error) {
            if (error instanceof RequestError) {
                logEditor(
                    "User request to open structure editor socket failed: " +
                        error.message
                );
                ws.send(
                    JSON.stringify({
                        type: "invalid_close_connection",
                        message: error.message,
                    })
                );
            } else {
                throw error;
            }
            ws.close();
        }
    });
}
