import { useState } from "react";
import { FlashcardTaskFrontDisplay } from "../../../components/flashcard/component.jsx";

export function FlashcardSelfAssessTask({ flashcard, onComplete }) {
    const [showAnswer, setShowAnswer] = useState(false);
    if (!flashcard) return <></>;
    return (
        <div className="flashcard_task">
            <FlashcardTaskFrontDisplay flashcard={flashcard} />
            {showAnswer && (
                <div className="flashcard_back">
                    <p>{flashcard.backText}</p>
                </div>
            )}
            {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)}>Show Answer</button>
            ) : (
                <div className="flashcard_difficulty_buttons">
                    <button onClick={() => onComplete(1)}>Easy</button>
                    <button onClick={() => onComplete(2)}>Medium</button>
                    <button onClick={() => onComplete(3)}>Hard</button>
                </div>
            )}
        </div>
    );
}