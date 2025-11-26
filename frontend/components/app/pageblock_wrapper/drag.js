import { applyBlockMove } from "./mover";

/**
 * Get the Y position of a target element based on its position and inside properties.
 * This is used to compare against the cursors Y position during drag operations.
 * @param {Element} target 
 * @returns {number}
 */
function getYPosOfTarget(target) {
    const rect = target.element.getBoundingClientRect();
    return (
        //Since each target is an element, followed by above or below, we select the rectangle y positions appropriately
        rect[target.position === "above" ? "top" : "bottom"] +
        (rect.bottom - rect.top) * (target.inside ? 0.5 : 0)
    );
}

function getTargetableElementAndShifts(pageRef, wrapperRef, targetables) {
    var targetableElementShifts = [];
    var page = pageRef.current;

    for (const targetable of targetables) {
        //If the wrapper, skip it, otherwise the dragged element will try insert into itself
        if (wrapperRef.current.contains(targetable.element)) {
            continue;
        }

        //Go to the page to get all children of the targetable,
        //The additional handling here is to ensure that if we have the root as targetable (and therefore no blockId), we get the page root children as appropriate
        var children = targetable.blockId
            ? page.getStructureChildren(targetable.blockId)
            : page.structure.children;

        //Convert each nodes to content objects
        children = children.map((e) => ({
            blockId: e.blockId,
            ...page.content[e.blockId],
        }));

        var numberOfChildren = 0;
        for (const child of children) {
            //Directly avoid adding the dragged element as a target within itself, not just its children
            if (!child.ref?.current || child.ref?.current === wrapperRef.current) {
                continue;
            }

            //If this is the first child, add targeting above it
            if (numberOfChildren === 0) {
                targetableElementShifts.push({
                    element: child.ref.current,
                    adjacent: child.blockId,
                    position: "above",
                    targetable,
                });
            }

            //Add targeting below each child of the targetable always
            targetableElementShifts.push({
                element: child.ref.current,
                adjacent: child.blockId,
                position: "below",
                targetable,
            });
            
            numberOfChildren++;
        }

        // If the targetable has no children, add a general inside target
        if (numberOfChildren === 0) {
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
}

//Actual drag handler for moving blocks around the page
export function createDragHandler(blockId, pageRef, wrapperRef, highlightRef) {
    return (e) => {
        e.preventDefault();

        const startY = e.clientY;
        const getTargetableElementAndShift = (originY) => {
            //TODO: accept x if the page later supports horizontal layouts
            const targetables = pageRef.current.getTargetableContainers();
            //For each container, get each child and add above and below as targets, (ignoring overlap)
            const targetableElementShifts =
                getTargetableElementAndShifts(pageRef, wrapperRef, targetables);

            //Get the nearest one
            let nearestElement = null;
            let nearestDistance = Infinity;
            for (const target of targetableElementShifts) {
                //If closer than previous nearest, set as nearest
                const distance = Math.abs(originY - getYPosOfTarget(target));
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestElement = target;
                }
            }

            return nearestElement;
        };

        //Create highlight element if it doesn't exist

        if (!highlightRef.current) {
            highlightRef.current = document.createElement("div");
            highlightRef.current.className = "page_block_highlight";
            highlightRef.current.style.display = "none"; // Initially hidden
            highlightRef.current.style.position = "absolute";

            //The transitions seem to misbehave unless there is an explicit initial position
            highlightRef.current.style.top = `0px`;
            highlightRef.current.style.left = `0px`;

            document.body.appendChild(highlightRef.current);
            console.log("Highlight created");
        }

        var shouldMoveHighlightInstantly = true; //To avoid initial animation glitch

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

                    if (shouldMoveHighlightInstantly) {
                        highlightRef.current.style.transition = "none";
                        shouldMoveHighlightInstantly = false;
                    }

                    highlightRef.current.style.top = `${yPos - 2}px`;
                    highlightRef.current.style.left = `${rect.left}px`;
                    highlightRef.current.style.width = `${rect.width}px`;

                    // Force reflow by asking the CSS engine for a layout property,
                    // This is dark magic, but it ensures that the transition applies properly
                    let _ = highlightRef.current.offsetHeight;

                    highlightRef.current.style.transition = ""; //Re-enable transitions
                } else {
                    highlightRef.current.style.display = "none"; //Else hide highlight if nothing to target
                    shouldMoveHighlightInstantly = true; //Make it so it will instantly reappear next time
                }
            }
        };

        const mouseUp = (e) => {
            //Remove the highlight
            if (highlightRef.current) {
                highlightRef.current.style.display = "none";
                shouldMoveHighlightInstantly = true;
            }

            //Clear the absolute positioning on the dragged element
            if (wrapperRef.current) {
                wrapperRef.current.style.position = "";
                wrapperRef.current.style.zIndex = "";
                wrapperRef.current.style.top = "";
                wrapperRef.current.style.transition = "";
            }

            //Update the page structure, then rely on a re-render to update the page without mess
            var currentPageStructure = pageRef.current.structure;

            //Find where we are dropping
            const target = getTargetableElementAndShift(e.clientY);
            if (target) {
                var blockIdToMoveInto = target.targetable.blockId;
                var blockIdRelativeTo = target.adjacent;
                applyBlockMove( //Uses the mover.js module to move the block around the page
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
}
