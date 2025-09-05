import app from './server';
import { env } from './env';
import { initializeDatabase } from './db/init';
import { sessionService } from './services/sessionService';

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized');

    // Initialize session cleanup after database is ready
    console.log('🧹 Starting session cleanup...');
    const initialCleanupCount = sessionService.cleanupExpiredSessions();
    console.log(`✅ Cleaned up ${initialCleanupCount} expired sessions on startup`);

    // Start server
    const server = app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`⛓️  Chain: ${env.CHAIN_NAME} (ID: ${env.CHAIN_ID})`);
      console.log(`📊 Health check: http://localhost:${env.PORT}/healthz`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully');
      sessionService.stopAutomaticCleanup();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully');
      sessionService.stopAutomaticCleanup();
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
