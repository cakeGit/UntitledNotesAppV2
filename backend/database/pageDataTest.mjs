import { logDb } from "../logger.mjs";
import { readPageFromDatabase } from "./page/deserializer.mjs";
import { writePageToDatabase } from "./page/serializer.mjs";

export async function runPageDataTest(db) {
    //Fake page data, using randomly generated UUIDs to avoid conflicts
    let inputData = {
        metadata: {
            name: "Test Page",
            ownerUserId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
            pageId: "f0b5f960-204d-4c34-8392-d0bbd1c37d45",
            notebookId: "a3bb189e-8bf9-3888-9912-ace4e6543002",
        },
        structure: {
            children: [
                {
                    blockId: "41779190-529c-48e6-ba63-05fd8351968e",
                },
                {
                    blockId: "9f7c79a2-458a-454f-a2b6-3141e9009f4b",
                },
            ],
        },
        content: {
            "41779190-529c-48e6-ba63-05fd8351968e": {
                type: "text",
                textContent: "This is a test block.",
            },
            "9f7c79a2-458a-454f-a2b6-3141e9009f4b": {
                type: "text",
                textContent: "This is another test block, that should be below the first one.",
            }
        },
    };
    // Log the input data to compare
    logDb("Input data for writing page data test:", inputData);
    await writePageToDatabase(
        db,
        inputData.metadata,
        inputData.structure,
        inputData.content
    );
    
    //Read and log the resulting data
    logDb("Result of writing page data test:",
        await readPageFromDatabase(db, "f0b5f960-204d-4c34-8392-d0bbd1c37d45"),
    );
}
