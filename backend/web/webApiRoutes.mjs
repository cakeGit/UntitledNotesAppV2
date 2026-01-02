import { Router } from 'express';
import googleAuthRouter from './routes/authWebRoutes.mjs';
import { ApiRouter } from './apiRouter.mjs';
import userRouter from './routes/userWebRoutes.mjs';

const apiRouter = new ApiRouter(Router());

googleAuthRouter(apiRouter);
userRouter(apiRouter);

export { apiRouter };