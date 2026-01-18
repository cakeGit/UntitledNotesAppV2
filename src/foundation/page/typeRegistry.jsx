import { PageTextBlock } from "../../components/blocks/text/text";
import { PageFlashcardsBlock } from "../../components/blocks/flashcards/container/flashcards";
import { PageTextFlashcardBlock } from "../../components/blocks/flashcards/text_flashcard/textFlashcard";

export const BLOCK_TYPE_REGISTRY = {
    text: {
        component: PageTextBlock,
    },
    flashcards: {
        component: PageFlashcardsBlock,
    },
    text_flashcard: {
        component: PageTextFlashcardBlock,
        containerType: "flashcard",
        hidesAddButton: true,
    }
};