//Loads all queries in the query directory and provides an interface to access them, does not provide actual validation handling or database access

import path from 'path';

const DB_WORKER_SCRIPT_DIR = import.meta.url.replace('file:///', '').replace('/queries.mjs', '');
const QUERY_DIR = path.resolve(DB_WORKER_SCRIPT_DIR, '../../query');

export const queries = {};

//Load all .sql files in the query directory
import fs from 'fs';
import { logDb } from '../logger.mjs';

const queryFiles = fs.readdirSync(QUERY_DIR).filter(file => file.endsWith('.sql'));

logDb(`Loading ${queryFiles.length} SQL query files from ${QUERY_DIR}`);

for (const file of queryFiles) {
    const queryName = path.basename(file, '.sql');
    const queryPath = path.join(QUERY_DIR, file);
    const querySQL = fs.readFileSync(queryPath, 'utf8');
    queries[queryName] = querySQL;
}

var avaliableQueries = Object.keys(queries);
logDb(`Loaded queries: ${avaliableQueries.slice(0, 10).join(', ') + (avaliableQueries.length > 10 ? ', ...' : '')}`);