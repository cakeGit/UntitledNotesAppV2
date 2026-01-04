import { useEffect, useRef, useState } from "react";
import { Page } from "../../../foundation/page/page.js";
import "./style.css";
import { buildNodeChildrenSimple } from "../../../foundation/blockBuilder.jsx";
import { LocalActivePage } from "../../../foundation/page/localActivePage.js";

export function PageViewComponent({ pageId }) {
    const socketRef = useRef(null);

    const pageRef = useRef(null);
    const linkedNetHandler = useRef(null);

    const [_structureRenderTick, setStructureRenderTick] = useState(0);
    //Listen to page structure changes
    useEffect(() => {
        if (!pageRef.current) {
            pageRef.current = new Page(
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
            );
            window.pageRef = pageRef;
            if (linkedNetHandler.current) {
                pageRef.current.linkedNetHandler = linkedNetHandler.current;
            }
        }

        //Register the primary container
        pageRef.current.primaryContainerRef = primaryContainerRef;

        //Register the structure rerender trigger
        pageRef.current.triggerStructureRerender = () => {
            setStructureRenderTick((tick) => tick + 1);
        };

        return () => {
            pageRef.current.triggerStructureRerender = null;
            pageRef.current.primaryContainerRef = null;
        };
    }, []);

    const primaryContainerRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(`ws://${window.location.host}/page_editor`);

        const pageNetHandler = new LocalActivePage(pageRef, ws);
        if (pageRef.current) {
            pageRef.current.linkedNetHandler = pageNetHandler;
        }

        linkedNetHandler.current = pageNetHandler;

        socketRef.current = ws;

        return () => {
            ws.close();
        };
    }, [pageId]);

    return (
        <div ref={primaryContainerRef} className="pageView">
            {pageRef.current ? buildNodeChildrenSimple(
                pageRef.current.structure.children,
                pageRef.current.content,
                pageRef
            ) : null}
        </div>
    );
}
