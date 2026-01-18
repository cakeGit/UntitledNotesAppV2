function reciprocalSmooth(lockValue, currentValue) {
    const delta = Math.pow(Math.abs(currentValue - lockValue), 0.75);
    return lockValue + delta;
}

function weightedDistanceToRectTarget(point, rect) {
    const rectCenter = {
        x: rect.left + 10, //Bias to left side, so its easier to hit different indentations
        y: rect.top + rect.height / 2,
    };
    const dx = point.x - rectCenter.x;
    const dy = point.y - rectCenter.y;
    return Math.sqrt((dx * dx) / 10 + dy * dy);
}

export function startDraggingPage(
    currentDragInfoRef,
    structurePlaceTargets,
    pageId,
    pageElementRef,
    socketRef,
    sendPageMove,
    setSidebarLock
) {
    if (currentDragInfoRef.current) {
        console.error("Already dragging a page but startDraggingPage was called");
        return;
    }
    setSidebarLock(true);

    let xLock = pageElementRef.current.getBoundingClientRect().left;
    let yCenter = pageElementRef.current.getBoundingClientRect().height / 2;

    currentDragInfoRef.current = {
        pageId: pageId,
        pageElementRef: pageElementRef,
    };

    let activeHighlightTarget = null;

    function findNearestTarget(cursorPos) {
        //Of all the refs, find the closest one (within 50 pixels y)
        let closestTarget = null;
        let closestDistance = Infinity;
        let closestTargetInfo = null;
        for (const targetInfo of structurePlaceTargets) {
            for (const target of targetInfo.refs) {
                const ref = target.ref;
                if (
                    !ref.current ||
                    pageElementRef.current.contains(ref.current)
                )
                    continue;

                const rect = ref.current.getBoundingClientRect();
                const yDiff = Math.abs(
                    cursorPos.y - (rect.top + rect.height / 2)
                );

                if (yDiff > 50) continue;

                const distance = weightedDistanceToRectTarget(cursorPos, rect);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestTarget = target;
                    closestTargetInfo = targetInfo;
                }
            }
        }
        return closestTarget
            ? {
                  ref: closestTarget.ref,
                  index: closestTarget.index,
                  inside: closestTarget.inside === true,
                  parentId: closestTargetInfo.parentId,
                  pageId: closestTargetInfo.pageId,
              }
            : null;
    }

    function onMouseMove(event) {
        //Move the page element to follow the mouse
        const pageElement = pageElementRef.current;
        if (pageElement) {
            pageElement.style.position = "absolute";
            pageElement.style.left =
                reciprocalSmooth(xLock, event.pageX) + "px";
            pageElement.style.top = event.pageY - yCenter + "px";
            pageElement.style.pointerEvents = "none";
            pageElement.style.zIndex = 1000;
        }

        const cursorPos = { x: event.clientX, y: event.clientY };
        const closestTarget = findNearestTarget(cursorPos);
        const closestRef = closestTarget?.ref;
        //Highlight the closest target, after removing highlight from the previous target
        if (activeHighlightTarget && activeHighlightTarget !== closestRef) {
            //Remove highlight from previous target
            activeHighlightTarget.current.style.opacity = 0;
            activeHighlightTarget = null;
        }
        if (closestTarget && activeHighlightTarget !== closestRef) {
            closestRef.current.style.opacity = 1;
            activeHighlightTarget = closestRef;
        }
    }

    function onMouseUp(event) {
        //Stop dragging the page
        currentDragInfoRef.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        //Send the new structure to the backend, when we get it back we will re-render
        const cursorPos = { x: event.clientX, y: event.clientY };
        const closestTarget = findNearestTarget(cursorPos);
        if (closestTarget) {
            const newParentId = closestTarget.inside
                ? closestTarget.pageId
                : closestTarget.parentId;
            sendPageMove.current(pageId, newParentId, closestTarget.index);
        }

        setSidebarLock(false);
    }

    //Bind the new events
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
}
