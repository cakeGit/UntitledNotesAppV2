import express from 'express';
import { logWeb } from '../logger.mjs';
import ViteExpress from "vite-express";
import { apiRouter } from './webApiRoutes.mjs';
import cookieParser from 'cookie-parser';
import { addPageEditorRouterEndpoint } from './page_editor/pageEditorSocket.mjs';
import expressWs from 'express-ws';

logWeb("Web index.js loaded, starting web server...");

const app = express();
expressWs(app); //Extend with WebSocket support
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

//Add api routes
app.use('/api/', apiRouter.expressRouter);

addPageEditorRouterEndpoint(app); //This has to be defferred until after expressWs call

ViteExpress.listen(app, PORT, () => {
    logWeb(`Server running on http://localhost:${PORT}`);
});