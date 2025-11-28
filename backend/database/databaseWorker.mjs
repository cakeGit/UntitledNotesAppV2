import { logDb } from "../logger.mjs";
import { queries } from "./queries.mjs";
import cluster from 'cluster';

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

export function startDatabaseWorker(db) {
    logDb("Database worker started, ready to handle queries.");

    logTestQuery(db);

    logDb("Sending 'database_ready' message to primary process.");
    process.send('database_ready');

    //When we recive a message from the cluster master process, handle database queries
    process.on('message', (worker, message) => {
        let type = message.type;
        let requestId = message.requestId;
        if (!type || !requestId) {
            logDb('Database worker received message with no type, ignoring.', message);
            return;
        }

        handleDatabaseMessage(db, worker, message);
    })
}

const requestRoutes = {};

function addEndpoint(type, handler) {
    requestRoutes[type] = handler;
}

addEndpoint("google_check_account", async (db, message, response) => {
    let googleUID = message.googleUID;
    if (!googleUID) {
        throw new Error("Missing googleUID");
        return;
    }

    const query = response.getQueryOrThrow('get_user_by_google_uid');

    db.get(query, [googleUID], (err, row) => {
        if (err) {
            response.error("Database error: " + err.message);
            return;
        }
        if (row) {
            response.success({ exists: true, userId: row.id });
        } else {
            response.success({ exists: false });
        }
    });
});

function handleDatabaseMessage(db, worker, message) {
    let type = message.type;
    let requestId = message.requestId;
    let handler = requestRoutes[type];

    const response = {
        success: (data) => {
            worker.send({ requestId, status: "success", data });
        },
        error: (errorMessage) => {
            worker.send({ requestId, status: "error", error: errorMessage });
        },
        getQueryOrThrow: (queryName) => {
            const query = queries[queryName];
            if (!query) {
                throw new Error("Query not found: " + queryName);
            }
            return query;
        }
    };

    if (!handler) {
        response.error("No handler for request type: " + type);
        return;
    }

    try {
        handler(db, message, response);
    } catch (err) {
        response.error("Handler error: " + err.message);
    }
}

