import { createRef } from "react";
import { PageBlockWrapperComponent } from "../components/app/pageblock_wrapper/component.jsx";
import { BLOCK_TYPE_REGISTRY } from "./page/typeRegistry.jsx";

export function buildBlockForData(blockId, data, children, pageRef, blockRef) {
    const Component = BLOCK_TYPE_REGISTRY[data.type]?.component;
    if (Component) {
        return (
            <Component
                ref={blockRef}
                blockId={blockId}
                pageRef={pageRef}
                data={data}
            > {children} </Component>
        );
    }
    return (
        <p>Unknown block! "{JSON.stringify(data)}"!</p>
    );
}

export function buildChildrenBlockForData(blockId, children, content, pageRef) {
    return buildNodeChildrenSimple(children, content, pageRef);
}

export function buildNodeChildrenSimple(children, content, pageRef) {
    if (children === undefined || children.length === 0) {
        return null;
    }
    return (
        <div>
            {children.map((block) => {
                // Each block gets its own ref
                const blockRef =
                    pageRef.current.content[block.blockId].ref ||
                    createRef(null);
                pageRef.current.content[block.blockId].ref = blockRef;
                return (
                    <PageBlockWrapperComponent
                        key={block.blockId}
                        pageRef={pageRef}
                        blockId={block.blockId}
                        wrapperRef={blockRef}
                    >
                        {(() => {
                            return buildChildrenBlockForData(
                                block.blockId,
                                block.children,
                                content,
                                pageRef
                            );
                        })()}
                    </PageBlockWrapperComponent>
                );
            })}
        </div>
    );
}
