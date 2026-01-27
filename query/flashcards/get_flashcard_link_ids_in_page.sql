SELECT FlashcardLinkID, FlashcardBlocks.BlockID FROM FlashcardBlocks
JOIN Blocks ON FlashcardBlocks.BlockID = Blocks.BlockID
WHERE Blocks.PageID = ?;