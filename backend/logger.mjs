//Logging utils to prettify (todo) and standardize logs (between the two threads), can be either from 'logDb' or 'logWeb'
import tk from "terminal-kit";
var term = tk.terminal;

export function logDb(message) {
    term.magenta("[DB] ").gray(`${new Date().toISOString()}: `).white(`${message}\n`);
}

export function logWeb(message) {
    term.cyan("[WEB] ").gray(`${new Date().toISOString()}: `).white(`${message}\n`);
}