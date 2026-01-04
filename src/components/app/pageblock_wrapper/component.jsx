import { useRef, useState } from "react";
import { buildBlockForData } from "../../../foundation/blockBuilder.jsx";
import { createDragHandler } from "./drag.jsx";
import "./style.css";
import { createDeleteBlockHandler } from "./delete.jsx";
import { createAddBlockHandler } from "./add.jsx";

//Page block wrapper is a component that wraps each block in the page editor, provides drag and drop functionality
export function PageBlockWrapperComponent({
    blockId,
    pageRef,
    children,
    wrapperRef,
}) {
    const blockRef = useRef(null);
    const draggerRef = useRef(null);

    const [data, setData] = useState(pageRef.current.content[blockId]);
    pageRef.current.content[blockId].setData = setData;

    return (
        <div
            ref={wrapperRef}
            className="page_block_wrapper"
            data-blockid={blockId}
        >
            {buildBlockForData(blockId, data, children, pageRef, blockRef)}
            <div
                ref={draggerRef}
                onMouseDown={createDragHandler(blockId, pageRef, wrapperRef)}
                className="page_block_dragger"
                style={{
                    cursor: "grab",
                    userSelect: "none",
                    display: "inline-block",
                }}
            >
                &nbsp;:::&nbsp;
            </div>
            &nbsp;
            <div
                ref={draggerRef}
                onMouseDown={createDeleteBlockHandler(
                    blockId,
                    pageRef,
                    wrapperRef
                )}
                className="page_block_binner"
                style={{
                    cursor: "pointer",
                    userSelect: "none",
                    display: "inline-block",
                }}
            >
                &nbsp;x&nbsp;
            </div>
            &nbsp;
            <div
                ref={draggerRef}
                onMouseDown={createAddBlockHandler(
                    blockId,
                    pageRef,
                    wrapperRef
                )}
                className="page_block_adder"
                style={{
                    cursor: "pointer",
                    userSelect: "none",
                    display: "inline-block",
                }}
            >
                &nbsp;+&nbsp;
            </div>
        </div>
    );
}
