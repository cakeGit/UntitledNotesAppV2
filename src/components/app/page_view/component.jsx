import { useEffect, useRef, useState } from "react";
import { Page } from "../../../foundation/page/page.js";
import "./style.css";
import { buildNodeChildrenSimple } from "../../../foundation/blockBuilder.jsx";
import { LocalActivePage } from "../../../foundation/page/localActivePage.js";
import { EmptyPageHint } from "../page_empty_hint/component.jsx";
import { PageAddBlockPopover } from "../page_add_popover/component.jsx";

export function PageViewComponent({ pageId }) {
    const socketRef = useRef(null);

    const pageRef = useRef(null);
    const linkedNetHandler = useRef(null);

    const [_structureRenderTick, setStructureRenderTick] = useState(0);
    //Listen to page structure changes
    useEffect(() => {
        if (!pageRef.current) {
            pageRef.current = new Page(
                { children: [] }, {}
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
        const ws = new WebSocket(`ws://${window.location.host}/page_editor?pageId=${pageId}`);

        const pageNetHandler = new LocalActivePage(pageRef, ws);
        if (pageRef.current) {
            pageRef.current.linkedNetHandler = pageNetHandler;
        }

        ws.onopen = () => {
            pageNetHandler.requestFullResync();
        };

        linkedNetHandler.current = pageNetHandler;

        socketRef.current = ws;

        return () => {
            ws.close();
        };
    }, [pageId]);

    return (
        <div ref={primaryContainerRef} className="pageView">
            {pageRef.current ? pageRef.current.structure.children.length > 0 ? buildNodeChildrenSimple(
                pageRef.current.structure.children,
                pageRef.current.content,
                pageRef
            ) : <EmptyPageHint pageRef={pageRef}/> : null}

            <PageAddBlockPopover pageRef={pageRef} />
        </div>
    );
}
