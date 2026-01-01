import express from 'express';
import { apiRouter } from './apiRoutes.js';
import { logWeb } from '../logger.mjs';
import ViteExpress from "vite-express";

logWeb("Web index.js loaded, starting web server...");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

//Add api routes
app.use('/api/', apiRouter.expressRouter);

ViteExpress.listen(app, PORT, () => {
    logWeb(`Server running on http://localhost:${PORT}`);
});