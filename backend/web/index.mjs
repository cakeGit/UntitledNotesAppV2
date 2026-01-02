import express from 'express';
import { logWeb } from '../logger.mjs';
import ViteExpress from "vite-express";
import { apiRouter } from './webApiRoutes.mjs';
import cookieParser from 'cookie-parser';

logWeb("Web index.js loaded, starting web server...");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

//Add api routes
app.use('/api/', apiRouter.expressRouter);

ViteExpress.listen(app, PORT, () => {
    logWeb(`Server running on http://localhost:${PORT}`);
});