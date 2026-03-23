DELETE FROM FlashcardLearningHistory
WHERE FlashcardLinkID IN (
    SELECT FlashcardBlocks.FlashcardLinkID
    FROM Blocks, FlashcardBlocks
    WHERE Blocks.PageID = $PageID
    AND Blocks.BlockID = FlashcardBlocks.BlockID
);

DELETE FROM ImageResources
WHERE ResourceID IN (
    SELECT ImageBlocks.ResourceID
    FROM Blocks, ImageBlocks
    WHERE Blocks.PageID = $PageID
    AND Blocks.BlockID = ImageBlocks.BlockID
);

DELETE FROM Pages
WHERE PageID = $PageID;