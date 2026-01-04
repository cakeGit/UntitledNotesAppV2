export function createDeleteBlockHandler(blockId, pageRef, wrapperRef, highlightRef) {
    return (e) => {
        e.preventDefault();

        pageRef.current.deleteBlock(blockId);
        pageRef.current.sendDeleted(blockId);
        pageRef.current.triggerStructureRerender();
    };
}
