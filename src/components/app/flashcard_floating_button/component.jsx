import "./style.css";

export function FlashcardFloatingButton({ currentNotebookId }) {
    const handleClick = () => {
        window.location.href = `/flashcard_select?notebook_id=${currentNotebookId}`;
    };
    return (
        <div className="flashcard_floating_button" onClick={handleClick}>
        </div>
    );
}