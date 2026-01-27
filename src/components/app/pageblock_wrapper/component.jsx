import { useRef, useState } from "react";
import { renderBlock } from "../../../foundation/blockRenderer.jsx";
import { createDragHandler } from "./drag.jsx";
import "./style.css";
import { createDeleteBlockHandler } from "./delete.jsx";
import { createAddBlockHandler } from "./add.jsx";
import { BLOCK_TYPE_REGISTRY } from "../../../foundation/page/typeRegistry.mjs";

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

    const hidesAddButton =
        BLOCK_TYPE_REGISTRY[data.type]?.hidesAddButton || false;

    return (
        <div
            ref={wrapperRef}
            className="page_block_wrapper"
            data-blockid={blockId}
        >
            <div className="page_block_container">
                {renderBlock(blockId, data, children, pageRef, blockRef)}
            </div>
            <button
                ref={draggerRef}
                onMouseDown={createDragHandler(blockId, pageRef, wrapperRef)}
                className="page_block_dragger"
                style={{
                    cursor: "grab",
                    userSelect: "none",
                    display: "inline-block",
                }}
            >
                ···
            </button>
            &nbsp;
            <button
                onMouseDown={createDeleteBlockHandler(
                    blockId,
                    pageRef,
                    wrapperRef,
                )}
                className="page_block_binner"
                style={{
                    cursor: "pointer",
                    userSelect: "none",
                    display: "inline-block",
                }}
            >
                x
            </button>
            &nbsp;
            {!hidesAddButton ? (
                <button
                    onMouseDown={createAddBlockHandler(
                        blockId,
                        pageRef,
                        wrapperRef,
                    )}
                    className="page_block_adder"
                    style={{
                        cursor: "pointer",
                        userSelect: "none",
                        display: "inline-block",
                    }}
                >
                    +
                </button>
            ) : null}
        </div>
    );
}
