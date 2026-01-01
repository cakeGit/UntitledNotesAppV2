import { logClus, logDb, logWeb } from '../logger.mjs';
import { RequestError } from './foundation_safe/requestError.js';

let dbInterface = null;
async function setup(databaseWorker) {
    //Wait for "database_ready" message from database worker before allowing queries
    logClus("PRIMARY/DB_INTERFACE", "Setup invoked, binding listener to wait for database worker to be ready before web setup...");

    let clusterMessageHandler = (worker, message) => {};

    databaseWorker.on("message", (message) => {
        clusterMessageHandler(message);
    });

    const handleDatabaseResponse = (message) => {
        //Handle responses from the database worker here (check interface exists first)
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
            const requestToComplete = this.pendingRequests[requestId];
            if (requestToComplete) {
                if (message.status === "success") {
                    requestToComplete.resolve(data);
                } else {
                    logWeb("Database interface received error response:", error, JSON.stringify(message));
                    requestToComplete.reject(message.requestError ? new RequestError(error) : new Error(error));
                }
            }
        }
    }

    await new Promise((resolve, reject) => {
        clusterMessageHandler = (message) => {
            if (message === 'database_ready') {
                logClus("PRIMARY/DB_INTERFACE", "Recived database ready signal, proceeding with web setup...");
                clusterMessageHandler = handleDatabaseResponse;
                dbInterface = new DbInterface(databaseWorker);
                logClus("PRIMARY/DB_INTERFACE", "Setting up main web...");
                resolve();
            }
        };
    });

}

export { setup, dbInterface};