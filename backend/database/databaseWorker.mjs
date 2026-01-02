import { logDb } from "../logger.mjs";
import { RequestError } from "../web/foundation_safe/requestError.js";
import { queries } from "./queries.mjs";
import authDatabaseRoutes from "./routes/authDatabaseRoutes.mjs";
import userDatabaseRoutes from "./routes/userDatabaseRoutes.mjs";

function logTestQuery(db) {
    //Run the "get_users" query as a test
    const testQuery = queries['get_users'];
    if (!testQuery) {
        console.error('Test query "get_users" not found in loaded queries');
        return;
    }
    db.all(testQuery, [], (err, rows) => {
        if (err) {
            console.error('Error running test query "get_users":', err);
        } else {
            logDb(`Test query "get_users" result: ${rows.length} users in database.`);
        }
    });
}

//It just works, or something
function wrapDbForPromises(db) {
    return {
        get: (sql, params) => {
            return new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(row);
                    }
                });
            })
        },
        all: (sql, params) => {
            return new Promise((resolve, reject) => {
                db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        },
        run: (sql, params) => {
            return new Promise((resolve, reject) => {
                db.run(sql, params, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this);
                    }
                });
            });
        },
        getQueryOrThrow: (queryName) => {
            const query = queries[queryName];
            if (!query) {
                throw new Error("Query not found: " + queryName);
            }
            return query;
        }
    };
}

export function startDatabaseWorker(db) {
    db = wrapDbForPromises(db);

    logDb("Database worker started, ready to handle queries.");

    logTestQuery(db);

    logDb("Sending 'database_ready' message to primary process.");
    process.send('database_ready');

    //When we recive a message from the cluster primary process, handle database queries
    process.on('message', (message) => {
        if (!message) {
            logDb('Database worker received empty message, ignoring.');
            return;
        }
        let type = message?.type;
        let requestId = message?.requestId;
        if (!type || !requestId) {
            logDb('Database worker received message with no type, ignoring "', message, '"');
            return;
        }

        handleDatabaseMessage(db, message);
    })
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
        }
    };

    if (!handler) {
        response.error("No handler for request type: " + type);
        return;
    }

    try {
        await handler(db, message, response);
    } catch (err) {
        if (err instanceof RequestError) {
            process.send({ requestId, status: "error", requestError: true, error: err.message });
            return;
        }

        response.error("Database error: " + err.message);
    }
}

