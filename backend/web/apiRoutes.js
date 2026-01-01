import { Router } from 'express';
import googleAuthRouter from './routes/googleAuthRoutes.js';
import { ApiRouter } from './apiRouter.js';

const apiRouter = new ApiRouter(Router());

googleAuthRouter(apiRouter);

export { apiRouter };