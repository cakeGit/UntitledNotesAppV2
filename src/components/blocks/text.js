import { useEffect, useRef } from "react";
import { PageBlockSubcontainerComponent } from "../app/pageblocksubcontainer/component";

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
    return (
        <div ref={ref}>
            <p>{data.textContent}</p>
            <div style={{ marginLeft: "20px" }}>
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
