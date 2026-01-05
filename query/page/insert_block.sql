REPLACE INTO Blocks (
    BlockID, ParentBlockID, OrderIndex, Type, PageID
) VALUES ($BlockID, $ParentBlockID, $OrderIndex, $Type, $PageID);

-- Insert into specific block type tables:

-- Sqlite doesent seem to directly have IF statements, but this will insert into TextBlocks if the block type is 'text', and does nothing otherwise
REPLACE INTO TextBlocks (BlockID, TextContent, Subtype)
SELECT $BlockID, $TextContent, $Subtype
WHERE $Type = 'text';