import tk from "terminal-kit";
import process from "process";
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

function getLogString(arg) {
    //If its a json object, stringify it
    if (arg.constructor === Object || Array.isArray(arg)) {
        return JSON.stringify(arg);
    }
    return arg;
}

function collectContent(firstArg, allArgs) {
    if (allArgs.length <= 1) {
        return getLogString(firstArg);
    } else {
        let content = getLogString(firstArg);
        for (let i = 1; i < allArgs.length; i++) {
            if (i > 0) {
                content += " ";
            }
            content += getLogString(allArgs[i]);
        }
        return content;
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
    var content = collectContent(message, arguments);
    process.send({ type: "log_db", content: content });
}

export function logWeb(message) {
    //Put together the string but just for the queue to avoid race condition
    var content = collectContent(message, arguments);
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