export function createAddBlockHandler(blockId, pageRef, wrapperRef, highlightRef) {
    return (e) => {
        e.preventDefault();

        pageRef.current.openAddBlockPopover(blockId, wrapperRef);
    };
}
