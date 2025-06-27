import { useRef } from "react";
import { Page } from "../../../foundation/page/page";
import "./style.css";
import { buildNodeChildrenSimple } from "../../../foundation/blockBuilder";

export function PageViewComponent({pageId}) {
    const pageRef = useRef(new Page(
        {
            children: [
                {
                    blockId: "textboxid",
                    children: [
                        {
                            blockId: "textboxid2",
                        }
                    ]
                }
            ]
        },
        {
            "textboxid": {
                type: "textbox",
                textContent: "hey"
            },
            "textboxid2": {
                type: "textbox",
                textContent: "hooo"
            }
        }
    ));

    const primaryContainerRef = useRef(null);

    pageRef.current.primaryContainerRef = primaryContainerRef;

    return (
        <div ref={primaryContainerRef} className="pageView">
            {
                buildNodeChildrenSimple(pageRef.current.structure.children, pageRef.current.content, pageRef)
            }
        </div>
    )
}