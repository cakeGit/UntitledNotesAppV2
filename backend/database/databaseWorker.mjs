import { logDb } from "../logger.mjs";
import {
    RequestError,
    RequestNeedsNewLoginError,
} from "../web/foundation_safe/requestError.js";
import {
    constructPageFromDatabase,
    writePageToDatabase,
} from "./page_serialization/pageSerializer.mjs";
import { queries } from "./queries.mjs";
import authDatabaseRoutes from "./routes/authDatabaseRoutes.mjs";
import userDatabaseRoutes from "./routes/userDatabaseRoutes.mjs";
import util from "util";

function logTestQuery(db) {
    //Run the "get_users" query as a test
    const testQuery = queries["get_users"];
    if (!testQuery) {
        console.error('Test query "get_users" not found in loaded queries');
        return;
    }
    db.all(testQuery, [], (err, rows) => {
        if (err) {
            console.error('Error running test query "get_users":', err);
        } else {
            logDb(
                `Test query "get_users" result: ${rows.length} users in database.`
            );
        }
    });
}

function filterForPropertiesInQuery(query, inputParams) {
    for (const param in inputParams) {
        if (!query.includes(param)) delete inputParams[param];
    }
    return inputParams;
}

//It just works, or something
function wrapDbForPromises(db) {
    return {
        get: (sql, params) => {
            const tracedError = new Error("Failed to execute statement");
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) {
                        console.error(err);
                        reject(tracedError);
                    } else {
                        resolve(row);
                    }
                });
            });
        },
        all: (sql, params) => {
            const tracedError = new Error("Failed to execute statement");
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error(err);
                        reject(tracedError);
                    } else {
                        resolve(rows);
                    }
                });
            });
        },
        run: (sql, params) => {
            const tracedError = new Error("Failed to execute statement");
            return new Promise((resolve, reject) => {
                db.run(sql, params, function (err) {
                    if (err) {
                        console.error(err);
                        reject(tracedError);
                    } else {
                        resolve();
                    }
                });
            });
        },
        runMultiple(sql, params) {
            const tracedError = new Error(
                "Failed to execute multiple statements"
            );

            const statements = sql
                .split(";")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            console.log(params);

            return new Promise((resolve, reject) => {
                for (const statement of statements) {
                    let subParams = filterForPropertiesInQuery(
                        statement,
                        structuredClone(params)
                    );

                    db.run(statement, subParams, function (err) {
                        if (err) {
                            console.error(err);
                            reject(tracedError);
                            return;
                        }
                    });
                }
            });
        },
        getQueryOrThrow: (queryName) => {
            const query = queries[queryName];
            if (!query) {
                throw new Error("Query not found: " + queryName);
            }
            return query;
        },
    };
}

export async function startDatabaseWorker(db) {
    db = wrapDbForPromises(db);

    logDb("Database worker started, ready to handle queries.");

    logTestQuery(db);

    writePageToDatabase(
        db,
        {
            name: "Test Page",
            ownerUserId: "d290f1ee-6c54-4b01-90e6-d701748f0851",
            pageId: "f0b5f960-204d-4c34-8392-d0bbd1c37d45",
        },
        {
            children: [
                {
                    blockId: "41779190-529c-48e6-ba63-05fd8351968e",
                },
            ],
        },
        {
            "41779190-529c-48e6-ba63-05fd8351968e": {
                type: "text",
                textContent: "This is a test block.",
            },
        }
    );
    console.log(
        util.inspect(
            await constructPageFromDatabase(
                db,
                "f0b5f960-204d-4c34-8392-d0bbd1c37d45"
            ),
            { showHidden: false, depth: null, colors: true }
        )
    );

    logDb("Sending 'database_ready' message to primary process.");
    process.send("database_ready");

    //When we recive a message from the cluster primary process, handle database queries
    process.on("message", (message) => {
        if (!message) {
            logDb("Database worker received empty message, ignoring.");
            return;
        }
        let type = message?.type;
        let requestId = message?.requestId;
        if (!type || !requestId) {
            logDb(
                'Database worker received message with no type, ignoring "',
                message,
                '"'
            );
            return;
        }

        handleDatabaseMessage(db, message);
    });
}

const requestRoutes = {};

function addEndpoint(type, handler) {
    requestRoutes[type] = handler;
}

userDatabaseRoutes(addEndpoint);
authDatabaseRoutes(addEndpoint);

async function handleDatabaseMessage(db, message) {
    let type = message.type;
    let requestId = message.requestId;
    let handler = requestRoutes[type];

    const response = {
        success: (data) => {
            process.send({ requestId, status: "success", data });
        },
        error: (errorMessage) => {
            process.send({ requestId, status: "error", error: errorMessage });
        },
    };

    if (!handler) {
        response.error("No handler for request type: " + type);
        return;
    }

    try {
        let result = await handler(db, message, response);
        if (result !== undefined) {
            response.success(result);
        }
    } catch (err) {
        if (err instanceof RequestNeedsNewLoginError) {
            process.send({
                requestId,
                status: "error",
                needsNewLoginError: true,
                error: err.message,
            });
            return;
        }

        if (err instanceof RequestError) {
            process.send({
                requestId,
                status: "error",
                requestError: true,
                error: err.message,
            });
            return;
        }

        console.error("Error handling database message:", err);
        console.trace(err);
        response.error("Database error: " + err.message);
    }
}
