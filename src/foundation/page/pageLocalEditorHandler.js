import { ALL_FIELDS_PRESENT } from "../../../backend/web/foundation_safe/validations.js";

export function handleLocalRequest(page, ws, msg, localActivePage) {
    if (msg.type === "block_change") {
        const { blockId, content } = msg;
        const existingBlock = page.content[blockId];
        ALL_FIELDS_PRESENT.test({
            blockId,
            content,
            existingBlock,
        }).throwErrorIfInvalid();

        const newData = {
            ...existingBlock, //Apply existing data
            ...content, //And then new data on top
        };
        page.content[blockId] = newData
        page.content[blockId].setData(newData);
    } else if (msg.type === "structure_change") {
        const { structure } = msg;
        ALL_FIELDS_PRESENT.test({ structure }).throwErrorIfInvalid();

        page.structure = structure;
        page.triggerStructureRerender();
    } else if (msg.type === "block_deletion") {
        const { blockId } = msg;
        const existingBlock = page.content[blockId];
        ALL_FIELDS_PRESENT.test({
            blockId,
            existingBlock,
        }).throwErrorIfInvalid();
        page.deleteBlock(blockId);
        page.triggerStructureRerender();
    } else if (msg.type === "block_addition") {
        const { adjacentBlockId, newBlockId, content } = msg;
        ALL_FIELDS_PRESENT.test({
            adjacentBlockId,
            newBlockId,
            content,
        }).throwErrorIfInvalid();
        page.content[newBlockId] = content;
        page.insertBlockAfter(adjacentBlockId, newBlockId);
        page.triggerStructureRerender(); 
    } else if (msg.type === "full_sync") {
        const { structure, content } = msg;
        ALL_FIELDS_PRESENT.test({
            structure,
            content,
        }).throwErrorIfInvalid();
        page.structure = structure;
        page.content = content;
        page.triggerStructureRerender();
    } else if (msg.type === "initial_page_data") {
        const { 
            metadata,
            structure,
            content
        } = msg;
        ALL_FIELDS_PRESENT.test({
            metadata,
            structure,
            content
        }).throwErrorIfInvalid();

        if (localActivePage.pageNameRef && metadata.name) { //Local active page has bindings for the header elements (just name for now)
            localActivePage.pageNameRef.current.textContent = metadata.name;
        }

        page.metadata = metadata;
        page.structure = structure;
        page.content = content;
        page.triggerStructureRerender();
    } else {
        console.warn("Unknown local editor message type:", msg.type);
    }
}
