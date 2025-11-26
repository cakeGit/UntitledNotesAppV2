import cluster from 'node:cluster';

const importDefferred = async (modulePath) => {
    return await import(modulePath);
};

if (cluster.isPrimary) {
    console.log("Primary process starting, this is the web server");
    cluster.fork();
    importDefferred('./web/index.js');
} else {
    console.log("Worker process started, this is the database");
    importDefferred('./database/index.js');
}