import { adaptJsObjectToSql } from "../foundation/adapter.mjs";
import { readPageFromDatabase } from "../page/deserializer.mjs";
import { writePageToDatabase } from "../page/serializer.mjs";
import { getUUIDBlob } from "../uuidBlober.mjs";

export default function pageDatabaseRoutes(addEndpoint) {
    addEndpoint("get_page_data", async (db, message, response) => {
        const pageData = await readPageFromDatabase(db, message.pageId);

        return pageData;
    });

    addEndpoint("write_page_data", async (db, message, response) => {
        await writePageToDatabase(
            db,
            message.metadata,
            message.structure,
            message.content,
        );
        return { success: true };
    });

    addEndpoint("check_page_access", async (db, message, response) => {
        const pageWithAccess = await db.get(
            db.getQueryOrThrow("page.check_page_access"),
            adaptJsObjectToSql({
                pageId: message.pageId,
                userId: message.userId,
            }),
        );

        return {
            hasAccess: !!pageWithAccess,
        };
    });

    addEndpoint("delete_page", async (db, message, response) => {
        //Delete blocks in page
        await db.run(
            db.getQueryOrThrow("page.delete_blocks_in_page"),
            {
                $pageId: getUUIDBlob(message.pageId),
            }
        );
        //Then, delete all the actual contents
        await db.run(
            db.getQueryOrThrow("page.delete_page_meta"),
            adaptJsObjectToSql({
                pageId: message.pageId,
            }),
        );
        return { success: true };
    });
}
