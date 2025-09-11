import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './auth/routes';
import projectRoutes from './projects/routes';
import taskRoutes from './tasks/routes';
import logger from './utils/logger';
import notificationRoutes from "./notifications/routes";

// export function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  console.log('Environment:', process.env.DATABASE_URL);
  

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/projects', projectRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use("/api/v1/notifications", notificationRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
    });
  });

  app.listen(3000, () => {
    logger.info('Server is running on port 3000');
  });
  
  // Error handling middleware (must be last)
  app.use(errorHandler);


  // return app;
// }