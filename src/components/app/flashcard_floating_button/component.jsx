import "./style.css";

export function FlashcardFloatingButton({ currentNotebookId }) {
    const handleClick = () => {
        window.location.href = `/flashcard_select?notebook_id=${currentNotebookId}`;
    };
    return (
        <div className="flashcard_floating_button" onClick={handleClick}>
            <div className="flashcard_symbol_element flashcard_symbol_1"></div>
            <div className="flashcard_symbol_element flashcard_symbol_2"></div>
        </div>
    );
}