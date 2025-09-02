import { useRef } from "react";
import { buildBlockForData } from "../../../foundation/blockBuilder";
import "./style.css";

function getYPosOfTarget(target) {
    const rect = target.element.getBoundingClientRect();
    return (
        rect[target.position === "above" ? "top" : "bottom"] +
        (rect.bottom - rect.top) * (target.inside ? 0.5 : 0)
    );
}

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
function applyBlockMove(
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

export function PageBlockWrapperComponent({
    blockId,
    data,
    pageRef,
    children,
    wrapperRef,
}) {
    const blockRef = useRef(null);
    const draggerRef = useRef(null);
    const highlightRef = useRef(null);

    //TODO: extract function
    const startDrag = (e) => {
        e.preventDefault();

        const startY = e.clientY;

        const getTargetableElementAndShifts = (targetables) => {
            var targetableElementShifts = [];
            var page = pageRef.current;

            for (const targetable of targetables) {
                //If the wrapper, skip it
                if (wrapperRef.current.contains(targetable.element)) {
                    continue;
                }

                var children = targetable.blockId
                    ? page.getStructureChildren(targetable.blockId)
                    : page.structure.children;

                children = children.map((e) => ({
                    blockId: e.blockId,
                    ...page.content[e.blockId],
                })); //Convert the nodes to content objects

                var i = 0;
                for (const child of children) {
                    if (child.ref?.current === wrapperRef.current) {
                        i++;
                        continue;
                    }

                    if (!child.ref?.current) {
                        i++;
                        continue;
                    }

                    targetableElementShifts.push({
                        element: child.ref.current,
                        adjacent: child.blockId,
                        position: "below",
                        targetable,
                    });

                    if (i === 0) {
                        targetableElementShifts.push({
                            element: child.ref.current,
                            adjacent: child.blockId,
                            position: "above",
                            targetable,
                        });
                    }
                    i++;
                }
                // If the targetable has no children, add it as a target
                if (i === 0) {
                    targetableElementShifts.push({
                        element: targetable.element,
                        adjacent: undefined,
                        position: "above",
                        inside: true,
                        targetable,
                    });
                }
            }
            return targetableElementShifts;
        };

        const getTargetableElementAndShift = (originY) => {
            //TODO. accept x
            const targetables = pageRef.current.getTargetableContainers();
            //For each container, get each child and add above and below as targets, (ignoring overlap)
            const targetableElementShifts =
                getTargetableElementAndShifts(targetables);

            //Get the nearest one
            let nearestElement = null;
            let nearestDistance = Infinity;
            for (const target of targetableElementShifts) {
                const distance = Math.abs(originY - getYPosOfTarget(target));
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestElement = target;
                }
            }

            return nearestElement;
        };

        //Create highlight

        if (!highlightRef.current) {
            highlightRef.current = document.createElement("div");
            highlightRef.current.className = "page_block_highlight";
            highlightRef.current.style.display = "none"; // Initially hidden
            highlightRef.current.style.position = "absolute";
            document.body.appendChild(highlightRef.current);
            console.log("Highlight created");
        }

        console.log(pageRef.current.structure);

        const mouseMove = (e) => {
            //Move the block to where the mouse it
            const deltaY = e.clientY - startY;
            wrapperRef.current.style.position = "relative";
            wrapperRef.current.style.zIndex = 999;
            wrapperRef.current.style.top = `${deltaY}px`;
            wrapperRef.current.style.transition = "none";

            //Update highlight position
            if (highlightRef.current) {
                const target = getTargetableElementAndShift(e.clientY);
                if (target) {
                    highlightRef.current.style.display = "block";
                    const rect = target.element.getBoundingClientRect();
                    const yPos = getYPosOfTarget(target);
                    highlightRef.current.style.top = `${yPos - 2}px`;
                    highlightRef.current.style.left = `${rect.left}px`;
                    highlightRef.current.style.width = `${rect.width}px`;
                } else {
                    highlightRef.current.style.display = "none";
                }
            }
        };

        const mouseUp = (e) => {
            //Remove the highlight
            if (highlightRef.current) {
                highlightRef.current.style.display = "none";
            }

            //Clear drag styling from wrapper
            if (wrapperRef.current) {
                wrapperRef.current.style.position = "";
                wrapperRef.current.style.zIndex = "";
                wrapperRef.current.style.top = "";
                wrapperRef.current.style.transition = "";
            }

            //Update the page structure, then rely on a re-render to update the page cleanly
            var currentPageStructure = pageRef.current.structure;

            const target = getTargetableElementAndShift(e.clientY);
            if (target) {
                var blockIdToMoveInto = target.targetable.blockId;
                var blockIdRelativeTo = target.adjacent;
                applyBlockMove(
                    currentPageStructure,
                    blockId,
                    blockIdToMoveInto,
                    blockIdRelativeTo,
                    target.position
                );
                pageRef.current.triggerStructureRerender();
            }

            //Remove listeners
            document.body.removeEventListener("mousemove", mouseMove);
            document.body.removeEventListener("mouseup", mouseUp);
        };

        //Add listeners
        document.body.addEventListener("mousemove", mouseMove);
        document.body.addEventListener("mouseup", mouseUp);
    };

    return (
        <div
            ref={wrapperRef}
            className="page_block_wrapper"
            data-blockid={blockId}
        >
            {buildBlockForData(blockId, data, children, pageRef, blockRef)}
            <div
                ref={draggerRef}
                onMouseDown={startDrag}
                className="page_block_dragger"
                style={{ cursor: "grab", userSelect: "none" }}
            >
                &nbsp;:::&nbsp;
            </div>
        </div>
    );
}
