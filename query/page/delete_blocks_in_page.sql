DELETE FROM TextBlocks
WHERE BlockId IN (
    SELECT Blocks.BlockId
    FROM Blocks
    WHERE Blocks.PageID = $pageId
);

DELETE FROM Blocks
WHERE BlockId IN (
    SELECT Blocks.BlockId
    FROM Blocks
    WHERE Blocks.PageID = $pageId
)