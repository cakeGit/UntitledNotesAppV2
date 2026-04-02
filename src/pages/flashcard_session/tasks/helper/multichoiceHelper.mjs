//Helper to take in an entire deck of possible flashcards and generate multiple choice options for a given flashcard
//Alternate choices must not be equal, and we sort by similarity to try find the most challenging options
//Media (canvas drawing / image) is supported: same media type yields a similarity of 1, averaged with text similarity when text is also present

//The actual text similarity algorithm is from the string-similarity package
import stringSimilarity from "string-similarity";

// Returns 'canvas', 'image', or null for the back side of a flashcard
function getBackMediaType(flashcard) {
    if (flashcard.backCanvasDocumentData && flashcard.backCanvasDocumentData.length > 0) {
        return "canvas";
    }
    if (flashcard.backImageResourceId) {
        return "image";
    }
    return null;
}

// 0-1 text similarity between two flashcard back sides
function compareBackTextSimilarity(fc1, fc2) {
    const text1 = fc1.backText || "";
    const text2 = fc2.backText || "";
    if (text1 == "" && text2 == "") return 1;
    if (text1 == "" || text2 == "") return 0;
    //Both having text content means they are at least a little bit similar, so we code it to 0.5-1
    return stringSimilarity.compareTwoStrings(text1, text2) * 0.5 + 0.5;
}

// 1 if both backs share the same media type (canvas/image), 0.5 if theres different media types, 0 otherwise
function compareBackMediaSimilarity(fc1, fc2) {
    const media1 = getBackMediaType(fc1);
    const media2 = getBackMediaType(fc2);
    if (media1 === null || media2 === null) return 0;
    return media1 === media2 ? 1 : 0.5;
}

// True if two flashcard back sides have identical content (text + media)
function areBacksEqual(fc1, fc2) {
    const media1 = getBackMediaType(fc1);
    const media2 = getBackMediaType(fc2);
    if (media1 !== media2) return false;
    if ((fc1.backText || "") !== (fc2.backText || "")) return false;
    if (media1 === "image") return fc1.backImageResourceId === fc2.backImageResourceId;
    if (media1 === "canvas") return fc1.backCanvasDocumentData === fc2.backCanvasDocumentData;
    return true;
}

// Combined similarity score:
function computeBackSimilarity(fc1, fc2) {
    const eitherHasMedia = getBackMediaType(fc1) !== null || getBackMediaType(fc2) !== null;
    const eitherHasText = !!(fc1.backText?.trim()) || !!(fc2.backText?.trim());

    if (!eitherHasMedia) {
        return compareBackTextSimilarity(fc1, fc2);
    }

    const mediaSimilarity = compareBackMediaSimilarity(fc1, fc2);

    if (!eitherHasText) {
        return mediaSimilarity;
    }

    return (mediaSimilarity + compareBackTextSimilarity(fc1, fc2)) / 2;
}

//Possible optimisation: bubble sort the top 3 most similar rather than sorting the entire array, O(3n) vs O(n log n)
export function generateMultiChoiceOptions(flashcard, allFlashcards) {
    if (!flashcard || !allFlashcards || allFlashcards.length < 4) {
        //Cases like these need to be caught ahead of time, but to avoid tripping up an error is thrown
        throw new Error(
            "Insufficient data to generate multiple choice options",
        );
    }

    //Get all possible unique choices excluding the correct answer
    const possibleChoices = allFlashcards
        .filter(
            (fc) =>
                fc.flashcardLinkId !== flashcard.flashcardLinkId &&
                !areBacksEqual(fc, flashcard),
        )
        .filter( //Also ensure distinct back content, this must be the one and only occurrence of this back content in the array
            (fc, index, self) =>
                index === self.findIndex((t) => areBacksEqual(t, fc)),
        );

    if (possibleChoices.length < 3) {
        throw new Error(
            "Insufficient distinct flashcards to generate multiple choice options",
        );
    }

    //Calculate similarity scores, bundling the flashcards with their similarity scores for sorting
    const choicesWithScores = possibleChoices.map((fc) => ({
        flashcard: fc,
        similarity: computeBackSimilarity(flashcard, fc),
    }));

    //Sort by similarity descending
    choicesWithScores.sort((a, b) => b.similarity - a.similarity);

    //Select the top 3 incorrect choices, taking the flashcard and discarding the similarity score
    const selectedChoices = choicesWithScores
        .slice(0, 3)
        .map((item) => item.flashcard);

    //Add the correct answer
    selectedChoices.push(flashcard);

    //Shuffle the options
    for (let i = selectedChoices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedChoices[i], selectedChoices[j]] = [
            selectedChoices[j],
            selectedChoices[i],
        ];
    }

    return selectedChoices;
}
