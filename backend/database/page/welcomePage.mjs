import { generateRandomUUID } from "../uuidBlober.mjs";

export function getWelcomePage(userId, notebookId) {
    const pageId = generateRandomUUID();
    
    const titleBlockId = generateRandomUUID();
    const textBlockId = generateRandomUUID();

    return {
        metadata: {
            name: "Getting started",
            // ownerUserId: userId,
            pageId: pageId,
            notebookId: notebookId,
        },
        structure: {
            children: [
                {
                    blockId: titleBlockId,
                },
                {
                    blockId: textBlockId,
                },
            ],
        },
        content: {
            [titleBlockId]: {
                type: "text",
                textContent: "Welcome to openbook!",
                subtype: "header",
            },
            [textBlockId]: {
                type: "text",
                textContent: "This is a text block, press the + to find more blocks!",
            },
        }
    };
}