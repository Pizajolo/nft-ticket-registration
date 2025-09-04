import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, getCorsOrigins } from './env';
import { errorHandler } from './middlewares/errors';
import { rateLimiter } from './middlewares/rateLimit';
// import { csrfProtection } from './middlewares/csrf';

// Import routes
import sessionRoutes from './routes/session';
import nftRoutes from './routes/nfts';
import registrationRoutes from './routes/registration';
import ticketRoutes from './routes/tickets';
import adminRoutes from './routes/admin';
import checkinRoutes from './routes/checkin';

const app = express();

// Trust proxy for secure cookies in production
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: getCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/healthz', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    chain: env.CHAIN_NAME
  });
});

// API routes (CSRF protection applied per-route where needed)
app.use('/api/session', sessionRoutes);
app.use('/api/nfts', nftRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/checkin', checkinRoutes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Route not found' 
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
