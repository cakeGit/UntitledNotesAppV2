DELETE FROM TextBlocks
WHERE BlockID IN (
    SELECT Blocks.BlockID
    FROM Blocks
    WHERE Blocks.PageID = $pageId
);

DELETE FROM FlashcardTextBlocks
WHERE BlockID IN (
    SELECT Blocks.BlockID
    FROM Blocks
    WHERE Blocks.PageID = $pageId
);

DELETE FROM DrawingCanvasBlocks
WHERE BlockID IN (
    SELECT Blocks.BlockID
    FROM Blocks
    WHERE Blocks.PageID = $pageId
);

DELETE FROM Blocks
WHERE BlockID IN (
    SELECT Blocks.BlockID
    FROM Blocks
    WHERE Blocks.PageID = $pageId
)