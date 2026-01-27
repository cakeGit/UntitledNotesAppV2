function isMastered(flashcard) {
    return flashcard.learningHistory1 === 1 &&
        flashcard.learningHistory2 === 1 &&
        flashcard.learningHistory3 === 1 &&
        flashcard.learningHistory4 === 1;
}

/**
 * Takes in the learning data in the form {flashcardLinkId, confidence} collected during a flashcard session
 * returns:
 * - Flaschard learning information to send to the server
 * - statistics to pass on to the flaschard session complete page
 */
export function collectFlashcardSessionData(
    flashcardLearningUpdates, //Edits
    finalData, //Data with edits
    initialData, //Data before edits
) {
    let totalConfidence = 0;

    const flashcardLearningStacks = {};//Each learning stack is the time ordered list of confidences for that flashcard
    for (const update of flashcardLearningUpdates) {
        if (!flashcardLearningStacks[update.flashcardLinkId]) {
            flashcardLearningStacks[update.flashcardLinkId] = [];
        }
        flashcardLearningStacks[update.flashcardLinkId].push(update.confidence);
        totalConfidence += update.confidence;
        //The stack will forget the bottom item if it exceeds 4 entries
        if (flashcardLearningStacks[update.flashcardLinkId].length > 4) {
            flashcardLearningStacks[update.flashcardLinkId].shift();
        }
    }

    //Then get statistics about the session
    let totalFlashcardsStudied = Object.keys(flashcardLearningStacks).length;
    let totalReviews = flashcardLearningUpdates.length;
    let averageConfidence = totalConfidence / totalReviews;
    //Coded statistic, average confidence is 3(Hard)-1(Easy), it needs to be mapped to 0(0% correct)-100(100% correct) scale
    let averageAccuracy = 1 - (averageConfidence - 1) / 2;
    
    //Optional statistics to be hidden if 0,
    let newFlashcards = 0;
    let flashcardsMastered = 0; //Defined as having 4 consecutive 'easy' reviews
    
    for (const flashcard of finalData) {
        const initialFlashcard = initialData.find((fc) => fc.flashcardLinkId === flashcard.flashcardLinkId);
        if (isMastered(flashcard) && !isMastered(initialFlashcard)) {
            flashcardsMastered += 1;
        }
        if (!initialFlashcard.lastLearnedTime || initialFlashcard.lastLearnedTime === 0) {
            newFlashcards += 1;
        }
    }
    
    return {
        flashcardLearningStacks,
        statistics: {
            totalFlashcardsStudied,
            totalReviews,
            averageConfidence,
            averageAccuracy,
            newFlashcards: newFlashcards > 0 ? newFlashcards : undefined,
            flashcardsMastered: flashcardsMastered > 0 ? flashcardsMastered : undefined,
        },
    };
    
}
