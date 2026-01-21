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

export function adaptSqlRowsContentToJs(rows, uuidParseKeys = []) {
    rows.forEach((block) => {
        for (const key in block) {
            const value = block[key];
            delete block[key];

            //Remove null values, these are probably from other types that arent relevant
            //For example, all blocks will have a imageUrl property even if it is null
            if (value == null) continue;

            const camelKey = sqlToJsName(key);
            
            if (key.endsWith("ID") || (uuidParseKeys.length !== 0 && uuidParseKeys.includes(key))) {
                //For any ID field, parse the UUID blob
                block[camelKey] = parseUUIDBlob(value);
            } else {
                block[camelKey] = value;
            }
        }
    });
}
