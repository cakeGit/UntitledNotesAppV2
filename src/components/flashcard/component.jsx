import "./style.css";

export function FlashcardTaskFrontDisplay({ flashcard }) {
    return (
        <div className="flashcard_task_front_display">
            <div className="flashcard_task_front_display_inner">
                <p>{flashcard.frontText}</p>
                <div className="minibar" />
            </div>
        </div>
    );
}
