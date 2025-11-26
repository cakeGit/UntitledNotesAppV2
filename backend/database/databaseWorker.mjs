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

    cluster.emit('database_ready');
}