import cluster from 'node:cluster';
import { logClus, setupWorkerListener } from './logger.mjs';

// the cluster.isPrimary property is true for the main process, so true when starting, falce when we do fork
if (cluster.isPrimary) {
    //The primary process is the web server
    logClus("PRIMARY", "Primary process starting, this is the web server");
    let dbWorker = cluster.fork(); //Run this script again, but as a worker process, being the database
    setupWorkerListener(dbWorker); //Setup logging listener for database worker
    
    (async () => {
        //Load the interface module first, since the web worker depends on it
        let dbInterface = await import('./web/webDbInterface.js');

        logClus("PRIMARY", "Setting up db interface");
        //Setup the database interface to communicate with the database worker
        //(it will be waiting for the database worker to confirm it is ready, hence the await)
        await (dbInterface.setup(dbWorker));

        //Now that the database interface is ready, start the web server
        logClus("PRIMARY", "Starting web server main");
        import('./web/index.js');
    })();
} else {
    //We always define the non primary process as the database
    logClus("DB", "Worker process started, this is the database");
    import('./database/index.js');
}