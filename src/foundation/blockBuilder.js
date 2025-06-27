import { PageBlockWrapperComponent } from "../components/app/pageblockwrapper/component";
import { PageTextBlock } from "../components/blocks/text";

export function buildBlockForData(blockId, data, children, pageRef) {
    return (<PageTextBlock blockId={blockId} pageRef={pageRef} data={data}>
        {children}
    </PageTextBlock>)
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
            {
                children.map((block) => {
                    return (
                        <PageBlockWrapperComponent
                            key={block.blockId}
                            pageRef={pageRef}
                            blockId={block.blockId}
                            data={content[block.blockId]}
                        >
                            {buildChildrenBlockForData(block.blockId, block.children, content, pageRef)}
                        </PageBlockWrapperComponent>
                    )
                })
            }
        </div>
    );
}
