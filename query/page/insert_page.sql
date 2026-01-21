INSERT INTO Pages (PageID, Name, NotebookID) 
VALUES (?, ?, ?)
ON CONFLICT(PageID) DO UPDATE SET --Update set instead of replace means we dont loose data in other columns like file tree info
    Name = excluded.Name,
    NotebookID = excluded.NotebookID;