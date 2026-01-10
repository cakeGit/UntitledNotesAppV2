import { logEditor } from "../../logger.mjs";
import { ALL_FIELDS_PRESENT } from "../foundation_safe/validations.js";

export function handleRequest(activePage, ws, msg) {
    if (msg.type === "block_change") {
        const { blockId, content } = msg;
        const existingBlock = activePage.content[blockId];
        ALL_FIELDS_PRESENT.test({
            blockId,
            content,
            existingBlock,
        }).throwErrorIfInvalid();

        //Update the active page data
        activePage.content[blockId] = {
            ...existingBlock, //Apply existing data
            ...content, //And then new data on top
        };
        activePage.isDirty = true;
        activePage.forwardToOtherClientsWithHash(ws, msg);
    } else if (msg.type === "structure_change") {
        const { structure } = msg;
        ALL_FIELDS_PRESENT.test({ structure }).throwErrorIfInvalid();

        activePage.structure = structure;
        activePage.isDirty = true;
        activePage.forwardToOtherClientsWithHash(ws, msg);
    } else if (msg.type === "block_deletion") {
        const { blockId } = msg;
        const existingBlock = activePage.content[blockId];
        ALL_FIELDS_PRESENT.test({
            blockId,
            existingBlock,
        }).throwErrorIfInvalid();
        activePage.deleteBlock(blockId);
        activePage.isDirty = true;
        activePage.forwardToOtherClientsWithHash(ws, msg);
    } else if (msg.type === "block_addition") {
        const { adjacentBlockId, newBlockId, content } = msg;
        ALL_FIELDS_PRESENT.test({
            // adjacentBlockId, //Can be null for adding at start
            newBlockId,
            content,
        }).throwErrorIfInvalid();
        activePage.content[newBlockId] = content;
        activePage.insertBlockAfter(adjacentBlockId, newBlockId);
        activePage.isDirty = true;
        activePage.forwardToOtherClientsWithHash(ws, msg);
    } else if (msg.type === "needs_sync") {
        //Send full structure and content back to editor
        const message = {
            type: "full_sync",
            structure: activePage.structure,
            content: activePage.content,
        };
        activePage.sendWithHash(ws, message);
    } else {
        logEditor("Unknown page server editor message type:", msg.type);
    }
}
