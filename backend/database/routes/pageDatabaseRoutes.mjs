import { readPageFromDatabase } from "../page/deserializer.mjs";
import { writePageToDatabase } from "../page/serializer.mjs";
import { getUUIDBlob } from "../uuidBlober.mjs";

export default function pageDatabaseRoutes(addEndpoint) {
    addEndpoint("get_page_data", async (db, message, response) => {
        const pageData = await readPageFromDatabase(db, message.pageId);

        return pageData;
    });

    addEndpoint("write_page_data", async (db, message, response) => {
        return await writePageToDatabase(db, message.metadata, message.structure, message.content);
    })

    addEndpoint("check_page_access", async (db, message, response) => {
        const pageIdBlob = getUUIDBlob(message.pageId);
        const userIdBlob = getUUIDBlob(message.userId);

        const pageWithAccess = await db.get(
            db.getQueryOrThrow("page.check_page_access"),
            [pageIdBlob, userIdBlob]
        );

        return {
            hasAccess: !!pageWithAccess,
        };
    });
}
