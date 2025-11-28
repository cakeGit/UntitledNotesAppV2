import cluster from 'cluster';
import { logWeb } from '../logger.mjs';

let dbInterface = null;
async function setup(databaseWorker) {
    //Wait for "database_ready" message from database worker before allowing queries
    logWeb("Waiting for database worker to be ready before web setup...");

    let clusterMessageHandler = (worker, message) => {};

    databaseWorker.on("message", (message) => {
        clusterMessageHandler(message);
    });

    const handleDatabaseResponse = (message) => {
        //Handle responses from the database worker here
        logWeb("Received message from database worker:", message);
        if (dbInterface) {
            dbInterface.handleResponse(message);
        }
    }

    class DbInterface {
        constructor(worker) {
            this.worker = worker;
            this.requestIdCounter = 1;
            this.pendingRequests = {};
        }

        sendRequest(type, payload) {
            return new Promise((resolve, reject) => {
                const requestId = this.requestIdCounter++;
                this.pendingRequests[requestId] = { resolve, reject };
                this.worker.send({ type, requestId, ...payload });
            });
        }

        handleResponse(message) {
            const { requestId, error, data } = message;
            const pending = this.pendingRequests[requestId];
            if (pending) {
                if (message.status === "success") {
                    pending.resolve(data);
                } else {
                    pending.reject(new Error(error));
                }
            }
        }
    }

    await new Promise((resolve, reject) => {
        clusterMessageHandler = (message) => {
            if (message === 'database_ready') {
                logWeb("Database worker is ready, proceeding with web setup...");
                clusterMessageHandler = handleDatabaseResponse;
                dbInterface = new DbInterface(databaseWorker);
                logWeb("Setting up main web...");
                resolve();
            }
        };
    });

}

export { setup, dbInterface};