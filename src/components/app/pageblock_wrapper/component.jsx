import { useRef } from "react";
import { buildBlockForData } from "../../../foundation/blockBuilder.jsx";
import { createDragHandler } from "./drag.jsx";
import "./style.css";

//Page block wrapper is a component that wraps each block in the page editor, provides drag and drop functionality
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

    return (
        <div
            ref={wrapperRef}
            className="page_block_wrapper"
            data-blockid={blockId}
        >
            {buildBlockForData(blockId, data, children, pageRef, blockRef)}
            <div
                ref={draggerRef}
                onMouseDown={createDragHandler(blockId, pageRef, wrapperRef, highlightRef)}
                className="page_block_dragger"
                style={{ cursor: "grab", userSelect: "none" }}
            >
                &nbsp;:::&nbsp;
            </div>
        </div>
    );
}
