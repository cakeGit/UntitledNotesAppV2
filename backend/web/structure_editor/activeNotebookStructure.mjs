import ActiveSocketElement from "../foundation/network/ActiveSocketElement.mjs";
import { generateRandomUUID } from "../../database/uuidBlober.mjs";
import { RequestError } from "../foundation_safe/requestError.js";
import { dbInterface } from "../webDbInterface.mjs";
import { destructureTree } from "../foundation/tree/treeStructureHelper.js";
import { moveElement } from "../foundation/tree/treeHelper.mjs";
import { logEditor } from "../../logger.mjs";

export class ActiveNotebookStructure extends ActiveSocketElement {
    constructor(notebookId, structure) {
        super("Active notebook structure");
        this.notebookId = notebookId;
        this.structure = structure;
        this.connectedClients = [];
    }

    //Message handler called by ActiveSocketElement
    async handleMessage(ws, message, clientId) {
        if (message.type === "move_page") {
            const { pageId, newParentId, newIndex } = message;
            moveElement(
                this.structure,
                "pageId",
                pageId,
                newParentId,
                newIndex,
            );
            this.broadcastCurrentStructure();
            this.writeCurrentStructureToDatabase();
        } else if (message.type === "request_new_page") {
            // For simplicity, just add a new page at the root
            const pageId = generateRandomUUID();
            const newPageMeta = {
                pageId: pageId,
                name: "New Page",
                notebookId: this.notebookId,
            };
            await dbInterface.sendRequest("write_page_data", {
                metadata: newPageMeta,
                structure: { children: [] },
                content: {},
            });
            this.structure.children.push({
                pageId: pageId,
                name: newPageMeta.name,
                children: [],
            });
            this.broadcastCurrentStructure();
        } else {
            throw new RequestError("Unknown message type: " + message.type);
        }
    }

    async writeCurrentStructureToDatabase() {
        const pageStructure = destructureTree(this.structure, "pageId");
        await dbInterface.sendRequest("notebook/update_page_structure", {
            pageStructure,
        });
    }

    broadcastCurrentStructure() {
        this.sendToAllClients({
            type: "notebook_structure",
            structure: this.structure,
        });
    }

    onClientConnection(ws, clientId) {
        ws.send(
            JSON.stringify({
                type: "notebook_structure",
                structure: this.structure,
            }),
        );
    }

    updatePageNameInStructure(pageId, newName) {
        function walkAndUpdateName(node, pageId, newName) {
            if (node.pageId === pageId) {
                node.name = newName;
                return true;
            }
            if (node.children) {
                for (const child of node.children) {
                    if (walkAndUpdateName(child, pageId, newName)) {
                        return true;
                    }
                }
            }
            return false;
        }
        if (walkAndUpdateName(this.structure, pageId, newName)) {
            this.broadcastCurrentStructure();
        }
        logEditor(
            `Updated page name in structure for pageId ${pageId} to "${newName}"`,
        );
    }
}
