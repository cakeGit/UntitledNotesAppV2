import xxhash from "xxhash-wasm";
import { handleRequest } from "./pageServerEditorHandler.mjs";
import { logEditor } from "../../logger.mjs";

//This method handles linking a websocket to the handling, as the actual message handler is a seperate module
function bindEvents(activePage, ws) {
    //Tell the client the current state of the page, including metadata (unlike a full sync)
    ws.send(JSON.stringify({
        type: "initial_page_data",
        metadata: activePage.metadata,
        structure: activePage.structure,
        content: activePage.content,
    }));

    ws.on("message", (msg) => {
        try {
            handleRequest(activePage, ws, JSON.parse(msg));
        } catch (e) {
            const message = {
                type: "full_sync",
                structure: activePage.structure,
                content: activePage.content,
            };
            activePage.sendWithHash(ws, message);

            logEditor("Error handling ws message for editor, force syncing:", e);
            logEditor("Page content", activePage.content);
            logEditor("Page structure", activePage.structure);
        }
    });
    
    ws.on("close", () => {
        logEditor("Editor client disconnected from page:", activePage.metadata.pageId);
        activePage.disconnectClient(ws);
    });
}

const hash = await xxhash();

export class ActivePage {
    constructor(pageMetadata, pageStructure, pageBlocks) {
        this.metadata = pageMetadata;
        this.structure = pageStructure;
        this.content = pageBlocks;
        this.connectedClients = [];
        this.isDirty = false;
    }

    connectClient(ws) {
        bindEvents(this, ws);
        this.connectedClients.push(ws);
    }

    disconnectClient(ws) {
        this.connectedClients = this.connectedClients.filter((clientWs) => clientWs !== ws);
    }

    deleteBlock(blockId) {
        delete this.content[blockId];
        function walkAndDelete(node, blockId) {
            if (!node.children) return;

            const index = node.children.findIndex(
                (child) => child.blockId === blockId
            );
            
            if (index !== -1) {
                node.children.splice(index, 1);
                return;
            }
            
            for (const child of node.children) {
                if (walkAndDelete(child, blockId)) {
                    return;
                }
            }
            return;
        }

        walkAndDelete(this.structure, blockId);
    }

    insertBlockAfter(adjacentBlockId, newBlockId) {
        if (!adjacentBlockId) {
            //Insert at start
            this.structure.children.unshift({ blockId: newBlockId });
            return;
        }

        this.findAndPerform(adjacentBlockId, (children, index) => {
            children.splice(index + 1, 0, { blockId: newBlockId });
        });
    }

    findAndPerform(targetBlockId, performer, currentNode = this.structure) {
        if (!currentNode.children) {
            return;
        }
        for (let i = 0; i < currentNode.children.length; i++) {
            const child = currentNode.children[i];
            if (child.blockId === targetBlockId) {
                performer(currentNode.children, i);
                return;
            }
            this.findAndPerform(targetBlockId, performer, child);
        }
    }

    forwardToOtherClients(senderWs, msg) {
        this.connectedClients.forEach((clientWs) => {
            if (clientWs !== senderWs && clientWs.readyState === clientWs.OPEN) {
                clientWs.send(JSON.stringify(msg));
            }
        });
    }

    forwardToOtherClientsWithHash(senderWs, msg) {
        this.forwardToOtherClients(senderWs, this.withHash(msg));
    }

    sendWithHash(ws, msg) {
        ws.send(JSON.stringify(this.withHash(msg)));
    }

    withHash(msg) {
        const contentString = JSON.stringify(this.content);
        const structureString = JSON.stringify(this.structure);
        const hashValue = hash.h32(contentString + structureString);
        return { ...msg, hash: hashValue };
    }

}