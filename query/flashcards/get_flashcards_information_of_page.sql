SELECT
FrontText, BackText,
LastLearnedTime,
FlashcardTextBlocks.FlashcardLinkID,
(LearningHistory & 3) AS LearningHistory4,
((LearningHistory >> 2) & 3) AS LearningHistory3,
((LearningHistory >> 4) & 3) AS LearningHistory2,
((LearningHistory >> 6) & 3) AS LearningHistory1
FROM FlashcardTextBlocks, Blocks
LEFT JOIN FlashcardLearningHistory ON FlashcardTextBlocks.FlashcardLinkID = FlashcardLearningHistory.FlashcardLinkID
WHERE Blocks.BlockID = FlashcardTextBlocks.BlockID
AND Blocks.PageID = ?;