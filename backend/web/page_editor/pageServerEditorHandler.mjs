import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";

export function handleRequest(activePage, ws, msg) {
    if (msg.type === "block_change") {
        const { blockId, content } = msg;
        const existingBlock = activePage.content[blockId];
        ALL_FIELDS_PRESENT.test({ blockId, content, existingBlock }).throwErrorIfInvalid();
        
        //Update the active page data
        activePage.content[blockId] = {
            ...existingBlock, //Apply existing data
            ...content, //And then new data on top
        };
        activePage.connectedClients.forEach((clientWs) => {
            if (clientWs !== ws && clientWs.readyState === clientWs.OPEN) {
                const message = {
                    type: "block_change",
                    blockId: blockId,
                    content: content,
                };
                clientWs.send(JSON.stringify(message));
            }
        });
    } else if (msg.type === "structure_change") {
        const { structure } = msg;
        ALL_FIELDS_PRESENT.test({ structure }).throwErrorIfInvalid();
        
        activePage.structure = structure;
        activePage.connectedClients.forEach((clientWs) => {
            if (clientWs !== ws && clientWs.readyState === clientWs.OPEN) {
                const message = {
                    type: "structure_change",
                    structure: structure,
                };
                clientWs.send(JSON.stringify(message));
            }
        });
    }
}