import { logEditor } from "../../logger.mjs";
import { getOrThrowAuthorizedUserUUIDOfRequest } from "../foundation/webAuth.mjs";
import { RequestError } from "../foundation_safe/requestError.js";
import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";
import { dbInterface } from "../webDbInterface.mjs";

class ActiveNotebookStructure {
    constructor(notebookId, structure) {
        this.notebookId = notebookId;
        this.structure = structure;
        this.connectedClients = [];
    }

    movePage(pageId, newParentId, newIndex) {
        // Find and remove the page from its current location
        let pageToMove = null;
        function removePage(pages, pageId) {
            for (const page of pages) {
                if (page.pageId === pageId) {
                    pageToMove = pages.splice(i, 1)[0];
                    return true;
                }
                if (page.children) {
                    if (removePage(page.children, pageId)) {
                        return true;
                    }
                }
            }
            return false;
        }

        removePage(this.structure.children, pageId);

        if (!pageToMove) {
            throw new RequestError("Page to move not found: " + pageId);
        }

        // Find the new parent and insert the page
        function insertPage(pages, parentId, page, index) {
            if (parentId === null) {
                pages.splice(index, 0, page);
                return true;
            }
            for (const page of pages) {
                if (page.pageId === parentId) {
                    if (!page.children) {
                        page.children = [];
                    }
                    page.children.splice(index, 0, page);
                    return true;
                }
                if (page.children) {
                    if (insertPage(page.children, parentId, page, index)) {
                        return true;
                    }
                }
            }
            return false;
        }
        insertPage(this.structure.children, newParentId, pageToMove, newIndex);
    }

    handleClientMessage(ws, message) {
        switch (message.type) {
            case "move_page":
                const { pageId, newParentId, newIndex } = message;
                this.movePage(pageId, newParentId, newIndex);
                this.broadcastCurrentStructure();
                break;
            default:
                throw new RequestError("Unknown message type: " + message.type);
        }
    }

    broadcastCurrentStructure() {
        const message = {
            type: "notebook_structure",
            structure: this.structure,
        };
        const messageString = JSON.stringify(message);
        this.connectedClients.forEach((client) => {
            client.send(messageString);
        });
    }

    connectClient(ws) {
        this.connectedClients.push(ws);

        ws.send(
            JSON.stringify({
                type: "notebook_structure",
                structure: this.structure,
            })
        );

        ws.on("message", (message) => {
            const parsedMessage = JSON.parse(message);
            try {
                this.handleClientMessage(ws, parsedMessage);
            } catch (error) {
                logEditor(
                    "Error handling message from structure editor client: " +
                        error.message
                );
                ws.send(
                    JSON.stringify({
                        type: "invalid_close_connection",
                        message: error.message,
                    })
                );
            }
        });

        ws.on("close", () => {
            this.connectedClients = this.connectedClients.filter(
                (client) => client !== ws
            );
        });
    }
}

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
