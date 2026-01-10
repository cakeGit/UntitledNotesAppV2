import { parseUUIDBlob } from "../uuidBlober.mjs";

function sqlToJsName(str) {
    if (str == "OrderIndex") {
        return "order";
    }
    if (str.endsWith("ID")) {
        str = str.slice(0, -2) + "Id";
    }
    return str.charAt(0).toLowerCase() + str.slice(1);
}

export function adaptSqlRowsContentToJs(rows) {
    rows.map((block) => {
        for (const key in block) {
            let value = block[key];

            delete block[key];

            //Remove null values, these are probably from other types that arent relevant
            //For example, all blocks will have a imageUrl property even if it is null
            if (value == null) continue;

            if (key.endsWith("ID")) {
                //For any ID field, parse the UUID blob
                value = value ? parseUUIDBlob(value) : null;
            }
            const camelKey = sqlToJsName(key);

            block[camelKey] = value;
        }
    });
}
