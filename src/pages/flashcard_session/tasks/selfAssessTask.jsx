import { useState } from "react";
import { FlashcardFullDisplay } from "../../../components/flashcard/generic_full_display/component.jsx";
import { AppLineBreak } from "../../../components/app/line_break/component.jsx";

export function FlashcardSelfAssessTask({ flashcard, onComplete }) {
    const [showAnswer, setShowAnswer] = useState(false); //This is the only state needed, determines if show answer has been clicked
    if (!flashcard) return <></>;
    return (
        <div className="flashcard_task">
            <FlashcardFullDisplay flashcard={flashcard} side="front" />{" "}
            {/*Show front of flashcard*/}
            {showAnswer && (
                <>
                    <AppLineBreak />
                    {/* The back is shown but only after user clicks "Show Answer" */}
                    <FlashcardFullDisplay
                        flashcard={flashcard}
                        side="back"
                        style="compact"
                    />
                </>
            )}
            {!showAnswer ? (
                <button onClick={() => setShowAnswer(true)}>Show Answer</button>
            ) : (
                //Shown after answer is revealed, user can self-assess confidence
                <div className="flashcard_confidence_buttons">
                    <button onClick={() => onComplete(3)}>Easy</button>
                    <button onClick={() => onComplete(2)}>Medium</button>
                    <button onClick={() => onComplete(1)}>Hard</button>
                </div>
            )}
        </div>
    );
}
