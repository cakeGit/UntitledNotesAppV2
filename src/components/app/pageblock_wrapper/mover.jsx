
/**
 * Modifies the structure to move a block,
 * Example arguments:
 * ```json
 * {
 *          children: [
 *              {
 *                  blockId: "textboxid",
 *                  children: [
 *                      {
 *                          blockId: "textboxid2",
 *                      }
 *                  ]
 *              }
 *          ]
 *      }
 * ```
 * Move textBlockId2 into undefined (root), relative to textBlockId, shift "below" (alternativley it could be above)
 */
export function applyBlockMove(
    structure,
    blockId,
    blockIdToMoveInto,
    blockIdRelativeTo,
    shift
) {
    //Remove from the structure and return the structure section we want to move
    function extractBlockFromStructure(structure, blockId) {
        function extractRecursivley(children, blockId) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (child.blockId === blockId) {
                    // Found the block to remove
                    children.splice(i, 1); // Remove it from the array
                    return child; // Return the removed block
                }
                if (child.children) {
                    const result = extractRecursivley(child.children, blockId);
                    if (result) return result; // If found in recursion, return it
                }
            }
        }
        return extractRecursivley(structure.children, blockId);
    }
    var removedStructureComponent = extractBlockFromStructure(
        structure,
        blockId
    );
    if (!removedStructureComponent) {
        console.warn(
            "Failed to remove existing block from the structure, could not find",
            blockId,
            structure
        );
    }

    //Now look for where to insert
    // Find the containing children list -> insert into that list
    function findChildren(node, blockId) {
        if (node.blockId === blockId) {
            node.children = node.children || [];
            return node.children;
        }
        if (node.children) {
            for (const child of node.children) {
                const result = findChildren(child, blockId);
                if (result) return result;
            }
        }
        return null;
    }
    var childrenTargetList =
        blockId === undefined
            ? structure.children
            : findChildren(structure, blockIdToMoveInto);
    if (!childrenTargetList) {
        console.warn(
            "Failed to find children target list for block",
            blockId,
            structure
        );
    }

    // Now we can insert the block into the target list, find the right index
    var insertIndex = 0;
    if (blockIdRelativeTo) {
        var found = false;
        for (let i = 0; i < childrenTargetList.length; i++) {
            if (childrenTargetList[i].blockId === blockIdRelativeTo) {
                insertIndex = i + (shift === "below" ? 1 : 0);
                found = true;
                break;
            }
        }
        if (!found) {
            console.warn(
                "Failed to find relative block",
                blockIdRelativeTo,
                childrenTargetList
            );
        }
    }

    //FINALLY, we go for it
    if (removedStructureComponent) {
        childrenTargetList.splice(insertIndex, 0, removedStructureComponent);
    }
}