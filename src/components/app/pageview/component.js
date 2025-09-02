import { use, useEffect, useRef, useState } from "react";
import { Page } from "../../../foundation/page/page";
import "./style.css";
import { buildNodeChildrenSimple } from "../../../foundation/blockBuilder";

export function PageViewComponent({ pageId }) {
    const pageRef = useRef(
        new Page(
            {
                children: [
                    {
                        blockId: "textboxid",
                        children: [
                            {
                                blockId: "textboxid2",
                            },
                        ],
                    },
                ],
            },
            {
                textboxid: {
                    type: "textbox",
                    textContent: "hey",
                },
                textboxid2: {
                    type: "textbox",
                    textContent: "hooo",
                },
            }
        )
    );

    const [_structureRenderTick, setStructureRenderTick] = useState(0);
    //Listen to page structure changes
    useEffect(() => {
        pageRef.current.triggerStructureRerender = () => {
            setStructureRenderTick((tick) => tick + 1);
        };
        return () => {
            pageRef.current.triggerStructureRerender = null;
        };
    }, []);

    const primaryContainerRef = useRef(null);

    useEffect(() => {
        //Register the primary container
        pageRef.current.primaryContainerRef = primaryContainerRef;
        return () => {
            pageRef.current.primaryContainerRef = null;
        };
    }, []);

    return (
        <div ref={primaryContainerRef} className="pageView">
            {buildNodeChildrenSimple(
                pageRef.current.structure.children,
                pageRef.current.content,
                pageRef
            )}
        </div>
    );
}
