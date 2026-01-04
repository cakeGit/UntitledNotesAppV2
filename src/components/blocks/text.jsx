import { useEffect, useRef } from "react";
import { PageBlockSubcontainerComponent } from "../app/pageblock_subcontainer/component.jsx";
import "./text.css";

export function PageTextBlock({ blockId, data, pageRef, children, ref }) {
    const subcontainerRef = useRef(null);

    useEffect(() => {
        pageRef.current.addTargetableSubcomponentContainer({
            canTarget: () => true,
            ref: subcontainerRef,
            blockId,
        });
    }, [blockId]);

    const textInputRef = useRef(null);

    // const handleTextClick = () => {
    //     console.log("Text block clicked");
    //     if (textInputRef.current) {
    //     }
    // };

    const handleTextChanged = (e) => {
        if (textInputRef.current) {
            data.textContent = textInputRef.current.innerText;
            pageRef.current.sendChange(blockId);
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

    useEffect(() => {
        if (textInputRef.current) {
            textInputRef.current.innerText = data.textContent || "";
            if (!data.textContent || data.textContent.trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
        }
    }, [data.textContent]);

    return (
        <div ref={ref}>
            <div className={"text_box_" + (data.subtype || "unknown")} contentEditable /*onClick={handleTextClick}*/ onBlur={handleTextLeave} onInput={handleTextChanged} ref={textInputRef} placeholder="Write text here... Type '/' for commands">
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
