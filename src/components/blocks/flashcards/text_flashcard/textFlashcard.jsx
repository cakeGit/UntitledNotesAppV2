import { useEffect, useRef } from "react";
import "./textFlashcard.css";

function TextCardSide({ side, data, pageRef, blockId }) {
    const textInputRef = useRef(null);
    const dataKey = side + "Text";

    const handleTextChanged = (e) => {
        if (textInputRef.current) {
            pageRef.current.content[blockId][dataKey] =
                textInputRef.current.innerText;
            pageRef.current.sendChange(blockId);
            if (data[dataKey]?.trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
        }
    };

    useEffect(() => {
        if (textInputRef.current) {
            textInputRef.current.innerText = data[dataKey] || "";
            if (!data[dataKey] || data[dataKey].trim() === "") {
                textInputRef.current.classList.add("showplaceholder");
            } else {
                textInputRef.current.classList.remove("showplaceholder");
            }
        }
    }, [data[dataKey]]);

    return (
        <div className={"flashcard_side flashcard_side_" + side}>
            <div
                className="flashcard_text_box"
                contentEditable
                onInput={handleTextChanged}
                ref={textInputRef}
                placeholder={side === "front" ? "Front side text..." : "Back side text..."}
            ></div>
        </div>
    );
}

export function PageTextFlashcardBlock({ blockId, data, pageRef, children, ref }) {
    return <div ref={ref} className="flashcard_text">
        <TextCardSide side="front" data={data} pageRef={pageRef} blockId={blockId}/>
        <TextCardSide side="back" data={data} pageRef={pageRef} blockId={blockId}/>
    </div>;
}
