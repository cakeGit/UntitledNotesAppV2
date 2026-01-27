INSERT INTO FlashcardLearningHistory (OwnerUserID, FlashcardLinkID, LearningHistory, LastLearnedTime)
VALUES ($OwnerUserID, $FlashcardLinkID, $LearningHistory, $LastLearnedTime)
ON CONFLICT(OwnerUserID, FlashcardLinkID) DO UPDATE SET
    LearningHistory = LearningHistory << $LearningHistoryShift | $LearningHistory,
    LastLearnedTime = $LastLearnedTime;