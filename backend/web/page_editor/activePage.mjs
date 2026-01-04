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

}