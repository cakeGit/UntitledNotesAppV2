import { PageTextBlock } from "../../components/blocks/text/text";
import { PageFlashcardsBlock } from "../../components/blocks/flashcards/container/flashcards";
import { PageTextFlashcardBlock } from "../../components/blocks/flashcards/text_flashcard/textFlashcard";
import { PageDrawingCanvasBlock } from "../../components/blocks/drawing_canvas/drawingCanvas";

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
    },
    drawing_canvas: {
        component: PageDrawingCanvasBlock,
    }
};