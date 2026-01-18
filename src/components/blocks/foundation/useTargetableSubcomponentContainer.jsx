import { useEffect, useRef } from "react";
import { PageBlockSubcontainerComponent } from "../../app/pageblock_subcontainer/component.jsx";

export function useTargetableSubcomponentContainer(pageRef, blockId, children, containerType = null) {
    const subcontainerRef = useRef(null);

    useEffect(() => {
        pageRef.current.addTargetableSubcomponentContainer({
            canTarget: () => true,
            containerType,
            ref: subcontainerRef,
            blockId,
        });
    }, [blockId, containerType]);

    return {
        subcontainerRef,
        subcontainerElement: (
            <div style={{ marginLeft: "20px" }}>
                {" "}
                <PageBlockSubcontainerComponent
                    forwardedRef={subcontainerRef}
                    parentId={blockId}
                >
                    {children}
                </PageBlockSubcontainerComponent>
            </div>
        ),
    };
}
