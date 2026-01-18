import { useState } from "react";
import { useTargetableSubcomponentContainer } from "../../foundation/useTargetableSubcomponentContainer.jsx";
import "./flashcards.css";

export function PageFlashcardsBlock({ blockId, data, pageRef, children, ref }) {
    const { subcontainerElement } = useTargetableSubcomponentContainer(
        pageRef,
        blockId,
        children,
        "flashcard"
    );

    const [collapsed, setCollapsed] = useState(false); //Local state, doesent sync to page data

    function addNewFlashcard() {
        pageRef.current.createNewBlockInside("text_flashcard", blockId);
    }

    return (
        <div ref={ref} className="flashcards_block_container">
            <h2>
                Flashcards{" "}
                <button onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? "Expand" : "Collapse"}
                </button>
            </h2>
            {!collapsed ? (
                <div className="flashcards_content">
                {subcontainerElement}
                <button onClick={addNewFlashcard}>Add Flashcard</button>
                </div>
            ) : null}
        </div>
    );
}
