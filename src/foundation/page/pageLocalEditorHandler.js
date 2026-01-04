import { ALL_FIELDS_PRESENT } from "../../../backend/web/foundation_safe/validations.js";

export function handleLocalRequest(page, ws, msg) {
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
    }
}
