//Logging utils to prettify (todo) and standardize logs (between the two threads), can be either from 'logDb' or 'logWeb'
import tk from "terminal-kit";
var term = tk.terminal;

export function logDb(message) {
    term.magenta("[DB] ").gray(`${new Date().toISOString()}: `).white(`${message}\n`);
    //Log other args
    for (let i = 1; i < arguments.length; i++) {
        term.white(`${arguments[i]}\n`);
    }
}

export function logWeb(message) {
    term.cyan("[WEB] ").gray(`${new Date().toISOString()}: `).white(`${message}\n`);
    //Log other args
    for (let i = 1; i < arguments.length; i++) {
        term.white(`${arguments[i]}\n`);
    }
}

export function logClus(group, message) {
    term.green(`[CLUS/${group}] `).gray(`${new Date().toISOString()}: `).white(`${message}\n`);
}