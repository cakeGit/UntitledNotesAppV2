import sqlite from 'sqlite3';
import path from 'path';

const requireDatabaseWorker = async () => {
    return await import('./databaseWorker.mjs');
}

const DB_INDEX_SCRIPT_DIR = import.meta.url.replace('file:///', '').replace('/index.js', '');
const DB_DIR = path.resolve(DB_INDEX_SCRIPT_DIR, '../../data');

export const db = new sqlite.Database(path.join(DB_DIR, 'database.sqlite'), async (err) => {
    if (err) {
        console.error('Could not connect to database at location at', DB_DIR + "/database.sqlite", "error", err);
    } else {
        console.log('Connected to database at', path.join(DB_DIR, 'database.sqlite'));
        //Run setup script to create tables if they don't exist
        const fs = await import('fs');
        const setupSQL = fs.readFileSync(path.join(DB_INDEX_SCRIPT_DIR, '../../query/setup.sql'), 'utf8');
        db.exec(setupSQL, (err) => {
            if (err) {
                console.error('Could not run setup SQL script', err);
            } else {
                console.log('Database setup complete, delegating database work to dbWorker.js');
            
                requireDatabaseWorker().then(( mod ) => {
                    mod.startDatabaseWorker(db);
                }).catch(err => {
                    console.error('Could not start database worker', err);
                });
            }
        });
    }
});
