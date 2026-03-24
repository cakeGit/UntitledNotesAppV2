import "../front/style.css"; //Just reuse the kind of styling used on the front of the card
import "./style.css"; //But also include the overrides for compact style
import { CanvasDisplay } from "../canvas_display/canvasDisplay";

//Style can be "compact" to indicate the default flashcard_task_front_text needs to be smaller
export function FlashcardFullDisplay({ flashcard, side, style }) { 
    const hasCanvasData =
        flashcard[side + "CanvasDocumentData"] &&
        flashcard[side + "CanvasDocumentData"].length > 0;
    const hasImageData = !hasCanvasData && flashcard[side + "ImageResourceId"];

    function getTitle(side) {
        return side === "front" ? "Front" : "Back";
    }

    return (
        <div className="flashcard_task_front_display">
            <div className="flashcard_task_front_display_inner">
                {hasCanvasData || hasImageData ? (
                    <div className="flashcard_task_front_with_media">
                        <div className="flashcard_task_front_media">
                            {hasCanvasData ? ( //Display of the diagram from the flashcard front side
                                <CanvasDisplay
                                    canvasDocumentData={
                                        flashcard[side + "CanvasDocumentData"]
                                    }
                                />
                            ) : ( //Display of the image
                                <img
                                    src={`/image/${flashcard[side + "ImageResourceId"]}`}
                                    alt={`${getTitle(side)} of flashcard image`}
                                    className="flashcard_task_front_image"
                                />
                            )}
                        </div>
                        <p className={"flashcard_task_front_text_caption" + (style === "compact" ? " flashcard_task_compact_text_caption" : "")}>
                            {flashcard[side + "Text"]}
                        </p>
                    </div>
                ) : (
                    <p className={"flashcard_task_front_text_exclusive" + (style === "compact" ? " flashcard_task_compact_text_caption" : "")}>
                        {flashcard[side + "Text"]}
                    </p>
                )}
            </div>
        </div>
    );
}
