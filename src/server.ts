import express from 'express';
import payload from 'payload';
import { config } from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Payload
const start = async () => {
  try {
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'your-secret-key',
      express: app,
      onInit: async () => {
        payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
        payload.logger.info(`Server URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'}`);
      },
    });

    // Import and use workflow APIs
    try {
      const { router: workflowRouter } = await import('./plugins/workflowAPIs');
      app.use('/api/workflows', workflowRouter);
      payload.logger.info('Workflow APIs loaded successfully');
    } catch (error) {
      payload.logger.error('Failed to load workflow APIs:', error);
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        payload: 'running'
      });
    });

    // API info endpoint
    app.get('/api', (req, res) => {
      res.json({
        name: 'Workflow Management System API',
        version: '1.0.0',
        endpoints: {
          workflows: {
            trigger: 'POST /api/workflows/trigger',
            status: 'GET /api/workflows/status/:docId',
            pending: 'GET /api/workflows/pending',
            assign: 'POST /api/workflows/assign'
          }
        }
      });
    });

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      payload.logger.error('Unhandled error:', err);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.originalUrl
      });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      payload.logger.info(`🚀 Server running on port ${port}`);
      payload.logger.info(`📊 Health check: http://localhost:${port}/health`);
      payload.logger.info(`🔌 API info: http://localhost:${port}/api`);
      payload.logger.info(`🎛️  Admin panel: http://localhost:${port}/admin`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  payload.logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  payload.logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

start(); 