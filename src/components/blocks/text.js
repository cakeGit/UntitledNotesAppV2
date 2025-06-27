import { useRef } from "react";
import { PageBlockSubcontainerComponent } from "../app/pageblocksubcontainer/component";

export function PageTextBlock({blockId, data, pageRef, children}) {
    const subcontainerRef = useRef(null);
    pageRef.current.addTargetableSubcomponentContainer(
        {
            canTarget: () => true,
            ref: subcontainerRef
        }
    )
    return (
        <div>
            <p>{data.textContent}</p>
            <div style={{marginLeft: "20px"}}>
                <PageBlockSubcontainerComponent ref={subcontainerRef} parentId={blockId}>
                    {children}
                </PageBlockSubcontainerComponent>
            </div>
        </div>
    );
}