import { useRef } from "react";
import { createAddBlockHandler } from "../pageblock_wrapper/add";
import { FaPlus } from "react-icons/fa";

export function EmptyPageHint({ pageRef }) {
    const hintRef = useRef(null);

    return (
        <div className="empty_page_hint" ref={hintRef}>
            <h2>This page is empty :&#40;</h2>
            <p>Use the "+" button to add blocks to the page.</p>
            <button
                onMouseDown={createAddBlockHandler(null, pageRef, hintRef)}
                className="page_block_adder page_block_adder_empty_hint"
                style={{
                    cursor: "pointer",
                    userSelect: "none",
                    display: "inline-block",
                }}
            >
                <FaPlus />
            </button>
        </div>
    );
}
