import { useState } from "react";
import { FlashcardFullDisplay } from "../../../components/flashcard/generic_full_display/component";
import { FlashcardHistory } from "../../../components/app/flashcard_history/component";
import { AppLineBreak } from "../../../components/app/line_break/component";

export function FlashcardTreeSidebar({ flashcardsByLinkId, updateRef }) {
    const [selectedFlashcardLinkId, setSelectedFlashcardLinkId] =
        useState(null);
    updateRef.current = setSelectedFlashcardLinkId; //Pass the state update function back to the parent so it can control which flashcard is selected
    const flashcard = flashcardsByLinkId[selectedFlashcardLinkId];
    //Shows flashcard, learning history and the content of a selected flashcard, otherwise a hint "Click on a leaf to see a flashcard"

    return (
        <div className="flashcard_tree_sidebar">
            {selectedFlashcardLinkId == null ? (
                <p className="flashcard_tree_sidebar_hint">
                    Click on a leaf to see a flashcard!
                </p>
            ) : (
                <div className="flashcard_tree_sidebar_content">
                    <h1>Flashcard</h1>
                    Progress: <FlashcardHistory flashcard={flashcard} />
                    <AppLineBreak />
                    <div className="flashcard_tree_sidebar_flashcard_container">
                        <FlashcardFullDisplay
                            flashcard={flashcard}
                            side="front"
                            style="compact"
                        />
                    </div>
                    <AppLineBreak />
                    <div className="flashcard_tree_sidebar_flashcard_container">
                        <FlashcardFullDisplay
                            flashcard={flashcard}
                            side="back"
                            style="compact"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
