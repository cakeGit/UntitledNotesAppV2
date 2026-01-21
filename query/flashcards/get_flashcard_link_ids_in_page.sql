SELECT FlashcardLinkID, FlashcardTextBlocks.BlockID FROM FlashcardTextBlocks
JOIN Blocks ON FlashcardTextBlocks.BlockID = Blocks.BlockID
WHERE Blocks.PageID = ?;