
export function PageBlockSubcontainerComponent({ref, parentId, children}) {
    return (
        <div ref={ref} parentid={parentId} className="page_block_subcontainer page_block_containerlike page_subcontainer_targetable_any">
            {children}
        </div>
    )
}