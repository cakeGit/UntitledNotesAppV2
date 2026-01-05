--Fancy sql statement, because we have a "conditional join" the LEFT JOIN can be used to fill in all the information in one go
SELECT * FROM Blocks

LEFT JOIN TextBlocks ON Blocks.BlockID = TextBlocks.BlockID AND Blocks.Type = 'text'

WHERE Blocks.PageID = ?;