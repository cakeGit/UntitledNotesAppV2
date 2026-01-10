import { logDb } from "../../logger.mjs";
import { getUUIDBlob, parseUUIDBlob } from "../uuidBlober.mjs";

function sqlToJsName(str) {
    if (str == "OrderIndex") {
        return "order";
    }
    if (str.endsWith("ID")) {
        str = str.slice(0, -2) + "Id";
    }
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function clearOrderRecursive(node, content) {
    if (!node.children) return;

    for (const child of node.children) {
        delete content[child.blockId].order;
        clearOrderRecursive(child, content);
    }
}

function sortChildrenRecursive(node, content) {
    if (!node.children) return;

    node.children.sort((a, b) => {
        return content[a.blockId].order - content[b.blockId].order;
    });
    for (const child of node.children) {
        sortChildrenRecursive(child, content);
    }
}

export async function readPageFromDatabase(db, pageId) {
    let startTime = performance.now();

    const pageIdBlob = getUUIDBlob(pageId);
    //Check the page exists and get metadata
    const pageData = await db.get(db.getQueryOrThrow("page.get_page"), [
        pageIdBlob,
    ]);

    if (!pageData) {
        return null;
    }

    //Get blocks of the current page
    let contentRows = await db.all(db.getQueryOrThrow("page.get_blocks"), [
        pageIdBlob,
    ]);

    if (!contentRows) {
        return null;
    }

    //Convert from SQL names to JS names
    adaptSqlContentToJs(contentRows);

    //Define our structure and content variables for the new page
    const structure = {
        children: [],
    };
    const content = {};

    const parents = {};
    const nodes = {};

    //Extract structure information and create the clean block data
    contentRows.forEach((block) => {
        const blockId = block.blockId;
        if (blockId == null) {
            logDb("Skipping block with null ID", block);
            return;
        }

        //Create the element of the structure tree
        const thisNode = {
            blockId,
        };
        nodes[blockId] = thisNode;
        parents[blockId] = block.parentBlockId;
        content[blockId] = block;

        //Remove now redundant data
        delete block.pageId;
        delete block.blockId;
        delete block.parentBlockId;
    });

    //Build structure tree using the node objects, and our parents map
    constructPageStructure(parents, nodes, structure);
    //Sort children by order index in our new structure
    sortChildrenRecursive(structure, content);

    //Remove order index since we dont need
    clearOrderRecursive(structure, content);

    const timeDelta = performance.now() - startTime;
    logDb("Reading page took", timeDelta, "ms");

    return {
        metadata: {
            pageId: parseUUIDBlob(pageData.PageID),
            name: pageData.Name,
            ownerUserId: parseUUIDBlob(pageData.OwnerUserID),
            notebookId: parseUUIDBlob(pageData.NotebookID),
        },
        structure,
        content,
    };
}

function constructPageStructure(parents, nodes, structure) {
    for (const blockId in parents) {
        const parent = parents[blockId];
        if (parent) {
            if (!nodes[parent]) {
                console.error(
                    "Parent block not found for block",
                    blockId,
                    "parent:",
                    parent
                );
                continue;
            }
            //Attach this node to the parent node
            if (!nodes[parent].children) {
                nodes[parent].children = [];
            }
            nodes[parent].children.push(nodes[blockId]);
        } else {
            //Attach to the root node
            structure.children.push(nodes[blockId]);
        }
    }
}

function adaptSqlContentToJs(blocksData) {
    blocksData.map((block) => {
        for (const key in block) {
            let value = block[key];

            delete block[key];

            //Remove null values, these are probably from other types that arent relevant
            //For example, all blocks will have a imageUrl property even if it is null
            if (value == null) continue;

            if (key.endsWith("ID")) {
                //For any ID field, parse the UUID blob
                value = value ? parseUUIDBlob(value) : null;
            }
            const camelKey = sqlToJsName(key);

            block[camelKey] = value;
        }
    });
}
