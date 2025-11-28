import cluster from 'node:cluster';
import { logDb, logWeb } from './logger.mjs';

const importDefferred = async (modulePath) => {
    return import(modulePath);
};

if (cluster.isPrimary) {
    logWeb("Primary process starting, this is the web server");
    let dbWorker = cluster.fork();
    (async () => {
        let dbInterface = await importDefferred('./web/webDbInterface.js');
        await (dbInterface.setup(dbWorker));
        importDefferred('./web/index.js');
    })();
} else {
    logDb("Worker process started, this is the database");
    importDefferred('./database/index.js');
}