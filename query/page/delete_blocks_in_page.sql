DELETE FROM Blocks
WHERE BlockId IN (
    SELECT Blocks.BlockId
    FROM Blocks
    INNER JOIN TextBlocks ON Blocks.BlockID = TextBlocks.BlockID AND Blocks.Type = 'text'
    WHERE Blocks.PageID = ?
)