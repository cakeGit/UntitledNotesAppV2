import { useEffect, useRef } from "react";
import { PageBlockSubcontainerComponent } from "../app/pageblock_subcontainer/component.js";

export function PageTextBlock({ blockId, data, pageRef, children, ref }) {
    const subcontainerRef = useRef(null);
    useEffect(() => {
        pageRef.current.addTargetableSubcomponentContainer({
            canTarget: () => true,
            ref: subcontainerRef,
            blockId,
        });
        // Don't remove on cleanup - let the page manage stale refs
        // This prevents targets from disappearing during re-renders
    }, [blockId]); // Remove pageRef from dependencies as it never changes

    const textInputRef = useRef(null);

    const handleTextClick = () => {
        console.log("Text block clicked");
        if (textInputRef.current) {
        }
    };

    const handleTextChanged = (e) => {
        if (textInputRef.current) {
            data.textContent = textInputRef.current.innerText;
            if (data.textContent.trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
        }
    };

    const handleTextLeave = (e) => {
        if (textInputRef.current) {
        }
    };

    return (
        <div ref={ref}>
            <div contentEditable onClick={handleTextClick} onBlur={handleTextLeave} onInput={handleTextChanged} ref={textInputRef} placeholder="Write text here... Type '/' for commands">
                {data.textContent}
            </div>
            <div style={{ marginLeft: "20px" }}> {/* Indented children */}
                <PageBlockSubcontainerComponent
                    forwardedRef={subcontainerRef}
                    parentId={blockId}
                >
                    {children}
                </PageBlockSubcontainerComponent>
            </div>
        </div>
    );
}
