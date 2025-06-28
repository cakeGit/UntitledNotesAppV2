import { useRef } from "react";
import { buildBlockForData } from "../../../foundation/blockBuilder";
import "./style.css";

export function PageBlockWrapperComponent({blockId, data, pageRef, children}) {
    const draggerRef = useRef(null);
    const wrapperRef = useRef(null);
    const highlightRef = useRef(null);

    //TODO: extract function
    const startDrag = (e) => {
        e.preventDefault();
        //Create highlight

        if (!highlightRef.current) {
            highlightRef.current = document.createElement("div");
            highlightRef.current.className = "page_block_highlight";
            highlightRef.current.innerText   = "TEST HIGHLIGHT TARGET HERE"
            highlightRef.current.style.display = "none"; // Initially hidden
            highlightRef.current.style.position = "absolute";
            document.body.appendChild(highlightRef.current);
            console.log("Highlight created");
        }

        //Actual drag handling
        const wrapper = wrapperRef.current;
        const startY = e.clientY;

        const getTargetableElementAndShift = (originY) => {//TODO. accept x
            const targetables = pageRef.current.getTargetableContainers();
            //For each container, get each child and add above and below as targets, (ignoring overlap)
            const targetableElementShifts = [];
            for (const targetable of targetables) {
                //If the targetable is an ancestor of the wrapper, skip it
                if (wrapper.contains(targetable)) {
                    continue;
                }

                const children = targetable.children;
                var i = 0;
                for (const child of children) {
                    if (child === wrapper.parentElement) {// Skip the wrapper itself
                        continue;
                    }

                    targetableElementShifts.push({element: child, position: "above"});
                    if (i === 0) {
                        targetableElementShifts.push({element: child, position: "below"});
                    }
                    i++;
                }
                // If the targetable has no children, add it as a target
                if (i === 0) {
                    targetableElementShifts.push({element: targetable, position: "below", inside: true});
                }
            }

            //Get the nearest one
            let nearestElement = null;
            let nearestDistance = Infinity;
            for (const target of targetableElementShifts) {
                const rect = target.element.getBoundingClientRect();
                const distance = Math.abs(originY - rect[target.position === "above" ? "top" : "bottom"]);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestElement = target;
                }
            }

            return nearestElement;
        }

        const mouseMove = (e) => {
            //Move the block to where the mouse it
            const deltaY = e.clientY - startY;
            wrapper.style.position = "relative";
            wrapper.style.zIndex = 999;
            wrapper.style.top = `${deltaY}px`;
            wrapper.style.transition = "none";

            //Update highlight position
            if (highlightRef.current) {
                const targetable = getTargetableElementAndShift(e.clientY);
                if (targetable) {
                    highlightRef.current.style.display = "block";
                    const rect = targetable.element.getBoundingClientRect();
                    highlightRef.current.style.top = `${rect[targetable.position === "above" ? "top" : "bottom"] - 2}px`;
                    highlightRef.current.style.left = `${rect.left}px`;
                    highlightRef.current.style.width = `${rect.width}px`;
                } else {
                    highlightRef.current.style.display = "none";
                }
            }
        };

        const mouseUp = () => {
            //Remove listeners
            document.body.removeEventListener("mousemove", mouseMove);
            document.body.removeEventListener("mouseup", mouseUp);
        };

        //Add listeners
        document.body.addEventListener("mousemove", mouseMove);
        document.body.addEventListener("mouseup", mouseUp);
    };

    return (
        <div ref={wrapperRef} className="page_block_wrapper">
            {buildBlockForData(blockId, data, children, pageRef)}
            <div
                ref={draggerRef}
                onMouseDown={startDrag}
                className="page_block_dragger"
                style={{ cursor: "grab", userSelect: "none" }}
            >
                &nbsp;: : :&nbsp;
            </div>
        </div>
    );
}