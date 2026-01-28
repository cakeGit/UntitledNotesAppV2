import { useEffect, useRef } from "react";
import "./text.css";
import { useTargetableSubcomponentContainer } from "../foundation/useTargetableSubcomponentContainer.jsx";
import { AppLineBreak } from "../../app/line_break/component.jsx";

export function PageTextBlock({ blockId, data, pageRef, children, ref }) {
    const { subcontainerElement } = useTargetableSubcomponentContainer(
        pageRef,
        blockId,
        children
    );
    const textInputRef = useRef(null);

    const handleTextChanged = (e) => {
        if (textInputRef.current) {
            pageRef.current.content[blockId].textContent =
                textInputRef.current.innerText;
            pageRef.current.sendChange(blockId);
            if (data.textContent.trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
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
            <div
                className={"text_box text_box_" + (data.subtype || "unknown")}
                contentEditable
                /*onClick={handleTextClick}*/ /*onBlur={handleTextLeave}*/ onInput={
                    handleTextChanged
                }
                ref={textInputRef}
                placeholder="Write text here... Type '/' for commands"
            ></div>
            {data.subtype === "header" ? <AppLineBreak className="text_header_underline" /> : null}
            {subcontainerElement}
        </div>
    );
}
