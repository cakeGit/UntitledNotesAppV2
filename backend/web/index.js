import express from 'express';
import path from 'path';
import { apiRouter } from './apiRouter.js';
import { logWeb } from '../logger.mjs';
import ViteExpress from "vite-express";

logWeb("Web index.js loaded, starting web server...");

const app = express();
const PORT = process.env.PORT || 3000;
const WEB_INDEX_SCRIPT_DIR = import.meta.url.replace('file:///', '').replace('/index.js', '');
const BUILD_DIR = path.resolve(WEB_INDEX_SCRIPT_DIR, '../../build');

app.use(express.json());

//Add api routes
app.use('/api/', apiRouter);

function getFileExtension(filename) {
    const parts = filename.split("#")[0].split("?")[0].split('.');
    return parts.length <= 1 ? "" : parts.pop().trim();
}

// app.use(express.static(BUILD_DIR, { maxAge: '1d' }));
// app.use((req, res, next) => {
//   if (req.method === "GET" && !req.path.startsWith("/api") && getFileExtension(req.path) == "") {
//     res.sendFile(path.join(process.cwd(), "build/index.html"));
//   } else {
//     next();
//   }
// });

ViteExpress.listen(app, PORT, () => {
    logWeb(`Server running on http://localhost:${PORT}`);
});