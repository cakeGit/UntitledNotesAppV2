-- Get pages that contain a block with type "flashcard" and in the current notebook ID
SELECT Name, PageID, FileTreeParentID, OrderIndex FROM Pages
WHERE PageID IN (
    SELECT DISTINCT Blocks.PageID FROM Blocks
    WHERE Blocks.Type = 'flashcards'
) AND NotebookID = ?;