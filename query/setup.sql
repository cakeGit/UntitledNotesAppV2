-- Users
CREATE TABLE IF NOT EXISTS Users (
    UserID BLOB PRIMARY KEY,
    LabelName TEXT NOT NULL, --Little "tag" name. e.g "Samuel" -> "samuel"
    DisplayName TEXT NOT NULL,
    Email TEXT NOT NULL,
    GoogleUserID TEXT, --May be NULL if the user deleted their account
    ProfilePictureURL TEXT --Similarly may be NULL
);

-- Notebook
CREATE TABLE IF NOT EXISTS Notebooks (
    NotebookID BLOB PRIMARY KEY,
    Name TEXT NOT NULL,
    OwnerUserID BLOB NOT NULL,
    FOREIGN KEY (OwnerUserID) REFERENCES User(UserID)
);

-- Pages
CREATE TABLE IF NOT EXISTS Pages (
    PageID BLOB PRIMARY KEY,
    Name TEXT NOT NULL,
    OwnerUserID BLOB NOT NULL,
    RootStructureNodeID BLOB,
    FOREIGN KEY (OwnerUserID) REFERENCES Notebook(NotebookID),
    FOREIGN KEY (RootStructureNodeID) REFERENCES Pages(PageID)
);

-- Blocks
CREATE TABLE IF NOT EXISTS Blocks (
    BlockID BLOB PRIMARY KEY,
    Type TEXT NOT NULL,
    LastEditedTime TEXT NOT NULL,
    LastEditedUserID BLOB NOT NULL,
    FOREIGN KEY (LastEditedUserID) REFERENCES User(UserID)
);

-- Flashcard learning history
CREATE TABLE IF NOT EXISTS FlashcardLearningHistory (
    OwnerUserID BLOB NOT NULL,
    Flashcard TEXT NOT NULL,
    LearningHistory BLOB,
    LastLearned TEXT,
    PRIMARY KEY (OwnerUserID, Flashcard),
    FOREIGN KEY (OwnerUserID) REFERENCES User(UserID)
);

-- Text block (more blocks to come)
CREATE TABLE IF NOT EXISTS TextBlocks (
    BlockID BLOB PRIMARY KEY,
    TextContent TEXT NOT NULL,
    FOREIGN KEY (BlockID) REFERENCES Blocks(BlockID)
);
-- Auth keys for a user
CREATE TABLE IF NOT EXISTS UserLogins (
    UserID BLOB NOT NULL,
    AuthKey BLOB NOT NULL,
    DeviceInfo TEXT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
    -- Composite primary key
    PRIMARY KEY (UserID, AuthKey)
);