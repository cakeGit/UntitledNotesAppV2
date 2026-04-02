import "./assignment_container.css";

export function PageAssignmentsContainerBlock({
    blockId,
    data,
    pageRef,
    children,
    ref,
}) {
    function addNewAssignment() {
        pageRef.current.createNewBlockInside("assignment", blockId);
    }

    return (
        <div ref={ref} className="assignments_block_container">
            <div className="assignments_block_content inner_inset_styled_container">
                <div>
                    {children}
                    <button
                        onClick={addNewAssignment}
                        className="assignment_add_button"
                    >
                        + Add Assignment
                    </button>
                </div>
            </div>
        </div>
    );
}
