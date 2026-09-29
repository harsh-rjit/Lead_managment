import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import notFoundHandler from './middleware/notFound.middleware.js';
import errorHandler from './middleware/error.middleware.js';

const app = express();

// 1. Cross-Origin Resource Sharing (CORS) Middleware
app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);

// 2. Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Request Logging Middleware (Development visibility)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 4. API Routes (Versioned & Root API prefixes)
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Backwards compatibility for /api/health

// 5. 404 Route Not Found Handler (Must be registered after all routes)
app.use(notFoundHandler);

// 6. Centralized Global Error Handler (Must be the last middleware in the pipeline)
app.use(errorHandler);

export default app;
