import { handleLocalRequest } from "./pageLocalEditorHandler";

export class LocalActivePage {
    constructor(pageRef, ws) {
        this.pageRef = pageRef;
        this.ws = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === "invalid_close_connection") {
                console.log("Closing local editor connection due to invalid message");
                alert(msg.message || "Connection closed due to invalid message.");
                if (msg.link_action == "goto_default_page") {
                    console.log("Returning to default page as instructed");
                    localStorage.clear("currentPageId");
                    localStorage.clear("currentNotebookId");
                    window.location.href = "/";
                }
                ws.close();
            }
            try {
                handleLocalRequest(this.pageRef.current, ws, msg, this);
                if (msg.hash) {
                    const localHash = this.pageRef.current.getLocalHash();
                    if (localHash !== msg.hash) {
                        console.log("Hash mismatch after handling message, requesting full resync");
                        this.requestFullResync();
                    }
                }
            } catch (e) {
                console.error("Error handling ws message for local editor:", e);
                if (msg.type !== "full_sync") {
                    console.log("Requesting full resync due to error");
                    this.requestFullResync();
                }
            }
        };
    }

    requestFullResync() {
        const message = {
            type: "needs_sync",
        };
        this.ws.send(JSON.stringify(message));
    }

    sendBlockChange(blockId, blockData) {
        const message = {
            type: "block_change",
            blockId: blockId,
            content: this.getCleanNetworkBlockData(blockData),
        };
        this.ws.send(JSON.stringify(message));
    }

    sendBlockDeletion(blockId) {
        const message = {
            type: "block_deletion",
            blockId: blockId,
        };
        this.ws.send(JSON.stringify(message));
    }

    sendStructureChange(structure) {
        const message = {
            type: "structure_change",
            structure: structure,
        };
        this.ws.send(JSON.stringify(message));
    }

    sendNewBlock(adjacentBlockId, newBlockId, blockData) {
        const message = {
            type: "block_addition",
            adjacentBlockId: adjacentBlockId,
            newBlockId: newBlockId,
            content: this.getCleanNetworkBlockData(blockData),
        };
        this.ws.send(JSON.stringify(message));
    }

    //Remove the react data since we cant send that, and it causes JSON to fail
    getCleanNetworkBlockData(blockData) {
        let result = {};
        for (const key in blockData) {
            if (key != "ref" && key != "setData") {
                result[key] = blockData[key];
            }
        }
        return result;
    }
}
