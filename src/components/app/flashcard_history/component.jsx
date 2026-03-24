import { getTimeDisplay } from "../../../../backend/web/foundation_safe/timeHelper";
import "./style.css";

function FlashcardHistoryElement({ value, isMastered }) {
    //Mastered is all Easy, turns blue to indicate good progress
    return (
        <div
            className={`flashcard_history_element flashcard_history_element_${isMastered ? "mastered" : ["none", "hard", "medium", "easy"][value]}`}
        ></div>
    );
}

export function FlashcardHistory({ flashcard }) {
    var mastered =
        flashcard.learningHistory1 === 4 &&
        flashcard.learningHistory2 === 4 &&
        flashcard.learningHistory3 === 4 &&
        flashcard.learningHistory4 === 4;
    return (
        <div className="flashcard_history">
            <FlashcardHistoryElement
                value={flashcard.learningHistory1 || 0}
                isMastered={mastered}
            />
            <FlashcardHistoryElement
                value={flashcard.learningHistory2 || 0}
                isMastered={mastered}
            />
            <FlashcardHistoryElement
                value={flashcard.learningHistory3 || 0}
                isMastered={mastered}
            />
            <FlashcardHistoryElement
                value={flashcard.learningHistory4 || 0}
                isMastered={mastered}
            />
            <span className="flashcard_history_time">
                (
                {
                    flashcard.lastLearnedTime == undefined ||
                    flashcard.lastLearnedTime == 0
                        ? "Unlearned"
                        : getTimeDisplay(flashcard.lastLearnedTime)[0] //Use [0] to get the text and ignore the attatched time class
                }
                )
            </span>
        </div>
    );
}
