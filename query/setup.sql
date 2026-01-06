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
    OwnerUserID BLOB NOT NULL
);

-- Pages
CREATE TABLE IF NOT EXISTS Pages (
    PageID BLOB PRIMARY KEY,
    Name TEXT NOT NULL,
    NotebookID BLOB NOT NULL,
    OwnerUserID BLOB NOT NULL,
    LastEditedTime TEXT,
    LastEditedUserID BLOB
);

-- Auth keys for a user
CREATE TABLE IF NOT EXISTS UserLogins (
    UserID BLOB NOT NULL,
    AuthKey BLOB NOT NULL PRIMARY KEY,
    DeviceInfo TEXT
);

-- Blocks
CREATE TABLE IF NOT EXISTS Blocks (
    BlockID BLOB PRIMARY KEY,
    ParentBlockID BLOB,
    OrderIndex INTEGER NOT NULL,
    Type TEXT NOT NULL,
    PageID BLOB
);

-- Flashcard learning history
CREATE TABLE IF NOT EXISTS FlashcardLearningHistory (
    OwnerUserID BLOB NOT NULL,
    Flashcard TEXT NOT NULL,
    LearningHistory BLOB,
    LastLearned TEXT,

    PRIMARY KEY (OwnerUserID, Flashcard) --Composite primary key
);

-- Text block (more blocks to come)
CREATE TABLE IF NOT EXISTS TextBlocks (
    BlockID BLOB PRIMARY KEY,
    TextContent TEXT NOT NULL,
    Subtype TEXT --Null means normal, but could be "Header"
);