import { useRef } from "react";
import { buildBlockForData } from "../../../foundation/blockBuilder";
import "./style.css";

export function PageBlockWrapperComponent({blockId, data, pageRef, children}) {
    const draggerRef = useRef(null);
    const wrapperRef = useRef(null);

    const startDrag = (e) => {
        e.preventDefault();
        const wrapper = wrapperRef.current;
        const startY = e.clientY;

        const mouseMove = (e) => {
            const deltaY = e.clientY - startY;
            wrapper.style.position = "relative";
            wrapper.style.zIndex = 999;
            wrapper.style.top = `${deltaY}px`;
            wrapper.style.transition = "none";
            console.log(pageRef.current.getTargetableContainers())
        };

        const mouseUp = () => {
            document.body.removeEventListener("mousemove", mouseMove);
            document.body.removeEventListener("mouseup", mouseUp);
        };

        document.body.addEventListener("mousemove", mouseMove);
        document.body.addEventListener("mouseup", mouseUp);
    };

    return (
        <div ref={wrapperRef} className="page_block_wrapper">
            {buildBlockForData(blockId, data, children, pageRef)}
            <div
                ref={draggerRef}
                onMouseDown={startDrag}
                className="page_block_dragger"
                style={{ cursor: "grab", userSelect: "none" }}
            >
                &nbsp;: : :&nbsp;
            </div>
        </div>
    );
}