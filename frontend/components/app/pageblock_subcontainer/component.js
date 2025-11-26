export function PageBlockSubcontainerComponent({
    forwardedRef,
    parentId,
    children,
}) {
    return (
        <div
            ref={forwardedRef}
            data-parentid={parentId}
            className="page_block_subcontainer page_block_containerlike page_subcontainer_targetable_any"
        >
            {children}
        </div>
    );
}
