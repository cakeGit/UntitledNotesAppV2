import { logDb } from "../../logger.mjs";
import { getUUIDBlob, parseUUIDBlob } from "../uuidBlober.mjs";

function getCamelNameScheme(str) {
    if (str == "OrderIndex") {
        return "order";
    }
    if (str.endsWith('ID')) {
        str = str.slice(0, -2) + 'Id';
    }
    return str.charAt(0).toLowerCase() + str.slice(1);
}

//TODO: serializer and deserializer classes instead of one

export async function constructPageFromDatabase(db, pageId) {
    const pageIdBlob = getUUIDBlob(pageId);
    //Check the page exists and get metadata
    const pageData = await db.get(db.getQueryOrThrow('page.get_page'), [ pageIdBlob ]);

    if (!pageData) {
        return null;
    }

    //Get blocks of the current page
    let blocksData = await db.all(db.getQueryOrThrow('page.get_blocks'), [ pageIdBlob ]);

    if (!blocksData) {
        return null;
    }

    blocksData.map(block => {
        for (const key in block) {
            let value = block[key];
            delete block[key];
            if (key.endsWith('ID')) {
                value = value ? parseUUIDBlob(value) : null;
            }
            const camelKey = getCamelNameScheme(key);
            block[camelKey] = value;
        }
    });

    const structure = {
        children: []
    };
    const content = {};

    const parents = {};
    const nodes = {};

    blocksData = blocksData.map(block => {
        const blockId = block.blockId;

        const thisNode = {
            blockId,
        };
        nodes[blockId] = thisNode;

        parents[blockId] = block.parentBlockId;

        delete block.pageId;
        delete block.blockId;
        delete block.parentBlockId;

        content[blockId] = block;

        return block;
    });

    //Build structure tree
    for (const blockId in parents) {
        const parent = parents[blockId];
        if (parent) {
            if (!nodes[parent]) {
                console.error("Parent block not found for block", blockId, "parent:", parent);
                continue;
            }
            if (!nodes[parent].children) {
                nodes[parent].children = [];
            }
            nodes[parent].children.push(nodes[blockId]);
        } else {
            structure.children.push(nodes[blockId]);
        }
    }

    //Sort children by order index
    function sortChildren(node) {
        if (!node.children) return;
        node.children.sort((a, b) => {
            return content[a.blockId].order - content[b.blockId].order;
        });
        for (const child of node.children) {
            sortChildren(child);
        }
    }
    sortChildren(structure);

    return {
        metadata: {
            pageId: parseUUIDBlob(pageData.PageID),
            name: pageData.Name,
            ownerUserId: parseUUIDBlob(pageData.OwnerUserID),
        },
        structure,
        content,
    };
}

// im trying to do this inside one insert statement now
// async function writeAdditionalBlockData(db, blockType, blockId, blockData) {
//     const blockIdBlob = getUUIDBlob(blockId);
//     if (blockType === 'text') {
//         await db.run(db.getQueryOrThrow('page.block.insert_text_data'), [
//             blockIdBlob,
//             blockData.textContent || '',
//             blockData.subtype || null
//         ]);
//     }
// }

function getPascalCase(str) {
    if (str.endsWith('Id')) {
        str = str.slice(0, -2) + 'ID';
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getSafeSqlEquivalent(str) {
    return str === "Order" ? "OrderIndex" : str;
}

function convertToSQLParams(inputData) {
    const taggedResult = {};

    for (const key in inputData) {
        taggedResult["$" + getSafeSqlEquivalent(getPascalCase(key))] = inputData[key];
    }

    return taggedResult;
}

export async function writePageToDatabase(db, pageMeta, structure, blocks) {
    //Insert page root data
    await db.run(db.getQueryOrThrow('page.insert_page'), [
        getUUIDBlob(pageMeta.pageId),
        pageMeta.name,
        getUUIDBlob(pageMeta.ownerUserId),
        getUUIDBlob(pageMeta.notebookId),
    ]);

    const blockParentIdMap = {};
    const blockOrderMap = {};

    function walkStructureForParents(structureNode) {
        if (structureNode.blockId) {
            for (const child of structureNode.children || []) {
                blockParentIdMap[child.blockId] = structureNode.blockId;
            }
        }

        let orderIndex = 0;
        for (const child in structureNode.children || []) {
            blockOrderMap[child] = orderIndex++;
            walkStructureForParents(structureNode.children[child]);
        }
    }
    walkStructureForParents(structure);

    //Insert each block
    for (const blockId in blocks) {
        const blockData = blocks[blockId];

        const parentBlockId = blockParentIdMap[blockId] || null;
        
        const inputParams = convertToSQLParams({
            ...blockData,
            blockId: getUUIDBlob(blockId),
            parentBlockId: parentBlockId ? getUUIDBlob(parentBlockId) : null,
            pageId: getUUIDBlob(pageMeta.pageId),
            order: blockOrderMap[blockId] || 0,
            type: blockData.type, //TODO: enfoce valid types
        });

        await db.runMultiple(db.getQueryOrThrow('page.insert_block'), inputParams);
        console.log("Inserted block", blockId);
    }
    console.log("Finished inserting page", pageMeta.pageId);
}