import express from 'express';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Security headers
app.use(helmet());
app.disable('x-powered-by');

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API routes
app.use('/', routes);

// Global error handler
app.use(errorHandler);

export default app;
