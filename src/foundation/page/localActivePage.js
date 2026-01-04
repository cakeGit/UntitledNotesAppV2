import { handleLocalRequest } from "./pageLocalEditorHandler";

export class LocalActivePage {
    constructor(pageRef, ws) {
        this.pageRef = pageRef;
        this.ws = ws;

        ws.onmessage = (event) => {
            try {
                handleLocalRequest(
                    this.pageRef.current, ws, JSON.parse(event.data)
                );
            } catch (e) {
                console.error("Error handling ws message for local editor:", e);
            }
        };
    }

    sendBlockChange(blockId, blockData) {
        const message = {
            type: "block_change",
            blockId: blockId,
            content: this.getCleanNetworkData(blockData),
        };
        console.log(message);
        this.ws.send(JSON.stringify(message));
    }

    sendStructureChange(structure) {
        const message = {
            type: "structure_change",
            structure: structure,
        };
        console.log(message);
        this.ws.send(JSON.stringify(message));
    }

    getCleanNetworkData(blockData) {
        let result = {};
        for (const key in blockData) {
            if (key != "ref" && key != "setData") {
                result[key] = blockData[key];
            }
        }
        return result;
    }
}
