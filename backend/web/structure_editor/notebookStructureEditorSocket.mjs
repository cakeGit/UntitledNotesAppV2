import { logEditor } from "../../logger.mjs";
import ActiveElementManager from "../foundation/network/activeElementManager.mjs";
import { restructureTree } from "../foundation/tree/treeStructureHelper.js";
import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { RequestError } from "../foundation_safe/requestError.js";
import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";
import { ActiveNotebookStructure } from "./activeNotebookStructure.mjs";

const ACTIVE_NOTEBOOK_STRUCTURE_MANAGER = new ActiveElementManager(
    async (notebookId, userId) => {
        //For loading the active notebook structure
        const pages = await dbInterface.sendRequest(
            "notebook/get_notebook_pages",
            {
                notebookId,
            }
        );

        //Turn sql rows into tree
        const rootStructureNode = restructureTree(
            pages,
            "pageId",
            "fileTreeParentId"
        );

        //Create the active notebook element
        const notebookStructure = new ActiveNotebookStructure(
            notebookId,
            rootStructureNode
        );

        logEditor(
            "Successfully opened new notebook structure editor",
            notebookId
        );
        return notebookStructure;
    },
    async (notebookId, userId) => {
        //Check the user has access to this notebook
        await dbInterface.sendRequest("notebook/get_accessible_notebook_name", {
            notebookId,
            userId,
        });
        return true;
    }
);

export function addNotebookStructureEditorRouterEndpoint(app) {
    app.ws("/structure_editor", async (ws, req) => {
        try {
            logEditor("New WebSocket connection to /structure_editor");
            const userId = await getOrThrowAuthorizedUserUUIDOfRequest(req);
            const { notebookId } = req.query; //Get notebook id from "/structure_editor?notebookId=..."

            //Check the user gave us their notebook, and that they have a valid user id
            ALL_FIELDS_PRESENT.test({
                notebookId,
                userId,
            }).throwRequestErrorIfInvalid();

            ACTIVE_NOTEBOOK_STRUCTURE_MANAGER.getOrLoadActiveElementFor(
                notebookId,
                userId
            ).then((activeNotebook) => {
                activeNotebook.connectClient(ws, userId);
            });
        } catch (error) {
            //If the user request was invalid, close the connection with an error message
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
