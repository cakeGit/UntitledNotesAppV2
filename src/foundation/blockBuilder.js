import { createRef } from "react";
import { PageBlockWrapperComponent } from "../components/app/pageblock_wrapper/component.js";
import { PageTextBlock } from "../components/blocks/text.js";

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
                return (
                    <PageBlockWrapperComponent
                        key={block.blockId}
                        pageRef={pageRef}
                        blockId={block.blockId}
                        data={content[block.blockId]}
                        wrapperRef={blockRef}
                    >
                        {(() => {
                            pageRef.current.content[block.blockId].ref =
                                blockRef;
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
