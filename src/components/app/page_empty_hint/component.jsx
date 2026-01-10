import { useRef } from "react";
import { createAddBlockHandler } from "../pageblock_wrapper/add";

export function EmptyPageHint({ pageRef }) {
    const hintRef = useRef(null);

    return (
        <div className="empty_page_hint" ref={hintRef}>
            <h2>This page is empty :&#40;</h2>
            <p>Use the "+" button to add blocks to the page.</p>
            <div
                onMouseDown={createAddBlockHandler(null, pageRef, hintRef)}
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
