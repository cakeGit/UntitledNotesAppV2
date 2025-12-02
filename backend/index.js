import cluster from 'node:cluster';
import { logClus } from './logger.mjs';

const importDefferred = async (modulePath) => {
    return import(modulePath);
};

if (cluster.isPrimary) {
    logClus("PR", "Primary process starting, this is the web server");
    let dbWorker = cluster.fork();
    (async () => {
        let dbInterface = await importDefferred('./web/webDbInterface.js');
        logClus("PR", "Setting up db interface");
        await (dbInterface.setup(dbWorker));
        logClus("PR", "Starting web server main");
        importDefferred('./web/index.js');
    })();
} else {
    logClus("DB", "Worker process started, this is the database");
    importDefferred('./database/index.js');
}