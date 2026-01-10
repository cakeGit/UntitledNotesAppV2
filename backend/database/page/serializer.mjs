import { alertStyle, logDb, logDbWithWarningBlinker } from "../../logger.mjs";
import { generateRandomUUID, getUUIDBlob } from "../uuidBlober.mjs";

function logForOvertimeSeverity(durationMs, ...messageParts) {
    const OVERTIME_THRESHOLD_MS = 150; //If it takes longer than 150ms, log with awesome warning blinker
    if (durationMs > OVERTIME_THRESHOLD_MS) {
        logDbWithWarningBlinker(alertStyle("Overtime alert!"), ...messageParts);
    } else {
        logDb(...messageParts);
    }
}

function jsToSqlName(str) {
    if (str === "order") {
        return "OrderIndex";
    }
    if (str.endsWith("Id")) {
        str = str.slice(0, -2) + "ID";
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function replaceIdsInStructureRecursive(idConversionMap, children) {
    for (const child of children) {
        const oldBlockId = child.blockId;
        const newBlockId = idConversionMap[oldBlockId];
        if (!newBlockId) {
            delete children[child];
            logDb("Removed child with missing block ID:", oldBlockId);
            continue;
        }
        if (child.children) {
            replaceIdsInStructureRecursive(idConversionMap, child.children);
        }
        child.blockId = newBlockId;
    }
}

function shuffleBlockIds(sourceStructure, sourceContent) {
    const oldToNewIdMap = {};

    const newStructure = structuredClone(sourceStructure);
    const newBlocks = {};

    for (const oldBlockId in sourceContent) {
        const newBlockId = generateRandomUUID();
        oldToNewIdMap[oldBlockId] = newBlockId;
        newBlocks[newBlockId] = structuredClone(sourceContent[oldBlockId]);
    }

    replaceIdsInStructureRecursive(oldToNewIdMap, newStructure.children);

    return {
        structure: newStructure,
        content: newBlocks,
    };
}

function walkStructureForParentsAndOrder(
    structureNode,
    blockParentIdMap,
    blockOrderMap
) {
    if (structureNode.blockId) {
        for (const child of structureNode.children || []) {
            blockParentIdMap[child.blockId] = structureNode.blockId;
        }
    }

    let orderIndex = 0;
    for (const child in structureNode.children || []) {
        blockOrderMap[child] = orderIndex++;
        walkStructureForParentsAndOrder(structureNode.children[child]);
    }
}

export async function writePageToDatabase(
    db,
    pageMeta,
    sourceStructure,
    sourceContent
) {
    const startTime = performance.now();
    logDb("Writing page", pageMeta.pageId, "to database");

    //This is somewhat silly, but to avoid the client sending specific block IDs that collide in the database,
    //We can shuffle the block IDs here to new ones, that we know are valid and wont corrupt the database
    let { structure, content } = shuffleBlockIds(
        sourceStructure,
        sourceContent
    );

    const blockParentIdMap = {};
    const blockOrderMap = {};

    walkStructureForParentsAndOrder(structure, blockParentIdMap, blockOrderMap);

    // Start a transaction, this prevents constant writes with every incremental change,
    // This also allows rollbacks when neccassary
    const transactionStartTime = performance.now();
    await db.run("BEGIN TRANSACTION");

    try {
        //Delete all existing blocks in this page
        await performDatabaseWrite(
            db,
            pageMeta,
            content,
            blockParentIdMap,
            blockOrderMap,
            startTime
        );
        const commitStartTime = performance.now();
        await db.run("COMMIT");
        const now = performance.now();
        logForOvertimeSeverity(now - startTime,
            "Finished writing page",
            pageMeta.pageId,
            "in",
            now - startTime,
            "ms",
            "(DB write time",
            now - transactionStartTime,
            "ms of which",
            now - commitStartTime,
            "ms was commit)"
        );
    } catch (error) {
        console.error("Error writing page to database:", error);
        await db.run("ROLLBACK");
        throw error;
    }
}

function convertToSQLParams(inputData) {
    const taggedResult = {};

    for (const key in inputData) {
        taggedResult["$" + jsToSqlName(key)] = inputData[key];
    }

    return taggedResult;
}

function getParametersOfBlockForWrite(
    blockData,
    blockId,
    parentBlockId,
    pageMeta,
    blockOrderMap
) {
    return convertToSQLParams({
        ...blockData,
        blockId: getUUIDBlob(blockId),
        parentBlockId: parentBlockId ? getUUIDBlob(parentBlockId) : null,
        pageId: getUUIDBlob(pageMeta.pageId),
        order: blockOrderMap[blockId] || 0,
        type: blockData.type,
    });
}

async function performDatabaseWrite(
    db,
    pageMeta,
    content,
    blockParentIdMap,
    blockOrderMap
) {
    await db.runMultiple(db.getQueryOrThrow("page.delete_blocks_in_page"), {
        $pageId: getUUIDBlob(pageMeta.pageId),
    });

    //Insert page root data
    await writePageMetadata(db, pageMeta);

    //Insert each block
    for (const blockId in content) {
        const blockData = content[blockId];

        const parentBlockId = blockParentIdMap[blockId] || null;

        const inputParams = getParametersOfBlockForWrite(
            blockData,
            blockId,
            parentBlockId,
            pageMeta,
            blockOrderMap
        );

        await db.runMultiple(
            db.getQueryOrThrow("page.insert_block"),
            inputParams
        );
    }
}

async function writePageMetadata(db, pageMeta) {
    await db.run(db.getQueryOrThrow("page.insert_page"), [
        getUUIDBlob(pageMeta.pageId),
        pageMeta.name,
        getUUIDBlob(pageMeta.ownerUserId),
        getUUIDBlob(pageMeta.notebookId),
    ]);
}
