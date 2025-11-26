//Logging utils to prettify and standardize logs, can be either from 'logDb' or 'logWeb'
//TODO: prettier logging with terminal colors

export function logDb(message) {
    console.log(`[DB] ${new Date().toISOString()}: ${message}`);
}

export function logWeb(message) {
    console.log(`[WEB] ${new Date().toISOString()}: ${message}`);
}