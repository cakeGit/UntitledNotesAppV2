--Fancy sql statement, because we have a "conditional join" the LEFT JOIN can be used to fill in all the information in one go
SELECT 
    Blocks.*, 
    TextBlocks.TextContent, 
    TextBlocks.Subtype, 
    FlashcardTextBlocks.FrontText, 
    FlashcardTextBlocks.BackText,
    FlashcardTextBlocks.FlashcardLinkID,
    DrawingCanvasBlocks.DocumentData
FROM Blocks

LEFT JOIN TextBlocks ON Blocks.BlockID = TextBlocks.BlockID AND Blocks.Type = 'text'
LEFT JOIN FlashcardTextBlocks ON Blocks.BlockID = FlashcardTextBlocks.BlockID AND Blocks.Type = 'text_flashcard'
LEFT JOIN DrawingCanvasBlocks ON Blocks.BlockID = DrawingCanvasBlocks.BlockID AND Blocks.Type = 'drawing_canvas'

WHERE Blocks.PageID = ?;