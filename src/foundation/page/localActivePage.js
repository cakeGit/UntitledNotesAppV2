import { handleLocalRequest } from "./pageLocalEditorHandler";

export class LocalActivePage {
    constructor(pageRef, ws) {
        this.pageRef = pageRef;
        this.ws = ws;

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            try {
                handleLocalRequest(this.pageRef.current, ws, msg);
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
