import tk from "terminal-kit";
var term = tk.terminal;

const logQueue = [];

function log(color, group, message) {
    term[color](`[${group}] `).gray(`${new Date().toISOString()}: `).white(`${message}\n`);
}

function processQueue() {
    while (logQueue.length > 0) {
        let logItem = logQueue.shift();
        log(logItem.color, logItem.group, logItem.content);
    }
}

export function setupWorkerListener(worker) {
    worker.on("message", (message) => {
        if (message.type === "log_db") {
            logQueue.push({
                group: "DB",
                color: "magenta",
                content: message.content
            });
            setTimeout(processQueue, 0);
        }
    });
}

export function logDb(message) {
    //Put together the string to send to main process via IPC to avoid race condition
    var content = message;
    //Log other args
    for (let i = 1; i < arguments.length; i++) {
        content += arguments[i];
    }
    process.send({ type: "log_db", content: content });
}

export function logWeb(message) {
    //Put together the string but just for the queue to avoid race condition
    var content = message;
    //Log other args
    for (let i = 1; i < arguments.length; i++) {
        content += arguments[i];
    }
    logQueue.push({
        group: "WEB",
        color: "cyan",
        content: content
    });
    setTimeout(processQueue, 0);
}

export function logClus(group, message) {
    var color = "green";
    if (group.indexOf("/") != -1) {
        color = "yellow";
    }
    logQueue.push({
        group: `CLUS/${group}`,
        color: color,
        content: message //Assume its just the one, i dont use extra args here
    });
    setTimeout(processQueue, 0);
}