import { handleRequest } from "./pageServerEditorHandler.mjs";

function bindEvents(activePage, ws) {
    ws.on("message", (msg) => {
        try {
            handleRequest(activePage, ws, JSON.parse(msg));
        } catch (e) {
            console.error("Error handling ws message for editor:", e);
        }
    });
    ws.on("close", () => {
        console.log("WebSocket connection to /page_editor closed");
        activePage.disconnectClient(ws);
    });
}

export class ActivePage {
    constructor(pageStructure, pageBlocks) {
        this.structure = pageStructure;
        this.content = pageBlocks;
        this.connectedClients = [];
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

}