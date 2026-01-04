import { createRef, useState } from "react";
import { PageBlockWrapperComponent } from "../components/app/pageblock_wrapper/component.jsx";
import { PageTextBlock } from "../components/blocks/text.jsx";

export function buildBlockForData(blockId, data, children, pageRef, blockRef) {
    return (
        <PageTextBlock
            ref={blockRef}
            blockId={blockId}
            pageRef={pageRef}
            data={data}
        >
            {children}
        </PageTextBlock>
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
