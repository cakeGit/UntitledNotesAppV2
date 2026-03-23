import { GenericModal } from "../../../../../foundation/modals/genericModal.jsx";

//Modal inner component, which just goes inside the generic modal container
//Contains a cancel and a delete button while also providing a warning about which notebook will be deleted
function DeleteModalInner({ modal }) {
    return (
        <>
            <h2>Confirm delete</h2>
            <p>
                Are you sure you want to delete page:
                <br />
                <b>{modal.pageName}</b>
                <br />
                This action cannot be undone! All notes, flashcards and other
                content inside the page will be deleted as well.
            </p>
            <div className="right_button_row">
                <button onClick={() => modal.closeModal()}>Cancel</button>
                <button onClick={() => {
                    modal.submit();
                    modal.closeModal();    
                }}>Delete</button>
            </div>
        </>
    );
}

//Use the generic modal api that was adapted from the settings modals
//For this, it just accepts a generic submit function
export class DeletePageModal extends GenericModal {
    constructor(submit, pageName, modalHook) {
        super(DeleteModalInner, modalHook);
        this.pageName = pageName;
        this.submit = submit;
    }
}
